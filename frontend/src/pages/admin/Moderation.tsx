import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Star, CheckCircle2, XCircle,
    Building2, AlertTriangle, ThumbsUp, Flag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'companies', label: 'Duyệt công ty', icon: Building2, count: 4 },
    { id: 'reviews', label: 'Kiểm duyệt đánh giá', icon: Star, count: 3 },
] as const;

type TabId = (typeof tabs)[number]['id'];

/* ── Mock Data ── */
const PENDING_COMPANIES = [
    { id: 1, name: 'TechVN Solutions', industry: 'Công nghệ thông tin', size: '51-200', website: 'techvn.com', taxCode: '0123456789', date: '08/03/2026', description: 'Công ty phần mềm chuyên về giải pháp ERP cho doanh nghiệp vừa và nhỏ.' },
    { id: 2, name: 'GreenFood Corporation', industry: 'Thực phẩm & Đồ uống', size: '201-500', website: 'greenfood.vn', taxCode: '9876543210', date: '07/03/2026', description: 'Tập đoàn sản xuất và phân phối thực phẩm hữu cơ hàng đầu Việt Nam.' },
    { id: 3, name: 'EduStar Academy', industry: 'Giáo dục', size: '11-50', website: 'edustar.edu.vn', taxCode: '1122334455', date: '06/03/2026', description: 'Trung tâm đào tạo ngoại ngữ và kỹ năng mềm cho sinh viên.' },
    { id: 4, name: 'DigitalX Agency', industry: 'Marketing & Quảng cáo', size: '11-50', website: 'digitalx.vn', taxCode: '5566778899', date: '05/03/2026', description: 'Agency chuyên dịch vụ Digital Marketing và Branding cho SME.' },
];

const PENDING_REVIEWS = [
    { id: 1, company: 'FPT Software', companyId: 10, rating: 4, title: 'Môi trường làm việc chuyên nghiệp', content: 'Môi trường tốt, đồng nghiệp thân thiện. Lương cạnh tranh nhưng OT khá nhiều.', pros: 'Đào tạo tốt, nhiều dự án quốc tế', cons: 'OT nhiều, quy trình phức tạp', author: 'anonymous', employment: 'current', date: '09/03/2026' },
    { id: 2, company: 'Viettel IDC', companyId: 11, rating: 2, title: 'Cần cải thiện nhiều điều', content: 'Quản lý chưa tốt, thiếu minh bạch trong đánh giá và thăng tiến.', pros: 'Lương ổn định, BHXH đầy đủ', cons: 'Ít cơ hội phát triển, văn hóa quân đội', author: 'anonymous', employment: 'former', date: '08/03/2026' },
    { id: 3, company: 'Shopee Vietnam', companyId: 12, rating: 5, title: 'Tuyệt vời cho người trẻ', content: 'Rất năng động, trẻ trung, nhiều phúc lợi hấp dẫn. Cơ hội học hỏi rất lớn.', pros: 'Năng động, phúc lợi tốt, team trẻ', cons: 'Cạnh tranh cao, áp lực KPI', author: 'Nguyen V.', employment: 'current', date: '07/03/2026' },
];

export default function Moderation() {
    const [activeTab, setActiveTab] = useState<TabId>('companies');
    const [companiesData, setCompaniesData] = useState(PENDING_COMPANIES);
    const [reviewsData, setReviewsData] = useState(PENDING_REVIEWS);

    const handleApproveCompany = (id: number) => {
        setCompaniesData(prev => prev.filter(c => c.id !== id));
    };

    const handleRejectCompany = (id: number) => {
        setCompaniesData(prev => prev.filter(c => c.id !== id));
    };

    const handleApproveReview = (id: number) => {
        setReviewsData(prev => prev.filter(r => r.id !== id));
    };

    const handleRejectReview = (id: number) => {
        setReviewsData(prev => prev.filter(r => r.id !== id));
    };

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
                                {count > 0 && (
                                    <span className={`min-w-[20px] h-5 text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
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
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    {companiesData.length === 0 ? (
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
                                            {company.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base font-bold text-slate-900">{company.name}</h3>
                                                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                                    <AlertTriangle className="w-3 h-3 mr-1" /> Chờ duyệt
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">{company.description}</p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                                                <span><strong className="text-slate-700">Ngành:</strong> {company.industry}</span>
                                                <span><strong className="text-slate-700">Quy mô:</strong> {company.size} nhân viên</span>
                                                <span><strong className="text-slate-700">Website:</strong> {company.website}</span>
                                                <span><strong className="text-slate-700">MST:</strong> {company.taxCode}</span>
                                                <span><strong className="text-slate-700">Ngày đăng ký:</strong> {company.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 lg:self-center">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveCompany(company.id)}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Duyệt
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRejectCompany(company.id)}
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
                    {reviewsData.length === 0 ? (
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
                                            <span><strong className="text-slate-700">Công ty:</strong> {review.company}</span>
                                            <span><strong className="text-slate-700">Người đánh giá:</strong> {review.author}</span>
                                            <span><strong className="text-slate-700">Trạng thái:</strong> {review.employment === 'current' ? 'Đang làm việc' : 'Đã nghỉ'}</span>
                                            <span><strong className="text-slate-700">Ngày:</strong> {review.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 lg:self-center">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveReview(review.id)}
                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Duyệt
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRejectReview(review.id)}
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
