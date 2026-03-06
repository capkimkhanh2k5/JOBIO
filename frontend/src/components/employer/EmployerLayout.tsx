import { Outlet } from 'react-router-dom';
import { EmployerTopNav } from './EmployerTopNav';
import { EmployerSidebar } from './EmployerSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { MiniFooter } from '@/components/layout/MiniFooter';

/**
 * EmployerLayout – wraps all /employer/* routes.
 * Layout: TopNav (full width sticky) + Sidebar (left) + main content (<Outlet />).
 * Completely separate from the public Header/Footer shell.
 */
export function EmployerLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Scroll progress bar */}
            <ScrollProgress />

            {/* Top Nav – sticky, full width */}
            <EmployerTopNav />

            {/* Content area: sidebar + page outlet */}
            <div className="flex flex-1 min-h-0">
                <EmployerSidebar />
                <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
                    <div className="flex-1 flex flex-col">
                        <Outlet />
                    </div>
                    <MiniFooter />
                </main>
            </div>
        </div>
    );
}
