import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Shield, KeyRound, Loader2, Info, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { useUserStore } from '@/store/userStore';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const securitySchema = z.object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
});

type SecurityFormValues = z.infer<typeof securitySchema>;

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export function SecuritySettings() {
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [gmail, setGmail] = useState('');

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema)
    });

    const isGoogleLinked = user?.social_provider === 'google';
    const isGoogleOnlyAccount = isGoogleLinked && !user?.has_usable_password;

    const onSubmit = async (data: SecurityFormValues) => {
        if (isGoogleOnlyAccount) {
            toast.info('Tài khoản Google này chưa có mật khẩu nội bộ để đổi trực tiếp.');
            return;
        }

        setIsLoading(true);
        try {
            await authService.changePassword({
                old_password: data.oldPassword,
                new_password: data.newPassword,
                new_password_confirm: data.confirmPassword
            });
            toast.success('Thay đổi mật khẩu thành công!');
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Đã có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitiateLink = async () => {
        if (!gmail || !gmail.includes('@gmail.com')) {
            toast.error('Vui lòng nhập đúng địa chỉ Gmail của bạn');
            return;
        }

        setIsLinking(true);
        try {
            await authService.initiateSocialLink({ email: gmail, provider: 'google' });
            toast.success('Một liên kết xác thực đã được gửi đến Gmail của bạn. Vui lòng kiểm tra hộp thư!');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Không thể gửi yêu cầu liên kết');
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-600/10 text-violet-600 rounded-2xl shadow-inner shrink-0">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Bảo mật & Mật khẩu</h2>
                        <p className="text-slate-500 font-medium text-sm mt-0.5">Quản lý các phương thức bảo mật cho tài khoản của bạn.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Left Column: Password Change */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-8">
                        <div className="mb-8 p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
                            <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-amber-800 text-sm font-medium leading-relaxed">
                                Mật khẩu nên dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn tối đa.
                            </p>
                        </div>

                        {isGoogleOnlyAccount && (
                            <div className="mb-8 p-5 rounded-2xl border border-cyan-200 bg-cyan-50/50 flex items-start gap-4">
                                <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-cyan-900 space-y-2">
                                    <p className="font-bold">Bạn đang đăng nhập bằng Google</p>
                                    <p className="opacity-80">Tài khoản này chưa thiết lập mật khẩu nội bộ. Nếu muốn sử dụng song song cả mật khẩu và Google, hãy dùng chức năng <strong>Quên mật khẩu</strong> để tạo mật khẩu mới.</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="oldPassword" className="text-slate-700 font-bold ml-1">Mật khẩu hiện tại</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    {...register('oldPassword')}
                                    placeholder="••••••••"
                                    className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-violet-500 focus:bg-white transition-all"
                                    disabled={isGoogleOnlyAccount}
                                />
                                {errors.oldPassword && <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {errors.oldPassword.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="newPassword" className="text-slate-700 font-bold ml-1">Mật khẩu mới</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        {...register('newPassword')}
                                        placeholder="••••••••"
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-violet-500 focus:bg-white transition-all"
                                        disabled={isGoogleOnlyAccount}
                                    />
                                    {errors.newPassword && <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {errors.newPassword.message}</p>}
                                </div>

                                <div className="space-y-2.5">
                                    <Label htmlFor="confirmPassword" className="text-slate-700 font-bold ml-1">Xác nhận mật khẩu</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...register('confirmPassword')}
                                        placeholder="••••••••"
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-violet-500 focus:bg-white transition-all"
                                        disabled={isGoogleOnlyAccount}
                                    />
                                    {errors.confirmPassword && <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {errors.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={isLoading || isGoogleOnlyAccount}
                                    className="h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 px-10 transition-all active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cập nhật mật khẩu'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Social Linking */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50">
                            <h3 className="text-lg font-black text-slate-900">Tài khoản liên kết</h3>
                            <p className="text-slate-500 text-sm font-medium">Quản lý liên kết mạng xã hội để đăng nhập nhanh.</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Google Link Card */}
                            <div className={`p-5 rounded-2xl border transition-all ${isGoogleLinked ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white rounded-xl shadow-sm">
                                            <GoogleIcon />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-900">Google</span>
                                            <span className="text-xs font-medium text-slate-500">Google Account</span>
                                        </div>
                                    </div>
                                    {isGoogleLinked ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-wider">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Đã liên kết
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-black uppercase tracking-wider">
                                            Chưa liên kết
                                        </div>
                                    )}
                                </div>

                                {!isGoogleLinked && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-600 ml-1">Email liên kết Google</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    value={gmail}
                                                    onChange={(e) => setGmail(e.target.value)}
                                                    placeholder="example@gmail.com"
                                                    className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-violet-500"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleInitiateLink}
                                            disabled={isLinking}
                                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                                        >
                                            {isLinking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Gửi liên kết xác thực'}
                                        </Button>
                                        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                                            Chúng tôi sẽ gửi một liên kết đến Gmail của bạn. <br/>Bạn cần nhấn vào link đó để hoàn tất xác thực.
                                        </p>
                                    </div>
                                )}

                                {isGoogleLinked && (
                                    <div className="mt-2 text-sm text-green-800 font-medium opacity-90 leading-relaxed">
                                        Tài khoản của bạn đã được bảo vệ bởi Google. Bạn có thể dùng tính năng <strong>Đăng nhập bằng Google</strong> để truy cập JOBIO.
                                    </div>
                                )}
                            </div>

                            {/* Other Providers Placeholder (Future proof) */}
                            <div className="p-5 rounded-2xl border bg-slate-50/50 border-slate-100 opacity-50 grayscale select-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm">
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    </div>
                                    <div>
                                        <span className="block font-bold text-slate-900">Facebook</span>
                                        <span className="text-xs font-medium text-slate-400">Sắp ra mắt</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-violet-600/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Info className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-bold">Hỗ trợ bảo mật</h4>
                        </div>
                        <p className="text-sm text-violet-100 leading-relaxed mb-4">
                            Nếu bạn gặp bất kỳ vấn đề nào trong quá trình liên kết tài khoản hoặc quên mật khẩu, hãy liên hệ ngay với đội ngũ hỗ trợ.
                        </p>
                        <Button className="w-full bg-white text-violet-700 hover:bg-violet-50 font-bold rounded-xl transition-colors">
                            Liên hệ hỗ trợ
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
