import { Outlet } from 'react-router-dom';
import { CandidateTopNav } from './CandidateTopNav';
import { CandidateSidebar } from './CandidateSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { MiniFooter } from '@/components/layout/MiniFooter';

/**
 * Candidate Layout – wraps all /candidate/* routes.
 * Layout: TopNav (full width sticky) + Sidebar (left) + main content (<Outlet />).
 */
export function CandidateLayout() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <ScrollProgress />
            <CandidateTopNav />
            <div className="flex flex-1 min-h-0">
                <CandidateSidebar />
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
