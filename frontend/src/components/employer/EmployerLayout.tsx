import { Outlet } from 'react-router-dom';
import { EmployerTopNav } from './EmployerTopNav';
import { EmployerSidebar } from './EmployerSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';

/**
 * EmployerLayout – wraps all /employer/* routes.
 * Layout: TopNav (full width sticky) + Sidebar (left) + main content (<Outlet />).
 * Completely separate from the public Header/Footer shell.
 */
export function EmployerLayout() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Scroll progress bar */}
            <ScrollProgress />

            {/* Top Nav – sticky, full width */}
            <EmployerTopNav />

            {/* Content area: sidebar + page outlet */}
            <div className="flex flex-1 min-h-0">
                <EmployerSidebar />
                <main className="flex-1 min-w-0 overflow-y-auto flex flex-col relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
