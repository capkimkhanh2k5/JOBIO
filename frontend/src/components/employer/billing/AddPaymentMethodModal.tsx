import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, Calendar, ShieldCheck } from "lucide-react";

const paymentMethodSchema = z.object({
    card_number: z.string().min(16, "Mã số thẻ không hợp lệ").max(19),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Định dạng MM/YY không hợp lệ"),
    cvv: z.string().min(3, "CVV không hợp lệ").max(4),
    holder_name: z.string().min(2, "Tên chủ thẻ không hợp lệ"),
});

type PaymentMethodValues = z.infer<typeof paymentMethodSchema>;

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: PaymentMethodValues) => void;
    isLoading?: boolean;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const form = useForm<PaymentMethodValues>({
        resolver: zodResolver(paymentMethodSchema),
        defaultValues: {
            card_number: '',
            expiry: '',
            cvv: '',
            holder_name: '',
        },
    });

    const handleSubmit = (values: PaymentMethodValues) => {
        onSubmit(values);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md border-border bg-background/95 text-foreground backdrop-blur-xl glass-effect shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Thêm phương thức mới
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="holder_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground font-medium">Tên chủ thẻ (In hoa)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="NGUYEN VAN A"
                                            className="border-border bg-muted/30 uppercase focus:border-indigo-500/50 text-foreground"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-rose-400" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="card_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground font-medium">Số thẻ</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="0000 0000 0000 0000"
                                                className="border-border bg-muted/30 pl-10 focus:border-indigo-500/50 text-foreground"
                                                {...field}
                                            />
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/30" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-rose-400" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="expiry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground font-medium">Hết hạn</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="MM/YY"
                                                    className="border-border bg-muted/30 pl-10 focus:border-indigo-500/50 text-foreground"
                                                    {...field}
                                                />
                                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/30" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-rose-400" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cvv"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-muted-foreground font-medium">CVV</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="***"
                                                className="border-border bg-muted/30 focus:border-indigo-500/50 text-foreground"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-rose-400" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                            Thông tin thẻ của bạn được mã hóa và bảo mật theo tiêu chuẩn quốc tế (PCI DSS).
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
                            >
                                {isLoading ? "Đang xử lý..." : "Lưu thẻ"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
