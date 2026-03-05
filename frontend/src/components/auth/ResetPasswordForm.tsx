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
import { Loader2, ShieldCheck } from 'lucide-react';

const resetSchema = z.object({
    token: z.string().min(4, { message: "Mã xác thực không hợp lệ" }),
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
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    email: _email,
    onSuccess
}) => {
    const form = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            token: '',
            new_password: '',
            new_password_confirm: '',
        },
    });

    const onSubmit = async (values: ResetFormValues) => {
        try {
            await authService.resetPassword({
                token: values.token,
                new_password: values.new_password,
                new_password_confirm: values.new_password_confirm,
            });
            toast.success("Mật khẩu đã được thay đổi thành công!");
            onSuccess();
        } catch (error: any) {
            const msg = error.response?.data?.detail
                || error.response?.data?.message
                || 'Lỗi. Vui lòng thử lại.';
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

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="token"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã xác thực từ Email</FormLabel>
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
                </form>
            </Form>
        </div>
    );
};
