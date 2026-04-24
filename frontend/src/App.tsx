import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Home from '@/pages/Home';
import CandidateProfile from '@/pages/Profile';
import PublicProfile from '@/pages/public/PublicProfile';
import Jobs from '@/pages/Jobs';
import Companies from '@/pages/Companies';
import JobDetail from '@/pages/JobDetailPage';
import Auth from '@/pages/Auth';
import CompanyDetail from '@/pages/CompanyDetailPage';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Pricing from '@/pages/Pricing';
import FAQ from '@/pages/FAQ';
import Blog from '@/pages/Blog';
import BlogDetail from '@/pages/BlogDetailPage';
import HRSolutions from '@/pages/HRSolutions';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Cookie from '@/pages/Cookie';
import { useUiStore, UiState } from '@/store/uiStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute, PublicRoute, NotFoundRedirect, RoleBasedRedirect } from '@/components/layout/RouteGuards';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { SuspenseFallback } from '@/components/shared/PageSkeleton';

// Company area – own layout shell (no public Header/Footer)
import { CompanyLayout } from '@/components/company/CompanyLayout';
import CompanyDashboard from '@/pages/company/CompanyDashboard';
import PostJob from '@/pages/company/PostJob';
import ManageJobs from '@/pages/company/ManageJobs';
import ManageCandidates from '@/pages/company/ManageCandidates';
import CompanySupportPage from '@/pages/company/Support/CompanySupportPage';
import { CompanyAnalyticsPage } from '@/pages/company/CompanyAnalyticsPage';
import { CompanySettingsPage } from '@/pages/company/CompanySettingsPage';
import CandidateSettingsPage from '@/pages/candidate/CandidateSettingsPage';
import PaymentResultPage from '@/pages/company/Billing/PaymentResult';
import BillingDashboard from '@/pages/company/Billing/BillingDashboard';

import CompanyCVSearch from '@/pages/company/CompanyCVSearch';
import CompanyInterviewsPage from '@/pages/company/CompanyInterviews';
import CompanyProfile from '@/pages/company/CompanyProfile';

// Candidate area
import { CandidateLayout } from '@/components/candidate/CandidateLayout';
import CandidateDashboard from '@/pages/candidate/CandidateDashboard';
import CVManager from '@/pages/candidate/CVManager';
import SuggestedJobs from '@/pages/candidate/SuggestedJobs';
import MyApplications from '@/pages/candidate/MyApplications';
import SavedJobs from '@/pages/candidate/SavedJobs';
import JobAlerts from '@/pages/candidate/JobAlerts';
import CandidateInterviews from '@/pages/candidate/Interviews';
import NotificationsPage from '@/pages/Notifications';
import SearchHistory from '@/pages/candidate/SearchHistory';
import UserBlogManagement from '@/pages/shared/BlogManagement';
import CreateBlogPost from '@/pages/shared/CreateBlogPost';
import VerifySocialLink from '@/pages/shared/VerifySocialLink';

// Admin area
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import SystemSettings from '@/pages/admin/SystemSettings';
import Moderation from '@/pages/admin/Moderation';
import BlogManagement from '@/pages/admin/BlogManagement';
import FinancialManagement from '@/pages/admin/FinancialManagement';
import JobMarketplace from '@/pages/admin/JobMarketplace';
import ViolationReports from '@/pages/admin/ViolationReports';
import AdvancedAnalytics from '@/pages/admin/AdvancedAnalytics';
import MasterData from '@/pages/admin/MasterData';
import AdminNotificationsPage from '@/pages/admin/AdminNotifications';

