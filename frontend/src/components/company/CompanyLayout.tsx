import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { CompanySidebar } from './CompanySidebar';
import { ScrollProgress } from '@/components/shared/ScrollProgress';
import { MiniFooter } from '@/components/layout/MiniFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

/**
 * CompanyLayout – wraps all /company/* routes.
 * Uses the same Header as the public site (glass pill, fixed top).
 * Editorial Luxury design system — warm dashboard surface.
 */
export function CompanyLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <ScrollProgress />

            <Header />
            {/* pt to offset fixed header */}
            <div className="flex flex-1 pt-[84px] pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
                <CompanySidebar />
                <main className="flex-1 flex flex-col min-w-0 w-full dashboard-surface">
                    <div className="flex-1 w-full">
                        <Outlet key={location.pathname} />
                    </div>
                    <div className="mt-auto shrink-0 w-full">
                        <MiniFooter />
                    </div>
                </main>
            </div>
            <MobileBottomNav />
        </div>
    );
}
