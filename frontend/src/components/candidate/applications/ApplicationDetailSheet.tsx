import { useQuery } from '@tanstack/react-query';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Calendar, FileText, CheckCircle2, Search, Video, FileBadge } from 'lucide-react';
import { mockApi } from '@/services/mockApi';

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
        queryFn: () => mockApi.getCandidateApplications(candidateId),
        enabled: open
    });

    const app = applications?.find((a: any) => a.id === applicationId);

    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['application-history', applicationId],
        queryFn: () => mockApi.getApplicationStatusHistory(applicationId),
        enabled: open
    });

    const { data: testResults, isLoading: isLoadingTests } = useQuery({
        queryKey: ['application-tests', applicationId],
        queryFn: () => mockApi.getApplicationTestResults(applicationId),
        enabled: open
    });

    const canWithdraw = app && ['Mới gửi', 'Đang xét'].includes(app.status);

    const statusOptions = ['Mới gửi', 'Đang xét', 'Phỏng vấn', 'Đề nghị/Tuyển', 'Kết thúc'];
    let currentStepIndex = 0;
    if (app) {
        if (app.status === 'Mới gửi') currentStepIndex = 0;
        else if (app.status === 'Đang xét') currentStepIndex = 1;
        else if (app.status === 'Phỏng vấn' || app.status === 'Shortlisted') currentStepIndex = 2;
        else if (app.status === 'Đề nghị' || app.status === 'Đã tuyển') currentStepIndex = 3;
        else currentStepIndex = 4; // rejected, withdrawn
    }

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
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <SheetHeader className="text-left space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                                            <img src={app.logo_url} alt={app.company} className="w-full h-full object-contain" />
                                        </div>
                                        <div>
                                            <SheetTitle className="text-xl font-bold line-clamp-1">{app.job_title}</SheetTitle>
                                            <SheetDescription className="flex items-center gap-2 mt-1 font-medium text-slate-600">
                                                <Building2 className="w-4 h-4" /> {app.company}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                    {canWithdraw && (
                                        <Button variant="destructive" size="sm" onClick={() => { onWithdraw(); onOpenChange(false); }}>
                                            Rút đơn
                                        </Button>
                                    )}
                                </div>

                                {/* Minimal Progress Bar */}
                                <div className="pt-4">
                                    <div className="flex justify-between mb-2">
                                        {statusOptions.map((st, i) => (
                                            <span key={st} className={`text-[10px] font-medium ${i <= currentStepIndex ? 'text-cyan-700' : 'text-slate-400'}`}>
                                                {st}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all duration-500"
                                            style={{ width: app.status === 'Từ chối' || app.status === 'Rút đơn' ? '100%' : `${(currentStepIndex / (statusOptions.length - 1)) * 100}%`, backgroundColor: app.status === 'Từ chối' ? '#ef4444' : app.status === 'Rút đơn' ? '#94a3b8' : '' }}
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
                                            <a href={app.cv_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-medium text-cyan-600 hover:text-cyan-700 hover:underline">
                                                <FileText className="w-4 h-4" /> {app.cv_name || "CV.pdf"}
                                            </a>
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
                                            {history?.concat().sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()).map((hist: any, idx: number) => (
                                                <div key={hist.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    {/* Timeline Dot */}
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                                        <CheckCircle2 className={`w-5 h-5 ${idx === 0 ? 'text-cyan-500' : ''}`} />
                                                    </div>
                                                    {/* Card */}
                                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="font-bold text-slate-900">{hist.status}</div>
                                                            <div className="text-xs text-slate-500">{new Date(hist.changed_at).toLocaleDateString('vi-VN')}</div>
                                                        </div>
                                                        <div className="text-sm text-slate-600">{hist.notes}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Test Results / Interviews Section (if applicable) */}
                                {app.status !== 'Mới gửi' && app.status !== 'Từ chối' && app.status !== 'Rút đơn' && (
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <FileBadge className="w-4 h-4 text-cyan-600" />
                                            Đánh giá & Phỏng vấn
                                        </h3>
                                        {isLoadingTests ? (
                                            <Skeleton className="h-20 w-full" />
                                        ) : testResults && testResults.length > 0 ? (
                                            <div className="grid gap-3">
                                                {testResults.map((test: any) => (
                                                    <div key={test.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center group hover:border-cyan-200 transition-colors">
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-900">{test.test_name}</p>
                                                            <p className="text-xs text-slate-500 mt-1">Hoàn thành: {new Date(test.completed_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-lg text-emerald-600">{test.score}/{test.max_score}</p>
                                                            <Badge variant="outline" className="text-[10px] mt-1 bg-emerald-50 border-emerald-200 text-emerald-700 uppercase">
                                                                {test.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                                <p className="text-sm text-slate-500">Chưa có thông tin đánh giá hoặc lịch phỏng vấn.</p>
                                            </div>
                                        )}
                                    </section>
                                )}

                            </div>
                        </ScrollArea>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
