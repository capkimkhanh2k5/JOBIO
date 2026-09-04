import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { companyService } from "@/services/companyService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Users, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function CompaniesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const industryId = searchParams.get("industry_id") || "";

    useEffect(() => {
        setPage(1);
    }, [industryId]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["companies", search, industryId, page],
        queryFn: async () => {
            const params: Record<string, any> = {
                page,
                page_size: PAGE_SIZE,
            };
            if (search) params.search = search;
            if (industryId) params.industry_id = industryId;

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
        window.dispatchEvent(new CustomEvent('app:scroll-to-top'));
    };

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
        navigate("/companies");
    };

    return (
        <div className="min-h-screen bg-muted flex flex-col">
            {/* ── Search Hero (Full width, extends to header) ── */}
            <div className="relative overflow-hidden pt-28 pb-16 px-4 border-b border-primary/10 shadow-sm" style={{
                background: 'linear-gradient(160deg, oklch(0.16 0.04 175) 0%, oklch(0.13 0.03 175) 40%, oklch(0.11 0.02 175) 100%)'
            }}>
                {/* Blobs */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, oklch(0.45 0.14 175 / 0.2) 0%, transparent 68%)' }} />
                <div className="absolute -bottom-24 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, oklch(0.65 0.12 85 / 0.12) 0%, transparent 68%)' }} />
                {/* Dot grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.14]" style={{
                    backgroundImage: 'radial-gradient(circle, oklch(0.65 0.14 175 / 0.15) 1px, transparent 1.2px)',
                    backgroundSize: '24px 24px'
                }} />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        Khám phá{' '}
                        <span className="bg-gradient-to-r from-primary via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                            Môi trường làm việc
                        </span>
                        {' '}hàng đầu
                    </h1>
                    <p className="text-white/40 text-base md:text-lg mb-8 font-light max-w-2xl mx-auto">
                        Tìm hiểu văn hóa công ty, chế độ phúc lợi và các cơ hội việc làm hấp dẫn từ các nhà tuyển dụng hàng đầu.
                    </p>

                    {/* Search card */}
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl w-full max-w-2xl mx-auto focus-within:border-teal-400/60 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all">
                        <div className="flex items-center flex-1 px-4 gap-3">
                            <Search className="h-5 w-5 text-white/70 shrink-0" />
                            <Input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Nhập tên công ty hoặc lĩnh vực..."
                                className="border-0 bg-transparent h-12 px-0 focus-visible:ring-0 text-base text-white font-medium placeholder:text-white/70"
                            />
                        </div>
                        <Button
                            onClick={handleSearchClick}
                            className="px-8 h-12 rounded-xl font-extrabold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white shadow-lg shadow-teal-500/25 shrink-0"
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
                    <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-border text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Đã có lỗi xảy ra</h3>
                        <p className="text-muted-foreground mb-6">Xin lỗi, chúng tôi không thể tải danh sách công ty do sự cố máy chủ.</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>Thử lại</Button>
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-dashed border-border text-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 border border-border/60">
                            <Building2 className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy công ty nào</h3>
                        <p className="text-muted-foreground mb-6">Không có kết quả nào phù hợp với từ khóa "{search}". Vui lòng thử lại với từ khóa khác.</p>
                        <Button onClick={clearFilters} variant="outline">
                            Xem tất cả công ty
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                {data?.total} <span className="font-normal text-muted-foreground">công ty phù hợp</span>
                            </h2>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {data?.items?.map((company: any) => (
                                <CompanyCard key={company.id} company={company} />
                            ))}
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
                                                page === pageNum ? "bg-primary text-white border-primary" : "text-muted-foreground"
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
    const addressText = formatCompanyAddress(company);
    const sizeText = company.company_size || company.employee_count_range || null;
    const description = cleanCompanyDescription(company.description);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="group bg-card border border-border/80 rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-teal-500/30 transition-all duration-300 flex flex-col h-full"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl border border-border/60 flex items-center justify-center p-1.5 bg-card flex-shrink-0 shadow-sm overflow-hidden">
                    {company.logo_url ? (
                        <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                    ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground/40" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <Link to={`/companies/${company.id}`} className="font-bold text-foreground text-base hover:text-teal-600 transition-colors truncate block">
                        {company.company_name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{industryName}</p>
                </div>
            </div>

            {description && (
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2 mb-3">
                    {description}
                </p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border/50 text-xs text-muted-foreground bg-muted/40 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 min-w-0" title={addressText || "Chưa cập nhật địa chỉ"}>
                    <MapPin className="w-3.5 h-3.5 text-teal-600/70 shrink-0" />
                    <span className="truncate text-foreground/80">{addressText || "Chưa cập nhật"}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0" title={sizeText || "Chưa cập nhật quy mô"}>
                    <Users className="w-3.5 h-3.5 text-teal-600/70 shrink-0" />
                    <span className="truncate text-foreground/80">{sizeText || "Chưa cập nhật"}</span>
                </div>
            </div>

            <Link to={`/companies/${company.id}`} className="mt-3.5 w-full">
                <Button variant="outline" className="w-full h-9 rounded-xl font-bold text-xs group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                    Xem hồ sơ
                </Button>
            </Link>
        </motion.div>
    );
}

function CompanySkeleton() {
    return (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col h-full">
            <div className="flex gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
            </div>
            <Skeleton className="h-10 w-full mb-3 rounded-lg" />
            <Skeleton className="h-9 w-full mt-auto rounded-xl" />
        </div>
    );
}

function formatCompanyAddress(company: any) {
    const address = company.address;
    if (address && typeof address === 'object' && address.province_name) return address.province_name;

    const rawAddress = company.headquarters || company.headquarters_address || '';
    if (!rawAddress) return '';

    const parts = rawAddress.split(',').map((part: string) => part.trim()).filter(Boolean);
    return parts[parts.length - 1] || rawAddress;
}

function cleanCompanyDescription(value?: string | null) {
    return value
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '';
}

function getPageNumber(current: number, total: number, index: number): number {
    const half = 2;
    let start = Math.max(1, current - half);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    return start + index;
}
