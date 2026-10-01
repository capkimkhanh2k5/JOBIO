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
                <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/12">
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
                                        className="h-11 bg-muted/50 border-border focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:font-normal"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary hover:from-teal-700 hover:to-primary text-white font-semibold transition-all shadow-md shadow-primary/20 hover:-translate-y-[1px]"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gửi OTP
                    </Button>
                </form>
            </Form>

            <Button
                variant="outline"
                className="w-full h-11 border-border text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/8 font-medium transition-all group shadow-sm"
                onClick={onBackToLogin}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
            </Button>
        </div>
    );
};
