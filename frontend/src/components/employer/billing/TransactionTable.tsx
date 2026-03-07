import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BillingTransaction } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCcw,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionTableProps {
    transactions: BillingTransaction[];
    onViewDetail: (transaction: BillingTransaction) => void;
    isLoading?: boolean;
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

export const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    onViewDetail,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted/30" />
                ))}
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50 glass-card">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Mã giao dịch</TableHead>
                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Nội dung</TableHead>
                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Số tiền</TableHead>
                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Phương thức</TableHead>
                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Trạng thái</TableHead>
                        <TableHead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Ngày</TableHead>
                        <TableHead className="text-right text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow className="border-border/50">
                            <TableCell colSpan={7} className="h-48 text-center text-muted-foreground/50">
                                Không tìm thấy giao dịch nào.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((tx) => {
                            const status = statusConfig[tx.status];
                            const StatusIcon = status.icon;

                            return (
                                <TableRow key={tx.id} className="hover:bg-muted/30 border-border transition-colors group">
                                    <TableCell className="font-mono text-[10px] font-medium text-foreground">
                                        {tx.id}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-foreground font-medium">
                                        {tx.description}
                                    </TableCell>
                                    <TableCell className="font-bold text-foreground">
                                        {formatCurrency(Number(tx.amount), tx.currency)}
                                    </TableCell>
                                    <TableCell className="capitalize text-muted-foreground text-xs">
                                        {tx.payment_method.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 font-bold text-[10px] uppercase tracking-tighter ${status.color}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {formatDate(tx.date)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                            onClick={() => onViewDetail(tx)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
