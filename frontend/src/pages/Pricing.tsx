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
import { billingService, type SubscriptionPlanAPI } from '@/services/billingService';

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

/* ─── Presentation config keyed by plan slug ─── */
const PLAN_PRESENTATION: Record<string, Partial<Plan>> = {
    free: {
        color: 'from-slate-500/20 to-slate-400/10', icon: Users,
        description: 'Dành cho doanh nghiệp mới bắt đầu tuyển dụng.', cta: 'Dùng miễn phí',
    },
    basic: {
        color: 'from-blue-500/20 to-cyan-500/10', icon: Briefcase,
        description: 'Đủ tính năng cho team HR nhỏ và SMEs.', cta: 'Chọn Basic',
    },
    professional: {
        color: 'from-cyan-500/30 to-violet-500/20', icon: Rocket,
        description: 'Tính năng AI giúp tuyển dụng nhanh và chính xác hơn.', cta: 'Chọn Professional',
        popular: true,
    },
    enterprise: {
        color: 'from-violet-500/20 to-purple-500/15', icon: Crown,
        description: 'Không giới hạn – tùy chỉnh theo nhu cầu doanh nghiệp lớn.', cta: 'Liên hệ tư vấn',
    },
    'candidate-free': {
        color: 'from-slate-500/20 to-slate-400/10', icon: Users,
        description: 'Tìm việc cơ bản, ứng tuyển không giới hạn.', cta: 'Dùng miễn phí',
    },
    'candidate-pro': {
        color: 'from-cyan-500/30 to-violet-500/20', icon: Star,
        description: 'AI gợi ý việc phù hợp + hồ sơ nổi bật.', cta: 'Nâng cấp Pro',
        popular: true,
    },
    'candidate-premium': {
        color: 'from-violet-500/20 to-purple-500/15', icon: Crown,
        description: 'Ưu tiên hiển thị + tư vấn nghề nghiệp 1-1.', cta: 'Chọn Premium',
    },
};

const DEFAULT_PRESENTATION: Partial<Plan> = {
    color: 'from-slate-500/20 to-slate-400/10',
    icon: Zap,
    description: '',
    cta: 'Đăng ký',
};

