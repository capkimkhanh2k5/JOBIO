import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { Search, Menu, LogOut, User, Settings, LayoutDashboard, X, ChevronRight, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useEffect, useRef, type FormEvent } from 'react';
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
import { cn } from '@/lib/utils';

interface NavItem {
    name: string;
    path: string;
    requiresAuth?: boolean;
    requiresRole?: 'company' | 'candidate' | 'admin';
    restrictedTitle?: string;
    restrictedDescription?: string;
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Việc Làm', path: '/jobs' },
    { name: 'Công Ty', path: '/companies' },
    { name: 'Blog', path: '/blog' },
    {
        name: 'Đăng Tuyển',
        path: '/company/jobs/create',
        requiresAuth: true,
        requiresRole: 'company',
        restrictedDescription: 'Tính năng "Đăng Tuyển" chỉ dành cho tài khoản Nhà tuyển dụng.',
    },
    { name: 'Giá Dịch Vụ', path: '/pricing' },
    {
        name: 'Tạo CV',
        path: '/candidate/cv',
        requiresAuth: true,
        requiresRole: 'candidate',
        restrictedDescription: 'Tính năng "Tạo CV" chỉ dành cho tài khoản Người tìm việc.',
    },
];

export const Header = () => {
    const { user, isAuthenticated, clearAuth, updateUser } = useUserStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [headerSearch, setHeaderSearch] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const headerSearchRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Refresh user profile on mount to sync subscription plan
        if (isAuthenticated && user?.role === 'company') {
            authService.getMe()
                .then(res => updateUser(res.data))
                .catch(err => console.error("Failed to sync header plan:", err));
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isAuthenticated, user?.role, updateUser]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    const handleHeaderSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = headerSearch.trim();

        navigate(query ? `/jobs?search=${encodeURIComponent(query)}` : '/jobs');
        setHeaderSearch('');
    };

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

        // Có yêu cầu role cụ thể
        if (item.requiresRole && user.role !== item.requiresRole) {
            toast.warning(item.restrictedTitle ?? 'Chức năng này không dành cho bạn', {
                description: item.restrictedDescription,
            });
            return;
        }

        navigate(item.path);
    };

    const DARK_HERO_ROUTES = ['/', '/jobs', '/companies'];
    const isDarkHeroPage = DARK_HERO_ROUTES.includes(location.pathname);
    const isDarkHeader = !isScrolled && isDarkHeroPage;

    return (
        <>
            <header className={cn(
                "fixed top-0 z-50 w-full transition-all duration-500 pointer-events-none",
                isScrolled ? "py-2" : "py-3.5"
            )}>
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pointer-events-auto">
                    <div className={cn(
                        "flex items-center justify-between px-6 lg:px-10 transition-all duration-500 border",
                        isScrolled
                            ? "h-[54px] rounded-2xl shadow-md backdrop-blur-xl"
                            : "h-[60px] rounded-2xl backdrop-blur-md",
                        isDarkHeader
                            ? "bg-transparent border-transparent text-white"
                            : "bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 shadow-slate-950/5 text-foreground"
                    )}>
                        {/* Left: Logo */}
                        <div className="flex items-center gap-10 lg:gap-14">
                            <Logo
                                className="mr-1"
                                imageClassName={cn(
                                    "w-auto object-contain drop-shadow-md transition-all duration-500",
                                    isScrolled ? "h-9" : "h-10"
                                )}
                                textClassName="text-2xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 tracking-tighter transition-all duration-500"
                            />

                            {/* Desktop Navigation — editorial uppercase with gold underline hover */}
                            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = location.pathname === item.path;

                                    const navClasses = cn(
                                        "relative text-[12px] xl:text-[13px] font-bold uppercase tracking-[0.12em] transition-all duration-300 py-1 whitespace-nowrap",
                                        isDarkHeader
                                            ? (isActive ? 'text-white font-extrabold drop-shadow' : 'text-white/80 hover:text-white drop-shadow-sm')
                                            : (isActive ? 'text-slate-950 dark:text-white font-extrabold' : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white')
                                    );

                                    // Active indicator — gold accent line
                                    const activeIndicator = isActive ? (
                                        <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--brand-gold)] to-[var(--brand-gold-light)] rounded-full" />
                                    ) : (
                                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[var(--brand-gold)]/60 rounded-full transition-all duration-300 group-hover:w-full" />
                                    );

                                    if (!item.requiresAuth) {
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                className={cn(navClasses, "group")}
                                            >
                                                {item.name}
                                                {activeIndicator}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => handleNavClick(item)}
                                            className={cn(navClasses, "group cursor-pointer")}
                                        >
                                            {item.name}
                                            {activeIndicator}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right: Search + Actions */}
                        <div className="flex items-center gap-4 lg:gap-5">
                            {/* Desktop Search — expandable pill on hover/focus */}
                            <form
                                onSubmit={handleHeaderSearch}
                                className={cn(
                                    "hidden xl:flex items-center rounded-full border transition-all duration-300 group p-1 focus-within:px-3 hover:px-3",
                                    isDarkHeader
                                        ? "bg-white/10 border-white/20 text-white focus-within:border-teal-400 focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-teal-400/20 hover:border-white/30"
                                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 hover:border-slate-300"
                                )}
                            >
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-7 w-7 shrink-0 rounded-full flex items-center justify-center transition-colors magnetic-button p-0",
                                        isDarkHeader
                                            ? "text-white hover:bg-white/20"
                                            : "text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                                    )}
                                    aria-label="Tìm kiếm"
                                >
                                    <Search className="w-4 h-4 stroke-[2.2]" />
                                </Button>
                                <input
                                    ref={headerSearchRef}
                                    type="text"
                                    value={headerSearch}
                                    onChange={(event) => setHeaderSearch(event.target.value)}
                                    placeholder="Tìm việc, công ty..."
                                    className={cn(
                                        "h-7 bg-transparent text-xs xl:text-sm font-medium outline-none transition-all duration-300 overflow-hidden",
                                        headerSearch.trim()
                                            ? "w-36 xl:w-44 opacity-100 pl-2 pr-1"
                                            : "w-0 opacity-0 group-hover:w-36 group-hover:xl:w-44 group-hover:opacity-100 group-focus-within:w-36 group-focus-within:xl:w-44 group-focus-within:opacity-100 group-hover:pl-2 group-hover:pr-1 group-focus-within:pl-2 group-focus-within:pr-1"
                                    )}
                                />
                            </form>

                            {/* Mobile search — go straight to /jobs */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/jobs')}
                                className={cn(
                                    "lg:hidden rounded-full w-10 h-10 transition-colors magnetic-button",
                                    isDarkHeader
                                        ? "text-white hover:bg-white/20"
                                        : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                                aria-label="Tìm kiếm"
                            >
                                <Search className="w-5 h-5 stroke-[2.2]" />
                            </Button>

                            {isAuthenticated && user && <NotificationBell isDarkHeader={isDarkHeader} />}

                            {/* Divider */}
                            <div className="hidden lg:block h-5 w-px bg-border/30" />

                            {/* Auth area */}
                            {isAuthenticated && user ? (
                                user.role === 'admin' ? (
                                    <Link to="/admin/dashboard" className="relative h-10 w-10 rounded-full p-0 inline-flex items-center justify-center hover:opacity-80 transition-opacity">
                                        <Avatar className="h-10 w-10 border-2 border-white/10 hover:border-primary/40 transition-colors ring-2 ring-transparent hover:ring-[var(--brand-gold)]/30">
                                            <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                                            <AvatarFallback className="bg-gradient-to-br from-teal-600 to-emerald-500 text-white text-xs font-bold">
                                                {user.full_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                                                <Avatar className="h-10 w-10 border-2 border-white/10 hover:border-primary/40 transition-colors ring-2 ring-transparent hover:ring-[var(--brand-gold)]/30">
                                                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                                                    <AvatarFallback className="bg-gradient-to-br from-teal-600 to-emerald-500 text-white text-xs font-bold">
                                                        {user.full_name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-64 editorial-card border-border/60 mt-2 p-1" align="end" forceMount>
                                            <DropdownMenuLabel className="font-normal px-3">
                                                <div className="flex flex-col space-y-2 py-2">
                                                    <p className="text-sm font-bold leading-none">{user.full_name}</p>
                                                    <p className="text-xs leading-none text-muted-foreground/60">
                                                        {user.email}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {(user.role as string) === 'admin' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
                                                                ADMIN
                                                            </span>
                                                        ) : (
                                                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary/8 text-primary text-[10px] font-bold uppercase w-fit">
                                                                {user.role}
                                                            </div>
                                                        )}
                                                        {user.role === 'company' && user.subscription_plan && (
                                                            <div className={cn(
                                                                "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest w-fit border shadow-sm",
                                                                user.subscription_plan.toLowerCase().includes('plus')
                                                                    ? "bg-primary/8 text-primary border-primary/12"
                                                                    : user.subscription_plan.toLowerCase().includes('pro')
                                                                        ? "bg-orange-50 text-orange-600 border-orange-100"
                                                                        : user.subscription_plan.toLowerCase().includes('max')
                                                                            ? "bg-amber-50 text-amber-600 border-amber-100"
                                                                            : "bg-primary/8 text-primary border-transparent"
                                                            )}>
                                                                Gói: {user.subscription_plan.split(' (')[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-border/40" />
                                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 px-3">
                                                <Link to={user.role === 'company' ? '/company/dashboard' : '/candidate/dashboard'} className="flex w-full items-center gap-3 py-2.5">
                                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                    <span>Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 px-3">
                                                <Link to={user.role === 'company' ? '/company/profile' : '/candidate/profile'} className="flex w-full items-center gap-3 py-2.5">
                                                    {user.role === 'company' ? (
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span>{user.role === 'company' ? 'Hồ sơ công ty' : 'Hồ sơ cá nhân'}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/5 px-3">
                                                <Link to={user.role === 'company' ? '/company/settings' : '/candidate/settings'} className="flex w-full items-center gap-3 py-2.5">
                                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                                    <span>Cài đặt</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border/40" />
                                            <DropdownMenuItem
                                                className="py-2.5 px-3 cursor-pointer rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 focus:bg-red-50"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="mr-3 h-4 w-4" />
                                                <span>Đăng xuất</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )
                            ) : (
                                <Link to="/auth" className="hidden sm:block">
                                    <Button className="rounded-full px-7 h-10 font-bold text-[12px] tracking-wider uppercase bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/15 magnetic-button border-0">
                                        Tham gia ngay
                                    </Button>
                                </Link>
                            )}

                            {/* Mobile menu toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden rounded-full w-10 h-10 hover:bg-primary/8"
                                onClick={() => setIsMobileMenuOpen(true)}
                                aria-label="Mở menu"
                            >
                                <Menu className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Mobile Drawer ── */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer panel */}
                    <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        {/* Drawer header */}
                        <div className="flex items-center justify-between p-5 border-b border-border/40">
                            <Logo
                                imageClassName="h-9 w-auto object-contain"
                                textClassName="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 tracking-tighter"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="rounded-full w-9 h-9 hover:bg-primary/8"
                                aria-label="Đóng menu"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Navigation links */}
                        <div className="flex-1 overflow-y-auto py-4">
                            <nav className="flex flex-col gap-0.5 px-3">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = location.pathname === item.path;

                                    if (!item.requiresAuth) {
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                                                    isActive
                                                        ? "bg-primary/8 text-primary"
                                                        : "text-foreground/60 hover:text-foreground hover:bg-muted/60"
                                                )}
                                            >
                                                <span>{item.name}</span>
                                                <ChevronRight className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-foreground/20")} />
                                            </Link>
                                        );
                                    }

                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => handleNavClick(item)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left",
                                                isActive
                                                    ? "bg-primary/8 text-primary"
                                                    : "text-foreground/60 hover:text-foreground hover:bg-muted/60"
                                            )}
                                        >
                                            <span>{item.name}</span>
                                            <ChevronRight className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-foreground/20")} />
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Drawer footer — auth actions */}
                        <div className="p-5 border-t border-border/40 space-y-3">
                            {isAuthenticated && user ? (
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar className="h-10 w-10 border-2 border-primary/15">
                                            <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                                            <AvatarFallback className="bg-gradient-to-br from-teal-600 to-emerald-500 text-white text-xs font-bold">
                                                {user.full_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{user.full_name}</p>
                                            <p className="text-xs text-muted-foreground/60 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'company' ? '/company/dashboard' : '/candidate/dashboard'}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/8 text-primary text-sm font-bold hover:bg-primary/12 transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <Link to="/auth" className="block">
                                    <Button className="w-full rounded-xl h-11 font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/15 border-0">
                                        Tham gia ngay
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
