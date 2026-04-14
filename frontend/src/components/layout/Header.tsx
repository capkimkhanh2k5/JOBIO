import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { Search, Menu, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { NotificationBell } from '../shared/notifications/NotificationBell';
import { Logo } from '@/components/shared/Logo';

interface NavItem {
    name: string;
    path: string;
    requiresAuth?: boolean;
    requiresRole?: 'company' | 'candidate' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Việc Làm', path: '/jobs' },
    { name: 'Công Ty', path: '/companies' },
    { name: 'Blog', path: '/blog' },
    { name: 'Đăng Tuyển', path: '/employer/jobs/create', requiresAuth: true, requiresRole: 'company' },
    { name: 'Giá Dịch Vụ', path: '/pricing' },
    { name: 'Tạo CV', path: '/cv-builder', requiresAuth: true },
];

export const Header = () => {
    const toggleCommand = useUiStore((state) => state.toggleCommand);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const { user, isAuthenticated, clearAuth } = useUserStore();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            clearAuth();
            toast.success("Hẹn gặp lại bạn!");
            navigate('/');
        } catch {
            clearAuth();
            navigate('/');
        }
    };

    const handleNavClick = (item: NavItem) => {
        // Không cần auth → điều hướng thẳng
        if (!item.requiresAuth) {
            navigate(item.path);
            return;
        }

        // Chưa login → redirect đến trang auth
        if (!isAuthenticated || !user) {
            navigate('/auth', { state: { from: item.path } });
            return;
        }

        // Có yêu cầu role cụ thể (company)
        if (item.requiresRole && user.role !== item.requiresRole && user.role !== 'admin') {
            toast.warning('Chức năng này không dành cho bạn', {
                description: 'Tính năng "Đăng Tuyển" chỉ dành cho tài khoản Nhà tuyển dụng.',
            });
            return;
        }

        navigate(item.path);
    };

    return (
        <header className={`fixed top-0 z-50 w-full transition-all duration-700 ${isScrolled ? 'py-4' : 'py-8'}`}>
            <div className="w-full max-w-[1600px] mx-auto px-6">
                <div className={`flex items-center justify-between px-10 h-20 transition-all duration-700 ${isScrolled ? 'glass-effect shadow-xl h-16 rounded-[28px]' : 'bg-transparent border-transparent rounded-[32px]'}`}>
                    <div className="flex items-center gap-16">
                        <Logo
                            className="mr-2"
                            imageClassName="h-14 w-auto object-contain drop-shadow-md transition-all duration-700"
                            textClassName="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter transition-all duration-700"
                        />

                        <nav className="hidden lg:flex items-center gap-10">
                            {NAV_ITEMS.map((item) => {
                                const isActive = location.pathname === item.path;

                                if (!item.requiresAuth) {
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={`text-[15px] font-black uppercase tracking-widest transition-all hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/60'}`}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavClick(item)}
                                        className={`text-[15px] font-black uppercase tracking-widest transition-all hover:text-primary cursor-pointer ${isActive ? 'text-primary' : 'text-foreground/60'}`}
                                    >
                                        {item.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleCommand}
                            className="rounded-full w-12 h-12 hover:bg-primary/10 transition-colors magnetic-button"
                        >
                            <Search className="w-6 h-6" />
                        </Button>
                        {isAuthenticated && user && <NotificationBell />}

                        <div className="h-6 w-[1px] bg-border/40 mx-2" />

                        {isAuthenticated && user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
                                        <Avatar className="h-12 w-12 border-2 border-white/10 hover:border-cyan-500/50 transition-colors">
                                            <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white">
                                                {user.full_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 glass-effect border-white/10 mt-2" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-2 py-2">
                                            <p className="text-sm font-bold leading-none">{user.full_name}</p>
                                            <p className="text-xs leading-none text-muted-foreground/70">
                                                {user.email}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase w-fit">
                                                    {user.role}
                                                </div>
                                                {user.role === 'company' && user.subscription_plan && (
                                                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase w-fit">
                                                        Gói: {user.subscription_plan}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem className="py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5">
                                        <Link to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'company' ? '/employer/dashboard' : '/candidate/dashboard'} className="flex items-center w-full">
                                            <LayoutDashboard className="mr-3 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5">
                                        <Link to={user.role === 'company' ? '/employer/company' : (user.recruiter_id ? `/profile/${user.recruiter_id}` : '/candidate/profile')} className="flex items-center w-full">
                                            <User className="mr-3 h-4 w-4" />
                                            <span>Trang cá nhân</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="py-3 cursor-pointer hover:bg-white/5 focus:bg-white/5">
                                        <Link to={user.role === 'company' ? '/employer/settings' : '/candidate/settings'} className="flex items-center w-full">
                                            <Settings className="mr-3 h-4 w-4" />
                                            <span>Cài đặt</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem
                                        className="py-3 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-400/10 focus:bg-red-400/10"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-3 h-4 w-4" />
                                        <span>Đăng xuất</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link to="/auth">
                                <Button className="rounded-full px-8 h-12 font-black text-[15px] bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 magnetic-button">
                                    Tham gia ngay
                                </Button>
                            </Link>
                        )}

                        <Button variant="ghost" size="icon" className="lg:hidden rounded-full w-12 h-12">
                            <Menu className="w-7 h-7" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
