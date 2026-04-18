import { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Check, X, Zap, Star, Crown, ArrowRight,
    HelpCircle, ChevronDown, Briefcase, Megaphone,
    Headphones, Rocket, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { billingService, type SubscriptionPlanAPI } from '@/services/billingService';

import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

/* ─── Types ─── */
interface FaqItem { q: string; a: string; }

type Duration = '3_months' | '6_months' | '1_year';
type TierKey = 'plus' | 'pro' | 'max';

interface TierConfig {
    key: TierKey;
    name: string;
    description: string;
    icon: React.ElementType;
    popular?: boolean;
    // Style tokens
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    priceColor: string;
    checkBg: string;
    checkColor: string;
    btnClass: string;
    headerGradient: string;
    textColor: string;
    subTextColor: string;
    glowEffect?: boolean;
    darkCard?: boolean;
}

const TIER_CONFIG: TierConfig[] = [
    {
        key: 'plus',
        name: 'Plus',
        description: 'Bắt đầu tuyển dụng hiệu quả với tin tuyển dụng nổi bật.',
        icon: Briefcase,
        cardBg: 'bg-white/80 backdrop-blur-xl',
        cardBorder: 'border-blue-100/80',
        cardHoverBorder: 'hover:border-blue-300',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        priceColor: 'text-slate-900',
        checkBg: 'bg-blue-50 border-blue-100',
        checkColor: 'text-blue-600',
        btnClass: 'bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm',
        headerGradient: 'from-blue-500 to-blue-600',
        textColor: 'text-slate-900',
        subTextColor: 'text-slate-600',
    },
    {
        key: 'pro',
        name: 'Pro',
        description: 'Đẩy mạnh tuyển dụng với tin nổi bật và hỗ trợ ưu tiên.',
        icon: Rocket,
        popular: true,
        cardBg: 'bg-white/90 backdrop-blur-xl',
        cardBorder: 'border-orange-200/80',
        cardHoverBorder: 'hover:border-orange-400',
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-500',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        priceColor: 'text-slate-900',
        checkBg: 'bg-orange-50 border-orange-100',
        checkColor: 'text-orange-600',
        btnClass: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 border-0',
        headerGradient: 'from-orange-500 to-orange-600',
        textColor: 'text-slate-900',
        subTextColor: 'text-slate-600',
        glowEffect: true,
    },
    {
        key: 'max',
        name: 'Max',
        description: 'Giải pháp tuyển dụng toàn diện cho doanh nghiệp lớn.',
        icon: Crown,
        cardBg: 'bg-gradient-to-br from-amber-50/80 via-white to-yellow-50/60 backdrop-blur-xl',
        cardBorder: 'border-amber-200/80',
        cardHoverBorder: 'hover:border-amber-400',
        iconBg: 'bg-gradient-to-br from-amber-100 to-yellow-100',
        iconColor: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        priceColor: 'text-slate-900',
        checkBg: 'bg-amber-50 border-amber-200',
        checkColor: 'text-amber-600',
        btnClass: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-md shadow-amber-500/20 border-0 font-bold',
        headerGradient: 'from-amber-500 to-yellow-500',
        textColor: 'text-slate-900',
        subTextColor: 'text-slate-600',
    },
];

const DURATION_LABELS: Record<Duration, string> = {
    '3_months': '3 Tháng',
    '6_months': '6 Tháng',
    '1_year': '1 Năm',
};

const DURATION_FROM_DAYS: Record<number, Duration> = {
    90: '3_months',
    180: '6_months',
    365: '1_year',
};

const SLUG_TO_TIER: Record<string, TierKey> = {
    'plus-3-thang': 'plus', 'plus-6-thang': 'plus', 'plus-1-nam': 'plus',
    'pro-3-thang': 'pro', 'pro-6-thang': 'pro', 'pro-1-nam': 'pro',
    'max-3-thang': 'max', 'max-6-thang': 'max', 'max-1-nam': 'max',
};

interface FeatureRow {
    icon: React.ElementType;
    label: string;
    key: string;
    type: 'boolean' | 'number';
}

const FEATURE_ROWS: FeatureRow[] = [
    { icon: Megaphone, label: 'Đẩy top tin tuyển dụng', key: 'top_job', type: 'boolean' },
    { icon: Zap, label: 'Gửi email hàng loạt', key: 'mass_email', type: 'boolean' },
    { icon: Headphones, label: 'Hỗ trợ ưu tiên 24/7', key: 'priority_support', type: 'boolean' },
    { icon: Palette, label: 'Company Branding', key: 'company_branding', type: 'boolean' },
    { icon: Briefcase, label: 'Số tin đăng tuyển', key: 'job_post_limit', type: 'number' },
];

const BILLING_FAQS: FaqItem[] = [
    { q: 'Tôi có thể hủy gói bất cứ lúc nào không?', a: 'Có. Bạn có thể hủy gói đăng ký bất cứ lúc nào. Sau khi hủy, tài khoản sẽ tiếp tục hoạt động đến hết chu kỳ thanh toán hiện tại.' },
    { q: 'Có được dùng thử trước khi mua không?', a: 'JOBIO cung cấp nhiều lựa chọn gói dịch vụ linh hoạt. Bạn có thể bắt đầu với gói Plus 3 tháng để trải nghiệm trước khi quyết định nâng cấp.' },
    { q: 'Thanh toán bằng phương thức nào?', a: 'Chúng tôi hỗ trợ: Thẻ tín dụng/ghi nợ (Visa/MasterCard), chuyển khoản ngân hàng, MoMo và ZaloPay.' },
    { q: 'Nếu không hài lòng có được hoàn tiền không?', a: 'JOBIO áp dụng chính sách hoàn tiền trong 7 ngày nếu bạn không hài lòng với dịch vụ. Liên hệ support@jobio.vn để được xử lý.' },
    { q: 'Chọn gói dài hạn có lợi hơn không?', a: 'Có! Gói 1 năm tiết kiệm hơn đáng kể so với mua 4 lần gói 3 tháng. Ngoài ra, gói dài hạn còn được ưu tiên hỗ trợ và truy cập sớm vào các tính năng mới.' },
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
                className="w-full flex items-center justify-between p-5 text-left group cursor-pointer"
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

const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);
};

