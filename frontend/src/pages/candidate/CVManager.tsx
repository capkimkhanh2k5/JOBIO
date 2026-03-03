import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cvService } from '@/services/cvService';
import api from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { CVListSidebar } from '@/components/candidate/cv/CVListSidebar';
import { CVBuilder } from '@/components/candidate/cv/CVBuilder';
import { CVLivePreview } from '@/components/candidate/cv/CVLivePreview';
import { NewCVDialog } from '@/components/candidate/cv/NewCVDialog';

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
    const recruiterId = user?.id;
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
            const def = cvList.find((c: CVItem) => c.is_default) ?? cvList[0];
            setSelectedCvId(def.id);
            setCvName(def.cv_name);
            setSelectedTemplateId(def.template_id);
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
        onSuccess: (_, cvId) => {
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
    const handleSelectCV = (cv: CVItem) => {
        setSelectedCvId(cv.id);
        setCvName(cv.cv_name);
        setSelectedTemplateId(cv.template_id);
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

    const selectedCV = cvList.find((c: CVItem) => c.id === selectedCvId) ?? null;

    return (
        <div className="min-h-screen bg-slate-50 relative">
            {/* Subtle aurora blobs */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full bg-violet-300/10 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-300/10 blur-[100px]" />
            </div>

            {/* Page header */}
            <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-cyan-500 to-sky-500">
                            Quản lý CV
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Tạo và quản lý CV chuyên nghiệp với AI hỗ trợ
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* AI Generate button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-violet-200 text-violet-700 hover:bg-violet-50 gap-2"
                            onClick={() => aiGenMutation.mutate()}
                            disabled={aiGenMutation.isPending || !selectedCvId}
                        >
                            <Sparkles className={`w-4 h-4 ${aiGenMutation.isPending ? 'animate-spin text-violet-400' : ''}`} />
                            {aiGenMutation.isPending ? 'AI đang tạo...' : 'AI Generate'}
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white border-0 shadow-md shadow-violet-500/25 gap-2"
                            onClick={() => setShowNewDialog(true)}
                        >
                            <Plus className="w-4 h-4" /> Tạo CV mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main 3-column layout */}
            <div className="flex h-[calc(100vh-73px)] relative z-10">
                {/* Column 1: CV List Sidebar */}
                <CVListSidebar
                    cvList={cvList}
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
                <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-white">
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
                <div className="hidden xl:flex flex-col w-[380px] shrink-0 overflow-hidden bg-slate-100 border-l border-slate-200">
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
                            setSelectedTemplateId(newCV.template_id);
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
