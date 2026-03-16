import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { BillingTransaction } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCcw,
    Receipt,
    Download,
    ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TransactionDetailModalProps {
    transaction: BillingTransaction | null;
    isOpen: boolean;
    onClose: () => void;
}

const statusConfig = {
    completed: {
        label: "Thành công",
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        icon: CheckCircle2,
    },
    pending: {
        label: "Đang xử lý",
        color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        icon: Clock,
    },
    failed: {
        label: "Thất bại",
        color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        icon: XCircle,
    },
    refunded: {
        label: "Hoàn tiền",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        icon: RefreshCcw,
    },
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
    transaction,
    isOpen,
    onClose,
}) => {
    if (!transaction) return null;

    const status = statusConfig[transaction.status];
    const StatusIcon = status.icon;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md border-border bg-background/95 text-foreground backdrop-blur-xl glass-effect shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <Receipt className="h-5 w-5 text-indigo-400" />
                        Chi tiết giao dịch
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* Status Badge */}
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                        <div className={`rounded-full p-3 ${status.color.split(' ')[0]}`}>
                            <StatusIcon className="h-8 w-8" />
                        </div>
                        <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-sm font-medium ${status.color}`}>
                            {status.label}
                        </Badge>
                        <h3 className="text-2xl font-bold">
                            {formatCurrency(Number(transaction.amount), transaction.currency)}
                        </h3>
                        <p className="text-sm text-muted-foreground">{transaction.id}</p>
                    </div>

                    <Separator className="bg-border" />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div className="text-muted-foreground">Thời gian</div>
                        <div className="text-right text-foreground font-medium">{formatDate(transaction.date)}</div>

                        <div className="text-muted-foreground">Phương thức</div>
                        <div className="text-right text-foreground font-medium capitalize">
                            {(transaction.payment_method?.name || transaction.payment_method?.code || 'N/A').replace('_', ' ')}
                        </div>

                        {transaction.vnpay_txn_ref && (
                            <>
                                <div className="text-muted-foreground">Mã tham chiếu VNPay</div>
                                <div className="text-right font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                    {transaction.vnpay_txn_ref}
                                </div>
                            </>
                        )}

                        <div className="text-muted-foreground">Nội dung</div>
                        <div className="text-right text-foreground font-medium">{transaction.description}</div>

                        {transaction.subscription_name && (
                            <>
                                <div className="text-muted-foreground">Gói dịch vụ</div>
                                <div className="text-right text-foreground font-medium">{transaction.subscription_name}</div>
                            </>
                        )}
                    </div>

                    {transaction.status === 'completed' && (
                        <div className="pt-4">
                            <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <Download className="h-4 w-4" />
                                Tải hóa đơn (PDF)
                            </Button>
                        </div>
                    )}

                    {transaction.status === 'pending' && transaction.payment_url && (
                        <div className="pt-4">
                            <Button
                                onClick={() => window.open(transaction.payment_url, '_blank')}
                                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                            >
                                Tiếp tục thanh toán
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
