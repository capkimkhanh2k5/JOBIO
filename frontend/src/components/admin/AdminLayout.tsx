import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';

/**
 * AdminLayout – Re-architected Sidebar-First monitoring layout.
 * Optimized for information density and professional system management.
 */
export function AdminLayout() {
    return (
        <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar-First: Full height on the left */}
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Internal TopNav: Acting as a contextual toolbar */}
                <AdminTopNav />
                
                {/* Main Dashboard / Content Area */}
                <main className="flex-1 overflow-y-auto bg-[#fcfcfd]">
                    <div className="w-full pb-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
