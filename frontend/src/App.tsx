import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetailPage';
import Auth from '@/pages/Auth';
import CompanyDetail from '@/pages/CompanyDetailPage';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Pricing from '@/pages/Pricing';
import FAQ from '@/pages/FAQ';
import { AuroraBackground } from '@/components/shared/AuroraBackground';
import { useUiStore, UiState } from '@/store/uiStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute, PublicRoute } from '@/components/layout/RouteGuards';

// Employer area – own layout shell (no public Header/Footer)
import { EmployerLayout } from '@/components/employer/EmployerLayout';
import EmployerDashboard from '@/pages/employer/EmployerDashboard';
import PostJob from '@/pages/employer/PostJob';
import ManageJobs from '@/pages/employer/ManageJobs';
import {
    EmployerCompanyPage, EmployerSettingsPage,
    EmployerCandidatesPage, EmployerCVSearchPage,
    EmployerInterviewsPage, EmployerMessagesPage, EmployerAnalyticsPage,
    EmployerCampaignsPage, EmployerSubscriptionPage, EmployerSupportPage,
    EmployerJobCandidatesPage,
} from '@/pages/employer/EmployerStubPages';

export default function App() {
    const theme = useUiStore((state: UiState) => state.theme);
    const toggleCommand = useUiStore((state: UiState) => state.toggleCommand);

    // Lenis smooth scroll
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        return () => lenis.destroy();
    }, []);

    // Dark mode class sync
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Ctrl+K command palette
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleCommand();
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [toggleCommand]);

    return (
        <BrowserRouter>
            <Routes>
                {/* ── Employer area: own shell, no public header/footer ── */}
                <Route path="/employer" element={<EmployerLayout />}>
                    <Route index element={<Navigate to="/employer/dashboard" replace />} />
                    <Route path="dashboard" element={<EmployerDashboard />} />
                    <Route path="company" element={<EmployerCompanyPage />} />
                    <Route path="settings" element={<EmployerSettingsPage />} />
                    <Route path="jobs" element={<ManageJobs />} />
                    <Route path="jobs/create" element={<PostJob />} />
                    <Route path="jobs/:id/edit" element={<PostJob />} />
                    <Route path="jobs/:id/candidates" element={<EmployerJobCandidatesPage />} />
                    <Route path="candidates" element={<EmployerCandidatesPage />} />
                    <Route path="cv-search" element={<EmployerCVSearchPage />} />
                    <Route path="interviews" element={<EmployerInterviewsPage />} />
                    <Route path="messages" element={<EmployerMessagesPage />} />
                    <Route path="analytics" element={<EmployerAnalyticsPage />} />
                    <Route path="campaigns" element={<EmployerCampaignsPage />} />
                    <Route path="subscription" element={<EmployerSubscriptionPage />} />
                    <Route path="support" element={<EmployerSupportPage />} />
                </Route>

                {/* ── Public site: aurora + header + footer ── */}
                <Route path="*" element={
                    <div className="min-h-screen flex flex-col relative font-sans">
                        <AuroraBackground />
                        <Toaster position="top-center" />
                        <Header />
                        <main className="flex-1 w-full relative z-10">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/jobs" element={<Jobs />} />
                                <Route path="/jobs/:id" element={<JobDetail />} />
                                <Route path="/companies/:id" element={<CompanyDetail />} />
                                <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path="/about" element={<About />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/faq" element={<FAQ />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                } />
            </Routes>
        </BrowserRouter>
    );
}
