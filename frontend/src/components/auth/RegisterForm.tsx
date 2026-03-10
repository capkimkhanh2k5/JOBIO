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
import { PasswordStrength } from './PasswordStrength';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Loader2, Briefcase, User, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

const registerSchema = z.object({
    full_name: z.string().min(2, { message: "Họ tên quá ngắn" }),
    email: z.string()
        .email({ message: "Email không hợp lệ" })
        .refine((val) => GMAIL_REGEX.test(val), {
            message: "Chỉ chấp nhận email có đuôi @gmail.com",
        }),
    password: z.string().min(8, { message: "Mật khẩu phải từ 8 ký tự" }),
    password_confirm: z.string(),
    role: z.enum(['candidate', 'company']),
    agreeTerms: z.boolean().refine(val => val === true, {
        message: "Bạn phải đồng ý với điều khoản",
    }),
}).refine((data) => data.password === data.password_confirm, {
    message: "Mật khẩu không khớp",
    path: ["password_confirm"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
    onSwitchToLogin: () => void;
    onRegistered: (email: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
    onSwitchToLogin,
    onRegistered
}) => {
    const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
    const [emailStatus, setEmailStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            password_confirm: '',
            role: 'candidate',
            agreeTerms: false,
        },
    });

    const onSubmit = async (values: RegisterFormValues) => {
        // Block submit if email is already taken
        if (emailStatus === 'taken') {
            toast.error('Email này đã được sử dụng. Vui lòng chọn email khác.');
            return;
        }

        // Verify @gmail.com before sending request
        if (!GMAIL_REGEX.test(values.email)) {
            toast.error('Chỉ chấp nhận email có đuôi @gmail.com');
            return;
        }

        try {
            await authService.register({
                email: values.email,
                full_name: values.full_name,
                password: values.password,
                confirm_password: values.password_confirm,
                role: values.role === 'candidate' ? 'candidate' : 'company',
            });
            onRegistered(values.email);
            toast.success("Đăng ký thành công! Vui lòng kiểm tra email.");
        } catch (error: any) {
            const msg = error.response?.data?.detail
                || error.response?.data?.email?.[0]
                || error.response?.data?.message
                || 'Đăng ký thất bại. Vui lòng thử lại.';
            toast.error(msg);
        }
    };

    const onError = (errors: any) => {
        // Show the first error message in a toast
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            const error = (errors as any)[firstErrorKey];
            toast.error(error.message || "Vui lòng kiểm tra lại thông tin đăng ký.");
        }
    };

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                    {/* Role Selector */}
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Tôi muốn...</FormLabel>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => field.onChange('candidate')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2 w-full",
                                            field.value === 'candidate'
                                                ? "border-primary bg-primary/8 text-primary"
                                                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-400"
                                        )}
                                    >
                                        <User className={cn("w-6 h-6", field.value === 'candidate' ? "text-cyan-600" : "text-muted-foreground")} />
                                        <span className="text-xs font-bold">Tìm việc</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => field.onChange('company')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2 w-full",
                                            field.value === 'company'
                                                ? "border-violet-500 bg-violet-500/10 text-violet-600"
                                                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-400"
                                        )}
                                    >
                                        <Briefcase className={cn("w-6 h-6", field.value === 'company' ? "text-violet-600" : "text-muted-foreground")} />
                                        <span className="text-xs font-bold">Tuyển dụng</span>
                                    </button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Họ và tên</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Nguyễn Văn A"
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
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="name@example.com"
                                            className={cn(
                                                "bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                emailStatus === 'taken' && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                                                emailStatus === 'available' && "border-green-500 focus:border-green-500 focus:ring-green-500/10"
                                            )}
                                            {...field}
                                            onBlur={async (e) => {
                                                field.onBlur();
                                                const val = e.target.value.trim();

                                                // Clear previous manual errors first
                                                form.clearErrors('email');

                                                // Skip if empty
                                                if (!val) {
                                                    setEmailStatus('idle');
                                                    return;
                                                }

                                                // Validate email format with regex instead of relying on form state
                                                const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                if (!basicEmailRegex.test(val)) {
                                                    setEmailStatus('idle');
                                                    return;
                                                }

                                                // Check @gmail.com domain
                                                if (!GMAIL_REGEX.test(val)) {
                                                    setEmailStatus('idle');
                                                    form.setError('email', { type: 'manual', message: 'Chỉ chấp nhận email có đuôi @gmail.com' });
                                                    return;
                                                }

                                                setIsCheckingEmail(true);
                                                setEmailStatus('checking');
                                                try {
                                                    const { data } = await authService.checkEmail(val);
                                                    if (data.is_available) {
                                                        setEmailStatus('available');
                                                        form.clearErrors('email');
                                                    } else {
                                                        setEmailStatus('taken');
                                                        form.setError('email', { type: 'manual', message: 'Email này đã được sử dụng' });
                                                    }
                                                } catch (error) {
                                                    setEmailStatus('idle');
                                                } finally {
                                                    setIsCheckingEmail(false);
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                            {isCheckingEmail && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                                            {!isCheckingEmail && emailStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            {!isCheckingEmail && emailStatus === 'taken' && <XCircle className="w-4 h-4 text-red-500" />}
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mật khẩu</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                            name="password_confirm"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Xác nhận mật khẩu</FormLabel>
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
                    </div>

                    <FormField
                        control={form.control}
                        name="agreeTerms"
                        render={({ field }) => (
                            <div className="flex items-start space-x-2 pt-2">
                                <Checkbox
                                    id="agreeTerms"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                                />
                                <Label htmlFor="agreeTerms" className="text-xs font-normal text-muted-foreground cursor-pointer leading-relaxed">
                                    Tôi đã đọc và đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của JOBIO.
                                </Label>
                            </div>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 transition-colors"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Đăng ký tài khoản
                    </Button>
                </form>
            </Form>

            <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 whitespace-nowrap">
                    Hoặc tiếp tục với
                </span>
                <div className="h-[1px] flex-1 bg-gray-200" />
            </div>

            <SocialAuth />

            <div className="text-center text-sm text-muted-foreground mt-6">
                Đã có tài khoản?{' '}
                <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80 font-semibold"
                    onClick={onSwitchToLogin}
                >
                    Đăng nhập ngay
                </Button>
            </div>
        </div>
    );
};
