import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { mockApi } from '@/services/mockApi';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

const forgotSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

interface ForgotPasswordFormProps {
    onBackToLogin: () => void;
    onEmailSent: (email: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    onBackToLogin,
    onEmailSent
}) => {
    const form = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (values: ForgotFormValues) => {
        try {
            await mockApi.forgotPassword(values.email);
            toast.success("Đã gửi email khôi phục mật khẩu.");
            onEmailSent(values.email);
        } catch (error: any) {
            toast.error(error.message || "Lỗi hệ thống. Vui lòng thử lại.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-600 shadow-lg shadow-cyan-500/10 border border-cyan-500/20">
                    <Mail className="w-10 h-10" />
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email khôi phục</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="name@example.com"
                                        className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-12"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 transition-opacity font-semibold h-12"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gửi hướng dẫn
                    </Button>
                </form>
            </Form>

            <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-white"
                onClick={onBackToLogin}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
            </Button>
        </div>
    );
};
