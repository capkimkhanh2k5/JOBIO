import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { billingService } from '@/services/billingService';
import { TransactionTable } from '@/components/employer/billing/TransactionTable';
import { TransactionDetailModal } from '@/components/employer/billing/TransactionDetailModal';
import { SubscriptionStatus as SubscriptionStatusCard } from '@/components/employer/billing/SubscriptionStatus';
import { BillingTransaction } from '@/types/api';
import { Link } from 'react-router-dom';
import {
    CreditCard,
    History,
    Plus,
    Search,
    Filter,
    Download,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
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
    const [selectedTransaction, setSelectedTransaction] = useState<BillingTransaction | null>(null);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("transactions");
    const [statusFilter] = useState<string>("all");

    // Alert Dialog State
    const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
    const [cancelId, setCancelId] = useState<number | null>(null);

    // Queries
    const { data: transactionsData, isLoading: isLoadingTx } = useQuery({
        queryKey: ['transactions', statusFilter],
        queryFn: () => billingService.listTransactions({
            status: statusFilter === "all" ? undefined : statusFilter
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
                    action={
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2 h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm">
                                <Download className="h-4 w-4" />
                                Xuất báo cáo
                            </Button>
                            <Button asChild className="gap-2 h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md border-none px-6">
                                <Link to="/employer/subscription">
                                    <Plus className="h-4 w-4" />
                                    Nâng cấp gói
                                </Link>
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6">

                {/* Subscription Status Card column layout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="grid gap-8 lg:grid-cols-3"
                >
                    <div className="lg:col-span-2">
                        {isLoadingSub ? (
                            <div className="h-48 rounded-3xl border border-slate-200 bg-white animate-pulse shadow-sm" />
                        ) : currentSub?.data ? (
                            <SubscriptionStatusCard
                                subscription={currentSub.data}
                                onCancel={() => handleCancelSub(Number(currentSub.data.id))}
                            />
                        ) : (
                            <div className="h-full min-h-[192px] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-black text-slate-900 mb-2">Gói hiện tại</h3>
                                <p className="text-sm text-slate-500 font-medium mb-6">Chưa đăng ký gói nào</p>
                                <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md border-none px-8">
                                    <Link to="/employer/subscription">Đăng ký gói ngay</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center text-center">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Bảo mật thanh toán</h3>
                            <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                                Mọi giao dịch trên JOBIO đều được mã hóa SSL/TLS 256-bit.
                                Thông tin thẻ được bảo vệ tối đa.
                            </p>
                            <Button variant="link" className="mt-auto h-auto p-0 pt-6 text-violet-600 hover:text-violet-700 font-bold">
                                Tìm hiểu thêm về bảo mật
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Main Tabs Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Tabs defaultValue="transactions" className="space-y-6" onValueChange={setActiveTab}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                            <TabsList className="bg-slate-100 border border-slate-200 p-1 h-12 shrink-0 rounded-xl">
                                <TabsTrigger value="transactions" className="gap-2 px-6 rounded-lg font-bold text-slate-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                                    <History className="h-4 w-4" />
                                    Lịch sử giao dịch
                                </TabsTrigger>
                            </TabsList>

                            {activeTab === "transactions" && (
                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                                        <Input
                                            placeholder="Tìm giao dịch..."
                                            className="h-11 w-[240px] border-slate-200 bg-white pl-10 text-sm focus:border-violet-500 focus:ring-violet-500/20 text-slate-900 rounded-xl"
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" className="h-11 w-11 border-slate-200 bg-white text-slate-400 hover:text-violet-600 hover:border-violet-200 rounded-xl shadow-sm transition-all">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <TabsContent value="transactions" className="mt-0 focus-visible:outline-none">
                            <TransactionTable
                                transactions={transactionsData?.data?.results || []}
                                isLoading={isLoadingTx}
                                onViewDetail={setSelectedTransaction}
                            />
                        </TabsContent>
                    </Tabs>

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
                </motion.div>
            </div>
        </div>
    );
};

export default BillingDashboard;
