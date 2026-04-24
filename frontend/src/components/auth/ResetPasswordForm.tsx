import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordStrength } from './PasswordStrength';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

const resetSchema = z.object({
    otp: z.string().regex(/^\d{6}$/, { message: "Mã OTP phải gồm đúng 6 chữ số" }),
    new_password: z.string().min(8, { message: "Mật khẩu phải từ 8 ký tự" }),
    new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
    message: "Mật khẩu không khớp",
    path: ["new_password_confirm"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

interface ResetPasswordFormProps {
    email: string;
    onSuccess: () => void;
    onBackToForgot: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    email,
    onSuccess,
    onBackToForgot,
}) => {
    const form = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            otp: '',
            new_password: '',
            new_password_confirm: '',
        },
    });

    const onSubmit = async (values: ResetFormValues) => {
        if (!email) {
            toast.error('Thiếu email khôi phục. Vui lòng quay lại bước nhập email.');
            return;
        }
        try {
            await authService.resetPassword({
                email,
                otp: values.otp,
                new_password: values.new_password,
                new_password_confirm: values.new_password_confirm,
            });
            toast.success("Mật khẩu đã được thay đổi thành công!");
            onSuccess();
        } catch (error: any) {
            const data = error.response?.data;
            let msg = 'Lỗi. Vui lòng thử lại.';
            if (data) {
                if (data.detail) msg = data.detail;
                else if (typeof data.message === 'string') msg = data.message;
                else {
                    const firstKey = Object.keys(data)[0];
                    if (firstKey && Array.isArray(data[firstKey])) {
                        msg = data[firstKey][0];
                    } else if (firstKey && typeof data[firstKey] === 'string') {
                        msg = data[firstKey];
                    }
                }
            }
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-600 shadow-lg shadow-violet-500/10 border border-violet-500/20">
                    <ShieldCheck className="w-10 h-10" />
                </div>
            </div>

            {email && (
                <p className="text-center text-sm text-slate-500">
                    Mã OTP đã được gửi tới <span className="font-semibold text-slate-700">{email}</span>
                </p>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã OTP từ Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Nhập mã 6 số"
                                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 h-12 text-center text-xl tracking-widest"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="new_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mật khẩu mới</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 h-12"
                                        {...field}
                                    />
                                </FormControl>
                                <PasswordStrength password={field.value} />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="new_password_confirm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 h-12"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 transition-colors"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đặt lại mật khẩu
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-11 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors"
                        onClick={onBackToForgot}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Đổi email nhận OTP
                    </Button>
                </form>
            </Form>
        </div>
    );
};
