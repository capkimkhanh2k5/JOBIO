import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

/**
 * AdminLayout – Re-architected Sidebar-First monitoring layout.
 * Uses Editorial Luxury design system with warm dashboard surface.
 */
export function AdminLayout() {
    return (
        <div className="min-h-screen flex bg-background font-sans">
            {/* Sidebar-First: Full height on the left, sticky so it stays while main scrolls */}
            <AdminSidebar />

            {/* Main content column – grows and scrolls naturally with the window */}
            <div className="flex-1 flex flex-col min-w-0 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
                {/* Internal TopNav: Acting as a contextual toolbar */}
                <AdminTopNav />

                {/* Main Dashboard / Content Area — warm tinted background */}
                <main className="flex-1 dashboard-surface">
                    <div className="w-full pb-10">
                        <Outlet />
                    </div>
                </main>
            </div>
            <MobileBottomNav />
        </div>
    );
}