// Inner component – must live inside <BrowserRouter> to access router hooks
function AppInner() {
    const theme = useUiStore((state: UiState) => state.theme);
    const toggleCommand = useUiStore((state: UiState) => state.toggleCommand);
    const location = useLocation();

    // Lenis smooth scroll – only active on public pages
    const isDashboard = location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/candidate') ||
        location.pathname.startsWith('/company');

    useEffect(() => {
        if (isDashboard) return; // native scroll for dashboard areas

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        const rafId = requestAnimationFrame(raf);
        return () => {
            lenis.destroy();
            cancelAnimationFrame(rafId);
        };
    }, [isDashboard]);

    // Dark mode class sync
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme !== 'dark');
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
        <ErrorBoundary>
            <Suspense fallback={<SuspenseFallback />}>
                <Toaster position="top-center" />
                <Routes>
                    {/* ── Candidate area ── */}
                    <Route path="/candidate" element={<ProtectedRoute role="candidate"><CandidateLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/candidate/dashboard" replace />} />
                        <Route path="dashboard" element={<CandidateDashboard />} />
                        <Route path="profile" element={<CandidateProfile />} />
                        <Route path="cv" element={<CVManager />} />
                        <Route path="suggested-jobs" element={<SuggestedJobs />} />
                        <Route path="applications" element={<MyApplications />} />
                        <Route path="saved" element={<SavedJobs />} />
                        <Route path="alerts" element={<JobAlerts />} />
                        <Route path="interviews" element={<CandidateInterviews />} />

                        <Route path="notifications" element={<NotificationsPage />} />
                        <Route path="settings" element={<CandidateSettingsPage />} />
                        <Route path="search-history" element={<SearchHistory />} />
                        <Route path="blog" element={<UserBlogManagement />} />
                        <Route path="blog/create" element={<CreateBlogPost />} />
                        <Route path="blog/edit/:slug" element={<CreateBlogPost />} />
                    </Route>

                    {/* ── Admin area ── */}
                    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="moderation" element={<Moderation />} />
                        <Route path="blog" element={<BlogManagement />} />
                        <Route path="financial" element={<FinancialManagement />} />
                        <Route path="jobs" element={<JobMarketplace />} />
                        <Route path="reports" element={<ViolationReports />} />
                        <Route path="settings" element={<SystemSettings />} />
                        <Route path="notifications" element={<AdminNotificationsPage />} />
                        <Route path="analytics" element={<AdvancedAnalytics />} />
                        <Route path="master-data" element={<MasterData />} />
                    </Route>

                    {/* ── Company area: own shell, no public header/footer ── */}
                    <Route path="/company" element={<ProtectedRoute role="company"><CompanyLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/company/dashboard" replace />} />
                        <Route path="dashboard" element={<CompanyDashboard />} />
                        <Route path="profile" element={<CompanyProfile />} />
                        <Route path="settings" element={<CompanySettingsPage />} />
                        <Route path="jobs" element={<ManageJobs />} />
                        <Route path="jobs/create" element={<PostJob />} />
                        <Route path="jobs/:id/edit" element={<PostJob />} />
                        {/* Legacy route redirects */}
                        <Route path="post-job" element={<Navigate to="/company/jobs/create" replace />} />
                        <Route path="manage-jobs" element={<Navigate to="/company/jobs" replace />} />
                        <Route path="jobs/:id/candidates" element={<ManageCandidates />} />
                        <Route path="candidates" element={<ManageCandidates />} />
                        <Route path="cv-search" element={<CompanyCVSearch />} />
                        <Route path="interviews" element={<CompanyInterviewsPage />} />

                        <Route path="analytics" element={<CompanyAnalyticsPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                        <Route path="subscription" element={<Navigate to="/pricing" replace />} />
                        <Route path="billing" element={<BillingDashboard />} />
                        <Route path="payment-result" element={<PaymentResultPage />} />
                        <Route path="support" element={<CompanySupportPage />} />
                        <Route path="blog" element={<UserBlogManagement />} />
                        <Route path="blog/create" element={<CreateBlogPost />} />
                        <Route path="blog/edit/:slug" element={<CreateBlogPost />} />

                        <Route path="notifications" element={<NotificationsPage />} />
                    </Route>

                    {/* ── Auth page: Standalone no footer ── */}
                    <Route path="/auth" element={
                        <RoleBasedRedirect>
                            <div className="min-h-screen flex flex-col relative font-sans bg-white">
                                <Header />
                                <main className="flex-1 w-full relative z-10 flex flex-col">
                                    <PublicRoute><Auth /></PublicRoute>
                                </main>
                            </div>
                        </RoleBasedRedirect>
                    } />

                    {/* ── Public site: header + footer ── */}
                    <Route path="*" element={
                        <RoleBasedRedirect>
                            <div className="min-h-screen flex flex-col relative font-sans bg-white">
                                <Header />
                                <main className="flex-1 w-full relative z-10">
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/auth/verify-social-link" element={<VerifySocialLink />} />
                                        <Route path="/jobs" element={<Jobs />} />
                                        <Route path="/jobs/:id" element={<JobDetail />} />
                                        <Route path="/companies" element={<Companies />} />
                                        <Route path="/companies/:id" element={<CompanyDetail />} />
                                        <Route path="/profile/:id" element={<PublicProfile />} />
                                        <Route path="/auth" element={<Navigate to="/" replace />} /> {/* Moved to top level */}
                                        {/* Profile is now under /candidate/profile */}
                                        <Route path="/about" element={<About />} />
                                        <Route path="/contact" element={<Contact />} />
                                        <Route path="/pricing" element={<Pricing />} />
                                        <Route path="/faq" element={<FAQ />} />
                                        <Route path="/blog" element={<Blog />} />
                                        <Route path="/blog/:slug" element={<BlogDetail />} />
                                        <Route path="/hr-solutions" element={<HRSolutions />} />
                                        <Route path="/terms" element={<Terms />} />
                                        <Route path="/privacy" element={<Privacy />} />
                                        <Route path="/cookie" element={<Cookie />} />
                                        <Route path="*" element={<NotFoundRedirect />} />
                                    </Routes>
                                </main>
                                <Footer />
                            </div>
                        </RoleBasedRedirect>
                    } />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppInner />
        </BrowserRouter>
    );
}
