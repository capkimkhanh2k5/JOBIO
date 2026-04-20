import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { applicationService } from '@/services/applicationService';
import { cvService } from '@/services/cvService';
import { toast } from 'sonner';

const STATUS_LABEL_MAP: Record<string, string> = {
    pending: 'Mới gửi',
    reviewing: 'Đang xét',
    shortlisted: 'Vào vòng tiếp',
    interview: 'Phỏng vấn',
    offered: 'Đề nghị',
    accepted: 'Đã nhận việc',
    rejected: 'Từ chối',
    withdrawn: 'Rút đơn',
};

interface ApplicationDetailSheetProps {
    applicationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onWithdraw: () => void;
}

export function ApplicationDetailSheet({ applicationId, open, onOpenChange, onWithdraw }: ApplicationDetailSheetProps) {
    const candidateId = "me";

    // Re-fetch or pass data. Simpler to re-fetch from mock cache by ID if possible, but we don't have a direct getApplicationById.
    // For now, fetch all and find, or mock a new endpoint.
    const { data: applications, isLoading: isLoadingApp } = useQuery({
        queryKey: ['candidate', 'applications', candidateId],
        queryFn: () => applicationService.list({}).then(r => r.data.results),
        enabled: open
    });

    const app = applications
        ?.map((item: any) => ({
            ...item,
            company: item.company_name || item.company || '',
            logo_url: item.company_logo || item.logo_url || '',
            statusLabel: STATUS_LABEL_MAP[item.status] || item.status,
        }))
        .find((a: any) => String(a.id) === String(applicationId));

    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['application-history', applicationId],
        queryFn: () => applicationService.getStatusHistory(Number(applicationId)).then(r => r.data),
        enabled: open
    });

    const canWithdraw = app && ['pending', 'reviewing'].includes(app.status);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    const handlePreviewCv = async () => {
        if (app.cv_url) {
            window.open(app.cv_url, '_blank');
            return;
        }
        if (!app.cv_id) {
            toast.error("Không tìm thấy dữ liệu CV");
            return;
        }
        try {
            toast.loading("Đang tải dữ liệu CV...");
            const res = await cvService.previewCv(app.candidate_id, app.cv_id);
            setPreviewHtml(res.data.html_content);
            setPreviewOpen(true);
            toast.dismiss();
        } catch (error) {
            toast.dismiss();
            toast.error("Không thể tải bản xem trước CV");
        }
    };

    const statusOptions = ['Mới gửi', 'Đang xét', 'Phỏng vấn', 'Đề nghị / Đã nhận việc', 'Kết thúc'];
    let currentStepIndex = 0;
    if (app) {
        if (app.status === 'pending') currentStepIndex = 0;
        else if (app.status === 'reviewing') currentStepIndex = 1;
        else if (app.status === 'interview' || app.status === 'shortlisted') currentStepIndex = 2;
        else if (app.status === 'offered' || app.status === 'accepted') currentStepIndex = 3;
        else currentStepIndex = 4; // rejected, withdrawn
    }

    const progressWidth = app
        ? (app.status === 'rejected' || app.status === 'withdrawn'
            ? 100
            : ((currentStepIndex + 1) / statusOptions.length) * 100)
        : 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden flex flex-col p-0 border-l border-slate-200">
                {isLoadingApp || !app ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <>
                        <div className="relative p-6 pr-28 border-b border-slate-100 bg-slate-50/80">
                            {canWithdraw && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-4 right-16 z-10 bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm"
                                    onClick={() => { onWithdraw(); onOpenChange(false); }}
                                >
                                    Rút đơn
                                </Button>
                            )}
                            <SheetHeader className="text-left space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                                        <img src={app.logo_url} alt={app.company} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <SheetTitle className="text-xl font-bold line-clamp-1">{app.job_title}</SheetTitle>
                                        <SheetDescription className="flex items-center gap-2 mt-1 font-medium text-slate-600">
                                            <Building2 className="w-4 h-4" /> {app.company}
                                        </SheetDescription>
                                    </div>
                                </div>

                                {/* Status Progress */}
                                <div className="pt-2">
                                    <div className="grid grid-cols-5 gap-2 mb-3">
                                        {statusOptions.map((st, i) => (
                                            <span
                                                key={st}
                                                className={`rounded-full border px-2 py-2.5 text-center text-xs font-semibold leading-tight transition-colors ${
                                                    i <= currentStepIndex
                                                        ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                                        : 'border-slate-200 bg-white text-slate-400'
                                                }`}
                                            >
                                                {st}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                                            style={{ width: `${progressWidth}%`, backgroundColor: app.status === 'rejected' ? '#ef4444' : app.status === 'withdrawn' ? '#94a3b8' : '' }}
                                        />
                                    </div>
                                </div>
                            </SheetHeader>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                {/* Application Info Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-cyan-600" />
                                        Hồ sơ ứng tuyển
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid gap-4 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                                            <span className="text-slate-500">Ngày gửi đơn:</span>
                                            <span className="font-medium text-slate-900">{new Date(app.applied_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                                            <span className="text-slate-500">CV đính kèm:</span>
                                            <button 
                                                onClick={handlePreviewCv} 
                                                className="flex items-center gap-1.5 font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
                                            >
                                                <FileText className="w-4 h-4" /> {app.cv_name || "CV.pdf"}
                                            </button>
                                        </div>
                                        {app.ai_score && (
                                            <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                                                <span className="text-slate-500">Độ phù hợp (AI):</span>
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">{app.ai_score}%</Badge>
                                            </div>
                                        )}
                                    </div>
                                    {app.cover_letter && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Thư giới thiệu (Cover Letter)</p>
                                            <p className="text-sm text-slate-700 italic">"{app.cover_letter}"</p>
                                        </div>
                                    )}
                                </section>

                                {/* Timeline Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-cyan-600" />
                                        Lịch sử trạng thái
                                    </h3>
                                    {isLoadingHistory ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-2/3" />
                                        </div>
                                    ) : (
                                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                            {history?.concat().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((hist: any, idx: number) => (
                                                <div key={hist.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    {/* Timeline Dot */}
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                                        <CheckCircle2 className={`w-5 h-5 ${idx === 0 ? 'text-cyan-500' : ''}`} />
                                                    </div>
                                                    {/* Card */}
                                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="font-bold text-slate-900">{STATUS_LABEL_MAP[hist.new_status] || hist.new_status}</div>
                                                            <div className="text-xs text-slate-500">{new Date(hist.created_at).toLocaleDateString('vi-VN')}</div>
                                                        </div>
                                                        <div className="text-sm text-slate-600">{hist.notes}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                            </div>
                        </ScrollArea>
                    </>
                )}
            </SheetContent>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-[210mm] max-h-[90vh] overflow-auto p-0 bg-transparent border-none shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Xem trước CV</DialogTitle>
                    </DialogHeader>
                    <div className="bg-white mx-auto shadow-2xl relative group" style={{ minWidth: '210mm', minHeight: '297mm' }}>
                        {previewHtml && (
                            <iframe
                                srcDoc={`
                                    <!DOCTYPE html>
                                    <html>
                                        <head>
                                            <style>
                                                body { margin: 0; padding: 0; background: white; }
                                                ::-webkit-scrollbar { width: 0px; background: transparent; }
                                            </style>
                                        </head>
                                        <body>
                                            ${previewHtml}
                                        </body>
                                    </html>
                                `}
                                className="w-full pointer-events-auto"
                                style={{
                                    height: '100%',
                                    minHeight: '297mm',
                                    border: 'none',
                                }}
                                title="CV Preview"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        )}
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="absolute top-4 right-4 z-50 bg-slate-900/50 hover:bg-slate-900 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setPreviewOpen(false)}
                        >
                            Đóng
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Sheet>
    );
}
