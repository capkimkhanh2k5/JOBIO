import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cvService } from '@/services/cvService';
import api from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { CVListSidebar } from '@/components/candidate/cv/CVListSidebar';
import { CVBuilder } from '@/components/candidate/cv/CVBuilder';
import { CVLivePreview } from '@/components/candidate/cv/CVLivePreview';
import { NewCVDialog } from '@/components/candidate/cv/NewCVDialog';
import { PageHeader } from '@/components/shared/PageHeader';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CVItem {
    id: string;
    cv_name: string;
    template_id: string;
    template_name: string;
    is_default: boolean;
    is_public: boolean;
    view_count: number;
    download_count: number;
    updated_at: string;
    thumbnail_url?: string;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved';

export default function CVManager() {
    const { user } = useUserStore();
    const recruiterId = user?.recruiter_id;
    const queryClient = useQueryClient();
    const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [cvName, setCvName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-1');
    const [cvData, setCvData] = useState<Record<string, any>>({});
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch CV list ────────────────────────────────────────────────────────
    const { data: cvList = [], isLoading: loadingCVs } = useQuery({
        queryKey: ['candidate', 'cvs', recruiterId],
        queryFn: () => cvService.list(Number(recruiterId)).then(r => r.data),
        staleTime: 30_000,
        enabled: !!recruiterId,
    });

    // Select first CV by default when list loads
    useEffect(() => {
        if (cvList.length > 0 && !selectedCvId) {
            const def = (cvList as any).find((c: any) => c.is_default) ?? cvList[0];
            setSelectedCvId((def as any).id);
            setCvName((def as any).cv_name);
            setSelectedTemplateId((def as any).template_id || (def as any).template);
        }
    }, [cvList, selectedCvId]);

    // ── Mutations ─────────────────────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: (data: any) => cvService.update(Number(recruiterId), Number(selectedCvId), data).then(r => r.data),
        onSuccess: () => {
            setAutoSaveStatus('saved');
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', recruiterId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (cvId: string) => cvService.delete(Number(recruiterId), Number(cvId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', recruiterId] });
            setSelectedCvId(null);
            toast.success('CV đã được xóa.');
        },
    });

    const defaultMutation = useMutation({
        mutationFn: (cvId: string) => cvService.setDefault(Number(recruiterId), Number(cvId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', recruiterId] });
            toast.success('Đã đặt làm CV mặc định.');
        },
    });

    const downloadMutation = useMutation({
        mutationFn: (cvId: string) => cvService.downloadPdf(Number(recruiterId), Number(cvId)),
        onSuccess: () => toast.success('CV đang được tải xuống...'),
    });

    const privacyMutation = useMutation({
        mutationFn: ({ cvId, is_public }: { cvId: string; is_public: boolean }) =>
            cvService.update(Number(recruiterId), Number(cvId), { is_public } as any).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', recruiterId] });
        },
    });

    const aiGenMutation = useMutation({
        mutationFn: () => api.post(`/api/recruiters/${recruiterId}/cvs/ai-generate/`).then(r => r.data),
        onSuccess: (data) => {
            setCvData(data.cv_data);
            toast.success('AI đã tạo nội dung CV cho bạn!');
        },
        onError: () => toast.error('Không thể tạo CV bằng AI, thử lại sau.'),
    });

    // ── Auto-save logic ───────────────────────────────────────────────────────
    const triggerAutoSave = useCallback(() => {
        if (!selectedCvId) return;
        setAutoSaveStatus('saving');
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            updateMutation.mutate({ cv_name: cvName, template_id: selectedTemplateId, cv_data: cvData });
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
        setSelectedTemplateId(cv.template_id || cv.template);
        setCvData({});
        setAutoSaveStatus('idle');
    };

    const handleFieldChange = (field: string, value: any) => {
        if (field === 'cv_name') setCvName(value);
        else if (field === 'template_id') setSelectedTemplateId(value);
        else setCvData(prev => ({ ...prev, [field]: value }));
        setAutoSaveStatus('saving');
        triggerAutoSave();
    };

    const selectedCV = (cvList as any).find((c: any) => c.id === selectedCvId) ?? null;

    return (
        <div className="relative flex flex-col w-full p-6 lg:p-8">
            {/* Page header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Quản lý CV"
                    description="Tạo và quản lý CV chuyên nghiệp với AI hỗ trợ"
                    icon={FileText}
                    action={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-violet-200 text-violet-700 hover:bg-violet-100 bg-white/50 backdrop-blur-sm gap-2 h-11 px-6 rounded-xl"
                                onClick={() => aiGenMutation.mutate()}
                                disabled={aiGenMutation.isPending || !selectedCvId}
                            >
                                <Sparkles className={`w-4 h-4 ${aiGenMutation.isPending ? 'animate-spin text-violet-400' : ''}`} />
                                {aiGenMutation.isPending ? 'AI đang tạo...' : 'AI Generate'}
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

            {/* Main 3-column layout */}
            <div className="flex h-[calc(100vh-140px)] relative z-10 w-full flex-1">
                {/* Column 1: CV List Sidebar */}
                <CVListSidebar
                    cvList={cvList as any}
                    loading={loadingCVs}
                    selectedId={selectedCvId}
                    onSelect={handleSelectCV}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onSetDefault={(id) => defaultMutation.mutate(id)}
                    onDownload={(id) => downloadMutation.mutate(id)}
                    onTogglePrivacy={(id, is_public) => privacyMutation.mutate({ cvId: id, is_public })}
                    onCreateNew={() => setShowNewDialog(true)}
                />

                {/* Column 2: CV Builder */}
                <div className="flex-1 overflow-y-auto border-transparent bg-white/60 backdrop-blur-xl">
                    <CVBuilder
                        cvName={cvName}
                        selectedTemplateId={selectedTemplateId}
                        cvData={cvData}
                        autoSaveStatus={autoSaveStatus}
                        onFieldChange={handleFieldChange}
                        selectedCV={selectedCV}
                    />
                </div>

                {/* Column 3: Live Preview */}
                <div className="hidden xl:flex flex-col w-[380px] shrink-0 overflow-hidden bg-white/40 backdrop-blur-xl border-l border-white/40">
                    <CVLivePreview
                        cvName={cvName}
                        cvData={cvData}
                        templateId={selectedTemplateId}
                        cvId={selectedCvId}
                    />
                </div>
            </div>

            {/* New CV Dialog */}
            <AnimatePresence>
                {showNewDialog && (
                    <NewCVDialog
                        onClose={() => setShowNewDialog(false)}
                        onCreated={(newCV) => {
                            queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs'] });
                            setSelectedCvId(newCV.id);
                            setCvName(newCV.cv_name);
                            setSelectedTemplateId(newCV.template_id || newCV.template);
                            setCvData({});
                            setAutoSaveStatus('idle');
                            setShowNewDialog(false);
                            toast.success('CV mới đã được tạo!');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
