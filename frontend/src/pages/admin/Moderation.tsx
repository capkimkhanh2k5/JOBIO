import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Shield, Star, CheckCircle2, XCircle,
    Building2, AlertTriangle, ThumbsUp, Flag, Loader2,
    Search, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { companyService } from '@/services/companyService';
import { dashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'companies', label: 'Duyệt công ty', icon: Building2 },
    { id: 'reviews', label: 'Kiểm duyệt đánh giá', icon: Star },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function Moderation() {
    const [activeTab, setActiveTab] = useState<TabId>('companies');
    const [companyPage, setCompanyPage] = useState(1);
    const [reviewPage, setReviewPage] = useState(1);
    const [companySearch, setCompanySearch] = useState('');
    const [reviewSearch, setReviewSearch] = useState('');
    const [debouncedCompanySearch, setDebouncedCompanySearch] = useState('');
    const [debouncedReviewSearch, setDebouncedReviewSearch] = useState('');
    const queryClient = useQueryClient();

    useEffect(() => {
        const h = setTimeout(() => { setDebouncedCompanySearch(companySearch); setCompanyPage(1); }, 300);
        return () => clearTimeout(h);
    }, [companySearch]);

    useEffect(() => {
        const h = setTimeout(() => { setDebouncedReviewSearch(reviewSearch); setReviewPage(1); }, 300);
        return () => clearTimeout(h);
    }, [reviewSearch]);

    // Stats
    const { data: statsData } = useQuery({
        queryKey: ['moderation-stats'],
        queryFn: () => dashboardService.getModerationStats().then(r => r.data),
    });

    // Companies
    const { data: companiesRes, isLoading: loadingCompanies } = useQuery({
        queryKey: ['pending-companies', companyPage, debouncedCompanySearch],
        queryFn: () => companyService.listPending({ page: companyPage, page_size: 10 }).then(r => r.data),
    });
    const companiesData = companiesRes?.results ?? [];
    const companyTotal = companiesRes?.count ?? 0;
    const companyTotalPages = Math.ceil(companyTotal / 10) || 1;

    // Reviews
    const { data: reviewsRes, isLoading: loadingReviews } = useQuery({
        queryKey: ['pending-reviews', reviewPage, debouncedReviewSearch],
        queryFn: () => dashboardService.listPendingReviews({ page: reviewPage, page_size: 10 }).then(r => r.data),
    });
    const reviewsData = (reviewsRes as any)?.results ?? reviewsRes?.reviews ?? [];
    const reviewTotal = (reviewsRes as any)?.count ?? reviewsRes?.total ?? 0;
    const reviewTotalPages = Math.ceil(reviewTotal / 10) || 1;

    // Mutations
    const verifyCompanyMut = useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'verified' | 'rejected' }) =>
            companyService.adminVerify(id, status),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['pending-companies'] });
            queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
            toast.success(vars.status === 'verified' ? 'Đã duyệt công ty thành công!' : 'Đã từ chối công ty.');
        },
        onError: () => toast.error('Có lỗi xảy ra khi xử lý yêu cầu.'),
    });

    const moderateReviewMut = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
            dashboardService.moderateReview(id, action),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
            toast.success(vars.action === 'approve' ? 'Đã duyệt đánh giá thành công!' : 'Đã từ chối đánh giá.');
        },
        onError: () => toast.error('Có lỗi xảy ra khi xử lý yêu cầu.'),
    });

    const statCards = [
        { label: 'Công ty chờ duyệt', value: statsData?.pending_companies ?? 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Công ty đã xác minh', value: statsData?.verified_companies ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Đánh giá chờ duyệt', value: statsData?.pending_reviews ?? 0, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Đánh giá đã duyệt', value: statsData?.approved_reviews ?? 0, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="w-6 h-6 text-violet-600" />
                        Duyệt &amp; Kiểm duyệt
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Duyệt hồ sơ công ty và kiểm duyệt đánh giá từ người dùng.</p>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} {...fadeUp(0.05 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                        <div className="relative">
                            <div className="mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString('vi-VN')}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.15)}>
                <div className="flex gap-1 bg-slate-50/50 border border-slate-200 p-1 w-fit rounded-xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const count = tab.id === 'companies' ? (statsData?.pending_companies ?? 0) : (statsData?.pending_reviews ?? 0);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                                    ${activeTab === tab.id
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`min-w-[20px] h-5 text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Companies Tab */}
            {activeTab === 'companies' && (
                <motion.div {...fadeUp(0.2)} className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm công ty theo tên, mã số thuế..."
                                value={companySearch}
                                onChange={(e) => setCompanySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 bg-slate-50/50 text-sm font-medium transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Công ty</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngành / Quy mô</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thông tin liên hệ</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày đăng ký</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingCompanies ? (
                                        <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                                    ) : companiesData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-700">Tất cả đã duyệt!</p>
                                                <p className="text-xs text-slate-400 mt-1">Không có công ty nào chờ xác minh.</p>
                                            </td>
                                        </tr>
                                    ) : companiesData.map((company: any) => (
                                        <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0 overflow-hidden">
                                                        {company.logo_url
                                                            ? <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-cover" />
                                                            : company.company_name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm">{company.company_name}</span>
                                                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-1.5 py-0 w-fit mt-0.5">
                                                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Chờ duyệt
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-semibold text-slate-700">{company.industry?.name ?? '—'}</span>
                                                    <span className="text-xs text-slate-400">{company.company_size ? `${company.company_size} nhân viên` : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{company.website ?? '—'}</span>
                                                    <span className="text-xs text-slate-400">MST: {company.tax_code ?? '—'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {company.created_at ? new Date(company.created_at).toLocaleDateString('vi-VN') : '—'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => verifyCompanyMut.mutate({ id: company.id, status: 'verified' })} disabled={verifyCompanyMut.isPending} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm h-8">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => verifyCompanyMut.mutate({ id: company.id, status: 'rejected' })} disabled={verifyCompanyMut.isPending} className="rounded-lg text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8">
                                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">
                                Hiển thị <span className="font-bold text-slate-900">{companiesData.length}</span> / <span className="font-bold text-slate-900">{companyTotal}</span> công ty
                            </p>
                            <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={companyPage <= 1} onClick={() => setCompanyPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-xs font-black text-violet-600">{companyPage}</span>
                                    <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                    <span className="text-xs font-bold text-slate-500">{companyTotalPages}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={companyPage >= companyTotalPages} onClick={() => setCompanyPage(p => Math.min(companyTotalPages, p + 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <motion.div {...fadeUp(0.2)} className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm đánh giá theo tiêu đề, nội dung..."
                                value={reviewSearch}
                                onChange={(e) => setReviewSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 bg-slate-50/50 text-sm font-medium transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Đánh giá</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Công ty</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ưu / Nhược điểm</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingReviews ? (
                                        <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                                    ) : reviewsData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-700">Không có đánh giá chờ duyệt!</p>
                                            </td>
                                        </tr>
                                    ) : reviewsData.map((review: any) => (
                                        <tr key={review.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1 max-w-[220px]">
                                                    <span className="font-bold text-slate-900 text-sm truncate">{review.title}</span>
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-500 line-clamp-2">{review.content}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-slate-800 text-sm">{review.company?.company_name ?? '—'}</span>
                                                    <span className="text-xs text-slate-400">{review.candidate?.full_name ?? 'Ẩn danh'}</span>
                                                    <span className="text-[10px] text-slate-400">{review.employment_status === 'current' ? 'Đang làm việc' : 'Đã nghỉ'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-2 max-w-[200px]">
                                                    <div className="bg-emerald-50 rounded-lg px-2 py-1.5 border border-emerald-100">
                                                        <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5"><ThumbsUp className="w-2.5 h-2.5 inline mr-0.5" />Ưu điểm</p>
                                                        <p className="text-xs text-slate-700 line-clamp-2">{review.pros}</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded-lg px-2 py-1.5 border border-red-100">
                                                        <p className="text-[9px] font-bold text-red-700 uppercase tracking-wider mb-0.5"><Flag className="w-2.5 h-2.5 inline mr-0.5" />Nhược điểm</p>
                                                        <p className="text-xs text-slate-700 line-clamp-2">{review.cons}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : '—'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => moderateReviewMut.mutate({ id: review.id, action: 'approve' })} disabled={moderateReviewMut.isPending} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm h-8">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => moderateReviewMut.mutate({ id: review.id, action: 'reject' })} disabled={moderateReviewMut.isPending} className="rounded-lg text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 h-8">
                                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">
                                Hiển thị <span className="font-bold text-slate-900">{reviewsData.length}</span> / <span className="font-bold text-slate-900">{reviewTotal}</span> đánh giá
                            </p>
                            <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={reviewPage <= 1} onClick={() => setReviewPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-xs font-black text-violet-600">{reviewPage}</span>
                                    <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                    <span className="text-xs font-bold text-slate-500">{reviewTotalPages}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage(p => Math.min(reviewTotalPages, p + 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
