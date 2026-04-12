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
        <div className="min-h-screen flex flex-col bg-slate-50/30">
            <ScrollProgress />
            <Header />
            <div className="flex flex-1 pt-[112px]">
                <AdminSidebar />
                <main className="flex-1 flex flex-col min-w-0 w-full">
                    <div className="flex-1 w-full">
                        <Outlet />
                    </div>
                    <div className="mt-auto shrink-0 w-full">
                        <MiniFooter />
                    </div>
                </main>
            </div>
        </div>
    );
}
