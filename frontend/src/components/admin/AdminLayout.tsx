import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';

/**
 * AdminLayout – Re-architected Sidebar-First monitoring layout.
 * Optimized for information density and professional system management.
 */
export function AdminLayout() {
    return (
        <div className="min-h-screen flex bg-slate-50 font-sans">
            {/* Sidebar-First: Full height on the left, sticky so it stays while main scrolls */}
            <AdminSidebar />

            {/* Main content column – grows and scrolls naturally with the window */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Internal TopNav: Acting as a contextual toolbar */}
                <AdminTopNav />

                {/* Main Dashboard / Content Area – let window handle scrolling */}
                <main className="flex-1 bg-[#fcfcfd]">
                    <div className="w-full pb-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
