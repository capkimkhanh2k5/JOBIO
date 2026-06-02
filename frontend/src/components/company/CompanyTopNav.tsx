import { Link, useNavigate } from 'react-router-dom';
import {
    LogOut, Settings, ChevronDown,
    Building2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useUserStore } from '@/store/userStore';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { Logo } from '@/components/shared/Logo';

// Removed relativeTime and notifIcon as they are no longer used here.

export function CompanyTopNav() {
    const { user, clearAuth, refreshToken } = useUserStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            if (refreshToken) await authService.logout();
            clearAuth();
            toast.success('Đã đăng xuất. Hẹn gặp lại!');
            navigate('/');
        } catch {
            clearAuth();
            navigate('/');
        }
    };

    const companyName = user?.full_name ?? 'Công ty của tôi';
    const initials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-white/3 backdrop-blur-xl z-30">
            {/* Logo */}
            <Logo
                to="/"
                className=""
                imageClassName="h-12 w-auto object-contain drop-shadow"
                textClassName="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tighter"
            />

            {/* Right actions */}
            <div className="flex items-center gap-3">

                {/* Notifications */}
                <NotificationBell />

                <div className="w-px h-6 bg-slate-200" />

                {/* User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2.5 h-10 px-3 rounded-full hover:bg-slate-100 transition-colors"
                            aria-label="Tài khoản"
                        >
                            <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarImage src={user?.avatar_url || ''} alt={companyName} />
                                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">{companyName}</span>
                            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 bg-white border border-slate-200 shadow-lg mt-2 rounded-xl">
                        <DropdownMenuLabel className="py-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={user?.avatar_url || ''} alt={companyName} />
                                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white text-xs font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{companyName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem asChild className="py-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                            <Link to="/company/profile" className="flex w-full items-center gap-3">
                                <Building2 className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700 font-medium">Hồ sơ công ty</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="py-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                            <Link to="/company/settings" className="flex w-full items-center gap-3">
                                <Settings className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700 font-medium">Cài đặt</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="py-2.5 cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                            <Link to="/" target="_blank" className="flex w-full items-center gap-3">
                                <ExternalLink className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-700 font-medium">Xem trang công ty</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                            className="py-2.5 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 font-medium"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            <span>Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
