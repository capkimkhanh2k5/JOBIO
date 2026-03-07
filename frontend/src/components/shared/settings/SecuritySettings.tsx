import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Shield, KeyRound, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';


const securitySchema = z.object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ['confirmPassword']
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export function SecuritySettings() {
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema)
    });

    const onSubmit = async (data: SecurityFormValues) => {
        setIsLoading(true);
        try {
            await authService.changePassword({
                old_password: data.oldPassword,
                new_password: data.newPassword,
                confirm_password: data.confirmPassword
            });
            toast.success("Thay đổi mật khẩu thành công!");
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Đã có lỗi xảy ra khi đổi mật khẩu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Bảo mật & Mật khẩu</h2>
                    <p className="text-sm text-muted-foreground mt-1">Đảm bảo tài khoản của bạn đang sử dụng mật khẩu an toàn và duy nhất.</p>
                </div>
            </div>

            <div className="mb-8 p-4 rounded-lg border border-amber-200 bg-amber-50 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm">
                    Mật khẩu nên dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                    <Input
                        id="oldPassword"
                        type="password"
                        {...register('oldPassword')}
                        className="bg-slate-50 focus:bg-white"
                    />
                    {errors.oldPassword && <p className="text-[11px] text-red-500">{errors.oldPassword.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                        id="newPassword"
                        type="password"
                        {...register('newPassword')}
                        className="bg-slate-50 focus:bg-white"
                    />
                    {errors.newPassword && <p className="text-[11px] text-red-500">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword')}
                        className="bg-slate-50 focus:bg-white"
                    />
                    {errors.confirmPassword && <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Cập nhật mật khẩu
                    </Button>
                </div>
            </form>
        </div>
    );
}
