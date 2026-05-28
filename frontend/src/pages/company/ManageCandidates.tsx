import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCandidateStore } from '@/store/candidateStore';
import { applicationService } from '@/services/applicationService';
import { CandidateBoard } from '@/components/company/candidates/CandidateBoard';
import { CandidateTable } from '@/components/company/candidates/CandidateTable';
import { CandidatesFilterSidebar } from '@/components/company/candidates/CandidatesFilterSidebar';
import { CandidateDetailSheet } from '@/components/company/candidates/CandidateDetailSheet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Kanban, List, RefreshCw, Mail, UserX, CheckCircle2, Users as UsersIcon } from 'lucide-react';

export default function ManageCandidates() {
    const [searchParams] = useSearchParams();
    const { viewMode, setViewMode, filters, setFilters, clearFilters, selectedCandidatesForBulk, clearBulkSelection } = useCandidateStore();
    const queryClient = useQueryClient();
    const jobIdParam = searchParams.get('job_id');

    useEffect(() => {
        clearBulkSelection();
        clearFilters();
        if (jobIdParam) {
            setFilters({ jobId: jobIdParam });
        }
    }, [clearBulkSelection, clearFilters, jobIdParam, setFilters]);

    const { data: applicationsRes, isLoading, refetch } = useQuery({
        queryKey: ['company-candidates', filters],
        queryFn: () => applicationService.list({
            ordering: '-applied_at',
            page_size: 1000,
        } as any).then(r => r.data),
    });
    const rawApplications = applicationsRes?.results ?? [];
    const applications = rawApplications
        .map((app: any) => {
            const matchScore = app.match_score ?? app.ai_score ?? 0;

            return {
                ...app,
                candidate_id: String(app.recruiter_id),
                candidate_name: app.recruiter_name,
                candidate_avatar: app.recruiter_avatar,
                candidate_email: app.recruiter_email,
                status: app.status === 'accepted' ? 'accepted' : app.status,
                ai_score: matchScore,
                match_score: matchScore,
                skills: app.skills ?? [],
                rating: app.rating ?? 0,
            };
        })
        .filter((app: any) => {
            if (filters.jobId && String(app.job_id) !== String(filters.jobId)) return false;
            if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) return false;
            if (app.ai_score < filters.aiScoreRange[0] || app.ai_score > filters.aiScoreRange[1]) return false;
            if (filters.skills.length > 0 && !filters.skills.every(skill => (app.skills || []).includes(skill))) return false;

            const search = filters.searchQuery.trim().toLowerCase();
            if (search) {
                const haystack = [
                    app.candidate_name,
                    app.candidate_email,
                    app.job_title,
                    ...(app.skills || []),
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(search)) return false;
            }

            return true;
        });

    const BULK_ACTION_STATUS: Record<string, string> = {
        'reject': 'rejected',
        'shortlist': 'shortlisted',
    };

    const bulkMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
            applicationService.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-candidates'] });
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
                            <div className="flex gap-1 bg-white border border-slate-200 shadow-sm p-1 w-fit rounded-xl">
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
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 flex-1 w-full min-w-0 flex relative gap-6 overflow-hidden">
                <div className="w-[300px] shrink-0 hidden md:block">
                    <CandidatesFilterSidebar />
                </div>

                <main className="flex-1 min-w-0 overflow-hidden">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full p-4">
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
