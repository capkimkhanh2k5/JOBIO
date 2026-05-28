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
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
            <ScrollProgress />

            <Header />
            {/* pt to offset fixed header */}
            <div className="flex flex-1 pt-[112px]">
                <CandidateSidebar />
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
