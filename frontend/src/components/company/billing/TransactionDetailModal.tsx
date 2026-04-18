import React from 'react';
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import { BillingTransaction } from "@/types/api";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import {
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCcw,
    Receipt,
    Download,
    ExternalLink,
    Briefcase,
    Rocket,
    Crown
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
    const transactionDate = transaction.created_at || transaction.date;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[32px] bg-white shadow-2xl transition-all duration-500">
                <div className="p-8 space-y-8">
                    {/* Minimalist Header*/}
                    <div className="flex flex-col items-center text-center pt-2">
                        <div className={cn(
                            "mb-5 h-20 w-20 rounded-3xl flex items-center justify-center shadow-xl transition-transform hover:scale-105 duration-500",
                            status.color.split(' ')[0],
                        )}>
                            <StatusIcon className={cn("h-10 w-10", status.color.split(' ')[1])} />
                        </div>

                        <div className="space-y-1">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-2">
                                Receipt #{(transaction.reference_code || transaction.id).substring(0, 12)}
                            </span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                                {formatCurrency(Number(transaction.amount), transaction.currency)}
                            </h2>
                            <div className="pt-3 flex justify-center">
                                <Badge variant="outline" className={cn("px-4 py-1 font-black text-[10px] uppercase tracking-widest border-none shadow-sm", status.color)}>
                                    {status.label}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    {/* Information Grid */}
                    <div className="space-y-6 px-1">
                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Chi tiết thanh toán</h4>
                            <div className="space-y-4">
                                <DetailRow label="Thời gian" value={formatDate(transactionDate)} />
                                <DetailRow
                                    label="Phương thức"
                                    value={(transaction.payment_method?.name || 'Thanh toán trực tuyến').replace('_', ' ')}
                                />
                                <DetailRow
                                    label="Mã đơn hàng"
                                    value={transaction.reference_code || transaction.id}
                                    isMono
                                />
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dịch vụ</h4>
                            {(() => {
                                const planName = (transaction.plan_name || '').toLowerCase();
                                const planThemes = {
                                    plus: { icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                                    pro: { icon: Rocket, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                                    max: { icon: Crown, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                                    default: { icon: Receipt, color: "text-violet-600", bg: "bg-slate-50", border: "border-slate-100" }
                                };
                                const theme = planThemes[planName.includes('plus') ? 'plus' : planName.includes('pro') ? 'pro' : planName.includes('max') ? 'max' : 'default'];
                                const Icon = theme.icon;

                                return (
                                    <div className={cn("rounded-2xl p-5 border group transition-all hover:bg-white hover:shadow-sm", theme.bg, theme.border, "hover:border-slate-200")}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn("h-12 w-12 rounded-xl bg-white border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-500", theme.border)}>
                                                <Icon className={cn("h-6 w-6", theme.color)} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 mb-1">
                                                    {transaction.plan_name || 'Gói dịch vụ JOBIO'}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                    {transaction.clean_description || transaction.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </section>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-2">
                        {transaction.status === 'completed' ? (
                            <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl gap-2 active:scale-95 duration-200">
                                <Download className="h-4 w-4" />
                                Tải hóa đơn PDF
                            </Button>
                        ) : transaction.status === 'pending' && transaction.payment_url ? (
                            <Button
                                onClick={() => window.open(transaction.payment_url, '_blank')}
                                className="w-full h-14 rounded-2xl bg-violet-600 text-white font-black hover:bg-violet-700 transition-all shadow-lg hover:shadow-xl gap-2 active:scale-95 duration-200"
                            >
                                Tiếp tục thanh toán
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        ) : null}

                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full h-12 rounded-2xl text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Đóng cửa sổ
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const DetailRow = ({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) => (
    <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
        <span className={cn(
            "text-xs font-black text-slate-900 text-right truncate",
            isMono && "font-mono text-[10px] text-violet-600"
        )}>
            {value}
        </span>
    </div>
);