/* ─── Main Component ─── */
export default function Pricing() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useUserStore();
    const [selectedDuration, setSelectedDuration] = useState<Duration>('3_months');

    // Mutation for subscription
    const subscribeMutation = useMutation({
        mutationFn: (planId: number) => billingService.subscribe({ plan_id: planId }),
        onSuccess: (res) => {
            if (res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.success('Đăng ký gói thành công!');
                navigate('/company/dashboard');
            }
        },
        onError: (err: any) => {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký gói.';
            toast.error(msg);
        }
    });

    const handleSelectPlan = (planId: number | undefined) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để tiếp tục');
            navigate('/auth');
            return;
        }

        if (user?.role !== 'company') {
            toast.error('Gói dịch vụ này chỉ dành cho tài khoản Nhà tuyển dụng');
            return;
        }

        if (!planId) {
            toast.error('Không tìm thấy thông tin gói dịch vụ');
            return;
        }

        subscribeMutation.mutate(planId);
    };

    const { data: rawPlans, isLoading } = useQuery({
        queryKey: ['billing-plans'],
        queryFn: async () => {
            const res = await billingService.listPlans();
            const allPlans: SubscriptionPlanAPI[] = Array.isArray(res.data)
                ? res.data
                : (res.data as any).results ?? [];
            return allPlans;
        },
        staleTime: 1000 * 60 * 5,
    });

    // Group plans by tier
    const tierPlans = useMemo(() => {
        if (!rawPlans) return null;
        const map: Record<TierKey, Record<Duration, SubscriptionPlanAPI>> = {
            plus: {} as Record<Duration, SubscriptionPlanAPI>,
            pro: {} as Record<Duration, SubscriptionPlanAPI>,
            max: {} as Record<Duration, SubscriptionPlanAPI>,
        };
        for (const plan of rawPlans) {
            const tier = SLUG_TO_TIER[plan.slug];
            const duration = DURATION_FROM_DAYS[plan.duration_days];
            if (tier && duration) {
                map[tier][duration] = plan;
            }
        }
        return map;
    }, [rawPlans]);

    // Get the selected plan for each tier
    const getSelectedPlan = (tier: TierKey): SubscriptionPlanAPI | undefined => {
        if (!tierPlans) return undefined;
        return tierPlans[tier][selectedDuration];
    };



    return (
        <div className="relative min-h-screen bg-[#F8FAFC] overflow-hidden">
            {/* ── Background Mesh Gradient ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-5%] w-[35%] h-[45%] bg-orange-400/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
            </div>

            {/* ── Hero ── */}
            <section className="relative z-10 pt-28 pb-10 px-4 text-center">
                <FadeIn>
                    <Badge className="mb-4 bg-blue-50/80 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-1.5 shadow-sm">
                        <Zap className="w-3.5 h-3.5 mr-1.5 inline" />
                        Bảng giá dịch vụ
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.08}>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 drop-shadow-sm">
                        Chọn gói{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                            phù hợp với bạn
                        </span>
                    </h1>
                </FadeIn>
                <FadeIn delay={0.14}>
                    <p className="text-slate-600 max-w-xl mx-auto mb-10 text-lg">
                        3 gói dịch vụ — từ đội HR nhỏ đến doanh nghiệp lớn. Linh hoạt chọn chu kỳ thanh toán phù hợp.
                    </p>
                </FadeIn>

                {/* Duration Selector */}
                <FadeIn delay={0.18}>
                    <div className="inline-flex items-center bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 border border-white/80 shadow-sm ring-1 ring-slate-900/5">
                        {(['3_months', '6_months', '1_year'] as Duration[]).map(dur => (
                            <button
                                key={dur}
                                onClick={() => setSelectedDuration(dur)}
                                className={cn(
                                    'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer relative',
                                    selectedDuration === dur
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
                                )}
                            >
                                {DURATION_LABELS[dur]}
                                {dur === '1_year' && (
                                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold">
                                        Tiết kiệm
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </FadeIn>
            </section>

            {/* ── Plan Cards (3 columns) ── */}
            <section className="relative z-10 py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-[500px] rounded-3xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            {TIER_CONFIG.map((tier, i) => {
                                const plan = getSelectedPlan(tier.key);
                                const Icon = tier.icon;
                                const price = plan ? parseFloat(String(plan.price)) : 0;
                                const features = (plan?.features as unknown as Record<string, unknown>) ?? {};

                                return (
                                    <FadeIn key={tier.key} delay={i * 0.1}>
                                        <div className="relative h-full">
                                            {/* Glow effect for Pro */}
                                            {tier.glowEffect && (
                                                <div className="absolute -inset-[2px] bg-gradient-to-b from-orange-400 to-orange-600 rounded-[28px] opacity-60 blur-sm pointer-events-none" />
                                            )}

                                            <motion.div
                                                whileHover={{ y: -6, scale: 1.01 }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                className={cn(
                                                    'relative rounded-[26px] p-8 h-full flex flex-col shadow-sm transition-all duration-300 border',
                                                    tier.cardBg,
                                                    tier.cardBorder,
                                                    tier.cardHoverBorder,
                                                    tier.glowEffect && 'shadow-[0_8px_32px_0_rgba(251,146,60,0.12)]',
                                                    tier.darkCard && 'shadow-[0_8px_40px_0_rgba(99,102,241,0.15)]',
                                                    !tier.glowEffect && !tier.darkCard && 'hover:shadow-lg ring-1 ring-slate-900/5'
                                                )}
                                            >
                                                {/* Popular badge */}
                                                {tier.popular && (
                                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0 px-4 py-1.5 shadow-lg shadow-orange-500/30 text-xs hover:from-orange-600 hover:to-orange-500 font-semibold tracking-wide uppercase">
                                                            <Star className="w-3.5 h-3.5 mr-1.5 fill-current" /> Phổ biến nhất
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Header */}
                                                <div className="mb-6">
                                                    <div className={cn('p-3.5 rounded-2xl w-fit mb-5 border', tier.iconBg, tier.darkCard ? 'border-indigo-400/20' : 'border-transparent')}>
                                                        <Icon className={cn('w-6 h-6', tier.iconColor)} />
                                                    </div>
                                                    <h3 className={cn('font-extrabold text-2xl mb-2', tier.textColor)}>{tier.name}</h3>
                                                    <p className={cn('text-sm leading-relaxed min-h-[40px]', tier.subTextColor)}>{tier.description}</p>
                                                </div>

                                                {/* Price */}
                                                <div className={cn('mb-8 pb-6 border-b', tier.darkCard ? 'border-indigo-500/20' : 'border-slate-200/50')}>
                                                    <div className={cn('flex items-baseline gap-1', tier.priceColor)}>
                                                        <span className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                                                            {formatPrice(price)}
                                                        </span>
                                                        <span className={cn('text-sm font-medium', tier.subTextColor)}>/{DURATION_LABELS[selectedDuration]}</span>
                                                    </div>
                                                    {selectedDuration !== '3_months' && (
                                                        <div className={cn(
                                                            'text-xs font-semibold mt-2 w-fit px-2.5 py-1 rounded-lg',
                                                            tier.darkCard
                                                                ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-400/20'
                                                                : 'text-green-700 bg-green-50 border border-green-100'
                                                        )}>
                                                            {selectedDuration === '6_months' ? '≈ ' + formatPrice(Math.round(price / 6)) + '/tháng' : '≈ ' + formatPrice(Math.round(price / 12)) + '/tháng'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Features */}
                                                <ul className="space-y-4 mb-8 flex-1">
                                                    {/* Numeric features */}
                                                    <li className={cn('flex items-start gap-3 text-sm font-medium', tier.textColor)}>
                                                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border', tier.checkBg)}>
                                                            <Check className={cn('w-3 h-3 font-bold', tier.checkColor)} />
                                                        </div>
                                                        <span className="leading-snug"><strong>{String(features.job_post_limit ?? '∞')}</strong> tin đăng tuyển</span>
                                                    </li>
                                                    {/* Boolean features */}
                                                    {[
                                                        { key: 'top_job', label: 'Đẩy top tin tuyển dụng' },
                                                        { key: 'mass_email', label: 'Gửi email hàng loạt' },
                                                        { key: 'priority_support', label: 'Hỗ trợ ưu tiên 24/7' },
                                                        { key: 'company_branding', label: 'Company Branding' },
                                                    ].map(feat => {
                                                        const ok = Boolean(features[feat.key]);
                                                        return (
                                                            <li
                                                                key={feat.key}
                                                                className={cn(
                                                                    'flex items-start gap-3 text-sm transition-colors',
                                                                    ok
                                                                        ? cn('font-medium', tier.textColor)
                                                                        : cn(tier.darkCard ? 'text-slate-600' : 'text-slate-400')
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border',
                                                                    ok
                                                                        ? tier.checkBg
                                                                        : cn(tier.darkCard ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100')
                                                                )}>
                                                                    {ok
                                                                        ? <Check className={cn('w-3 h-3 font-bold', tier.checkColor)} />
                                                                        : <X className={cn('w-3 h-3', tier.darkCard ? 'text-slate-600' : 'text-slate-300')} />
                                                                    }
                                                                </div>
                                                                <span className="leading-snug">{feat.label}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>

                                                {/* CTA */}
                                                <Button
                                                    onClick={() => handleSelectPlan(plan?.id)}
                                                    disabled={subscribeMutation.isPending}
                                                    size="lg"
                                                    className={cn('w-full font-bold transition-all duration-300 mt-auto rounded-xl h-12 cursor-pointer', tier.btnClass)}
                                                >
                                                    {subscribeMutation.isPending && plan?.id === subscribeMutation.variables ? (
                                                        <span className="flex items-center gap-2">
                                                            <Rocket className="w-4 h-4 animate-bounce" />
                                                            Đang xử lý...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-center w-full">
                                                            Chọn gói {tier.name}
                                                            <ArrowRight className="w-4 h-4 ml-2" />
                                                        </span>
                                                    )}
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

            {/* ── Comparison Table ── */}
            {!isLoading && tierPlans && (
                <section className="relative z-10 py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <FadeIn>
                            <h2 className="text-3xl font-extrabold mb-3 text-center text-slate-900 drop-shadow-sm">So sánh chi tiết tính năng</h2>
                            <p className="text-center text-slate-500 mb-10 text-sm">Chọn gói phù hợp nhất với nhu cầu tuyển dụng của bạn</p>

                            <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/80 overflow-hidden shadow-lg shadow-blue-900/5 ring-1 ring-slate-900/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="py-5 px-6 w-[36%] bg-slate-50/80 border-b border-slate-200/60">
                                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tính năng</span>
                                                </th>
                                                {TIER_CONFIG.map(tier => (
                                                    <th key={tier.key} className="py-5 px-6 text-center border-b border-slate-200/60 bg-slate-50/80">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={cn(
                                                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold',
                                                                tier.key === 'plus' && 'bg-blue-100 text-blue-700',
                                                                tier.key === 'pro' && 'bg-orange-100 text-orange-700',
                                                                tier.key === 'max' && 'bg-indigo-100 text-indigo-700',
                                                            )}>
                                                                {tier.popular && <Star className="w-3.5 h-3.5 fill-current" />}
                                                                {tier.name}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FEATURE_ROWS.map((feat, idx) => {
                                                const RowIcon = feat.icon;
                                                return (
                                                    <tr key={feat.key} className={cn(
                                                        'border-b border-slate-100/80 last:border-0 transition-colors hover:bg-blue-50/30',
                                                        idx % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'
                                                    )}>
                                                        <td className="py-4 px-6 text-sm font-medium text-slate-700">
                                                            <div className="flex items-center gap-2.5">
                                                                <RowIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                                {feat.label}
                                                            </div>
                                                        </td>
                                                        {TIER_CONFIG.map(tier => {
                                                            const plan = getSelectedPlan(tier.key);
                                                            const features = (plan?.features as unknown as Record<string, unknown>) ?? {};
                                                            const val = features[feat.key];

                                                            return (
                                                                <td key={tier.key} className="py-4 px-6 text-center">
                                                                    {feat.type === 'boolean' ? (
                                                                        val ? (
                                                                            <div className={cn(
                                                                                'w-6 h-6 rounded-full flex items-center justify-center mx-auto',
                                                                                tier.key === 'plus' && 'bg-blue-100',
                                                                                tier.key === 'pro' && 'bg-orange-100',
                                                                                tier.key === 'max' && 'bg-indigo-100',
                                                                            )}>
                                                                                <Check className={cn(
                                                                                    'w-3.5 h-3.5 font-bold',
                                                                                    tier.key === 'plus' && 'text-blue-600',
                                                                                    tier.key === 'pro' && 'text-orange-600',
                                                                                    tier.key === 'max' && 'text-indigo-600',
                                                                                )} />
                                                                            </div>
                                                                        ) : (
                                                                            <X className="w-5 h-5 text-slate-300 mx-auto" />
                                                                        )
                                                                    ) : (
                                                                        <span className={cn(
                                                                            'text-sm font-bold px-3 py-1 rounded-lg',
                                                                            tier.key === 'plus' && 'text-blue-700 bg-blue-50',
                                                                            tier.key === 'pro' && 'text-orange-700 bg-orange-50',
                                                                            tier.key === 'max' && 'text-indigo-700 bg-indigo-50',
                                                                        )}>
                                                                            {val != null ? String(val) : '—'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                            {/* Price row */}
                                            <tr className="bg-slate-50/60 border-t-2 border-slate-200/60">
                                                <td className="py-5 px-6 text-sm font-bold text-slate-900">
                                                    Giá / {DURATION_LABELS[selectedDuration]}
                                                </td>
                                                {TIER_CONFIG.map(tier => {
                                                    const plan = getSelectedPlan(tier.key);
                                                    const price = plan ? parseFloat(String(plan.price)) : 0;
                                                    return (
                                                        <td key={tier.key} className="py-5 px-6 text-center">
                                                            <span className={cn(
                                                                'text-lg font-extrabold',
                                                                tier.key === 'plus' && 'text-blue-700',
                                                                tier.key === 'pro' && 'text-orange-700',
                                                                tier.key === 'max' && 'text-indigo-700',
                                                            )}>
                                                                {formatPrice(price)}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
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
                            <Button asChild className="bg-white text-blue-600 hover:bg-slate-50 font-bold shadow-md shadow-blue-900/5 border border-slate-200 rounded-xl px-8 h-12 relative z-10 cursor-pointer" size="lg">
                                <Link to="/contact">Liên hệ chúng tôi <ArrowRight className="w-4 h-4 ml-2" /></Link>
                            </Button>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
