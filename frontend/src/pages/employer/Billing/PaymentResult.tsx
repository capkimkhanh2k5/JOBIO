import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { mockBillingService } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, ArrowRight, Home, ReceiptText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSalary, cn } from '@/lib/utils';


const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const txnId = Number(searchParams.get('txnId'));

    const status = searchParams.get('status') as 'success' | 'failed';

    const { data: txn, isLoading } = useQuery({
        queryKey: ['billing', 'transaction', txnId],
        queryFn: () => mockBillingService.getTransaction(txnId),
        enabled: !!txnId,
    });

    const completeMutation = useMutation({
        mutationFn: () => mockBillingService.completeTransaction(txnId, status),
    });

    useEffect(() => {
        if (txnId && status) {
            completeMutation.mutate();
        }
    }, [txnId, status]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 space-y-4">
                <Skeleton className="w-16 h-16 rounded-full bg-white/5" />
                <Skeleton className="h-8 w-48 bg-white/5" />
                <Skeleton className="h-4 w-64 bg-white/5" />
            </div>
        );
    }

    const isSuccess = status === 'success';

    return (
        <div className="p-4 sm:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-full"
            >
                <Card className="p-10 bg-white border border-slate-100 shadow-2xl relative overflow-hidden text-center transition-all duration-500 hover:shadow-cyan-500/5">


                    {/* Background Aura */}
                    <div className={cn(
                        "absolute -top-32 -left-32 w-64 h-64 blur-[100px] rounded-full",
                        isSuccess ? "bg-emerald-500/10" : "bg-red-500/10"
                    )} />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl",
                            isSuccess ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-red-500 text-white shadow-red-500/30"
                        )}>
                            {isSuccess ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                        </div>

                        <h1 className="text-3xl font-black text-slate-900 mb-3">
                            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
                        </h1>

                        <p className="text-slate-500 mb-8 max-w-sm">
                            {isSuccess
                                ? 'Giao dịch của bạn đã được xử lý thành công. Gói dịch vụ mới đã được kích hoạt ngay lập tức.'
                                : 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng kiểm tra lại phương thức thanh toán hoặc liên hệ hỗ trợ.'}
                        </p>

                        {txn && (
                            <div className="w-full bg-muted/50 rounded-2xl p-6 mb-8 text-left space-y-3 border border-border/30">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">MÃ GIAO DỊCH</span>
                                    <span className="text-slate-900 font-mono font-bold">{txn.vnpay_txn_ref || `TXN${txn.id}`}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">SỐ TIỀN</span>
                                    <span className="text-slate-900 font-black">{formatSalary(txn.amount, 'VND')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">PHƯƠNG THỨC</span>
                                    <span className="text-slate-900 font-bold uppercase">{txn.payment_method}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <Button asChild className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border-none font-bold">
                                <Link to="/employer/dashboard">
                                    <Home className="w-4 h-4 mr-2" /> VỀ DASHBOARD
                                </Link>
                            </Button>
                            <Button asChild className={cn(
                                "h-12 rounded-xl font-black shadow-lg",
                                isSuccess
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20"
                                    : "bg-red-500 hover:bg-red-400 text-white shadow-red-500/20"
                            )}>
                                <Link to={isSuccess ? "/employer/subscription" : "/employer/checkout?planId=" + (txn?.subscription || "")}>
                                    {isSuccess ? (
                                        <>QUẢN LÝ GÓI <ArrowRight className="w-4 h-4 ml-2" /></>
                                    ) : (
                                        <>THỬ LẠI <Clock className="w-4 h-4 ml-2" /></>
                                    )}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {isSuccess && (
                    <p className="mt-8 text-muted-foreground/60 text-xs text-center flex items-center justify-center gap-2">
                        <ReceiptText className="w-4 h-4" /> Hóa đơn GTGT sẽ được gửi đến email đăng ký của bạn trong vòng 24h.
                    </p>
                )}
            </motion.div>
        </div>
    );
};


export default PaymentResultPage;
