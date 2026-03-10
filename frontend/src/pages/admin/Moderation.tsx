import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Shield, Star, CheckCircle2, XCircle,
    Building2, AlertTriangle, ThumbsUp, Flag, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { companyService } from '@/services/companyService';
import { dashboardService } from '@/services/dashboardService';

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
    const queryClient = useQueryClient();

    const { data: companiesRes, isLoading: loadingCompanies } = useQuery({
        queryKey: ['pending-companies'],
        queryFn: () => companyService.listPending().then(r => r.data),
    });
    const companiesData = companiesRes?.results ?? [];

    const { data: reviewsRes, isLoading: loadingReviews } = useQuery({
        queryKey: ['pending-reviews'],
        queryFn: () => dashboardService.listPendingReviews().then(r => r.data),
    });
    const reviewsData = reviewsRes?.reviews ?? [];

    const verifyCompanyMut = useMutation({
        mutationFn: ({ id, status }: { id: number; status: 'verified' | 'rejected' }) =>
            companyService.adminVerify(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-companies'] }),
    });

    const moderateReviewMut = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
            dashboardService.moderateReview(id, action),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-reviews'] }),
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Duyệt & Kiểm duyệt
                </h1>
                <p className="text-sm text-slate-500 mt-1">Duyệt công ty và kiểm duyệt đánh giá</p>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1 w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const count = tab.id === 'companies' ? companiesData.length : reviewsData.length;
                        const loading = tab.id === 'companies' ? loadingCompanies : loadingReviews;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                                    ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {loading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : count > 0 ? (
                                    <span className={`min-w-[20px] h-5 text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                                        {count}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Companies Tab */}
            {activeTab === 'companies' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    {loadingCompanies ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" />
                            <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                        </div>
                    ) : companiesData.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <p className="text-lg font-bold text-slate-900">Tất cả đã duyệt!</p>
                            <p className="text-sm text-slate-500 mt-1">Không có công ty nào chờ xác minh.</p>
                        </div>
                    ) : (
                        companiesData.map((company) => (
                            <div key={company.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex gap-4 flex-1">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0">
                                            {company.company_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-bold text-slate-900">{company.company_name}</h3>
                                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                                    <AlertTriangle className="w-3 h-3 mr-1" /> Chờ duyệt
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">{company.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                                                <span><strong className="text-slate-700">Ngành:</strong> {company.industry?.name}</span>
                                                <span><strong className="text-slate-700">Quy mô:</strong> {company.company_size} nhân viên</span>
                                                <span><strong className="text-slate-700">Website:</strong> {company.website}</span>
                                                <span><strong className="text-slate-700">MST:</strong> {company.tax_code}</span>
                                                <span><strong className="text-slate-700">Ngày đăng ký:</strong> {new Date(company.created_at).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 lg:self-center">
                                        <Button
                                            size="sm"
                                            onClick={() => verifyCompanyMut.mutate({ id: company.id, status: 'verified' })}
                                            disabled={verifyCompanyMut.isPending}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Duyệt
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => verifyCompanyMut.mutate({ id: company.id, status: 'rejected' })}
                                            disabled={verifyCompanyMut.isPending}
                                            className="rounded-xl text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                        >
                                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Từ chối
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    {loadingReviews ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" />
                            <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                        </div>
                    ) : reviewsData.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <p className="text-lg font-bold text-slate-900">Không có đánh giá chờ duyệt!</p>
                        </div>
                    ) : (
                        reviewsData.map((review) => (
                            <div key={review.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="text-base font-bold text-slate-900">{review.title}</h3>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3">{review.content}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                            <div className="bg-emerald-50/50 rounded-lg px-3 py-2 border border-emerald-100">
                                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1"><ThumbsUp className="w-3 h-3 inline mr-1" />Ưu điểm</p>
                                                <p className="text-xs text-slate-700">{review.pros}</p>
                                            </div>
                                            <div className="bg-red-50/50 rounded-lg px-3 py-2 border border-red-100">
                                                <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1"><Flag className="w-3 h-3 inline mr-1" />Nhược điểm</p>
                                                <p className="text-xs text-slate-700">{review.cons}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span><strong className="text-slate-700">Công ty:</strong> {review.company?.company_name}</span>
                                            <span><strong className="text-slate-700">Người đánh giá:</strong> {review.recruiter?.full_name ?? 'Ẩn danh'}</span>
                                            <span><strong className="text-slate-700">Trạng thái:</strong> {(review.employment_status ?? (review as any).employment) === 'current' ? 'Đang làm việc' : 'Đã nghỉ'}</span>
                                            <span><strong className="text-slate-700">Ngày:</strong> {review.created_at ? new Date(review.created_at).toLocaleDateString('vi-VN') : (review as any).date}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 lg:self-center">
                                        <Button
                                            size="sm"
                                            onClick={() => moderateReviewMut.mutate({ id: review.id, action: 'approve' })}
                                            disabled={moderateReviewMut.isPending}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Duyệt
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => moderateReviewMut.mutate({ id: review.id, action: 'reject' })}
                                            disabled={moderateReviewMut.isPending}
                                            className="rounded-xl text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Từ chối
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>
            )}
        </div>
    );
}
