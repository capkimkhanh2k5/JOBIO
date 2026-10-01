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
import { toast } from 'sonner';
import type { ApplicationStatusHistoryItem } from '@/types/api';
import { sanitizeHtmlDocument } from '@/lib/sanitizeHtml';

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
    applicationPreview?: any;
}

export function ApplicationDetailSheet({ applicationId, open, onOpenChange, onWithdraw, applicationPreview }: ApplicationDetailSheetProps) {
    const { data: appDetail, isLoading: isLoadingApp } = useQuery({
        queryKey: ['candidate', 'application-detail', applicationId],
        queryFn: () => applicationService.getById(Number(applicationId)).then(r => r.data),
        enabled: open && Boolean(applicationId),
    });

    const app = appDetail
        ? {
            ...appDetail,
            company: appDetail.company_name || applicationPreview?.company_name || applicationPreview?.company || appDetail.job?.company_name || '',
            logo_url: appDetail.company_logo || applicationPreview?.company_logo || applicationPreview?.logo_url || '',
            job_title: appDetail.job_title || appDetail.job?.title || '',
            cv_name: appDetail.cv?.file_name || (appDetail as any).cv_name || applicationPreview?.cv_name || 'CV.pdf',
            cv_id: appDetail.cv?.id || (appDetail as any).cv_id || applicationPreview?.cv_id,
            cv_template_id: (appDetail as any).cv_template_id ?? null,
            cv_url: (appDetail as any).cv_file_url ?? (appDetail as any).cv_url ?? null,
            candidate_id: appDetail.candidate?.id || appDetail.candidate_id,
            statusLabel: STATUS_LABEL_MAP[appDetail.status] || appDetail.status,
        }
        : null;

    const { data: history, isLoading: isLoadingHistory, isError: isHistoryError } = useQuery({
        queryKey: ['application-history', applicationId],
        queryFn: () => applicationService.getStatusHistory(Number(applicationId)).then(r => r.data),
        enabled: open && Boolean(applicationId),
    });

    const canWithdraw = app && ['pending', 'reviewing'].includes(app.status);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

    // Clean up blob URL when dialog closes
    const handleClosePreview = () => {
        setPreviewOpen(false);
        if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
        }
        setPreviewHtml(null);
    };

    const handlePreviewCv = async () => {
        if (!app) return;
        if (!app.cv_id) {
            toast.error("Không tìm thấy dữ liệu CV");
            return;
        }

        const isUploadedCv = !app.cv_template_id && !!app.cv_id;

        if (isUploadedCv) {
            try {
                toast.loading("Đang tải CV...");
                const res = await applicationService.getCvFile(Number(applicationId));
                const blob = res.data;
                const blobUrl = URL.createObjectURL(blob);
                setPdfBlobUrl(blobUrl);
                setPreviewHtml(null);
                setPreviewOpen(true);
                toast.dismiss();
            } catch {
                toast.dismiss();
                toast.error("Không thể tải CV. Vui lòng thử lại.");
            }
            return;
        }

        // CV_Template: call previewCv() to get HTML, show in Dialog
        try {
            toast.loading("Đang tải dữ liệu CV...");
            const res = await applicationService.previewCv(Number(applicationId));
            setPreviewHtml(res.data.html_content);
            setPdfBlobUrl(null);
            setPreviewOpen(true);
            toast.dismiss();
        } catch {
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
        else currentStepIndex = 4;
    }

    const progressWidth = app
        ? (app.status === 'rejected' || app.status === 'withdrawn'
            ? 100
            : ((currentStepIndex + 1) / statusOptions.length) * 100)
        : 0;

    const historyItems = [...((history?.length ? history : app?.status_history) || [])]
        .sort((a: ApplicationStatusHistoryItem, b: ApplicationStatusHistoryItem) => (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));

    const timelineItems = historyItems.length > 0
        ? historyItems
        : (app ? [{
            id: Number(app.id),
            old_status: null,
            new_status: 'pending',
            changed_by: null,
            notes: 'Đơn ứng tuyển đã được gửi thành công.',
            created_at: app.applied_at,
        } satisfies ApplicationStatusHistoryItem] : []);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden flex flex-col p-0 border-l border-border">
                {isLoadingApp || !app ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <>
                        <div className="relative border-b border-border/60 bg-muted/80">
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
                            <SheetHeader className="px-6 pb-4 pt-6 pr-24 text-left">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-2 shadow-sm">
                                        {app.logo_url ? (
                                            <img loading="lazy" src={app.logo_url} alt={app.company} className="h-full w-full object-contain" />
                                        ) : (
                                            <Building2 className="h-7 w-7 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <SheetTitle className="text-xl font-bold line-clamp-1">{app.job_title}</SheetTitle>
                                        <SheetDescription className="flex items-center gap-2 mt-1 font-medium text-muted-foreground">
                                            <Building2 className="w-4 h-4" /> {app.company || 'Chưa có tên công ty'}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>
                            <div className="px-6 pb-6 pt-1">
                                <div className="grid grid-cols-5 gap-3 mb-3">
                                    {statusOptions.map((st, i) => (
                                        <span
                                            key={st}
                                            className={`text-center text-[11px] font-semibold leading-tight transition-colors sm:text-xs ${
                                                i <= currentStepIndex ? 'text-teal-700' : 'text-muted-foreground/60'
                                            }`}
                                        >
                                            {st}
                                        </span>
                                    ))}
                                </div>
                                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                                    <div
                                        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                                        style={{
                                            width: `${progressWidth}%`,
                                            backgroundColor: app.status === 'rejected' ? '#ef4444' : app.status === 'withdrawn' ? '#94a3b8' : '',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                <section>
                                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-teal-600" />
                                        Hồ sơ ứng tuyển
                                    </h3>
                                    <div className="bg-muted border border-border/60 rounded-xl p-4 grid gap-4 text-sm">
                                        <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                                            <span className="text-muted-foreground">Ngày gửi đơn:</span>
                                            <span className="font-medium text-foreground">{new Date(app.applied_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                                            <span className="text-muted-foreground">CV đính kèm:</span>
                                            <button
                                                onClick={handlePreviewCv}
                                                type="button"
                                                className="flex cursor-pointer items-center gap-1.5 font-medium text-teal-600 transition-colors hover:text-teal-700 hover:underline"
                                            >
                                                <FileText className="w-4 h-4" /> {app.cv_name || "CV.pdf"}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                                            <span className="text-muted-foreground">Số CV đính kèm:</span>
                                            <span className="font-medium text-foreground">{app.cv_id ? 1 : 0}</span>
                                        </div>
                                        {app.ai_score !== null && app.ai_score !== undefined && app.ai_score > 0 && (
                                            <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                                                <span className="text-muted-foreground">Độ phù hợp (AI):</span>
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">{app.ai_score}%</Badge>
                                            </div>
                                        )}
                                    </div>
                                    {app.cover_letter && (
                                        <div className="mt-4 p-4 bg-muted rounded-xl border border-border/60">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Thư giới thiệu (Cover Letter)</p>
                                            <p className="text-sm text-foreground/80 italic">"{app.cover_letter}"</p>
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-teal-600" />
                                        Lịch sử trạng thái
                                    </h3>
                                    {isLoadingHistory ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-2/3" />
                                        </div>
                                    ) : isHistoryError ? (
                                        <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-5 text-sm text-muted-foreground">
                                            Không tải được lịch sử trạng thái từ hệ thống.
                                        </div>
                                    ) : (
                                        <div className="relative space-y-4 before:absolute before:bottom-2 before:left-5 before:top-2 before:w-0.5 before:bg-muted-foreground/20">
                                            {timelineItems.map((hist, idx) => (
                                                <div key={hist.id} className="relative pl-14">
                                                    <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-cyan-300 bg-card text-foreground/80 shadow-md">
                                                        <CheckCircle2 className={`w-5 h-5 ${idx === 0 ? 'text-teal-600' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                                                        <div className="mb-1 flex items-center justify-between gap-3">
                                                            <div className="font-bold text-foreground">{STATUS_LABEL_MAP[hist.new_status] || hist.new_status}</div>
                                                            <div className="shrink-0 text-xs text-muted-foreground">
                                                                {new Date(hist.created_at).toLocaleString('vi-VN')}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {hist.notes || 'Không có ghi chú cho lần cập nhật này.'}
                                                        </div>
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

            {/* CV preview Dialog — handles both CV_Template (HTML) and CV_Upload (PDF blob) */}
            <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) handleClosePreview(); }}>
                <DialogContent className="max-w-[210mm] max-h-[90vh] overflow-auto p-0 bg-transparent border-none shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Xem trước CV</DialogTitle>
                    </DialogHeader>
                    <div className="bg-card mx-auto shadow-2xl relative group" style={{ minWidth: '210mm', minHeight: '297mm' }}>
                        {pdfBlobUrl ? (
                            // CV_Upload: blob URL is same-origin → browser PDF viewer works
                            <iframe
                                src={pdfBlobUrl}
                                className="w-full pointer-events-auto"
                                style={{ height: '297mm', border: 'none', display: 'block' }}
                                title="CV PDF Preview"
                            />
                        ) : previewHtml ? (
                            // CV_Template: HTML rendered in iframe
                            <iframe
                                srcDoc={sanitizeHtmlDocument(previewHtml)}
                                className="w-full pointer-events-auto"
                                style={{ height: '297mm', border: 'none', display: 'block' }}
                                title="CV Preview"
                                sandbox=""
                            />
                        ) : null}
                        <Button
                            variant="default"
                            size="sm"
                            className="absolute top-4 right-4 z-50 cursor-pointer border border-foreground/30 bg-foreground/90 px-3 font-semibold text-white shadow-lg hover:bg-foreground/80"
                            onClick={handleClosePreview}
                        >
                            Đóng
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </Sheet>
    );
}
