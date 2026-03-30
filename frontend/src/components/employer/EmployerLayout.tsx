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
        <div className="min-h-screen flex flex-col bg-slate-50/30 font-sans">
            <ScrollProgress />

            <Header />
            {/* pt to offset fixed header */}
            <div className="flex flex-1 pt-[112px]">
                <EmployerSidebar />
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
