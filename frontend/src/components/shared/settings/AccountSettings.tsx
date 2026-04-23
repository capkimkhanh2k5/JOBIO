import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/authService';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AccountSettings() {
    const { user, updateUser } = useUserStore();
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!user) return;
        setFullName(user.full_name ?? '');
        setPhone(user.phone ?? '');
        setLocalAvatarUrl(null);
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: async () => {
            if (!user) {
                throw new Error('Không tìm thấy thông tin người dùng.');
            }

            const response = await authService.updateProfile(user.id, {
                full_name: fullName.trim(),
                phone: phone.trim(),
            });

            return response.data;
        },
        onSuccess: (updatedUser) => {
            updateUser({
                full_name: updatedUser.full_name,
                phone: updatedUser.phone,
                avatar_url: updatedUser.avatar_url,
            });
            toast.success('Đã lưu thay đổi tài khoản.');
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Không thể lưu thay đổi tài khoản.';
            toast.error(message);
        }
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            const response = await authService.uploadAvatar(file);
            return response.data;
        },
        onSuccess: (updatedUser) => {
            updateUser({ avatar_url: updatedUser.avatar_url });
            setLocalAvatarUrl(updatedUser.avatar_url);
            toast.success('Đã cập nhật ảnh đại diện.');
        },
        onError: (error: any) => {
            const message = error.response?.data?.detail || 'Không thể tải ảnh đại diện lên.';
            toast.error(message);
        }
    });

    if (!user) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-20 w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    const avatarSrc = localAvatarUrl || user.avatar_url || undefined;
    const avatarFallback = (user.full_name || user.email || 'U').substring(0, 2).toUpperCase();
    const isSaving = updateProfileMutation.isPending;
    const isUploadingAvatar = uploadAvatarMutation.isPending;

    const handleChooseAvatar = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setLocalAvatarUrl(previewUrl);
        uploadAvatarMutation.mutate(file, {
            onSettled: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Thông tin tài khoản</h2>
                <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin định danh và liên hệ của bạn.</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="relative">
                        <Avatar className="h-20 w-20 border border-slate-200 shadow-sm">
                            <AvatarImage src={avatarSrc} alt={user.full_name} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white text-2xl font-black">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                        <Button
                            type="button"
                            size="icon"
                            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-violet-600 hover:bg-violet-700 shadow-md"
                            onClick={handleChooseAvatar}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{user.full_name}</h3>
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 uppercase text-[10px] font-bold">
                                {user.role}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-[11px] text-muted-foreground mt-2">Nhấn biểu tượng máy ảnh để đổi avatar.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Họ và Tên</Label>
                        <Input
                            id="full_name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                        <p className="text-[11px] text-muted-foreground mt-1">Email dùng để đăng nhập, không thể thay đổi.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0987654321"
                            className="bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <Button
                        type="button"
                        className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 px-8"
                        onClick={() => updateProfileMutation.mutate()}
                        disabled={isSaving || isUploadingAvatar}
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
