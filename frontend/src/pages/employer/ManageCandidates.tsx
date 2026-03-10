import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCandidateStore } from '@/store/candidateStore';
import { applicationService } from '@/services/applicationService';
import { CandidateBoard } from '@/components/employer/candidates/CandidateBoard';
import { CandidateTable } from '@/components/employer/candidates/CandidateTable';
import { CandidatesFilterSidebar } from '@/components/employer/candidates/CandidatesFilterSidebar';
import { CandidateDetailSheet } from '@/components/employer/candidates/CandidateDetailSheet';
import { Button } from '@/components/ui/button';
import { Kanban, List, RefreshCw, Mail, UserX, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Header Area */}
            <header className="flex-shrink-0 border-b border-border/50 bg-card p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý Ứng viên</h1>
                        <p className="text-muted-foreground mt-1">
                            {applications.length} ứng viên đang hiển thị dựa trên bộ lọc
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggles */}
                        <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
                            <Button
                                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 ${viewMode === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                onClick={() => setViewMode('kanban')}
                            >
                                <Kanban className="w-4 h-4 mr-2" /> Board
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 ${viewMode === 'table' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <List className="w-4 h-4 mr-2" /> Table
                            </Button>
                        </div>

                        <Button variant="outline" size="icon" onClick={() => refetch()} className="h-10 w-10 shrink-0">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions Bar - only shows in table mode when items are selected */}
                {viewMode === 'table' && selectedCandidatesForBulk.length > 0 && (
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
                )}
            </header>

            {/* Main Content Area with Sidebar */}
            <div className="flex-1 overflow-hidden flex p-6 gap-6 relative hide-scrollbar">
                <CandidatesFilterSidebar />

                <main className="flex-1 overflow-hidden">
                    {viewMode === 'kanban' ? (
                        <CandidateBoard
                            applications={applications}
                            isLoading={isLoading}
                            onStatusChange={() => refetch()}
                        />
                    ) : (
                        <CandidateTable
                            applications={applications}
                            isLoading={isLoading}
                        />
                    )}
                </main>
            </div>

            <CandidateDetailSheet />
        </div>
    );
}
