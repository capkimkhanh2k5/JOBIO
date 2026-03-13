import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SocialAuth } from './SocialAuth';
import { PasswordStrength } from './PasswordStrength';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Loader2, Briefcase, User, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

const registerSchema = z.object({
    full_name: z.string().optional(),
    email: z.string()
        .email({ message: "Email không hợp lệ" })
        .refine((val) => GMAIL_REGEX.test(val), {
            message: "Chỉ chấp nhận email có đuôi @gmail.com",
        }),
    password: z.string().min(8, { message: "Mật khẩu phải từ 8 ký tự" }),
    password_confirm: z.string(),
    otp: z.string().length(6, { message: "Mã OTP phải có đúng 6 chữ số" }),
    role: z.enum(['candidate', 'company']),

    company_name: z.string().optional(),
    tax_code: z.string().optional(),

    agreeTerms: z.boolean().refine(val => val === true, {
        message: "Bạn phải đồng ý với điều khoản",
    }),
}).superRefine((data, ctx) => {
    if (data.password !== data.password_confirm) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Mật khẩu không khớp",
            path: ["password_confirm"],
        });
    }

    if (data.role === 'candidate') {
        if (!data.full_name || data.full_name.trim().length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Họ tên quá ngắn",
                path: ["full_name"],
            });
        }
    }

    if (data.role === 'company') {
        if (!data.company_name || data.company_name.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Tên công ty là bắt buộc",
                path: ["company_name"],
            });
        }
    }
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
    const [isOtpSent, setIsOtpSent] = React.useState(false);
    const [countdown, setCountdown] = React.useState(0);
    const [isSendingOtp, setIsSendingOtp] = React.useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
    const [isOtpVerified, setIsOtpVerified] = React.useState(false);

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            password_confirm: '',
            otp: '',
            role: 'candidate',
            company_name: '',
            tax_code: '',
            agreeTerms: false,
        },
    });

    const selectedRole = form.watch('role');

    const otpValue = form.watch('otp');
    React.useEffect(() => {
        const verifyOtp = async () => {
            if (otpValue && otpValue.length === 6 && !isOtpVerified && !isVerifyingOtp) {
                setIsVerifyingOtp(true);
                try {
                    await authService.verifyRegistrationOtp({ email: form.getValues('email'), otp: otpValue });
                    setIsOtpVerified(true);
                    toast.success("Xác thực OTP thành công!");
                } catch (error: any) {
                    toast.error(error.response?.data?.detail || "Mã OTP không hợp lệ hoặc đã hết hạn.");
                    form.setValue('otp', '');
                } finally {
                    setIsVerifyingOtp(false);
                }
            }
        };
        verifyOtp();
    }, [otpValue, isOtpVerified, isVerifyingOtp, form]);

    const handleSendOtp = async () => {
        const email = form.getValues('email').trim();
        if (!email) {
            form.setError('email', { type: 'manual', message: 'Vui lòng nhập email trước' });
            return;
        }

        const isValidEmail = GMAIL_REGEX.test(email);
        if (!isValidEmail) {
            toast.error('Chỉ chấp nhận email có đuôi @gmail.com');
            return;
        }

        const isValidParams = await form.trigger('email');
        if (!isValidParams || emailStatus === 'taken' || emailStatus === 'checking') {
            toast.error('Vui lòng nhập một email hợp lệ chưa được sử dụng');
            return;
        }

        setIsSendingOtp(true);
        try {
            await authService.sendRegistrationOtp({ email });
            toast.success("Mã OTP đã được gửi đến email của bạn.");
            setIsOtpSent(true);
            setCountdown(300); // 5 phút
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Gửi mã thất bại. Vui lòng thử lại.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const onSubmit = async (values: RegisterFormValues) => {
        if (!isOtpVerified) {
            toast.error("Vui lòng gửi và xác thực mã OTP trước khi đăng ký.");
            return;
        }

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
                full_name: values.role === 'company' ? (values.company_name || '') : (values.full_name || ''),
                password: values.password,
                password_confirm: values.password_confirm,
                otp: values.otp,
                role: values.role === 'candidate' ? 'candidate' : 'company',
                company_name: values.company_name,
                tax_code: values.tax_code,
            });
            onRegistered(values.email);
            toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        } catch (error: any) {
            const data = error.response?.data;
            let msg = 'Đăng ký thất bại. Vui lòng thử lại.';

            if (data) {
                if (data.detail) msg = data.detail;
                else if (typeof data.message === 'string') msg = data.message;
                else if (data.email?.[0]) msg = data.email[0];
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
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-3 w-full group",
                                            field.value === 'candidate'
                                                ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-500/10"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-full", field.value === 'candidate' ? "bg-blue-100/50" : "bg-slate-100 group-hover:bg-slate-200/50")}>
                                            <User className={cn("w-5 h-5", field.value === 'candidate' ? "text-blue-600" : "text-slate-400")} />
                                        </div>
                                        <span className={cn("text-[13px] font-bold", field.value === 'candidate' ? "text-blue-700" : "text-slate-500")}>Tìm việc làm</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => field.onChange('company')}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-3 w-full group",
                                            field.value === 'company'
                                                ? "border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-500/10"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-full", field.value === 'company' ? "bg-indigo-100/50" : "bg-slate-100 group-hover:bg-slate-200/50")}>
                                            <Briefcase className={cn("w-5 h-5", field.value === 'company' ? "text-indigo-600" : "text-slate-400")} />
                                        </div>
                                        <span className={cn("text-[13px] font-bold", field.value === 'company' ? "text-indigo-700" : "text-slate-500")}>Nhà tuyển dụng</span>
                                    </button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {selectedRole === 'candidate' && (
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <FormLabel>Họ và tên</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nguyễn Văn A"
                                            className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:font-normal"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {selectedRole === 'company' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên công ty <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Công ty CP Công Nghệ JOBIO"
                                                className="h-11 bg-white border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:font-normal"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tax_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã số thuế <span className="text-xs text-gray-400 font-normal">(Tuỳ chọn)</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="0101234567"
                                                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:font-normal"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

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
                                                "h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:font-normal pr-10",
                                                emailStatus === 'taken' && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                                                (emailStatus === 'available' && isOtpVerified) && "border-green-500 focus:border-green-500 focus:ring-green-500/10"
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

                                                // Use Zod validation natively
                                                const isValid = await form.trigger('email');
                                                if (!isValid) {
                                                    setEmailStatus('idle');
                                                    return;
                                                }

                                                setIsCheckingEmail(true);
                                                setEmailStatus('checking');
                                                try {
                                                    const { data } = await authService.checkEmail(val);
                                                    if (!data.exists) {
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
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            {isCheckingEmail && <Loader2 className="w-4 h-4 text-gray-400 animate-spin mr-2" />}
                                            {!isCheckingEmail && emailStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />}
                                            {!isCheckingEmail && emailStatus === 'taken' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className={cn(
                                                    "h-8 px-3 text-xs font-semibold transition-all",
                                                    countdown > 0 ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                                                )}
                                                disabled={isSendingOtp || countdown > 0 || isCheckingEmail || emailStatus === 'taken' || !GMAIL_REGEX.test(form.watch('email'))}
                                                onClick={handleSendOtp}
                                            >
                                                {isSendingOtp ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                                ) : countdown > 0 ? (
                                                    `Gửi lại (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')})`
                                                ) : (
                                                    "Gửi mã OTP"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* OTP Field */}
                    <div className={cn("transition-all duration-300", isOtpSent && !isOtpVerified ? "block" : "hidden")}>
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Mã xác nhận (OTP)</FormLabel>
                                        {isVerifyingOtp && <span className="text-xs text-blue-500 flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Đang kiểm tra...</span>}
                                    </div>
                                    <div className="flex justify-center">
                                        <FormControl>
                                            <InputOTP maxLength={6} {...field} disabled={isVerifyingOtp || isOtpVerified}>
                                                <InputOTPGroup className="gap-2">
                                                    <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-md border" />
                                                    <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-md border" />
                                                    <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-md border" />
                                                    <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-md border" />
                                                    <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-md border" />
                                                    <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-md border" />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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
                                            className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:font-normal"
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
                                            className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:font-normal"
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
                                <Label htmlFor="agreeTerms" className="text-xs font-normal text-muted-foreground leading-relaxed">
                                    Tôi đã đọc và đồng ý với <Link to="/terms" target="_blank" className="font-medium text-primary hover:underline transition-colors">Điều khoản dịch vụ</Link> và <Link to="/privacy" target="_blank" className="font-medium text-primary hover:underline transition-colors">Chính sách bảo mật</Link> của JOBIO.
                                </Label>
                            </div>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all shadow-md shadow-blue-500/20 hover:-translate-y-[1px]"
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
                    className="p-0 h-auto text-blue-600 hover:text-blue-700 font-bold"
                    onClick={onSwitchToLogin}
                >
                    Đăng nhập ngay
                </Button>
            </div>
        </div>
    );
};
