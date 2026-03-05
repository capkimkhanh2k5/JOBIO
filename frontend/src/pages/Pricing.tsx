import { useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Check, X, Zap, Star, Crown, Building2, Users, ArrowRight,
    HelpCircle, ChevronDown, Briefcase, Eye, FileText, Cpu,
    Headphones, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* ─── Types ─── */
interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    duration_days: number;
    max_jobs: number | null;
    max_featured_jobs: number | null;
    max_cv_views: number | null;
    can_export_cv: boolean;
    has_ai_matching: boolean;
    has_priority_support: boolean;
    popular?: boolean;
    color: string;
    icon: React.ElementType;
    description: string;
    cta: string;
}

interface FaqItem {
    q: string;
    a: string;
}

/* ─── Mock API ─── */
const mockBillingPlans = async (planType: 'employer' | 'candidate'): Promise<Plan[]> => {
    await delay(600);
    if (planType === 'employer') {
        return [
            {
                id: 'free', name: 'Free', price_monthly: 0, price_yearly: 0, duration_days: 30,
                max_jobs: 3, max_featured_jobs: 0, max_cv_views: 10,
                can_export_cv: false, has_ai_matching: false, has_priority_support: false,
                color: 'from-slate-500/20 to-slate-400/10', icon: Users,
                description: 'Dành cho doanh nghiệp mới bắt đầu tuyển dụng.', cta: 'Dùng miễn phí',
            },
            {
                id: 'basic', name: 'Basic', price_monthly: 499000, price_yearly: 4490000, duration_days: 30,
                max_jobs: 10, max_featured_jobs: 2, max_cv_views: 100,
                can_export_cv: true, has_ai_matching: false, has_priority_support: false,
                color: 'from-blue-500/20 to-cyan-500/10', icon: Briefcase,
                description: 'Đủ tính năng cho team HR nhỏ và SMEs.', cta: 'Chọn Basic',
            },
            {
                id: 'professional', name: 'Professional', price_monthly: 1490000, price_yearly: 13490000, duration_days: 30,
                max_jobs: 50, max_featured_jobs: 10, max_cv_views: 1000,
                can_export_cv: true, has_ai_matching: true, has_priority_support: false,
                popular: true,
                color: 'from-cyan-500/30 to-violet-500/20', icon: Rocket,
                description: 'Tính năng AI giúp tuyển dụng nhanh và chính xác hơn.', cta: 'Chọn Professional',
            },
            {
                id: 'enterprise', name: 'Enterprise', price_monthly: 0, price_yearly: 0, duration_days: 365,
                max_jobs: null, max_featured_jobs: null, max_cv_views: null,
                can_export_cv: true, has_ai_matching: true, has_priority_support: true,
                color: 'from-violet-500/20 to-purple-500/15', icon: Crown,
                description: 'Không giới hạn – tùy chỉnh theo nhu cầu doanh nghiệp lớn.', cta: 'Liên hệ tư vấn',
            },
        ];
    }
    return [
        {
            id: 'candidate-free', name: 'Free', price_monthly: 0, price_yearly: 0, duration_days: 30,
            max_jobs: null, max_featured_jobs: null, max_cv_views: null,
            can_export_cv: false, has_ai_matching: false, has_priority_support: false,
            color: 'from-slate-500/20 to-slate-400/10', icon: Users,
            description: 'Tìm việc cơ bản, ứng tuyển không giới hạn.', cta: 'Dùng miễn phí',
        },
        {
            id: 'candidate-pro', name: 'Pro', price_monthly: 99000, price_yearly: 890000, duration_days: 30,
            max_jobs: null, max_featured_jobs: null, max_cv_views: null,
            can_export_cv: true, has_ai_matching: true, has_priority_support: false,
            popular: true,
            color: 'from-cyan-500/30 to-violet-500/20', icon: Star,
            description: 'AI gợi ý việc phù hợp + hồ sơ nổi bật.', cta: 'Nâng cấp Pro',
        },
        {
            id: 'candidate-premium', name: 'Premium', price_monthly: 249000, price_yearly: 2240000, duration_days: 30,
            max_jobs: null, max_featured_jobs: null, max_cv_views: null,
            can_export_cv: true, has_ai_matching: true, has_priority_support: true,
            color: 'from-violet-500/20 to-purple-500/15', icon: Crown,
            description: 'Ưu tiên hiển thị + tư vấn nghề nghiệp 1-1.', cta: 'Chọn Premium',
        },
    ];
};

