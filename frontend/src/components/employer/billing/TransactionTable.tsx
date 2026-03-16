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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest pl-6">Mã giao dịch</TableHead>
                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Nội dung</TableHead>
                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Số tiền</TableHead>
                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Phương thức</TableHead>
                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Trạng thái</TableHead>
                        <TableHead className="text-slate-500 uppercase text-[10px] font-bold tracking-widest">Ngày</TableHead>
                        <TableHead className="text-right text-slate-500 uppercase text-[10px] font-bold tracking-widest pr-6">Thao tác</TableHead>
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
                                <TableRow key={tx.id} className="hover:bg-slate-50/80 border-slate-100 transition-colors group">
                                    <TableCell className="font-mono text-[10px] font-bold text-slate-500 pl-6">
                                        {(tx.reference_code || String(tx.id)).substring(0, 12)}
                                        {(tx.reference_code || String(tx.id)).length > 12 && '...'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-slate-900 font-bold">
                                        {tx.description}
                                    </TableCell>
                                    <TableCell className="font-black text-slate-900">
                                        {formatCurrency(Number(tx.amount), tx.currency)}
                                    </TableCell>
                                    <TableCell className="capitalize text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                        {(tx.payment_method?.name || tx.payment_method?.code || 'N/A').replace('_', ' ')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 font-bold text-[10px] uppercase tracking-tighter ${status.color}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-[11px] font-medium">
                                        {formatDate(tx.date)}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all rounded-lg opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-violet-100"
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
