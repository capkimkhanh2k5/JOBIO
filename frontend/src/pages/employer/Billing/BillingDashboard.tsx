import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { TransactionTable } from '@/components/employer/billing/TransactionTable';
import { TransactionDetailModal } from '@/components/employer/billing/TransactionDetailModal';
import { PaymentMethodCard } from '@/components/employer/billing/PaymentMethodCard';
import { AddPaymentMethodModal } from '@/components/employer/billing/AddPaymentMethodModal';
import { SubscriptionStatus as SubscriptionStatusCard } from '@/components/employer/billing/SubscriptionStatus';
import { BillingTransaction, SavedPaymentMethod } from '@/types/api';
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
import { toast } from "sonner";

const BillingDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedTransaction, setSelectedTransaction] = useState<BillingTransaction | null>(null);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("transactions");
    const [statusFilter] = useState<string>("all");

    // Queries
    const { data: transactionsData, isLoading: isLoadingTx } = useQuery({
        queryKey: ['transactions', statusFilter],
        queryFn: () => billingService.listTransactions({
            status: statusFilter === "all" ? undefined : statusFilter
        }),
    });

    const { data: currentSub } = useQuery({
        queryKey: ['current-subscription'],
        queryFn: () => billingService.getCurrentSubscription(),
    });

    const { data: paymentMethods, isLoading: isLoadingPM } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => billingService.listPaymentMethods(),
    });

    // Mutations
    const addPMMutation = useMutation({
        mutationFn: (data: any) => billingService.addPaymentMethod(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success("Đã thêm phương thức thanh toán mới");
            setIsAddPaymentModalOpen(false);
        },
        onError: () => toast.error("Không thể thêm phương thức thanh toán"),
    });

    const deletePMMutation = useMutation({
        mutationFn: (id: string) => billingService.deletePaymentMethod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success("Đã xóa phương thức thanh toán");
        },
    });

    const setDefaultPMMutation = useMutation({
        mutationFn: (id: string) => billingService.setDefaultPaymentMethod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success("Đã đặt phương thức mặc định");
        },
    });

    return (
        <div className="container mx-auto max-w-7xl space-y-8 py-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between px-1">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Thanh toán & Gói dịch vụ
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Quản lý đăng ký, phương thức thanh toán và xem lịch sử giao dịch của bạn.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-border bg-background hover:bg-muted text-foreground">
                        <Download className="h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white leading-none">
                        <Link to="/employer/subscription">
                            <Plus className="h-4 w-4" />
                            Nâng cấp gói
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Subscription Status Card column layout */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {currentSub?.data && currentSub.data.length > 0 ? (
                        <SubscriptionStatusCard subscription={currentSub.data[0]} />
                    ) : (
                        <div className="h-48 rounded-3xl border border-border bg-muted/30 animate-pulse" />
                    )}
                </div>
                <div>
                    <div className="h-full rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6 glass-card">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Bảo mật thanh toán</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Mọi giao dịch trên JOBIO đều được mã hóa SSL/TLS 256-bit.
                            Chúng tôi không lưu trữ trực tiếp thông tin thẻ ngân hàng của bạn.
                        </p>
                        <Button variant="link" className="mt-4 h-auto p-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                            Tìm hiểu thêm về bảo mật
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Tabs Container */}
            <Tabs defaultValue="transactions" className="space-y-6" onValueChange={setActiveTab}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                    <TabsList className="bg-muted border border-border p-1 h-11 shrink-0">
                        <TabsTrigger value="transactions" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <History className="h-4 w-4" />
                            Lịch sử giao dịch
                        </TabsTrigger>
                        <TabsTrigger value="payment-methods" className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <CreditCard className="h-4 w-4" />
                            Phương thức thanh toán
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "transactions" && (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                                <Input
                                    placeholder="Tìm giao dịch..."
                                    className="h-10 w-[200px] border-border bg-background pl-9 text-sm focus:border-indigo-500/50 text-foreground"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-background text-muted-foreground hover:text-foreground">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {activeTab === "payment-methods" && (
                        <Button
                            onClick={() => setIsAddPaymentModalOpen(true)}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm phương thức
                        </Button>
                    )}
                </div>

                <TabsContent value="transactions" className="mt-0 focus-visible:outline-none">
                    <TransactionTable
                        transactions={transactionsData?.data?.results || []}
                        isLoading={isLoadingTx}
                        onViewDetail={setSelectedTransaction}
                    />
                </TabsContent>

                <TabsContent value="payment-methods" className="mt-0 focus-visible:outline-none">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {isLoadingPM ? (
                            [1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />)
                        ) : (paymentMethods?.data?.length === 0 || !paymentMethods?.data) ? (
                            <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/10 px-4 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground/30">
                                    <CreditCard className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Chưa có phương thức thanh toán</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Thêm thẻ Visa/Mastercard hoặc ví điện tử để thanh toán nhanh hơn.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddPaymentModalOpen(true)}
                                    className="mt-6 border-border text-foreground hover:bg-muted"
                                >
                                    Thêm thẻ ngay
                                </Button>
                            </div>
                        ) : (
                            paymentMethods.data.map((pm: SavedPaymentMethod) => (
                                <PaymentMethodCard
                                    key={pm.id}
                                    method={pm}
                                    onDelete={(id) => deletePMMutation.mutate(id)}
                                    onSetDefault={(id) => setDefaultPMMutation.mutate(id)}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <TransactionDetailModal
                transaction={selectedTransaction}
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
            />

            <AddPaymentMethodModal
                isOpen={isAddPaymentModalOpen}
                onClose={() => setIsAddPaymentModalOpen(false)}
                onSubmit={(values) => addPMMutation.mutate(values)}
                isLoading={addPMMutation.isPending}
            />

            {/* Background Aurora Effect */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] h-[60%] w-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
            </div>
        </div>
    );
};

export default BillingDashboard;
