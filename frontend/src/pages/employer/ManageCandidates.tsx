import { useEffect, useState } from 'react';
import { useCandidateStore } from '@/store/candidateStore';
import { mockApi } from '@/services/mockApi';
import { CandidateBoard } from '@/components/employer/candidates/CandidateBoard';
import { CandidateTable } from '@/components/employer/candidates/CandidateTable';
import { CandidatesFilterSidebar } from '@/components/employer/candidates/CandidatesFilterSidebar';
import { CandidateDetailSheet } from '@/components/employer/candidates/CandidateDetailSheet';
import { Button } from '@/components/ui/button';
import { Kanban, List, RefreshCw, Mail, UserX, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageCandidates() {
    const { viewMode, setViewMode, filters, selectedCandidatesForBulk, clearBulkSelection } = useCandidateStore();
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadCandidates = async () => {
        setIsLoading(true);
        try {
            // Using generic getAllApplications but sending filters
            const res = await mockApi.getAllApplications({
                status: filters.statuses,
                job_id: filters.jobId || undefined,
                search: filters.searchQuery || undefined,
                ai_score_min: filters.aiScoreRange[0],
                ai_score_max: filters.aiScoreRange[1],
                skills: filters.skills
            });
            setApplications(res.items);
            clearBulkSelection();
        } catch (error) {
            toast.error("Không thể tải danh sách ứng viên");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Debounce fetching if needed, for mock we just call
        const timer = setTimeout(() => {
            loadCandidates();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]); // Refetch on filter change

    const handleBulkAction = async (action: string) => {
        if (selectedCandidatesForBulk.length === 0) return;
        setIsLoading(true);
        // Simulate bulk action delay
        await new Promise(r => setTimeout(r, 600));
        toast.success(`Đã thực hiện "${action}" cho ${selectedCandidatesForBulk.length} ứng viên`);
        clearBulkSelection();
        setIsLoading(false);
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

                        <Button variant="outline" size="icon" onClick={loadCandidates} className="h-10 w-10 shrink-0">
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
                            <Button size="sm" variant="outline" className="bg-background border-border/50 hover:bg-emerald-500 hover:text-white" onClick={() => handleBulkAction('Gửi email')}>
                                <Mail className="w-4 h-4 mr-2" /> Gửi email
                            </Button>
                            <Button size="sm" variant="outline" className="bg-background border-border/50 hover:bg-red-500 hover:text-white hover:border-red-500" onClick={() => handleBulkAction('Từ chối hàng loạt')}>
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
                            onStatusChange={loadCandidates}
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
