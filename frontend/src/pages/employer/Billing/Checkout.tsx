import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { CheckoutSteps } from '@/components/employer/billing/CheckoutSteps';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, CreditCard, Landmark, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { formatSalary, cn } from '@/lib/utils';

// Local type for checkout selection
type CheckoutPaymentMethod = 'vnpay' | 'bank_transfer' | 'credit_card';

const CheckoutPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const planSlug = searchParams.get('planSlug') ?? '';

    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('vnpay');

    const { data: plan, isLoading } = useQuery({
        queryKey: ['billing', 'plan', planSlug],
        queryFn: () => billingService.getPlan(planSlug).then(r => r.data),
        enabled: !!planSlug,
    });

    const createSubscriptionMutation = useMutation({
        mutationFn: (_method: string) =>
            billingService.subscribe({ plan_id: plan!.id, payment_method: paymentMethod as any }).then(r => r.data),
        onSuccess: (data) => {
            if (data.payment_url) {
                toast.info("Đang chuyển hướng đến cổng thanh toán VNPay...");
                setTimeout(() => {
                    window.location.href = data.payment_url;
                }, 1500);
            } else {
                toast.success("Đăng ký gói thành công!");
                navigate('/employer/subscription');
            }
        }
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else createSubscriptionMutation.mutate(paymentMethod);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else navigate(-1);
    };

    if (isLoading || !plan) return null;

    return (
        <div className="py-6 sm:py-8 mt-4 w-full max-w-[1400px] mx-auto px-4 sm:px-8">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-violet-200 hover:bg-violet-50 transition-all hover:shadow-sm cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thanh toán dịch vụ</h1>
                        <p className="text-slate-500 text-sm font-medium">Hoàn tất các bước để kích hoạt gói dịch vụ của bạn.</p>
                    </div>
                </div>
            </div>

            <CheckoutSteps currentStep={step} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch pt-6 border-t border-slate-100">
                {/* Left Side: Step Content */}
                <div className="lg:col-span-7 space-y-6">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 px-2 mb-2">1. Xác nhận gói dịch vụ</h2>
                                </div>

                                <Card className="p-10 bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:border-violet-100">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <Badge variant="outline" className="text-violet-600 bg-violet-50 border-violet-100 mb-3 px-3 py-1 font-black text-[10px] tracking-widest uppercase">GÓI TUYỂN DỤNG</Badge>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900 tracking-tight">{formatSalary(plan.price, 'VND')}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 mt-1">Thanh toán 1 lần</div>
                                        </div>
                                    </div>

                                    <div className="space-y-5 py-8 border-y border-slate-50">
                                        {Object.entries(plan.features).map(([key, val]) => {
                                            if (typeof val === 'number') return (
                                                <div key={key} className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-bold tracking-tight">{getFeatureLabel(key)}</span>
                                                    <span className="text-slate-900 font-black px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">{val}</span>
                                                </div>
                                            );
                                            if (val === true) return (
                                                <div key={key} className="flex items-center gap-3 text-sm text-slate-700">
                                                    <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 border border-violet-100">
                                                        <Check className="w-4 h-4 text-violet-600 font-black" />
                                                    </div>
                                                    <span className="font-bold tracking-tight">{getFeatureLabel(key)}</span>
                                                </div>
                                            );
                                            return null;
                                        })}
                                    </div>

                                    <div className="mt-8">
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center block bg-slate-50/50 py-2 rounded-xl border border-dashed border-slate-200">
                                            Thời hạn sử dụng: <span className="text-slate-900">{plan.duration_days} ngày</span>
                                        </span>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 px-2 mb-2">2. Phương thức thanh toán</h2>
                                </div>

                                <div className="grid gap-6">
                                    <PaymentOption
                                        active={paymentMethod === 'vnpay'}
                                        onClick={() => setPaymentMethod('vnpay')}
                                        title="Cổng thanh toán VNPay"
                                        desc="Thanh toán qua ứng dụng ngân hàng, thẻ ATM, thẻ quốc tế hoặc ví điện tử VNPay."
                                        icon={<Landmark className="w-6 h-6" />}
                                        tag="KHUYÊN DÙNG"
                                    />
                                    <PaymentOption
                                        active={paymentMethod === 'bank_transfer'}
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        title="Chuyển khoản trực tiếp"
                                        desc="Thanh toán bằng cách chuyển khoản qua mã QR hoặc số tài khoản JOBIO."
                                        icon={<CreditCard className="w-6 h-6" />}
                                    />
                                    <PaymentOption
                                        active={paymentMethod === 'credit_card'}
                                        onClick={() => setPaymentMethod('credit_card')}
                                        title="Thẻ tín dụng (Stripe)"
                                        desc="Hỗ trợ thẻ Visa, Mastercard, JCB qua cổng thanh toán bảo mật Stripe."
                                        icon={<CreditCard className="w-6 h-6" />}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 px-2 mb-2">3. Xác nhận thanh toán</h2>
                                </div>

                                <Card className="p-10 bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden relative transition-all duration-300 hover:shadow-lg hover:border-violet-100 space-y-10">
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SẢN PHẨM & DỊCH VỤ</span>
                                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black">
                                                    P
                                                </div>
                                                <span className="text-lg font-black text-slate-900">Gói {plan.name}</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-900">{formatSalary(plan.price, 'VND')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PHƯƠNG THỨC THANH TOÁN</span>
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-violet-600">
                                                {paymentMethod === 'vnpay' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <span className="font-black text-slate-900 block">{paymentMethod === 'vnpay' ? 'Cổng thanh toán VNPay' : paymentMethod === 'bank_transfer' ? 'Chuyển khoản trực tiếp' : 'Thẻ tín dụng (Stripe)'}</span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hệ thống xử lý tự động</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">TỔNG SỐ TIỀN</span>
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatSalary(plan.price, 'VND')}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                <ShieldCheck className="w-3.5 h-3.5" /> GIAO DỊCH BẢO MẬT
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Đảm bảo bởi JOBIO</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Order Summary */}
                <div className="lg:col-span-5 flex flex-col">
                    <Card className="p-10 bg-white border border-slate-200 shadow-sm lg:sticky lg:top-8 rounded-3xl transition-all duration-300 hover:shadow-lg hover:border-violet-100 overflow-hidden relative">
                        {/* Summary Content */}
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-2 h-8 bg-violet-600 rounded-full" />
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest">Tóm tắt đơn hàng</h4>
                        </div>

                        <div className="space-y-5 mb-10">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold tracking-tight uppercase text-[10px] tracking-widest">Giá gốc</span>
                                <span className="text-slate-900 font-black">{formatSalary(plan.price, 'VND')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold tracking-tight uppercase text-[10px] tracking-widest">Thuế (VAT 8%)</span>
                                <span className="text-slate-500 font-bold italic">Đã bao gồm</span>
                            </div>
                            <div className="pt-6 border-t border-slate-100 mt-6">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Tổng thanh toán</span>
                                    <span className="text-3xl font-black text-violet-600 tracking-tight">{formatSalary(plan.price, 'VND')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="space-y-6">
                            <Button
                                onClick={handleNext}
                                disabled={createSubscriptionMutation.isPending}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-none rounded-2xl h-16 font-black text-xl shadow-lg shadow-violet-200 group relative overflow-hidden transition-all border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1"
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {createSubscriptionMutation.isPending ? "ĐANG XỬ LÝ..." : (
                                        <>
                                            {step === 3 ? "THANH TOÁN NGAY" : "TIẾP TỤC"}
                                            <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </Button>

                            <p className="text-[11px] text-center text-slate-400 leading-relaxed font-bold px-4">
                                Bằng cách nhấn tiếp tục, bạn đồng ý với <span className="text-violet-600 underline cursor-pointer hover:text-violet-700">Điều khoản</span> & <span className="text-violet-600 underline cursor-pointer hover:text-violet-700">Chính sách</span> của JOBIO.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const PaymentOption = ({ active, onClick, title, desc, icon, tag }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer",
            active
                ? "border-violet-600 bg-violet-50/50 ring-1 ring-violet-500 shadow-md shadow-violet-500/5"
                : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50 shadow-sm"
        )}
    >
        <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
            active ? "bg-violet-600 text-white shadow-lg shadow-violet-200 rotate-3" : "bg-slate-100 text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50"
        )}>
            {icon}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-slate-900 text-lg tracking-tight">{title}</span>
                {tag && <Badge className="bg-violet-600 text-white text-[8px] font-black h-4 px-1.5 uppercase tracking-widest border-none">{tag}</Badge>}
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>

        {active && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                    <Check className="w-4 h-4 text-white font-black" />
                </div>
            </div>
        )}
    </button>
);

const getFeatureLabel = (key: string) => {
    const labels: any = {
        max_jobs: 'Tin tuyển dụng tối đa',
        max_featured_jobs: 'Tin nổi bật tối đa',
        max_cv_views: 'Lượt xem hồ sơ',
        can_export_cv: 'Cho phép xuất CV',
        has_ai_matching: 'Sử dụng AI Matching',
        has_priority_support: 'Hỗ trợ ưu tiên'
    };
    return labels[key] || key;
};

export default CheckoutPage;
