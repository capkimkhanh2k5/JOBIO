import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Briefcase, Calendar, DollarSign, Target, Users, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { employerService } from '@/services/employerService';
import { AddJobToCampaignModal } from './AddJobToCampaignModal';

interface CampaignDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string | null;
}

export function CampaignDetailSheet({ isOpen, onClose, campaignId }: CampaignDetailSheetProps) {
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

    const { data: campaign, isLoading: isCampaignLoading } = useQuery({
        queryKey: ['campaign', campaignId],
        queryFn: () => employerService.getCampaign(Number(campaignId!)).then(r => r.data),
        enabled: !!campaignId && isOpen,
    });

    const { data: jobs, isLoading: isJobsLoading } = useQuery({
        queryKey: ['campaign-jobs', campaignId],
        queryFn: () => Promise.resolve([]),  // TODO: no dedicated campaign-jobs endpoint
        enabled: !!campaignId && isOpen,
    });

    const getStatusToken = (status: string) => {
        switch (status) {
            case 'active': return { text: 'Active', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' };
            case 'draft': return { text: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400' };
            case 'paused': return { text: 'Paused', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400' };
            case 'completed': return { text: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' };
            default: return { text: status, color: 'bg-slate-100 text-slate-700' };
        }
    };

    const isLoading = isCampaignLoading || isJobsLoading;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-800 p-0 overflow-y-auto hidden-scrollbar flex flex-col">
                {isLoading ? (
                    <div className="p-6 space-y-6">
                        <Skeleton className="h-8 w-2/3" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <Skeleton className="h-24 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                ) : campaign ? (
                    <>
                        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between">
                            <div>
                                <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-violet-600 dark:from-cyan-400 dark:to-violet-400 mb-1">
                                    {campaign.campaign_name}
                                </SheetTitle>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="outline" className={getStatusToken(campaign.status).color}>
                                        {getStatusToken(campaign.status).text}
                                    </Badge>
                                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {campaign.campaign_type}
                                    </Badge>
                                    <span className="text-sm text-slate-500 flex items-center gap-1 ml-2">
                                        <Calendar className="w-4 h-4" />
                                        {format(parseISO(campaign.start_date), 'dd/MM/yyyy')} - {format(parseISO(campaign.end_date), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8 flex-1">
                            {/* Overview Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
                                        <span className="text-sm font-medium flex items-center">
                                            <Target className="w-4 h-4 mr-1.5" />
                                            Tiến độ Tuyển dụng
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {campaign.hired_count} / {campaign.target_positions}
                                        </span>
                                    </div>
                                    <Progress value={(campaign.hired_count / campaign.target_positions) * 100} indicatorClassName="bg-violet-500" className="h-2" />
                                </div>

                                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-slate-400">
                                        <span className="text-sm font-medium flex items-center">
                                            <DollarSign className="w-4 h-4 mr-1.5" />
                                            Ngân sách (USD)
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {campaign.spent_amount.toLocaleString()} / {campaign.budget.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={campaign.budget > 0 ? (campaign.spent_amount / campaign.budget) * 100 : 0} indicatorClassName={(campaign.budget > 0 && (campaign.spent_amount / campaign.budget) > 0.9) ? "bg-red-500" : "bg-cyan-500"} className="h-2" />
                                </div>
                            </div>

                            {/* Info section */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Mô tả chiến dịch</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {campaign.description || "Không có mô tả"}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Đối tượng</h4>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">{campaign.target_audience || "Chung"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ghi chú</h4>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">{campaign.notes || "Không có"}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-200 dark:bg-slate-800" />

                            {/* Linked Jobs */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                        <Briefcase className="w-5 h-5 mr-2 text-cyan-500" />
                                        Việc làm liên kết ({jobs?.length || 0})
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs border-dashed border-slate-300 dark:border-slate-700"
                                        onClick={() => setIsAddJobModalOpen(true)}
                                    >
                                        + Thêm việc làm
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {jobs && jobs.length > 0 ? (
                                        jobs.map((job: any) => (
                                            <div key={job.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between group hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                        {job.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5" />
                                                            {job.applications_count} lượt ứng tuyển
                                                        </span>
                                                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-slate-100 dark:bg-slate-800">{job.status}</Badge>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                                            <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm text-slate-500">Chưa có việc làm nào được liên kết với chiến dịch này.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-6 text-center text-slate-500">Không tìm thấy thông tin chiến dịch.</div>
                )}
            </SheetContent>

            {campaignId && (
                <AddJobToCampaignModal
                    isOpen={isAddJobModalOpen}
                    onClose={() => setIsAddJobModalOpen(false)}
                    campaignId={campaignId}
                    existingJobIds={jobs?.map((j: any) => j.job_id || j.id) || []}
                />
            )}
        </Sheet>
    );
}
