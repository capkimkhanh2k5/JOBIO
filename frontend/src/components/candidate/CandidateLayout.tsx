import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CandidateSidebar } from './CandidateSidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { MiniFooter } from '@/components/layout/MiniFooter';

/**
 * Candidate Layout – wraps all /candidate/* routes.
 * Uses the same Header as the public site (glass pill, fixed top).
 */
export function CandidateLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <ScrollProgress />

            <Header />
            {/* pt to offset fixed header */}
            <div className="flex flex-1 pt-[112px]">
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
