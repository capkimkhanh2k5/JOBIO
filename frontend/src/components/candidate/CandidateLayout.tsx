import { Outlet } from 'react-router-dom';
import { CandidateTopNav } from './CandidateTopNav';
import { CandidateSidebar } from './CandidateSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';

/**
 * Candidate Layout – wraps all /candidate/* routes.
 * Layout: TopNav (full width sticky) + Sidebar (left) + main content (<Outlet />).
 */
export function CandidateLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <ScrollProgress />
            <CandidateTopNav />
            <div className="flex flex-1 min-h-0">
                <CandidateSidebar />
                <main className="flex-1 min-w-0 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
