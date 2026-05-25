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
import { getCandidateId } from '@/lib/candidateIdentity';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(8, { message: "Mật khẩu phải từ 8 ký tự" }),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
    onRequire2FA: (email: string, rememberMe: boolean) => void;
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
                remember_me: values.rememberMe,
            });

            if (data.requires_2fa) {
                onRequire2FA(values.email, values.rememberMe);
                return;
            }

            const userData = { ...data.user };
            const candidateId = getCandidateId(userData);
            if (userData.role === 'candidate' && candidateId) {
                userData.candidate_id = candidateId;
            }

            setAuth(userData, data.access_token, data.refresh_token, values.rememberMe);
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
                                        autoComplete="email"
                                        placeholder="name@example.com"
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:font-normal"
                                        tabIndex={1}
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
                                        className="p-0 h-auto text-sm text-blue-600 hover:text-blue-500 hover:no-underline font-semibold transition-colors"
                                        onClick={onForgotPassword}
                                        type="button"
                                        tabIndex={-1}
                                    >
                                        Quên mật khẩu?
                                    </Button>
                                </div>
                                <FormControl>
                                    <Input
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:font-normal"
                                        tabIndex={2}
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
                                    tabIndex={-1}
                                />
                                <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground cursor-pointer">
                                    Ghi nhớ đăng nhập
                                </Label>
                            </div>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all shadow-md shadow-blue-500/20 hover:-translate-y-[1px]"
                        disabled={form.formState.isSubmitting}
                        tabIndex={3}
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
                    className="p-0 h-auto text-blue-600 hover:text-blue-500 hover:no-underline font-bold transition-colors"
                    onClick={onSwitchToRegister}
                >
                    Đăng ký ngay
                </Button>
            </div>
        </div>
    );
};
