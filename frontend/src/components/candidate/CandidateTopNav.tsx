import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, MessageSquare, LogOut, User, Settings, ChevronDown,
    Loader2, ExternalLink, AlertTriangle, Star, Eye, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useUserStore } from '@/store/userStore';
import { mockApi } from '@/services/mockApi';
import { toast } from 'sonner';

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
}

const notifIcon: Record<string, React.ReactNode> = {
    application: <FileText className="w-4 h-4 text-cyan-400" />,
    interview: <Bell className="w-4 h-4 text-violet-400" />,
    view: <Eye className="w-4 h-4 text-sky-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    match: <Star className="w-4 h-4 text-lime-400" />,
};

export function CandidateTopNav() {
    const { user, clearAuth, refreshToken } = useUserStore();
    const navigate = useNavigate();
    const [notifOpen, setNotifOpen] = useState(false);

    // Notifications count
    const { data: notifCount } = useQuery({
        queryKey: ['candidate', 'notifications', 'count'],
        queryFn: mockApi.getNotificationsCount,
        staleTime: 30_000,
    });

    // Notifications list
    const { data: notifications, isLoading: notifLoading } = useQuery({
        queryKey: ['candidate', 'notifications', 'recent'],
        queryFn: mockApi.getRecentNotifications,
        enabled: notifOpen,
        staleTime: 30_000,
    });

    // Unread messages count
    const { data: msgCount } = useQuery({
        queryKey: ['candidate', 'messages', 'unread'],
        queryFn: mockApi.getUnreadMessagesCount,
        staleTime: 30_000,
    });

    const handleLogout = async () => {
        try {
            if (refreshToken) await mockApi.logout(refreshToken);
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
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-white/3 backdrop-blur-xl sticky top-0 z-30">
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
                    className="relative rounded-full w-10 h-10 hover:bg-white/8 transition-colors"
                    onClick={() => navigate('/candidate/messages')}
                >
                    <MessageSquare className="w-5 h-5" />
                    {(msgCount?.unread_count ?? 0) > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-violet-400 rounded-full border border-background" />
                    )}
                </Button>

                <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full w-10 h-10 hover:bg-white/8 transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {(notifCount?.unread_count ?? 0) > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] text-[10px] font-bold bg-cyan-500 text-white rounded-full flex items-center justify-center px-1"
                                >
                                    {notifCount!.unread_count}
                                </motion.span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-96 glass-effect border-white/10 mt-2 p-0 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <p className="font-semibold text-sm">Thông báo</p>
                            <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-300">
                                {notifCount?.unread_count ?? 0} chưa đọc
                            </Badge>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {notifications?.map((n, i) => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-cyan-500/5' : ''}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center shrink-0 mt-0.5">
                                                {notifIcon[n.type] ?? <Bell className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium leading-tight">{n.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                                <p className="text-[11px] text-muted-foreground/60 mt-1">{relativeTime(n.created_at)}</p>
                                            </div>
                                            {!n.is_read && (
                                                <span className="w-2 h-2 bg-cyan-400 rounded-full shrink-0 mt-2" />
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-white/10" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2.5 h-10 px-3 rounded-full hover:bg-white/8 transition-colors"
                        >
                            <Avatar className="w-8 h-8 border border-white/10">
                                <AvatarImage src={user?.avatar_url} alt={userName} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">{userName}</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass-effect border-white/10 mt-2">
                        <DropdownMenuLabel className="py-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={user?.avatar_url} alt={userName} />
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
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/profile" className="flex items-center gap-3">
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
                        <DropdownMenuSeparator className="bg-white/5" />
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
