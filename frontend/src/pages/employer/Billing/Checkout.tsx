import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { mockBillingService } from '@/services/mockApi';
import { CheckoutSteps } from '@/components/employer/billing/CheckoutSteps';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, CreditCard, Landmark, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { formatSalary, cn } from '@/lib/utils';

import type { PaymentMethod } from '@/types/api';

const CheckoutPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const planId = Number(searchParams.get('planId'));

    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay');

    const { data: plan, isLoading } = useQuery({
        queryKey: ['billing', 'plan', planId],
        queryFn: () => mockBillingService.getPlanDetail(planId),
        enabled: !!planId,
    });

    const createSubscriptionMutation = useMutation({
        mutationFn: (method: PaymentMethod) =>
            mockBillingService.createSubscription({ plan_id: planId, payment_method: method }),
        onSuccess: async (sub) => {
            if (paymentMethod === 'vnpay') {
                const txn = await mockBillingService.createTransaction(sub.id, 'vnpay');
                toast.info("Đang chuyển hướng đến cổng thanh toán VNPay...");
                // Simulate redirect delay
                setTimeout(() => {
                    if (txn.payment_url) window.location.href = `/employer/payment-result?txnId=${txn.id}&status=success`;
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
        <div className="p-4 sm:p-8 max-w-6xl mx-auto pb-20">
            <div className="mb-8">
                <button
                    onClick={handleBack}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-bold group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    QUAY LẠI
                </button>
            </div>


            <CheckoutSteps currentStep={step} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end pt-8 border-t border-slate-100">
                {/* Left Side: Step Content */}
                <div className="space-y-6">
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
                                    <h2 className="text-2xl font-black text-slate-900">Xác nhận đơn hàng</h2>
                                    <p className="text-slate-500 text-sm">Vui lòng kiểm tra kỹ thông tin gói dịch vụ.</p>
                                </div>

                                <Card className="p-8 bg-white border border-slate-100 shadow-xl overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:border-cyan-100">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <Badge variant="outline" className="text-cyan-600 border-cyan-200 mb-3">GÓI TUYỂN DỤNG</Badge>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900">{formatSalary(plan.price, 'VND')}</div>
                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thanh toán 1 lần</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 py-8 border-y border-slate-50">
                                        {Object.entries(plan.features).map(([key, val]) => {
                                            if (typeof val === 'number') return (
                                                <div key={key} className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">{getFeatureLabel(key)}</span>
                                                    <span className="text-slate-900 font-black">{val}</span>
                                                </div>
                                            );
                                            if (val === true) return (
                                                <div key={key} className="flex items-center gap-3 text-sm text-slate-700">
                                                    <div className="w-5 h-5 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                                                        <Check className="w-3 h-3 text-cyan-600" />
                                                    </div>
                                                    <span className="font-medium">{getFeatureLabel(key)}</span>
                                                </div>
                                            );
                                            return null;
                                        })}
                                    </div>

                                    <div className="mt-8">
                                        <span className="text-slate-400 text-xs font-bold italic uppercase tracking-widest text-center block">Thời hạn sử dụng: {plan.duration_days} ngày</span>
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
                                    <h2 className="text-2xl font-black text-slate-900">Phương thức thanh toán</h2>
                                    <p className="text-slate-500 text-sm">Chọn cách thức bạn muốn thực hiện giao dịch.</p>
                                </div>

                                <div className="grid gap-4">
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
                                        title="Chuyển khoản ngân hàng"
                                        desc="Thanh toán bằng cách chuyển khoản trực tiếp vào số tài khoản của JOBIO."
                                        icon={<CreditCard className="w-6 h-6" />}
                                    />
                                    <PaymentOption
                                        active={paymentMethod === 'credit_card'}
                                        onClick={() => setPaymentMethod('credit_card')}
                                        title="Thẻ tín dụng (Stripe)"
                                        desc="Hỗ trợ thẻ Visa, Mastercard, JCB."
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
                                    <h2 className="text-2xl font-black text-slate-900">Tổng kết & Hoàn tất</h2>
                                    <p className="text-slate-500 text-sm">Kiểm tra lại lần cuối trước khi tiến hành thanh toán.</p>
                                </div>

                                <Card className="p-8 bg-white border border-slate-100 shadow-xl overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:border-cyan-100 space-y-8">
                                    <div className="space-y-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">SẢN PHẨM</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-slate-900">Gói {plan.name}</span>
                                            <span className="text-lg font-bold text-slate-900">{formatSalary(plan.price, 'VND')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">PHƯƠNG THỨC</span>
                                        <div className="flex items-center gap-3 text-cyan-600">
                                            {paymentMethod === 'vnpay' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                            <span className="font-bold">{paymentMethod === 'vnpay' ? 'VNPay' : paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Thẻ tín dụng'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">TỔNG CỘNG</span>
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatSalary(plan.price, 'VND')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> THANH TOÁN AN TOÀN
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Order Summary */}
                <div className="flex flex-col">
                    <Card className="p-8 bg-white border border-slate-100 shadow-xl lg:sticky lg:top-8 transition-all duration-500 hover:shadow-2xl hover:border-cyan-100 overflow-hidden relative">
                        {/* Summary Content */}
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-8 bg-cyan-500 rounded-full" />
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tóm tắt đơn hàng</h4>
                        </div>

                        <div className="space-y-5 mb-10">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium tracking-tight">Giá gốc</span>
                                <span className="text-slate-900 font-black">{formatSalary(plan.price, 'VND')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium tracking-tight">Thuế (VAT 8%)</span>
                                <span className="text-slate-900 font-bold italic">Đã bao gồm</span>
                            </div>
                            <div className="flex justify-between text-2xl pt-6 border-t border-slate-100 mt-6 font-black tracking-tight">
                                <span className="text-slate-900 uppercase">Tổng cộng</span>
                                <span className="text-cyan-600">{formatSalary(plan.price, 'VND')}</span>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="space-y-6">
                            <Button
                                onClick={handleNext}
                                disabled={createSubscriptionMutation.isPending}
                                className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white border-none rounded-2xl h-16 font-black text-xl shadow-xl shadow-cyan-500/20 group relative overflow-hidden"
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

                            <p className="text-[11px] text-center text-slate-400 leading-relaxed font-medium px-4">
                                Nhấn tiếp tục đồng nghĩa với việc đồng ý <span className="text-cyan-600 underline cursor-pointer">Điều khoản</span> & <span className="text-cyan-600 underline cursor-pointer">Chính sách</span> JOBIO.
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
            "flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group",
            active
                ? "border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500 shadow-lg shadow-cyan-500/5"
                : "border-slate-100 bg-white hover:border-cyan-500/40 hover:bg-slate-50 shadow-sm"
        )}

    >

        <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            active ? "bg-cyan-500 text-white" : "bg-muted text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
        )}>
            {icon}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-foreground text-lg">{title}</span>
                {tag && <Badge className="bg-cyan-600 dark:bg-cyan-500 text-white text-[8px] font-black h-4 px-1">{tag}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
        </div>


        {
            active && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                </div>
            )
        }
    </button >
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
