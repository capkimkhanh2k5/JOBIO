import { useUserStore } from '@/store/userStore';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function AccountSettings() {
    const { user } = useUserStore();

    if (!user) return (
        <div className="p-6 space-y-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold">Thông tin tài khoản</h2>
                <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin định danh và liên hệ của bạn.</p>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-white flex items-center justify-center text-2xl font-black shadow-inner">
                        {user.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{user.full_name}</h3>
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 uppercase text-[10px] font-bold">
                                {user.role}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Họ và Tên</Label>
                        <Input id="full_name" defaultValue={user.full_name} className="bg-slate-50 focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue={user.email} disabled className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                        <p className="text-[11px] text-muted-foreground mt-1">Email dùng để đăng nhập, không thể thay đổi.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input id="phone" defaultValue={user.phone || ''} placeholder="0987654321" className="bg-slate-50 focus:bg-white transition-colors" />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-600/20 px-8">
                        Lưu thay đổi
                    </Button>
                </div>
            </div>
        </div>
    );
}
