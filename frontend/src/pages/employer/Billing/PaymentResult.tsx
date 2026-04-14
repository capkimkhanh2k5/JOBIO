import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const PaymentResultPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const txnId = searchParams.get('txnId') ?? '';

    const queryStatus = searchParams.get('status') as 'success' | 'failed' | null;
    const queryMessage = searchParams.get('message') || '';

    const { data: txn, isLoading } = useQuery({
        queryKey: ['billing', 'transaction', txnId],
        queryFn: () => billingService.getTransaction(txnId).then(r => r.data),
        enabled: !!txnId,
    });

    const statusFromTransaction = txn?.status === 'completed'
        ? 'success'
        : txn?.status === 'failed'
            ? 'failed'
            : null;
    
    const finalStatus = statusFromTransaction || queryStatus || 'failed';
    const isSuccess = finalStatus === 'success';

    const upgradedPlanName = txn?.plan_name || txn?.subscription_name || (txn?.metadata as any)?.plan_name || '';
    
    const defaultMessage = isSuccess
        ? upgradedPlanName
            ? `Thanh toán thành công. Gói ${upgradedPlanName} đã được kích hoạt.`
            : 'Thanh toán thành công. Gói dịch vụ của bạn đã được kích hoạt.'
        : 'Thanh toán thất bại. Vui lòng kiểm tra lại phương thức thanh toán hoặc thử lại sau.';
    
    const displayMessage = queryMessage || defaultMessage;

    useEffect(() => {
        if (!isLoading) {
            if (isSuccess) {
                toast.success(displayMessage);
                // Redirect to home page as requested
                navigate('/');
            } else {
                toast.error(displayMessage);
                // Redirect to subscription page so they can try again if failed
                navigate('/employer/subscription');
            }
        }
    }, [isLoading, isSuccess, displayMessage, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 space-y-6 text-center">
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl border-4 border-violet-100 border-t-violet-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-violet-50 animate-pulse" />
                </div>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Đang xử lý kết quả thanh toán
                </h2>
                <p className="text-slate-500 font-medium">
                    Vui lòng không đóng trình duyệt. Bạn sẽ được chuyển hướng trong giây lát.
                </p>
            </div>

            <div className="flex gap-2">
                <Skeleton className="h-2 w-2 rounded-full bg-violet-200" />
                <Skeleton className="h-2 w-2 rounded-full bg-violet-400" />
                <Skeleton className="h-2 w-2 rounded-full bg-violet-600" />
            </div>
        </div>
    );
};

export default PaymentResultPage;
