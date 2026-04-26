import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { companyService } from "@/services/companyService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Users, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function CompaniesPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["companies", search, page],
        queryFn: async () => {
            const params: Record<string, any> = {
                page,
                page_size: PAGE_SIZE,
            };
            if (search) params.search = search;

            const { data: resp } = await companyService.list(params);
            const items = Array.isArray(resp) ? resp : (resp?.results || []);
            const total = Array.isArray(resp) ? resp.length : (resp?.count || 0);
            return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
        },
        placeholderData: prev => prev,
    });

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setSearch(searchInput);
            setPage(1);
        }
    };

    const handleSearchClick = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ── Search Hero (Full width, extends to header) ── */}
            <div className="relative overflow-hidden pt-28 pb-16 px-4 border-b border-primary/10 shadow-sm" style={{
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

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight drop-shadow-sm">
                        Khám phá{' '}
                        <span className="bg-gradient-to-r from-primary via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                            Môi trường làm việc
                        </span>
                        {' '}hàng đầu
                    </h1>
                    <p className="text-gray-600 text-base md:text-lg mb-8 font-medium max-w-2xl mx-auto">
                        Tìm hiểu văn hóa công ty, chế độ phúc lợi và các cơ hội việc làm hấp dẫn từ các nhà tuyển dụng hàng đầu.
                    </p>

                    {/* Search card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-primary/5 border border-white/60 p-2 flex gap-2 w-full max-w-2xl mx-auto ring-1 ring-black/5">
                        <div className="flex items-center flex-1 bg-gray-50 border border-transparent rounded-xl px-4 gap-2 focus-within:border-primary/50 focus-within:bg-white transition-colors">
                            <Search className="h-5 w-5 text-gray-400" />
                            <Input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Nhập tên công ty hoặc lĩnh vực..."
                                className="border-0 bg-transparent h-12 px-0 focus-visible:ring-0 text-base"
                            />
                        </div>
                        <Button
                            onClick={handleSearchClick}
                            className="px-8 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
                        >
                            Tìm kiếm
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="container mx-auto px-4 py-12 flex-1">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => (
                            <CompanySkeleton key={i} />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200 text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h3>
                        <p className="text-gray-500 mb-6">Xin lỗi, chúng tôi không thể tải danh sách công ty do sự cố máy chủ.</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>Thử lại</Button>
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                            <Building2 className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy công ty nào</h3>
                        <p className="text-gray-500 mb-6">Không có kết quả nào phù hợp với từ khóa "{search}". Vui lòng thử lại với từ khóa khác.</p>
                        <Button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} variant="outline">
                            Xem tất cả công ty
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {data?.total} <span className="font-normal text-gray-500">công ty phù hợp</span>
                            </h2>
                        </div>

                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {data?.items?.map((company: any) => (
                                    <CompanyCard key={company.id} company={company} />
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Pagination */}
                        {data && data.pageCount > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
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
                                            className={cn(
                                                "w-10 h-10",
                                                page === pageNum ? "bg-primary text-white border-primary" : "text-gray-600"
                                            )}
                                            onClick={() => handlePageChange(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={page >= data.pageCount}
                                    onClick={() => handlePageChange(Math.min(data.pageCount, page + 1))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function CompanyCard({ company }: { company: any }) {
    const industryName = typeof company.industry === 'object' ? company.industry?.name : (company.industry_name || 'Đa lĩnh vực');
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
        >
            <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl border border-gray-100 flex items-center justify-center p-2 bg-white flex-shrink-0">
                    {company.logo_url ? (
                        <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                    ) : (
                        <Building2 className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                <div>
                    <Link to={`/companies/${company.id}`} className="font-bold text-gray-900 text-lg hover:text-primary transition-colors line-clamp-2">
                        {company.company_name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{industryName}</p>
                </div>
            </div>

            <div className="space-y-2 mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{company.headquarters_address || "Chưa cập nhật địa chỉ"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{company.employee_count_range || "Chưa cập nhật quy mô"}</span>
                </div>
            </div>

            <Link to={`/companies/${company.id}`} className="mt-5 w-full">
                <Button variant="outline" className="w-full group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                    Xem hồ sơ
                </Button>
            </Link>
        </motion.div>
    );
}

function CompanySkeleton() {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col h-full">
            <div className="flex gap-4 mb-4">
                <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
            <div className="space-y-3 mt-auto pt-4 border-t border-gray-50">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-10 w-full rounded-md mt-5" />
        </div>
    );
}

function getPageNumber(current: number, total: number, index: number): number {
    const half = 2;
    let start = Math.max(1, current - half);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    return start + index;
}
