import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Lightbulb, Upload, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cvService } from '@/services/cvService';
import { useUserStore } from '@/store/userStore';
import { getCandidateId } from '@/lib/candidateIdentity';
import { downloadFileFromUrl } from '@/lib/download';
import { Button } from '@/components/ui/button';
import { CVListSidebar } from '@/components/candidate/cv/CVListSidebar';
import { CVBuilder } from '@/components/candidate/cv/CVBuilder';
import { CVLivePreview } from '@/components/candidate/cv/CVLivePreview';
import { NewCVDialog } from '@/components/candidate/cv/NewCVDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CVItem {
    id: string;
    cv_name: string;
    template_id: string | null;   // null for CV_Upload
    template_name: string;
    is_default: boolean;
    is_public: boolean;
    view_count: number;
    download_count: number;
    pdf_generated_at?: string | null;
    updated_at: string;
    thumbnail_url?: string | null;
    cv_url?: string | null;        // URL of uploaded PDF for CV_Upload
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved';

export default function CVManager() {
    const { user } = useUserStore();
    const candidateId = getCandidateId(user);
    const queryClient = useQueryClient();
    const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [cvName, setCvName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-1');
    const [cvData, setCvData] = useState<Record<string, any>>({});
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
    const [pdfDirtyCvIds, setPdfDirtyCvIds] = useState<Set<string>>(() => new Set());
    const [pdfCache, setPdfCache] = useState<Record<string, { cv_url: string; pdf_generated_at: string }>>({});
    const [previewKey, setPreviewKey] = useState(0); // increments after save to trigger preview refresh
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [downloadingCvId, setDownloadingCvId] = useState<string | null>(null);
    const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
    const [showLeaveSavePrompt, setShowLeaveSavePrompt] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Upload handlers ───────────────────────────────────────────────────────
    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation: type must be application/pdf
        if (file.type !== 'application/pdf') {
            toast.error('Chỉ chấp nhận file PDF');
            e.target.value = '';
            return;
        }

        // Client-side validation: size must not exceed 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Kích thước file không được vượt quá 10MB');
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const cvName = file.name.replace(/\.pdf$/i, '');
            const res = await cvService.uploadPdfFile(Number(candidateId), file, cvName);
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] });
            handleSelectCV(res.data);
            toast.success('Upload CV thành công!');
        } catch {
            toast.error('Upload thất bại. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    // ── Fetch CV list ────────────────────────────────────────────────────────
    const { data: cvList = [], isLoading: loadingCVs } = useQuery({
        queryKey: ['candidate', 'cvs', candidateId],
        queryFn: () => cvService.list(Number(candidateId)).then(r => r.data),
        staleTime: 30_000,
        enabled: !!candidateId,
    });

    // Select first CV by default when list loads
    useEffect(() => {
        if (cvList.length > 0 && !selectedCvId) {
            const def = (cvList as any).find((c: any) => c.is_default) ?? cvList[0];
            handleSelectCV(def as any);
        }
    }, [cvList]); // eslint-disable-line

    // ── Mutations ─────────────────────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: (data: any) => cvService.update(Number(candidateId), Number(selectedCvId), data).then(r => r.data),
        onSuccess: () => {
            setAutoSaveStatus('saved');
            setPreviewKey(k => k + 1); // trigger preview refresh with latest saved data
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (cvId: string) => cvService.delete(Number(candidateId), Number(cvId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] });
            setSelectedCvId(null);
            toast.success('CV đã được xóa.');
        },
    });

    // ── Auto-save logic ───────────────────────────────────────────────────────
    const triggerAutoSave = useCallback((overrides?: { cv_name?: string, template_id?: string, cv_data?: any }) => {
        if (!selectedCvId) return;
        setAutoSaveStatus('saving');
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            // Priority: provided override -> current state value
            const finalCvName = overrides?.cv_name ?? cvName;
            const finalTemplateId = overrides?.template_id ?? selectedTemplateId;
            const finalCvData = overrides?.cv_data ?? cvData;

            updateMutation.mutate({ 
                cv_name: finalCvName, 
                template_id: finalTemplateId, 
                cv_data: finalCvData 
            });
        }, 500);
    }, [selectedCvId, cvName, selectedTemplateId, cvData, updateMutation]);

    // Periodic auto-save every 30s
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedCvId && autoSaveStatus !== 'saving') triggerAutoSave();
        }, 30_000);
        return () => clearInterval(interval);
    }, [selectedCvId, autoSaveStatus, triggerAutoSave]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSelectCV = (cv: any) => {
        setSelectedCvId(cv.id);
        setCvName(cv.cv_name);
        setSelectedTemplateId(String(cv.template_id || cv.template || ''));
        setAutoSaveStatus('idle');
        // Load cv_data from CV detail
        if (candidateId) {
            cvService.getById(Number(candidateId), Number(cv.id)).then((res: any) => {
                setCvData(res.data?.cv_data || {});
            }).catch(() => setCvData({}));
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        const overrides: any = {};
        if (field === 'cv_name') {
            setCvName(value);
            overrides.cv_name = value;
        } else if (field === 'template_id') {
            const valStr = String(value);
            setSelectedTemplateId(valStr);
            overrides.template_id = valStr;
        } else if (field === 'cv_data') {
            setCvData(value); // full cv_data object from CVBuilder
            overrides.cv_data = value;
        } else {
            const newData = { ...cvData, [field]: value };
            setCvData(newData);
            overrides.cv_data = newData;
        }
        if (selectedCvId) {
            setPdfDirtyCvIds(prev => new Set(prev).add(selectedCvId));
        }
        setAutoSaveStatus('saving');
        triggerAutoSave(overrides);
    };

    const navigate = useNavigate();
    const selectedCV = (cvList as any).find((c: any) => c.id === selectedCvId) ?? null;
    const hasUnsavedPdfChanges = Boolean(
        selectedCV?.template_id && selectedCvId && pdfDirtyCvIds.has(selectedCvId)
    );

    const getDownloadFilename = (cv: CVItem) => {
        const rawName = (cv.cv_name || 'CV').trim() || 'CV';
        return rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;
    };

    const isPdfStale = (cv: CVItem) => {
        if (!cv.template_id) return false;
        if (pdfDirtyCvIds.has(cv.id)) return true;
        if (!cv.cv_url || !cv.pdf_generated_at) return true;

        const cvUpdatedAt = new Date(cv.updated_at).getTime();
        const pdfGeneratedAt = new Date(cv.pdf_generated_at).getTime();
        return Number.isFinite(cvUpdatedAt) && Number.isFinite(pdfGeneratedAt)
            ? cvUpdatedAt > pdfGeneratedAt
            : true;
    };

    const saveSelectedCvNow = async () => {
        if (!selectedCvId) return;
        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = null;
        }

        setAutoSaveStatus('saving');
        await updateMutation.mutateAsync({
            cv_name: cvName,
            template_id: selectedTemplateId,
            cv_data: cvData,
        });
    };

    const saveSelectedPdf = async () => {
        if (!selectedCV || !selectedCvId || !candidateId) {
            throw new Error('missing_selected_cv');
        }

        await saveSelectedCvNow();
        const res = await cvService.savePdf(Number(candidateId), Number(selectedCvId));
        const downloadUrl = res.data.download_url;
        if (!downloadUrl) throw new Error('missing_download_url');

        setPdfCache(prev => ({
            ...prev,
            [selectedCvId]: {
                cv_url: downloadUrl,
                pdf_generated_at: res.data.pdf_generated_at || new Date().toISOString(),
            },
        }));
        setPdfDirtyCvIds(prev => {
            const next = new Set(prev);
            next.delete(selectedCvId);
            return next;
        });
        queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] });
        setPreviewKey(k => k + 1);
        return res.data;
    };

    useEffect(() => {
        if (!hasUnsavedPdfChanges) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedPdfChanges]);

    useEffect(() => {
        if (!hasUnsavedPdfChanges) return;

        const handleDocumentClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            const anchor = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

            const nextUrl = new URL(anchor.href, window.location.href);
            if (nextUrl.origin !== window.location.origin) return;

            const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
            const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (nextPath === currentPath) return;

            event.preventDefault();
            event.stopPropagation();
            setPendingNavigation(nextPath);
            setShowLeaveSavePrompt(true);
        };

        document.addEventListener('click', handleDocumentClick, true);
        return () => document.removeEventListener('click', handleDocumentClick, true);
    }, [hasUnsavedPdfChanges]);

    const handleCancelLeave = () => {
        setShowLeaveSavePrompt(false);
        setPendingNavigation(null);
    };

    const handleSaveBeforeLeave = async () => {
        setIsSavingBeforeLeave(true);
        try {
            await saveSelectedPdf();
            toast.success('Đã lưu bản PDF mới nhất.');
            setShowLeaveSavePrompt(false);
            if (pendingNavigation) {
                navigate(pendingNavigation);
            }
            setPendingNavigation(null);
        } catch {
            toast.error('Không thể lưu PDF. Vui lòng thử lại.');
        } finally {
            setIsSavingBeforeLeave(false);
        }
    };

    const requestPageNavigation = (to: string) => {
        if (hasUnsavedPdfChanges) {
            setPendingNavigation(to);
            setShowLeaveSavePrompt(true);
            return;
        }
        navigate(to);
    };

    const handleDownloadCV = async (cv?: CVItem | null) => {
        const baseTarget = cv ?? selectedCV;
        const target = baseTarget
            ? { ...baseTarget, ...(pdfCache[baseTarget.id] || {}) }
            : null;
        if (!target || !candidateId) {
            toast.error('Vui lòng chọn CV cần tải');
            return;
        }

        setDownloadingCvId(target.id);
        try {
            let downloadUrl = target.cv_url || '';
            let pdfGeneratedAt = target.pdf_generated_at || '';

            if (downloadUrl && !isPdfStale(target)) {
                await downloadFileFromUrl(downloadUrl, getDownloadFilename(target));
                toast.success('CV đang được tải xuống...');
                return;
            }

            if (target.id === selectedCvId) {
                await saveSelectedCvNow();
                const res = await cvService.savePdf(Number(candidateId), Number(target.id));
                downloadUrl = res.data.download_url;
                pdfGeneratedAt = res.data.pdf_generated_at || '';
            } else {
                const res = await cvService.downloadPdf(Number(candidateId), Number(target.id));
                downloadUrl = res.data.download_url;
                pdfGeneratedAt = res.data.pdf_generated_at || '';
            }

            if (!downloadUrl) throw new Error('missing_download_url');

            await downloadFileFromUrl(downloadUrl, getDownloadFilename(target));
            setPdfCache(prev => ({
                ...prev,
                [target.id]: {
                    cv_url: downloadUrl,
                    pdf_generated_at: pdfGeneratedAt || new Date().toISOString(),
                },
            }));
            setPdfDirtyCvIds(prev => {
                const next = new Set(prev);
                next.delete(target.id);
                return next;
            });
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] });
            setPreviewKey(k => k + 1);
            toast.success('CV đang được tải xuống...');
        } catch {
            toast.error('Không thể tải CV. Vui lòng thử lại.');
        } finally {
            setDownloadingCvId(null);
        }
    };

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            {/* Page header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Quản lý CV"
                    description="Tạo và quản lý CV chuyên nghiệp với AI hỗ trợ"
                    icon={FileText}
                    action={
                        <div className="flex items-center gap-3">
                            {/* Hidden file input for PDF upload */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white/50 backdrop-blur-sm gap-2 h-11 px-4 rounded-xl"
                                onClick={() => requestPageNavigation(`/candidate/suggested-jobs${selectedCvId ? `?cv_id=${selectedCvId}` : ''}`)}
                            >
                                <Lightbulb className="w-4 h-4" />
                                Gợi ý việc làm
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-violet-200 text-violet-700 hover:bg-violet-50 bg-white/50 backdrop-blur-sm gap-2 h-11 px-5 rounded-xl font-semibold"
                                onClick={() => handleDownloadCV()}
                                disabled={!selectedCV || downloadingCvId === selectedCV?.id}
                            >
                                {downloadingCvId === selectedCV?.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                {downloadingCvId === selectedCV?.id ? 'Đang tải...' : 'Tải CV'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-white/50 backdrop-blur-sm gap-2 h-11 px-5 rounded-xl"
                                onClick={handleUploadClick}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {isUploading ? 'Đang upload...' : 'Upload CV'}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/25 gap-2 transition-all h-11 px-6 rounded-xl font-bold"
                                onClick={() => setShowNewDialog(true)}
                            >
                                <Plus className="w-4 h-4" /> Tạo CV mới
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 min-h-0 p-6 lg:p-8">
                {/* Main 3-column layout */}
                <div className="flex h-[calc(100vh-140px)] relative z-10 w-full flex-1 bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                    {/* Column 1: CV List Sidebar */}
                    <CVListSidebar
                        cvList={cvList as any}
                        loading={loadingCVs}
                        selectedId={selectedCvId}
                        onSelect={handleSelectCV}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onDownload={(id) => {
                            const cv = (cvList as any).find((item: CVItem) => item.id === id);
                            void handleDownloadCV(cv);
                        }}
                        onCreateNew={() => setShowNewDialog(true)}
                    />

                    {/* Column 2: CV Builder */}
                    <div className="flex-1 overflow-y-auto bg-transparent">
                        <CVBuilder
                            cvName={cvName}
                            selectedTemplateId={selectedTemplateId}
                            cvData={cvData}
                            autoSaveStatus={autoSaveStatus}
                            onFieldChange={handleFieldChange}
                            selectedCV={selectedCV}
                            candidateId={Number(candidateId)}
                            onCvUrlUpdated={(downloadUrl, pdfGeneratedAt) => {
                                if (selectedCvId) {
                                    setPdfCache(prev => ({
                                        ...prev,
                                        [selectedCvId]: {
                                            cv_url: downloadUrl,
                                            pdf_generated_at: pdfGeneratedAt || new Date().toISOString(),
                                        },
                                    }));
                                    setPdfDirtyCvIds(prev => {
                                        const next = new Set(prev);
                                        next.delete(selectedCvId);
                                        return next;
                                    });
                                }
                                queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] });
                            }}
                        />
                    </div>

                    {/* Column 3: Live Preview */}
                    <div className="hidden xl:flex flex-col w-[380px] shrink-0 overflow-hidden bg-white/20 border-l border-white/40">
                        <CVLivePreview
                            cvName={cvName}
                            templateId={selectedTemplateId}
                            cvId={selectedCvId}
                            cvUrl={selectedCV?.cv_url}
                            previewKey={previewKey}
                        />
                    </div>
                </div>
            </div>

            {/* New CV Dialog */}
            <AnimatePresence>
                {showNewDialog && (
                    <NewCVDialog
                        onClose={() => setShowNewDialog(false)}
                        onCreated={(newCV) => {
                            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs'] });
                            handleSelectCV({ id: newCV.id, cv_name: newCV.cv_name, template_id: newCV.template_id || newCV.template });
                            setShowNewDialog(false);
                            toast.success('CV mới đã được tạo!');
                        }}
                    />
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={showLeaveSavePrompt}
                onClose={handleCancelLeave}
                onConfirm={handleSaveBeforeLeave}
                title="Lưu trước khi rời trang?"
                description="CV đã có thay đổi mới. Hãy lưu để bản CV được dùng hoặc được tải về là bản mới nhất."
                confirmText="Lưu"
                cancelText="Hủy"
                type="warning"
                isLoading={isSavingBeforeLeave}
            />
        </div>
    );
}
