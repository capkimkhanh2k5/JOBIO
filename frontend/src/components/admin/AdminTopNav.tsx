import { Search } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';

export function AdminTopNav() {
    return (
        <header className="h-14 shrink-0 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
            {/* Left: reserved */}
            <div className="w-1/4" />

            {/* Center: Search */}
            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Tìm kiếm nhanh hệ thống..."
                    className="w-full pl-10 pr-4 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all bg-slate-50/50"
                />
            </div>

            {/* Right: Notifications & Logo */}
            <div className="w-1/4 flex items-center justify-end gap-4">
                {/* Real notification bell — replaces the old static icon */}
                <NotificationBell />

                <div className="h-4 w-px bg-slate-200" />

                <Logo
                    to="/"
                    showText={false}
                    imageClassName="h-8 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
                />
            </div>
        </header>
    );
}
