import { Link, useNavigate } from 'react-router-dom';
import {
    MessageSquare, LogOut, User, Settings, ChevronDown
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
import { useMessageStore } from '@/store/messageStore';

export function CandidateTopNav() {
    const { user, clearAuth, refreshToken } = useUserStore();
    const navigate = useNavigate();

    // Unread messages count – from global messageStore (updated by MessagesPage)
    const msgCount = useMessageStore((state) => state.unreadCount);

    const handleLogout = async () => {
        try {
            if (refreshToken) await authService.logout();
            clearAuth();
            toast.success('Đã đăng xuất. Hẹn gặp lại!');
            navigate('/auth');
        } catch {
            clearAuth();
            navigate('/auth');
        }
    };

    const userName = user?.full_name ?? 'Ứng viên';
    const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-30 shadow-sm">
            {/* Logo */}
            <Link
                to="/"
                className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter hover:opacity-80 transition-opacity"
                aria-label="JOBIO – Về trang chủ"
            >
                JOBIO
                <span className="ml-2 text-xs font-semibold text-cyan-400/80 uppercase tracking-widest align-middle">Candidate</span>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full w-10 h-10 hover:bg-slate-100 transition-colors text-slate-600"
                    onClick={() => navigate('/candidate/messages')}
                >
                    <MessageSquare className="w-5 h-5" />
                    {(msgCount ?? 0) > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-violet-400 rounded-full border border-background" />
                    )}
                </Button>

                <NotificationBell />

                <div className="w-px h-6 bg-slate-200" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2.5 h-10 px-3 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
                        >
                            <Avatar className="w-8 h-8 border border-slate-200">
                                <AvatarImage src={user?.avatar_url || ''} alt={userName} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">{userName}</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg mt-2">
                        <DropdownMenuLabel className="py-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border border-slate-200">
                                    <AvatarImage src={user?.avatar_url || ''} alt={userName} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-bold">{userName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/candidate/profile" className="flex items-center gap-3">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>Hồ sơ cá nhân</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/candidate/settings" className="flex items-center gap-3">
                                <Settings className="w-4 h-4 text-muted-foreground" />
                                <span>Cài đặt</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Đăng xuất
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