const BILLING_FAQS: FaqItem[] = [
    { q: 'Tôi có thể hủy gói bất cứ lúc nào không?', a: 'Có. Bạn có thể hủy gói đăng ký bất cứ lúc nào. Sau khi hủy, tài khoản sẽ tiếp tục hoạt động đến hết chu kỳ thanh toán hiện tại.' },
    { q: 'Có được dùng thử trước khi mua không?', a: 'JOBIO cung cấp gói Free hoàn toàn miễn phí không giới hạn thời gian. Bạn có thể trải nghiệm các tính năng cơ bản trước khi quyết định nâng cấp.' },
    { q: 'Thanh toán bằng phương thức nào?', a: 'Chúng tôi hỗ trợ: Thẻ tín dụng/ghi nợ (Visa/MasterCard), chuyển khoản ngân hàng, MoMo và ZaloPay.' },
    { q: 'Nếu không hài lòng có được hoàn tiền không?', a: 'JOBIO áp dụng chính sách hoàn tiền trong 7 ngày nếu bạn không hài lòng với dịch vụ. Liên hệ support@jobio.vn để được xử lý.' },
    { q: 'Gói Annual có ưu đãi gì?', a: 'Thanh toán theo năm tiết kiệm đến 25% so với thanh toán theo tháng. Ngoài ra, gói Annual còn được ưu tiên hỗ trợ và truy cập sớm vào các tính năng mới.' },
];

/* ─── Helpers ─── */
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
            {children}
        </motion.div>
    );
}

function FeatureRow({ feature, plans }: { feature: { key: keyof Plan; label: string }; plans: Plan[] }) {
    const isBoolean = (v: unknown) => v === true || v === false;
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <td className="py-4 px-6 text-sm font-medium text-gray-700">{feature.label}</td>
            {plans.map(plan => {
                const val = plan[feature.key];
                return (
                    <td key={plan.id} className="py-4 px-6 text-center text-sm">
                        {isBoolean(val) ? (
                            val ? <Check className="w-4 h-4 text-emerald-500 mx-auto font-bold" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />
                        ) : val === null ? (
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Không giới hạn</span>
                        ) : (
                            <span className="text-gray-900 font-semibold">{String(val)}</span>
                        )}
                    </td>
                );
            })}
        </tr>
    );
}

