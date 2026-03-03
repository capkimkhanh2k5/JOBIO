import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { mockApi } from '@/services/mockApi';
import { useFilterStore } from '@/store/filterStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CVSearchFiltersPanel } from '@/components/employer/cv/CVSearchFilters';
import { CandidateCard, CandidateCardSkeleton } from '@/components/employer/cv/CandidateCard';
import { CandidateProfileSheet } from '@/components/employer/cv/CandidateProfileSheet';

export default function EmployerCVSearch() {
    const filters = useFilterStore(state => state.cvFilters);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const navigate = useNavigate();

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['employer', 'cvSearch', filters, 1],
        queryFn: () => mockApi.searchCandidates({ ...filters, page: 1, limit: 12 }),
        placeholderData: (prev) => prev, // keepPreviousData approach
    });

    const isBackgroundFetching = isFetching && !isLoading;

    const handleCandidateClick = (id: string) => {
        setSelectedCandidateId(id);
    };

    const handleExport = () => {
        toast.info("Tính năng xuất báo cáo sẽ được cập nhật trong phiên bản tới!");
    };

    const handleCreateCampaign = () => {
        navigate('/employer/campaigns');
    };

    return (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-background/50">
            {/* Page Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tìm kiếm ứng viên</h1>
                    <p className="text-muted-foreground text-sm mt-1">Duyệt qua hàng ngàn hồ sơ chất lượng cao</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleExport} variant="outline" className="bg-card shadow-sm border-border/50">
                        <Download className="w-4 h-4 mr-2" />
                        Xuất báo cáo
                    </Button>
                    <Button onClick={handleCreateCampaign} className="shadow-lg shadow-primary/20">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Tạo chiến dịch tuyển dụng
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 w-full max-w-[1600px] mx-auto overflow-hidden">
                {/* Fixed Left Sidebar for Filters */}
                <div className="w-[300px] border-r border-border/40 hidden md:flex flex-col flex-shrink-0 bg-background/30 z-10">
                    <div className="p-4 h-full">
                        <CVSearchFiltersPanel />
                    </div>
                </div>

                {/* Right Scrollable Content: Results Grid */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="p-6">
                        {/* Results count & loading indicator */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                {isLoading ? (
                                    <Skeleton className="w-32 h-6" />
                                ) : (
                                    <span>Tìm thấy {data?.total || 0} hồ sơ phù hợp</span>
                                )}
                            </h2>
                            {isBackgroundFetching && (
                                <div className="text-sm text-primary flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    Đang làm mới...
                                </div>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <CandidateCardSkeleton key={i} />
                                ))
                            ) : data?.items?.length ? (
                                data.items.map((candidate: any) => (
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
                                    <p className="text-muted-foreground max-w-md">Hãy thử thay đổi tiêu chí tìm kiếm hoặc xóa bớt bộ lọc để nhận được nhiều kết quả hơn.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
