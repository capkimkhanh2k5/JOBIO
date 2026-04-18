import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { billingService } from '@/services/billingService';
import { TransactionTable } from '@/components/company/billing/TransactionTable';
import { TransactionDetailModal } from '@/components/company/billing/TransactionDetailModal';
import { SubscriptionStatus as SubscriptionStatusCard } from '@/components/company/billing/SubscriptionStatus';
import { BillingTransaction } from '@/types/api';
import {
    History,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PageHeader } from '@/components/shared/PageHeader';

const BillingDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedTransaction, setSelectedTransaction] = useState<BillingTransaction | null>(null);

    // Alert Dialog State
    const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
    const [cancelId, setCancelId] = useState<number | null>(null);

    // Queries
    const { data: transactionsData, isLoading: isLoadingTx } = useQuery({
        queryKey: ['transactions', statusFilter, searchTerm],
        queryFn: () => billingService.listTransactions({
            status: statusFilter === "all" ? undefined : statusFilter,
            search: searchTerm || undefined
        }),
    });

    const { data: currentSub, isLoading: isLoadingSub } = useQuery({
        queryKey: ['current-subscription'],
        queryFn: () => billingService.getCurrentSubscription(),
    });

    // Mutations
    const cancelSubMutation = useMutation({
        mutationFn: (id: number) => billingService.cancelSubscription(id).then(r => r.data),
        onSuccess: () => {
            toast.success("Đã hủy gia hạn gói thành công");
            queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
        },
        onError: () => toast.error("Không thể hủy gia hạn gói lúc này"),
    });

    const handleCancelSub = (id: number) => {
        setCancelId(id);
        setIsCancelAlertOpen(true);
    };

    const confirmCancel = () => {
        if (cancelId) {
            cancelSubMutation.mutate(cancelId);
            setIsCancelAlertOpen(false);
            setCancelId(null);
        }
    };

    return (
        <div className="w-full mx-auto min-h-screen">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Thanh toán & Gói dịch vụ"
                    description="Quản lý đăng ký, phương thức thanh toán và xem lịch sử giao dịch của bạn."
                    icon={History}
                    action={null}
                />
            </div>

            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6">
                {/* Subscription Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {isLoadingSub ? (
                        <div className="h-64 rounded-[32px] border border-slate-200 bg-white animate-pulse shadow-sm" />
                    ) : (
                        <SubscriptionStatusCard
                            subscription={currentSub?.data}
                            onCancel={() => currentSub?.data && handleCancelSub(Number(currentSub.data.id))}
                        />
                    )}
                </motion.div>

                {/* Transaction History Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
                                <History className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Lịch sử giao dịch</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                                <Input
                                    placeholder="Tìm mã hoặc nội dung..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-11 w-[280px] border-slate-200 bg-white pl-10 text-sm focus:border-violet-500 focus:ring-violet-500/20 text-slate-900 rounded-xl transition-all"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-11 px-4 border border-slate-200 bg-white text-sm font-bold text-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none cursor-pointer shadow-sm transition-all"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="completed">Thành công</option>
                                <option value="pending">Đang xử lý</option>
                                <option value="failed">Thất bại</option>
                                <option value="refunded">Hoàn tiền</option>
                            </select>
                        </div>
                    </div>

                    <TransactionTable
                        transactions={transactionsData?.data?.results || []}
                        isLoading={isLoadingTx}
                        onViewDetail={setSelectedTransaction}
                    />
                </motion.div>

                <TransactionDetailModal
                    transaction={selectedTransaction}
                    isOpen={!!selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />

                <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
                    <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận hủy tự động gia hạn</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc chắn muốn hủy tự động gia hạn gói dịch vụ này? Bạn vẫn có thể tiếp tục sử dụng quyền lợi của gói cho đến hết chu kỳ hiện tại. Lựa chọn này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-slate-200" onClick={() => setCancelId(null)}>Đóng</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmCancel} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold border-none shadow-sm">
                                Đồng ý hủy
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default BillingDashboard;
