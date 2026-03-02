import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Plus, Users, Briefcase } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

interface AddJobToCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
    existingJobIds: string[]; // To filter out jobs already in the campaign
}

export function AddJobToCampaignModal({ isOpen, onClose, campaignId, existingJobIds }: AddJobToCampaignModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    // Fetch employer's active jobs
    const { data: jobsResponse, isLoading } = useQuery({
        queryKey: ['employer-jobs'],
        queryFn: () => apiClient.getJobs({}), // Fetching all jobs, maybe filter by status='published' if supported
        enabled: isOpen
    });

    const jobs = jobsResponse?.items || [];

    // Filter out jobs that are already linked to this campaign, and apply search
    const availableJobs = useMemo(() => {
        return jobs.filter((job: any) => {
            // Check if job is already in campaign
            const isExisting = existingJobIds.includes(job.id);
            // Search filter
            const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
            // Only show published jobs ideally
            const isPublished = job.status === 'published';

            return !isExisting && matchesSearch && isPublished;
        });
    }, [jobs, existingJobIds, searchQuery]);

    const addJobMutation = useMutation({
        mutationFn: (jobId: string) => apiClient.addCampaignJob(campaignId, jobId),
        onSuccess: () => {
            toast.success('Đã thêm việc làm vào chiến dịch');
            queryClient.invalidateQueries({ queryKey: ['campaign-jobs', campaignId] });
            queryClient.invalidateQueries({ queryKey: ['campaigns'] }); // to update job count
            onClose();
        },
        onError: () => {
            toast.error('Lỗi khi thêm việc làm vào chiến dịch');
        }
    });

    const handleAddJob = (jobId: string) => {
        addJobMutation.mutate(jobId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 flex flex-col gap-0 p-0 overflow-hidden">
                <div className="p-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-violet-600 dark:from-cyan-400 dark:to-violet-400">
                            Thêm việc làm vào chiến dịch
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 flex-1 overflow-hidden flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm theo tiêu đề công việc..."
                            className="pl-9 bg-white/50 dark:bg-slate-950/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 overflow-hidden">
                        <ScrollArea className="h-[300px]">
                            {isLoading ? (
                                <div className="p-4 flex justify-center items-center h-full text-slate-500">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    Đang tải danh sách việc làm...
                                </div>
                            ) : availableJobs.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {availableJobs.map((job: any) => (
                                        <div key={job.id} className="p-3 hover:bg-white dark:hover:bg-slate-900 flex justify-between items-center transition-colors group">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                    {job.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {job.applications_count || 0} lượt ứng tuyển
                                                    </span>
                                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">{job.status}</Badge>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAddJob(job.id)}
                                                disabled={addJobMutation.isPending}
                                                className="shrink-0 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-400 border-slate-200 dark:border-slate-700"
                                            >
                                                {addJobMutation.isPending && addJobMutation.variables === job.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Thêm
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                                    <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-slate-500 text-sm">
                                        {searchQuery
                                            ? "Không tìm thấy việc làm nào phù hợp."
                                            : "Không có việc làm nào có thể thêm. Bạn cần đăng việc làm mới hoặc tất cả việc làm đã có trong chiến dịch này."}
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
