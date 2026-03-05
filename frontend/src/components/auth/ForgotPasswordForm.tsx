import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authService } from '@/services/authService';
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
            await authService.forgotPassword({ email: values.email });
            toast.success("Đã gửi email khôi phục mật khẩu.");
            onEmailSent(values.email);
        } catch (error: any) {
            const msg = error.response?.data?.detail
                || error.response?.data?.message
                || 'Lỗi hệ thống. Vui lòng thử lại.';
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
                    <Mail className="w-8 h-8" />
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
                                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 h-11"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 transition-colors"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gửi hướng dẫn
                    </Button>
                </form>
            </Form>

            <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                onClick={onBackToLogin}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
            </Button>
        </div>
    );
};