function FaqAccordion({ item }: { item: FaqItem }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn('bg-white rounded-2xl border overflow-hidden transition-all shadow-sm', open ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-gray-200')}>
            <button
                onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between p-5 text-left group"
                aria-expanded={open}
            >
                <span className="font-semibold text-sm pr-4 text-gray-900 group-hover:text-indigo-700 transition-colors">{item.q}</span>
                <ChevronDown className={cn('w-4 h-4 shrink-0 text-gray-400 transition-transform group-hover:text-gray-600', open && 'rotate-180 text-indigo-600')} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-gray-50/50">
                            {item.a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Main Component ─── */
export default function Pricing() {
    const [planType, setPlanType] = useState<'employer' | 'candidate'>('employer');
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    const { data: plans, isLoading } = useQuery({
        queryKey: ['billing-plans', planType],
        queryFn: () => mockBillingPlans(planType),
        staleTime: 1000 * 60 * 5,
    });

    const TABLE_FEATURES: { key: keyof Plan; label: string }[] = [
        { key: 'max_jobs', label: 'Số tin đăng tuyển' },
        { key: 'max_featured_jobs', label: 'Tin nổi bật' },
        { key: 'max_cv_views', label: 'Lượt xem CV' },
        { key: 'can_export_cv', label: 'Xuất CV ứng viên' },
        { key: 'has_ai_matching', label: 'AI Matching' },
        { key: 'has_priority_support', label: 'Hỗ trợ ưu tiên' },
    ];

    const formatPrice = (price: number) => {
        if (price === 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <div className="relative min-h-screen bg-gray-50/30">
            {/* ── Hero ── */}
            <section className="relative pt-28 pb-14 px-4 text-center overflow-hidden">
                <FadeIn>
                    <Badge className="mb-4 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5">
                        <Zap className="w-3.5 h-3.5 mr-1.5 inline" />
                        Bảng giá
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.08}>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900">
                        Gói dịch vụ{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                            phù hợp với bạn
                        </span>
                    </h1>
                </FadeIn>
                <FadeIn delay={0.14}>
                    <p className="text-gray-600 max-w-xl mx-auto mb-8">
                        Từ cá nhân tìm việc đến doanh nghiệp tuyển dụng hàng loạt — JOBIO có gói dịch vụ đáp ứng mọi nhu cầu.
                    </p>
                </FadeIn>

                {/* Employer / Candidate Toggle */}
                <FadeIn delay={0.18}>
                    <div className="inline-flex items-center bg-gray-100/80 rounded-2xl p-1 border border-gray-200 mb-6">
                        {(['employer', 'candidate'] as const).map(t => (
                            <button key={t} onClick={() => setPlanType(t)}
                                className={cn(
                                    'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
                                    planType === t
                                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                                        : 'text-gray-500 hover:text-gray-900'
                                )}>
                                {t === 'employer' ? <><Building2 className="w-4 h-4 mr-1.5 inline" />Nhà tuyển dụng</> : <><Users className="w-4 h-4 mr-1.5 inline" />Ứng viên</>}
                            </button>
                        ))}
                    </div>
                </FadeIn>

                {/* Monthly / Yearly billing */}
                <FadeIn delay={0.22}>
                    <div className="inline-flex items-center gap-3 text-sm font-medium">
                        <span className={cn('transition-colors', billing === 'monthly' ? 'text-gray-900' : 'text-gray-500')}>Tháng</span>
                        <button
                            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
                            className={cn('relative w-12 h-6 rounded-full transition-colors border-2', billing === 'yearly' ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-200 border-gray-200 hover:bg-gray-300 hover:border-gray-300')}
                            aria-label="Toggle billing period"
                        >
                            <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', billing === 'yearly' && 'translate-x-6')} />
                        </button>
                        <span className={cn('transition-colors flex items-center', billing === 'yearly' ? 'text-gray-900' : 'text-gray-500')}>
                            Năm
                            <Badge className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">-25%</Badge>
                        </span>
                    </div>
                </FadeIn>

                <div className="absolute top-24 left-1/4 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* ── Plan Cards ── */}
            <section className="py-6 px-4">
                <div className="max-w-6xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {Array(4).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-80 rounded-3xl" />
                            ))}
                        </div>
                    ) : (
                        <div className={cn('grid gap-5', planType === 'employer' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto')}>
                            {plans?.map((plan, i) => {
                                const Icon = plan.icon;
                                const price = billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
                                const isEnterprise = plan.id === 'enterprise';
                                return (
                                    <FadeIn key={plan.id} delay={i * 0.07}>
                                        <motion.div
                                            whileHover={{ y: -6 }}
                                            transition={{ duration: 0.2 }}
                                            className={cn(
                                                'relative bg-white rounded-3xl p-7 border h-full flex flex-col hover:shadow-lg shadow-sm transition-all',
                                                plan.popular ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-gray-200'
                                            )}
                                        >
                                            {plan.popular && (
                                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                                    <Badge className="bg-indigo-600 text-white border-0 px-3 py-1 shadow-md text-xs hover:bg-indigo-700 font-medium tracking-wide">
                                                        <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />Phổ biến nhất
                                                    </Badge>
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <div className={cn('p-3 rounded-xl w-fit mb-4', plan.popular ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500')}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="font-bold text-xl text-gray-900 mb-2">{plan.name}</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">{plan.description}</p>
                                            </div>

                                            <div className="mb-6 pb-6 border-b border-gray-100">
                                                {isEnterprise ? (
                                                    <div className="text-3xl font-bold text-gray-900">Liên hệ</div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-baseline gap-1 text-gray-900">
                                                            <span className="text-4xl font-extrabold tracking-tight">
                                                                {price === 0 ? 'Miễn phí' : formatPrice(billing === 'yearly' ? Math.round(price / 12) : price)}
                                                            </span>
                                                            {price > 0 && <span className="text-sm font-medium text-gray-500">/tháng</span>}
                                                        </div>
                                                        {billing === 'yearly' && price > 0 && (
                                                            <div className="text-sm text-emerald-600 font-medium mt-2">Tổng: {formatPrice(price)}/năm</div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Features */}
                                            <ul className="space-y-3.5 mb-8 flex-1">
                                                {[
                                                    { icon: Briefcase, label: plan.max_jobs === null ? 'Tin đăng không giới hạn' : `${plan.max_jobs} tin đăng/tháng`, ok: true },
                                                    { icon: Eye, label: plan.max_cv_views === null ? 'Xem CV không giới hạn' : `${plan.max_cv_views} lượt xem CV`, ok: (plan.max_cv_views ?? 0) > 0 || plan.max_cv_views === null },
                                                    { icon: FileText, label: 'Xuất CV ứng viên', ok: plan.can_export_cv },
                                                    { icon: Cpu, label: 'AI Matching Engine', ok: plan.has_ai_matching },
                                                    { icon: Headphones, label: 'Hỗ trợ ưu tiên 24/7', ok: plan.has_priority_support },
                                                ].map(feat => {
                                                    const FIcon = feat.icon;
                                                    return (
                                                        <li key={feat.label} className={cn('flex items-start gap-3 text-sm', feat.ok ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                                                            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5', feat.ok ? 'bg-indigo-50' : 'bg-gray-50')}>
                                                                {feat.ok ? <Check className="w-3 h-3 text-indigo-600 font-bold" /> : <X className="w-3 h-3 text-gray-300" />}
                                                            </div>
                                                            <span className="leading-snug">{feat.label}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>

                                            <Button asChild size="lg"
                                                className={cn('w-full font-semibold transition-all mt-auto',
                                                    plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border-0'
                                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                                )}>
                                                <Link to={isEnterprise ? '/contact' : '/auth'} className="flex items-center justify-center w-full">
                                                    {plan.cta}
                                                </Link>
                                            </Button>
                                        </motion.div>
                                    </FadeIn>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Comparison Table (Employer only) ── */}
            {!isLoading && planType === 'employer' && plans && plans.length > 0 && (
                <section className="py-14 px-4 bg-white/50 border-t border-gray-100">
                    <div className="max-w-5xl mx-auto">
                        <FadeIn>
                            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">So sánh chi tiết tính năng</h2>
                            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                                <th className="py-5 px-6 font-semibold text-gray-900 w-1/3">Tính năng</th>
                                                {plans.map(p => (
                                                    <th key={p.id} className="py-5 px-6 text-center text-sm font-bold text-gray-900">
                                                        {p.popular ? (
                                                            <span className="text-indigo-600 flex items-center justify-center gap-1.5">{p.name} <Star className="w-3.5 h-3.5 fill-current" /></span>
                                                        ) : p.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {TABLE_FEATURES.map(f => <FeatureRow key={f.key} feature={f} plans={plans} />)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* ── Billing FAQ ── */}
            <section className="py-16 px-4 bg-gray-50/50 border-t border-gray-100 text-center md:text-left">
                <div className="max-w-3xl mx-auto flex flex-col items-center md:items-stretch">
                    <FadeIn>
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Câu hỏi thường gặp</h2>
                        </div>
                    </FadeIn>
                    <div className="space-y-4 w-full">
                        {BILLING_FAQS.map((item, i) => (
                            <FadeIn key={i} delay={i * 0.05}>
                                <FaqAccordion item={item} />
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.3} className="w-full">
                        <div className="mt-12 text-center bg-indigo-50 rounded-3xl p-10 border border-indigo-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Bạn cần tư vấn thêm?</h3>
                            <p className="text-gray-600 mb-6 font-medium">Đội ngũ chuyên gia của JOBIO luôn sẵn sàng hỗ trợ bạn 24/7 để tạo ra trải nghiệm tuyển dụng tốt nhất.</p>
                            <Button asChild className="bg-white border text-indigo-600 border-gray-200 hover:bg-gray-50 font-semibold shadow-sm" size="lg">
                                <Link to="/contact">Liên hệ chúng tôi <ArrowRight className="w-4 h-4 ml-2" /></Link>
                            </Button>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
