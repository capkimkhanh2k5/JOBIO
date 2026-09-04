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
        <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-300 ${method.is_default ? 'border-teal-200 bg-teal-50/30 shadow-md shadow-teal-100/50' : 'border-border bg-card shadow-sm'} p-5 hover:shadow-lg hover:border-teal-200`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 border transition-colors ${method.is_default ? 'bg-card text-teal-600 border-teal-100 shadow-sm' : 'bg-muted text-muted-foreground/60 border-border/60'}`}>
                        {isCard ? <CreditCard className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-foreground tracking-tight">
                                {method.provider} •••• {method.last4}
                            </h4>
                            {method.is_default && (
                                <Badge className="bg-teal-600 text-white border-none shadow-sm uppercase text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg">
                                    Mặc định
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
                            Hết hạn: {method.expiry}
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-border/60 bg-card text-foreground shadow-xl rounded-xl p-1">
                        {!method.is_default && (
                            <DropdownMenuItem
                                onClick={() => onSetDefault(method.id)}
                                className="gap-2 cursor-pointer focus:bg-teal-50 focus:text-teal-600 rounded-lg font-bold text-sm transition-colors py-2"
                            >
                                <Star className="h-4 w-4 fill-current" /> Đặt làm mặc định
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => onDelete(method.id)}
                            className="gap-2 cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600 rounded-lg font-bold text-sm transition-colors py-2"
                        >
                            <Trash2 className="h-4 w-4" /> Xóa phương thức
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                <ShieldCheck className="h-3 w-3" />
                Kết nối bảo mật
            </div>
        </div>
    );
};
