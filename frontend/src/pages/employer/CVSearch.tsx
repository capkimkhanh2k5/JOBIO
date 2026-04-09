import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { candidateService } from '@/services/candidateService';
import { useFilterStore } from '@/store/filterStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CVSearchFiltersPanel } from '@/components/employer/cv/CVSearchFilters';
import { CandidateCard, CandidateCardSkeleton } from '@/components/employer/cv/CandidateCard';
import { CandidateProfileSheet } from '@/components/employer/cv/CandidateProfileSheet';
import { PageHeader } from '@/components/shared/PageHeader';

export default function EmployerCVSearch() {
    const filters = useFilterStore(state => state.cvFilters);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const navigate = useNavigate();

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['employer', 'cvSearch', filters, 1],
        queryFn: () => candidateService.list({ ...filters, page: 1, page_size: 12 }).then(r => r.data),
        placeholderData: (prev) => prev,
    });

    const isBackgroundFetching = isFetching && !isLoading;

    const handleCandidateClick = (id: string) => setSelectedCandidateId(id);
    const handleExport = () => toast.info("Tính năng xuất báo cáo sẽ được cập nhật trong phiên bản tới!");
    const handleCreateCampaign = () => navigate('/employer/campaigns');

    return (
        <div className="w-full mx-auto min-h-screen flex flex-col">
            {/* Page Header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Tìm kiếm ứng viên"
                    description="Duyệt qua hàng ngàn hồ sơ chất lượng cao"
                    icon={Users}
                    action={
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleExport}
                                variant="outline"
                                className="bg-white shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 h-10 rounded-xl font-semibold"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Xuất báo cáo
                            </Button>
                            <Button
                                onClick={handleCreateCampaign}
                                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 h-10 rounded-xl font-semibold"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Tạo chiến dịch
                            </Button>
                        </div>
                    }
                />
            </div>

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-1 w-full overflow-hidden border-t border-border/40"
            >
                {/* Left Sidebar for Filters */}
                <div className="w-[300px] hidden md:flex flex-col flex-shrink-0 p-6 lg:pl-8">
                    <CVSearchFiltersPanel />
                </div>

                {/* Right Content: Results Grid */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 overflow-hidden h-full shadow-sm">
                        <div className="p-6 lg:p-8 space-y-8 min-h-full">
                        {/* Results count & loading indicator */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-violet-600" />
                                {isLoading ? (
                                    <Skeleton className="w-32 h-6" />
                                ) : (
                                    <span>Tìm thấy {data?.count || 0} hồ sơ phù hợp</span>
                                )}
                            </h2>
                            {isBackgroundFetching && (
                                <div className="text-sm text-violet-600 flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                    Đang làm mới...
                                </div>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => <CandidateCardSkeleton key={i} />)
                            ) : data?.results?.length ? (
                                data.results.map((candidate: any) => (
                                    <CandidateCard
                                        key={candidate.id}
                                        candidate={candidate}
                                        onClick={handleCandidateClick}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                        <Users className="w-12 h-12 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Không tìm thấy ứng viên</h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Hãy thử thay đổi tiêu chí tìm kiếm hoặc xóa bớt bộ lọc để nhận được nhiều kết quả hơn.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Candidate Profile Sheet */}
            <CandidateProfileSheet
                open={!!selectedCandidateId}
                onOpenChange={(open) => !open && setSelectedCandidateId(null)}
                candidateId={selectedCandidateId}
                onSelectCandidate={setSelectedCandidateId}
            />
        </div>
    );
}