/** Map a raw API plan to the UI Plan shape */
function mapApiPlan(raw: SubscriptionPlanAPI): Plan {
    const f = raw.features as Record<string, unknown>;
    const pres = PLAN_PRESENTATION[raw.slug] ?? DEFAULT_PRESENTATION;
    const price = parseFloat(raw.price) || 0;
    return {
        id: raw.slug,
        name: raw.name,
        price_monthly: (f.price_monthly as number) ?? price,
        price_yearly: (f.price_yearly as number) ?? price * 10,
        duration_days: raw.duration_days,
        max_jobs: (f.max_jobs as number | null) ?? null,
        max_featured_jobs: (f.max_featured_jobs as number | null) ?? null,
        max_cv_views: (f.max_cv_views as number | null) ?? null,
        can_export_cv: Boolean(f.can_export_cv),
        has_ai_matching: Boolean(f.has_ai_matching),
        has_priority_support: Boolean(f.has_priority_support),
        popular: pres.popular,
        color: pres.color ?? DEFAULT_PRESENTATION.color!,
        icon: pres.icon ?? DEFAULT_PRESENTATION.icon!,
        description: pres.description ?? '',
        cta: pres.cta ?? DEFAULT_PRESENTATION.cta!,
    };
}

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
        queryFn: async () => {
            const res = await billingService.listPlans();
            const allPlans: SubscriptionPlanAPI[] = Array.isArray(res.data)
                ? res.data
                : (res.data as any).results ?? [];
            // Filter by slug prefix to separate employer/candidate plans
            const filtered = allPlans.filter(p =>
                planType === 'candidate'
                    ? p.slug.startsWith('candidate')
                    : !p.slug.startsWith('candidate')
            );
            return filtered.map(mapApiPlan);
        },
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
        <div className="relative min-h-screen bg-[#F8FAFC] overflow-hidden">
            {/* ── Background Mesh Gradient ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-5%] w-[35%] h-[45%] bg-orange-400/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
            </div>

            {/* ── Hero ── */}
            <section className="relative z-10 pt-28 pb-14 px-4 text-center">
                <FadeIn>
                    <Badge className="mb-4 bg-blue-50/80 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-1.5 shadow-sm">
                        <Zap className="w-3.5 h-3.5 mr-1.5 inline" />
                        Bảng giá
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.08}>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 drop-shadow-sm">
                        Gói dịch vụ{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                            phù hợp với bạn
                        </span>
                    </h1>
                </FadeIn>
                <FadeIn delay={0.14}>
                    <p className="text-slate-600 max-w-xl mx-auto mb-8 text-lg">
                        Từ cá nhân tìm việc đến doanh nghiệp tuyển dụng hàng loạt — JOBIO có gói dịch vụ đáp ứng mọi nhu cầu.
                    </p>
                </FadeIn>

                {/* Employer / Candidate Toggle */}
                <FadeIn delay={0.18}>
                    <div className="inline-flex items-center bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 border border-white/80 mb-6 shadow-sm ring-1 ring-slate-900/5">
                        {(['employer', 'candidate'] as const).map(t => (
                            <button key={t} onClick={() => setPlanType(t)}
                                className={cn(
                                    'px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                                    planType === t
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                                )}>
                                {t === 'employer' ? <><Building2 className="w-4 h-4 mr-1.5 inline" />Nhà tuyển dụng</> : <><Users className="w-4 h-4 mr-1.5 inline" />Ứng viên</>}
                            </button>
                        ))}
                    </div>
                </FadeIn>

                {/* Monthly / Yearly billing */}
                <FadeIn delay={0.22}>
                    <div className="inline-flex items-center gap-3 text-sm font-medium">
                        <span className={cn('transition-colors', billing === 'monthly' ? 'text-slate-900' : 'text-slate-500')}>Tháng</span>
                        <button
                            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
                            className={cn('relative w-12 h-6 rounded-full transition-colors duration-300 border-2', billing === 'yearly' ? 'bg-blue-600 border-blue-600' : 'bg-slate-200 border-slate-200 hover:bg-slate-300 hover:border-slate-300')}
                            aria-label="Toggle billing period"
                        >
                            <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]', billing === 'yearly' && 'translate-x-6')} />
                        </button>
                        <span className={cn('transition-colors flex items-center', billing === 'yearly' ? 'text-slate-900' : 'text-slate-500')}>
                            Năm
                            <Badge className="ml-2 text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 border-orange-200">Giảm 25%</Badge>
                        </span>
                    </div>
                </FadeIn>
            </section>

            {/* ── Plan Cards ── */}
            <section className="relative z-10 py-6 px-4">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {Array(4).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-96 rounded-3xl" />
                            ))}
                        </div>
                    ) : (
                        <div className={cn('grid gap-6', planType === 'employer' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto')}>
                            {plans?.map((plan, i) => {
                                const Icon = plan.icon;
                                const price = billing === 'yearly' ? plan.price_yearly : plan.price_monthly;
                                const isEnterprise = plan.id === 'enterprise';
                                return (
                                    <FadeIn key={plan.id} delay={i * 0.07}>
                                        <div className="relative h-full">
                                            {/* Glow effect for popular plan */}
                                            {plan.popular && (
                                                <div className="absolute -inset-[2px] bg-gradient-to-b from-orange-400 to-blue-500 rounded-[26px] opacity-70 blur-sm pointer-events-none" />
                                            )}

                                            <motion.div
                                                whileHover={{ y: -8, scale: 1.01 }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                className={cn(
                                                    'relative bg-white/70 backdrop-blur-xl rounded-[24px] p-8 h-full flex flex-col shadow-sm transition-all duration-300',
                                                    plan.popular
                                                        ? 'border border-white shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
                                                        : 'border border-white/60 hover:shadow-lg hover:bg-white/90 hover:border-white/80 ring-1 ring-slate-900/5'
                                                )}
                                            >
                                                {plan.popular && (
                                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0 px-4 py-1.5 shadow-lg shadow-orange-500/30 text-xs hover:from-orange-600 hover:to-orange-500 font-semibold tracking-wide uppercase">
                                                            <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />Phổ biến nhất
                                                        </Badge>
                                                    </div>
                                                )}

                                                <div className="mb-6">
                                                    <div className={cn('p-3.5 rounded-2xl w-fit mb-5 shadow-sm', plan.popular ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100/50')}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <h3 className="font-exrabold text-2xl text-slate-900 mb-2 truncate">{plan.name}</h3>
                                                    <p className="text-sm text-slate-600 leading-relaxed min-h-[40px]">{plan.description}</p>
                                                </div>

                                                <div className="mb-8 pb-6 border-b border-slate-200/50">
                                                    {isEnterprise ? (
                                                        <div className="text-4xl font-black text-slate-900 drop-shadow-sm">Liên hệ</div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-baseline gap-1 text-slate-900">
                                                                <span className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                                                                    {price === 0 ? 'Miễn phí' : formatPrice(billing === 'yearly' ? Math.round(price / 12) : price)}
                                                                </span>
                                                                {price > 0 && <span className="text-sm font-medium text-slate-500">/tháng</span>}
                                                            </div>
                                                            {billing === 'yearly' && price > 0 && (
                                                                <div className="text-sm text-green-600 font-bold mt-2 bg-green-50 w-fit px-2 py-0.5 rounded-md border border-green-100">
                                                                    Thanh toán: {formatPrice(price)}/năm
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Features */}
                                                <ul className="space-y-4 mb-8 flex-1">
                                                    {[
                                                        { icon: Briefcase, label: plan.max_jobs === null ? 'Tin đăng không giới hạn' : `${plan.max_jobs} tin đăng/tháng`, ok: true },
                                                        { icon: Eye, label: plan.max_cv_views === null ? 'Xem CV không giới hạn' : `${plan.max_cv_views} lượt xem CV`, ok: (plan.max_cv_views ?? 0) > 0 || plan.max_cv_views === null },
                                                        { icon: FileText, label: 'Xuất CV ứng viên', ok: plan.can_export_cv },
                                                        { icon: Cpu, label: 'AI Matching Engine', ok: plan.has_ai_matching },
                                                        { icon: Headphones, label: 'Hỗ trợ ưu tiên 24/7', ok: plan.has_priority_support },
                                                    ].map(feat => {
                                                        return (
                                                            <li key={feat.label} className={cn('flex items-start gap-3 text-sm transition-colors', feat.ok ? 'text-slate-800 font-medium' : 'text-slate-400')}>
                                                                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border', feat.ok ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100')}>
                                                                    {feat.ok ? <Check className="w-3 h-3 text-blue-600 font-bold" /> : <X className="w-3 h-3 text-slate-300" />}
                                                                </div>
                                                                <span className="leading-snug">{feat.label}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>

                                                <Button asChild size="lg"
                                                    className={cn('w-full font-bold transition-all duration-300 mt-auto rounded-xl h-12',
                                                        plan.popular
                                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 border-0'
                                                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                                                    )}>
                                                    <Link to={isEnterprise ? '/contact' : '/auth'} className="flex items-center justify-center w-full">
                                                        {plan.cta}
                                                    </Link>
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </FadeIn>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Comparison Table (Employer only) ── */}
            {!isLoading && planType === 'employer' && plans && plans.length > 0 && (
                <section className="relative z-10 py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <FadeIn>
                            <h2 className="text-3xl font-extrabold mb-10 text-center text-slate-900 drop-shadow-sm">So sánh chi tiết tính năng</h2>
                            <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/80 overflow-hidden shadow-lg shadow-blue-900/5 ring-1 ring-slate-900/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/60 bg-slate-50/50">
                                                <th className="py-6 px-8 font-bold text-slate-900 w-1/3 text-lg">Tính năng</th>
                                                {plans.map(p => (
                                                    <th key={p.id} className="py-6 px-6 text-center text-base font-bold text-slate-900">
                                                        {p.popular ? (
                                                            <span className="text-orange-600 flex items-center justify-center gap-1.5">{p.name} <Star className="w-4 h-4 fill-current" /></span>
                                                        ) : p.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {TABLE_FEATURES.map((f, idx) => (
                                                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-white/50 transition-colors">
                                                    <td className="py-5 px-8 text-sm font-medium text-slate-700">{f.label}</td>
                                                    {plans.map(plan => {
                                                        const val = plan[f.key];
                                                        const isBoolean = (v: unknown) => v === true || v === false;
                                                        return (
                                                            <td key={plan.id} className="py-5 px-6 text-center">
                                                                {isBoolean(val) ? (
                                                                    val ? <Check className="w-5 h-5 text-blue-600 mx-auto font-bold" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                                                                ) : val === null ? (
                                                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md uppercase tracking-wide">Không giới hạn</span>
                                                                ) : (
                                                                    <span className="text-slate-900 font-bold">{String(val)}</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* ── Billing FAQ ── */}
            <section className="relative z-10 py-20 px-4 text-center md:text-left">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="max-w-3xl mx-auto flex flex-col items-center md:items-stretch">
                    <FadeIn>
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-10">
                            <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-blue-600">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Câu hỏi thường gặp</h2>
                        </div>
                    </FadeIn>
                    <div className="space-y-4 w-full">
                        {BILLING_FAQS.map((item, i) => (
                            <FadeIn key={i} delay={i * 0.05}>
                                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                                    <FaqAccordion item={item} />
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.3} className="w-full">
                        <div className="mt-16 text-center bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-[32px] p-12 border border-blue-100/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Headphones className="w-32 h-32" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 relative z-10">Bạn cần tư vấn thêm?</h3>
                            <p className="text-slate-600 mb-8 font-medium text-lg max-w-xl mx-auto relative z-10">Đội ngũ chuyên gia của JOBIO luôn sẵn sàng hỗ trợ bạn 24/7 để tạo ra trải nghiệm tuyển dụng tốt nhất.</p>
                            <Button asChild className="bg-white text-blue-600 hover:bg-slate-50 font-bold shadow-md shadow-blue-900/5 border border-slate-200 rounded-xl px-8 h-12 relative z-10" size="lg">
                                <Link to="/contact">Liên hệ chúng tôi <ArrowRight className="w-4 h-4 ml-2" /></Link>
                            </Button>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
