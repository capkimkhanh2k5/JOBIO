import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Shield, KeyRound, Loader2, Info, Mail, CheckCircle2, AlertCircle, Link2 } from 'lucide-react';
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


export function SecuritySettings() {
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema)
    });

    const isGoogleLinked = user?.social_provider === 'google';
    const isGoogleOnlyAccount = isGoogleLinked && !user?.has_usable_password;
    const canLoginWithPassword = !isGoogleOnlyAccount;

    const handleSetPasswordClick = () => {
        toast.info('Chức năng đặt mật khẩu cho tài khoản Google cần luồng xác minh riêng từ backend.');
    };

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

            <div className="grid grid-cols-1 gap-8 items-start">
                {/* Left Column: Password Change */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-8">
                        <div className="mb-8 grid gap-4 lg:grid-cols-2">
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start gap-3">
                                <Mail className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-slate-900 text-sm font-bold">Email đăng nhập</p>
                                    <p className="text-slate-500 text-sm font-medium mt-1 break-all">{user?.email || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-violet-200 bg-violet-50/60 flex items-start gap-3">
                                <Link2 className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-violet-950 text-sm font-bold">Phương thức đăng nhập</p>
                                    <p className="text-violet-800 text-sm font-medium mt-1">
                                        {isGoogleOnlyAccount
                                            ? 'Chỉ Google'
                                            : isGoogleLinked
                                                ? 'Google và Email/Mật khẩu'
                                                : 'Email/Mật khẩu'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isGoogleOnlyAccount && (
                            <div className="mb-8 p-5 rounded-2xl border border-cyan-200 bg-cyan-50/50 flex items-start gap-4">
                                <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-cyan-900 space-y-3">
                                    <p className="font-bold">Tài khoản này chưa có mật khẩu nội bộ</p>
                                    <p className="opacity-80">
                                        Bạn vẫn có thể đăng nhập bằng Google. Nếu muốn đăng nhập song song bằng email và mật khẩu,
                                        hãy dùng luồng <strong>Đặt mật khẩu</strong> riêng sau khi xác minh email hoặc xác thực lại Google.
                                    </p>
                                    <div className="grid gap-2 text-cyan-950">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                                            <span>Không yêu cầu mật khẩu hiện tại.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                                            <span>Sau khi đặt mật khẩu, bạn có thể đăng nhập bằng Google hoặc Email/Mật khẩu.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isGoogleOnlyAccount && (
                            <div className="mb-8 p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
                                <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-amber-800 text-sm font-medium leading-relaxed">
                                    Mật khẩu nên dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn tối đa.
                                </p>
                            </div>
                        )}

                        {isGoogleOnlyAccount ? (
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-2xl bg-violet-50 text-violet-600 shrink-0">
                                            <KeyRound className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">Đặt mật khẩu</h3>
                                            <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                                                Đây là bước liên kết thêm phương thức Email/Mật khẩu cho cùng tài khoản Google hiện tại,
                                                không phải luồng quên mật khẩu.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                        {[
                                            'Xác minh email hoặc Google',
                                            'Nhập mật khẩu mới',
                                            'Kích hoạt đăng nhập song song',
                                        ].map((step, index) => (
                                            <div key={step} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                                <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{step}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6">
                                        <Button
                                            type="button"
                                            onClick={handleSetPasswordClick}
                                            className="h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 px-10 transition-all active:scale-95"
                                        >
                                            Đặt mật khẩu
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="oldPassword" className="text-slate-700 font-bold ml-1">Mật khẩu hiện tại</Label>
                                    <Input
                                        id="oldPassword"
                                        type="password"
                                        {...register('oldPassword')}
                                        placeholder="••••••••"
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-violet-500 focus:bg-white transition-all"
                                        disabled={!canLoginWithPassword}
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
                                            disabled={!canLoginWithPassword}
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
                                            disabled={!canLoginWithPassword}
                                        />
                                        {errors.confirmPassword && <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> {errors.confirmPassword.message}</p>}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !canLoginWithPassword}
                                        className="h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 px-10 transition-all active:scale-95"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cập nhật mật khẩu'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
