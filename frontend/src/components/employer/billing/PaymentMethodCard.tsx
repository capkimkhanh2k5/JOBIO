import React from 'react';
import { SavedPaymentMethod } from "@/types/api";
import {
    CreditCard,
    Trash2,
    Star,
    ShieldCheck,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentMethodCardProps {
    method: SavedPaymentMethod;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
    method,
    onDelete,
    onSetDefault,
}) => {
    const isCard = method.type === 'card';

    return (
        <div className={`relative group overflow-hidden rounded-2xl border ${method.is_default ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-border bg-card/50'} p-5 glass-card transition-all hover:border-indigo-500/30 group`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className={`rounded-xl ${method.is_default ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-muted text-muted-foreground/40'} p-3`}>
                        {isCard ? <CreditCard className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">
                                {method.provider} •••• {method.last4}
                            </h4>
                            {method.is_default && (
                                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 uppercase text-[10px] font-bold tracking-tighter">
                                    Mặc định
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Hết hạn: {method.expiry}
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-border bg-background text-foreground glass-effect shadow-xl">
                        {!method.is_default && (
                            <DropdownMenuItem
                                onClick={() => onSetDefault(method.id)}
                                className="gap-2 cursor-pointer focus:bg-muted"
                            >
                                <Star className="h-4 w-4" /> Đặt làm mặc định
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => onDelete(method.id)}
                            className="gap-2 cursor-pointer text-rose-400 focus:bg-rose-500/10 focus:text-rose-400"
                        >
                            <Trash2 className="h-4 w-4" /> Xóa phương thức
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/30">
                <ShieldCheck className="h-3 w-3" />
                Secure Connection
            </div>

            {/* Decorative Aurora Glow */}
            {method.is_default && (
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            )}
        </div>
    );
};
