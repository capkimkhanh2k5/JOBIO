import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SocialAuth } from './SocialAuth';
import { authService } from '@/services/authService';
import { useUserStore, UserState } from '@/store/userStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải từ 6 ký tự" }),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
    onRequire2FA: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    onSwitchToRegister,
    onForgotPassword,
    onRequire2FA
}) => {
    const setAuth = useUserStore((state: UserState) => state.setAuth);
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            const { data } = await authService.login({
                email: values.email,
                password: values.password,
            });

            if (data.requires_2fa) {
                onRequire2FA(values.email);
                return;
            }

            setAuth(data.user, data.access, data.refresh);
            toast.success(`Chào mừng trở lại, ${data.user.full_name}!`);
        } catch (error: any) {
            const msg = error.response?.data?.detail
                || error.response?.data?.message
                || 'Đăng nhập thất bại. Vui lòng thử lại.';
            toast.error(msg);
        }
    };

    const onError = (errors: any) => {
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            const error = (errors as any)[firstErrorKey];
            toast.error(error.message || "Vui lòng kiểm tra lại thông tin đăng nhập.");
        }
    };

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="name@example.com"
                                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel>Mật khẩu</FormLabel>
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto text-xs text-primary hover:text-primary/80 font-semibold"
                                        onClick={onForgotPassword}
                                        type="button"
                                    >
                                        Quên mật khẩu?
                                    </Button>
                                </div>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="rememberMe"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground cursor-pointer">
                                    Ghi nhớ đăng nhập
                                </Label>
                            </div>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng nhập
                    </Button>
                </form>
            </Form>

            <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 whitespace-nowrap">
                    Hoặc đăng nhập với
                </span>
                <div className="h-[1px] flex-1 bg-gray-200" />
            </div>

            <SocialAuth />

            <div className="text-center text-sm text-muted-foreground mt-6">
                Chưa có tài khoản?{' '}
                <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80 font-semibold"
                    onClick={onSwitchToRegister}
                >
                    Đăng ký ngay
                </Button>
            </div>
        </div>
    );
};
