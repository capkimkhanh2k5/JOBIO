import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/useStore";
import { jobService } from "@/services/jobService";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobSort } from "@/components/jobs/JobSort";
import { JobCard } from "@/components/jobs/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Briefcase, MapPin, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JobsPage() {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filters = useFilterStore();
    const { search, setSearch } = filters;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['jobs', filters],
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (filters.search) params.search = filters.search;
            if (filters.category && filters.category !== 'all') params.category_id = filters.category;
            if (filters.province && filters.province !== 'all') params.province_id = filters.province;
            if (filters.job_type?.length) params.job_type = filters.job_type.join(',');
            if (filters.level?.length) params.level = filters.level.join(',');
            if (filters.isRemote !== null) params.is_remote = filters.isRemote;
            if (filters.salaryRange?.[0] > 0) params.salary_min = filters.salaryRange[0];
            if (filters.salaryRange?.[1] < 10000) params.salary_max = filters.salaryRange[1];
            if (filters.experienceRange?.[0] > 0) params.experience_min = filters.experienceRange[0];
            if (filters.experienceRange?.[1] < 15) params.experience_max = filters.experienceRange[1];
            if (filters.skills?.length) params.skills = filters.skills.join(',');
            const { data: resp } = await jobService.list(params);
            return { items: resp.results, total: resp.count };
        },
        placeholderData: (previousData) => previousData,
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search Header */}
            <section className="mb-12 relative overflow-hidden rounded-3xl bg-background/60 backdrop-blur-2xl border border-white/20 p-8 sm:p-12 shadow-xl shadow-primary/5">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
                    >
                        Tìm kiếm công việc mơ ước
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        Hàng ngàn cơ hội nghề nghiệp tại các công ty hàng đầu đang chờ đón bạn.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-2 bg-background/50 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl shadow-primary/5"
                    >
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Tiêu đề công việc, công ty..."
                                className="pl-10 h-12 border-none bg-transparent focus-visible:ring-0 text-lg"
                            />
                        </div>
                        <div className="w-[1px] bg-white/10 mx-2 hidden sm:block" />
                        <div className="flex-1 relative hidden sm:block">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Địa điểm..."
                                className="pl-10 h-12 border-none bg-transparent focus-visible:ring-0 text-lg"
                            />
                        </div>
                        <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
                            Tìm kiếm
                        </Button>
                    </motion.div>
                </div>
            </section>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters - Desktop */}
                <aside className="hidden lg:block w-80 flex-shrink-0">
                    <div className="sticky top-24 space-y-6">
                        <div className="glass-card-tinted border-white/20 rounded-2xl p-6 shadow-xl">
                            <JobFilters />
                        </div>
                        {/* Job Alert Promo */}
                        <div className="bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 rounded-2xl p-6 space-y-4">
                            <h4 className="font-bold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                Nhận thông báo việc làm
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Chúng tôi sẽ gửi các việc làm phù hợp nhất với tiêu chí của bạn vào email hàng ngày.
                            </p>
                            <Button size="sm" className="w-full bg-primary text-primary-foreground">Thiết lập ngay</Button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <JobSort
                        view={view}
                        setView={setView}
                        totalResults={data?.total || 0}
                        onMobileFilterToggle={() => setIsFilterOpen(true)}
                    />

                    {/* Results Area */}
                    <div className="mt-6">
                        {isLoading ? (
                            <div className={cn(
                                "grid gap-6",
                                view === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                            )}>
                                {Array(6).fill(0).map((_, i) => (
                                    <CardSkeleton key={i} view={view} />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                                <h3 className="text-xl font-bold">Đã có lỗi xảy ra</h3>
                                <p className="text-muted-foreground">Vui lòng thử lại sau giây lát.</p>
                                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tải lại trang</Button>
                            </div>
                        ) : data?.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted text-center max-w-md mx-auto">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                    <Briefcase className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Không tìm thấy việc làm</h3>
                                <p className="text-muted-foreground mb-6">Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc để có nhiều kết quả hơn.</p>
                                <Button onClick={() => filters.resetFilters()}>Xóa tất cả bộ lọc</Button>
                            </div>
                        ) : (
                            <motion.div
                                layout
                                className={cn(
                                    "grid gap-6",
                                    view === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                                )}
                            >
                                <AnimatePresence mode="popLayout">
                                    {data?.items.map((job: any) => (
                                        <JobCard key={job.id} job={job} view={view} />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Pagination / Load More (Stub) */}
                        {!isLoading && data && data.items.length > 0 && (
                            <div className="mt-12 flex justify-center">
                                <Button variant="outline" className="px-12 py-6 rounded-xl border-white/10 hover:bg-white/5 transition-colors">
                                    Tải thêm việc làm
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Filter Drawer */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-6 overflow-y-auto bg-background/95 backdrop-blur-xl border-r-white/10">
                    <JobFilters />
                    <div className="mt-8 pt-4 border-t border-white/10">
                        <Button className="w-full" onClick={() => setIsFilterOpen(false)}>Hiển thị kết quả</Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function CardSkeleton({ view }: { view: "grid" | "list" }) {
    if (view === "list") {
        return (
            <div className="flex items-center p-4 gap-6 bg-background/40 rounded-xl border border-white/10">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-12 w-32 rounded-lg" />
            </div>
        );
    }
    return (
        <div className="p-6 bg-background/40 rounded-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="w-10 h-10 rounded-full" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
