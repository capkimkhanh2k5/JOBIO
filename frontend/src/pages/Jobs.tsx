import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/store/useStore";
import { jobService } from "@/services/jobService";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobSort } from "@/components/jobs/JobSort";
import { JobCard } from "@/components/jobs/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search, Briefcase, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function JobsPage() {
    const [view, setView] = useState<"grid" | "list">("grid");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState("-created_at");

    const filters = useFilterStore();
    const { search, setSearch } = filters;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["jobs", filters, page, sort],
        queryFn: async () => {
            const params: Record<string, any> = {
                page,
                page_size: PAGE_SIZE,
                ordering: sort,
                status: "published",
            };
            if (filters.search) params.search = filters.search;
            if (filters.category && filters.category !== "all") params.category_id = filters.category;
            if (filters.province && filters.province !== "all") params.province_id = filters.province;
            if (filters.job_type?.length) params.job_type = filters.job_type.join(",");
            if (filters.level?.length) params.level = filters.level.join(",");
            if (filters.isRemote !== null) params.is_remote = filters.isRemote;
            if (filters.salaryRange?.[0] > 0) params.salary_min = filters.salaryRange[0];
            if (filters.salaryRange?.[1] < 10000) params.salary_max = filters.salaryRange[1];
            if (filters.experienceRange?.[0] > 0) params.experience_min = filters.experienceRange[0];
            if (filters.experienceRange?.[1] < 15) params.experience_max = filters.experienceRange[1];
            if (filters.skills?.length) params.skills = filters.skills.join(",");
            const { data: resp } = await jobService.list(params);
            const items = Array.isArray(resp) ? resp : (resp?.results || []);
            const total = Array.isArray(resp) ? resp.length : (resp?.count || 0);
            return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
        },
        placeholderData: prev => prev,
    });

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") setPage(1);
    };

    const handleSortChange = (s: string) => { setSort(s); setPage(1); };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Top-level header removed, search is moved into main content ── */}

            {/* ── Body ── */}
            <div className="container mx-auto px-4 pt-24 pb-8 space-y-6">

                {/* ── Search Hero (Full container width) ── */}
                <div className="relative overflow-hidden rounded-2xl py-12 px-6 border border-primary/10 shadow-sm" style={{
                    background: 'linear-gradient(135deg, oklch(0.92 0.06 265) 0%, oklch(0.95 0.04 282) 45%, oklch(0.97 0.02 218) 100%)'
                }}>
                    {/* Blobs */}
                    <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, oklch(0.68 0.22 272 / 0.18) 0%, transparent 68%)' }} />
                    <div className="absolute -bottom-24 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, oklch(0.72 0.18 202 / 0.15) 0%, transparent 68%)' }} />
                    {/* Dot grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.14]" style={{
                        backgroundImage: 'radial-gradient(circle, oklch(0.45 0.20 265) 1.2px, transparent 1.2px)',
                        backgroundSize: '24px 24px'
                    }} />

                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight drop-shadow-sm">
                            Tìm Việc Làm{' '}
                            <span className="bg-gradient-to-r from-primary via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                                Phù Hợp
                            </span>
                        </h1>
                        <p className="text-gray-600 text-sm mb-6 font-medium">
                            Hàng nghìn cơ hội nghề nghiệp từ các công ty hàng đầu đang chờ bạn.
                        </p>

                        {/* Search card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-primary/5 border border-white/60 p-2 flex gap-2 w-full max-w-xl mx-auto ring-1 ring-black/5">
                            <div className="flex items-center flex-1 bg-white border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={handleSearch}
                                    placeholder="Tiêu đề, kỹ năng, công ty..."
                                    className="border-0 bg-transparent h-11 px-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                                />
                            </div>
                            <Button
                                onClick={() => setPage(1)}
                                className="px-8 h-11 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 shadow-md shadow-violet-400/30 transition-all shrink-0"
                            >
                                Tìm kiếm
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className="flex gap-6">
                    {/* Sidebar filters — desktop */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <JobFilters />
                            </div>
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="flex-1 min-w-0 flex flex-col gap-6">

                        {/* ── Search Hero relocated above ── */}

                        {/* List Header (Sort & Views) */}
                        <JobSort
                            view={view}
                            setView={setView}
                            totalResults={data?.total ?? 0}
                            onMobileFilterToggle={() => setIsFilterOpen(true)}
                            sort={sort}
                            setSort={handleSortChange}
                        />

                        <div className="mt-5">
                            {isLoading ? (
                                <div className={cn(
                                    "grid gap-4",
                                    view === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-2" : "grid-cols-1"
                                )}>
                                    {Array(6).fill(0).map((_, i) => (
                                        <CardSkeleton key={i} view={view} />
                                    ))}
                                </div>
                            ) : isError ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 text-center">
                                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="h-6 w-6 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Đã có lỗi xảy ra</h3>
                                    <p className="text-sm text-gray-500 mb-5">Vui lòng thử lại sau giây lát.</p>
                                    <Button variant="outline" onClick={() => window.location.reload()}>Tải lại trang</Button>
                                </div>
                            ) : !data || data.items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                                        <Briefcase className="h-7 w-7 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Không tìm thấy việc làm</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mb-5">
                                        Thử thay đổi từ khóa hoặc bỏ bớt bộ lọc để tìm thêm kết quả.
                                    </p>
                                    <Button onClick={() => filters.resetFilters()} variant="outline">
                                        Xóa tất cả bộ lọc
                                    </Button>
                                </div>
                            ) : (
                                <motion.div
                                    layout
                                    className={cn(
                                        "grid gap-4",
                                        view === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-2" : "grid-cols-1"
                                    )}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {data?.items?.map((job: any) => (
                                            <JobCard key={job.id} job={job} view={view} />
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* Pagination */}
                            {!isLoading && data && data.pageCount > 1 && (
                                <div className="mt-8 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Trang <span className="font-semibold text-gray-800">{page}</span> / {data.pageCount}
                                        {" "}· {data.total} kết quả
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline" size="icon"
                                            className="h-8 w-8 border-gray-200"
                                            disabled={page <= 1}
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        {Array.from({ length: Math.min(data.pageCount, 5) }, (_, i) => {
                                            const pageNum = getPageNumber(page, data.pageCount, i);
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "outline"}
                                                    size="icon"
                                                    className={cn(
                                                        "h-8 w-8 text-xs",
                                                        page === pageNum ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600"
                                                    )}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                        <Button
                                            variant="outline" size="icon"
                                            className="h-8 w-8 border-gray-200"
                                            disabled={page >= data.pageCount}
                                            onClick={() => handlePageChange(Math.min(data.pageCount, page + 1))}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile filter drawer */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 overflow-y-auto bg-white">
                    <SheetHeader className="px-5 py-4 border-b border-gray-100">
                        <SheetTitle className="text-base font-bold">Bộ lọc</SheetTitle>
                    </SheetHeader>
                    <div className="p-5">
                        <JobFilters />
                    </div>
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" onClick={() => setIsFilterOpen(false)}>
                            Xem kết quả ({data?.total ?? 0})
                        </Button>
                    </div>
                </SheetContent>
            </Sheet >
        </div >
    );
}

/** Smart page window: always show 5 pages centered around current */
function getPageNumber(current: number, total: number, index: number): number {
    const half = 2;
    let start = Math.max(1, current - half);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    return start + index;
}

function CardSkeleton({ view }: { view: "grid" | "list" }) {
    if (view === "list") {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-16 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        );
    }
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-lg" />
                <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-1.5">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
        </div>
    );
}
