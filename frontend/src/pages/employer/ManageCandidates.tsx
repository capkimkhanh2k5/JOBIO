import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCandidateStore } from '@/store/candidateStore';
import { applicationService } from '@/services/applicationService';
import { CandidateBoard } from '@/components/employer/candidates/CandidateBoard';
import { CandidateTable } from '@/components/employer/candidates/CandidateTable';
import { CandidatesFilterSidebar } from '@/components/employer/candidates/CandidatesFilterSidebar';
import { CandidateDetailSheet } from '@/components/employer/candidates/CandidateDetailSheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Kanban, List, RefreshCw, Mail, UserX, CheckCircle2, Users as UsersIcon } from 'lucide-react';

export default function ManageCandidates() {
    const { viewMode, setViewMode, filters, selectedCandidatesForBulk, clearBulkSelection } = useCandidateStore();
    const queryClient = useQueryClient();

    const { data: applicationsRes, isLoading, refetch } = useQuery({
        queryKey: ['employer-candidates', filters],
        queryFn: () => applicationService.list({
            status: filters.statuses,
            job_id: filters.jobId || undefined,
            search: filters.searchQuery || undefined,
            ai_score_min: filters.aiScoreRange[0],
            ai_score_max: filters.aiScoreRange[1],
            skills: filters.skills
        } as any).then(r => r.data),
    });
    const applications = applicationsRes?.results ?? [];

    const BULK_ACTION_STATUS: Record<string, string> = {
        'reject': 'rejected',
        'shortlist': 'shortlisted',
    };

    const bulkMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
            applicationService.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employer-candidates'] });
            clearBulkSelection();
        },
    });

    const handleBulkAction = (action: string) => {
        if (selectedCandidatesForBulk.length === 0) return;
        const statusValue = BULK_ACTION_STATUS[action];
        if (!statusValue) return;
        bulkMutation.mutate(
            { ids: selectedCandidatesForBulk.map(Number), status: statusValue },
            {
                onSuccess: () => toast.success(`Đã cập nhật ${selectedCandidatesForBulk.length} ứng viên`),
                onError: () => toast.error('Thao tác thất bại, vui lòng thử lại'),
            }
        );
    };

    return (
        <div className="flex flex-col w-full h-full min-h-0 bg-transparent">
            {/* Header Area */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Quản lý Ứng viên"
                    description={`${applications.length} ứng viên đang hiển thị dựa trên bộ lọc`}
                    icon={UsersIcon}
                    action={
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm p-1 w-fit rounded-xl">
                                <Button
                                    variant="ghost"
                                    className={`rounded-lg px-6 py-2 h-auto text-sm font-semibold transition-all shadow-none ${
                                        viewMode === 'kanban'
                                            ? 'bg-violet-600 text-white hover:bg-violet-700 hover:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 bg-transparent hover:bg-white'
                                    }`}
                                    onClick={() => setViewMode('kanban')}
                                >
                                    <Kanban className="w-4 h-4 mr-2" /> Board
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={`rounded-lg px-6 py-2 h-auto text-sm font-semibold transition-all shadow-none ${
                                        viewMode === 'table'
                                            ? 'bg-violet-600 text-white hover:bg-violet-700 hover:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 bg-transparent hover:bg-white'
                                    }`}
                                    onClick={() => setViewMode('table')}
                                >
                                    <List className="w-4 h-4 mr-2" /> Table
                                </Button>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => refetch()} className="h-10 w-10 bg-white border-slate-200 text-slate-600 hover:text-slate-900">
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    }
                />
            </div>

            {/* Bulk Actions Bar - only shows in table mode when items are selected */}
            {viewMode === 'table' && selectedCandidatesForBulk.length > 0 && (
                <div className="flex-shrink-0 px-6 lg:px-8 pt-6">
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                Đã chọn {selectedCandidatesForBulk.length} ứng viên
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="bg-background border-border/50 hover:bg-emerald-500 hover:text-white" onClick={() => handleBulkAction('shortlist')}>
                                <Mail className="w-4 h-4 mr-2" /> Vào shortlist
                            </Button>
                            <Button size="sm" variant="outline" className="bg-background border-border/50 hover:bg-red-500 hover:text-white hover:border-red-500" onClick={() => handleBulkAction('reject')}>
                                <UserX className="w-4 h-4 mr-2" /> Từ chối
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area with Sidebar */}
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6 flex-1 w-full flex overflow-hidden relative gap-6">
                <div className="w-[300px] hidden md:block">
                    <CandidatesFilterSidebar />
                </div>

                <main className="flex-1 overflow-hidden">
                    <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 overflow-hidden h-full shadow-sm">
                        {viewMode === 'kanban' ? (
                            <CandidateBoard
                                applications={applications as any}
                                isLoading={isLoading}
                                onStatusChange={() => refetch()}
                            />
                        ) : (
                            <CandidateTable
                                applications={applications as any}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </main>
            </div>

            <CandidateDetailSheet />
        </div>
    );
}
