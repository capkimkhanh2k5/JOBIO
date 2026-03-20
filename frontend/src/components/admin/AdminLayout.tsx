import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from './AdminSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { MiniFooter } from '@/components/layout/MiniFooter';

/**
 * AdminLayout – wraps all /admin/* routes.
 * Uses the same Header as public site with Admin sidebar.
 */
export function AdminLayout() {
    return (
        <div className="h-screen flex flex-col bg-slate-50/30">
            <ScrollProgress />
            <Header />
            <div className="flex flex-1 min-h-0 pt-[112px]">
                <AdminSidebar />
                <main className="flex-1 min-w-0 min-h-0 overflow-y-auto w-full">
                    <Outlet />
                    <MiniFooter />
                </main>
            </div>
        </div>
    );
}
