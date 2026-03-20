import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { EmployerSidebar } from './EmployerSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { MiniFooter } from '@/components/layout/MiniFooter';

/**
 * EmployerLayout – wraps all /employer/* routes.
 * Uses the same Header as the public site (glass pill, fixed top).
 */
export function EmployerLayout() {
    return (
        <div className="h-screen flex flex-col bg-slate-50/30">
            <ScrollProgress />

            <Header />
            {/* pt to offset fixed header */}
            <div className="flex flex-1 min-h-0 pt-[112px]">
                <EmployerSidebar />
                <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
                    <Outlet />
                    <MiniFooter />
                </main>
            </div>
        </div>
    );
}
