import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Home from '@/pages/Home';
import CandidateProfile from '@/pages/Profile';
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
import HRSolutions from '@/pages/HRSolutions';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Cookie from '@/pages/Cookie';
import { useUiStore, UiState } from '@/store/uiStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { PublicRoute, ProtectedRoute } from '@/components/layout/RouteGuards';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { SuspenseFallback } from '@/components/shared/PageSkeleton';

// Employer area – own layout shell (no public Header/Footer)
import { EmployerLayout } from '@/components/employer/EmployerLayout';
import EmployerDashboard from '@/pages/employer/EmployerDashboard';
import PostJob from '@/pages/employer/PostJob';
import ManageJobs from '@/pages/employer/ManageJobs';
import ManageCandidates from '@/pages/employer/ManageCandidates';
import {
    EmployerAnalyticsPage,
    EmployerSupportPage,
} from '@/pages/employer/EmployerStubPages';
import { EmployerSettingsPage } from '@/pages/employer/EmployerSettingsPage';
import CandidateSettingsPage from '@/pages/candidate/CandidateSettingsPage';
import PlansPage from '@/pages/employer/Billing/Plans';
import CheckoutPage from '@/pages/employer/Billing/Checkout';
import PaymentResultPage from '@/pages/employer/Billing/PaymentResult';
import BillingDashboard from '@/pages/employer/Billing/BillingDashboard';
import MessagesPage from '@/pages/Messages';
import EmployerCVSearch from '@/pages/employer/CVSearch';
import EmployerCampaigns from '@/pages/employer/Campaigns';
import EmployerInterviewsPage from '@/pages/employer/Interviews';
import CompanyProfile from '@/pages/employer/CompanyProfile';
import EmployerReferrals from '@/pages/employer/Referrals';
import JobMatching from '@/pages/employer/JobMatching';

// Candidate area
import { CandidateLayout } from '@/components/candidate/CandidateLayout';
import CandidateDashboard from '@/pages/candidate/CandidateDashboard';
import CVManager from '@/pages/candidate/CVManager';
import MyApplications from '@/pages/candidate/MyApplications';
import SavedJobs from '@/pages/candidate/SavedJobs';
import JobAlerts from '@/pages/candidate/JobAlerts';
import CandidateInterviews from '@/pages/candidate/Interviews';
import NotificationsPage from '@/pages/Notifications';
import MyReviews from '@/pages/candidate/MyReviews';
import ConnectionsPage from '@/pages/candidate/Connections';
import MatchingJobsPage from '@/pages/candidate/MatchingJobsPage';
import TestCatalogue from '@/pages/candidate/AssessmentTests/TestCatalogue';
import TakeTest from '@/pages/candidate/AssessmentTests/TakeTest';
import TestResult from '@/pages/candidate/AssessmentTests/TestResult';
import SearchHistory from '@/pages/candidate/SearchHistory';

// Admin area
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import SystemSettings from '@/pages/admin/SystemSettings';
import Moderation from '@/pages/admin/Moderation';
import BlogManagement from '@/pages/admin/BlogManagement';
import EmailTemplates from '@/pages/admin/EmailTemplates';

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
            <ErrorBoundary>
                <Suspense fallback={<SuspenseFallback />}>
                    <Toaster position="top-center" />
                    <Routes>
                        {/* ── Candidate area ── */}
                        <Route path="/candidate" element={<CandidateLayout />}>
                            <Route index element={<Navigate to="/candidate/dashboard" replace />} />
                            <Route path="dashboard" element={<CandidateDashboard />} />
                            <Route path="profile" element={<CandidateProfile />} />
                            <Route path="cv" element={<CVManager />} />
                            <Route path="applications" element={<MyApplications />} />
                            <Route path="saved" element={<SavedJobs />} />
                            <Route path="alerts" element={<JobAlerts />} />
                            <Route path="reviews" element={<MyReviews />} />
                            <Route path="interviews" element={<CandidateInterviews />} />
                            <Route path="connections" element={<ConnectionsPage />} />
                            <Route path="messages" element={<MessagesPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="settings" element={<CandidateSettingsPage />} />
                            <Route path="search-history" element={<SearchHistory />} />
                        </Route>

                        {/* ── Admin area ── */}
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="users" element={<UserManagement />} />
                            <Route path="moderation" element={<Moderation />} />
                            <Route path="blog" element={<BlogManagement />} />
                            <Route path="email-templates" element={<EmailTemplates />} />
                            <Route path="settings" element={<SystemSettings />} />
                        </Route>

                        {/* ── Employer area: own shell, no public header/footer ── */}
                        <Route path="/employer" element={<EmployerLayout />}>
                            <Route index element={<Navigate to="/employer/dashboard" replace />} />
                            <Route path="dashboard" element={<EmployerDashboard />} />
                            <Route path="company" element={<CompanyProfile />} />
                            <Route path="settings" element={<EmployerSettingsPage />} />
                            <Route path="jobs" element={<ManageJobs />} />
                            <Route path="jobs/create" element={<PostJob />} />
                            <Route path="jobs/:id/edit" element={<PostJob />} />
                            {/* Legacy route redirects */}
                            <Route path="post-job" element={<Navigate to="/employer/jobs/create" replace />} />
                            <Route path="manage-jobs" element={<Navigate to="/employer/jobs" replace />} />
                            <Route path="jobs/:id/matching" element={<JobMatching />} />
                            <Route path="jobs/:id/candidates" element={<ManageCandidates />} />
                            <Route path="candidates" element={<ManageCandidates />} />
                            <Route path="cv-search" element={<EmployerCVSearch />} />
                            <Route path="interviews" element={<EmployerInterviewsPage />} />
                            <Route path="messages" element={<MessagesPage />} />
                            <Route path="analytics" element={<EmployerAnalyticsPage />} />
                            <Route path="campaigns" element={<EmployerCampaigns />} />
                            <Route path="referrals" element={<EmployerReferrals />} />
                            <Route path="subscription" element={<PlansPage />} />
                            <Route path="billing" element={<BillingDashboard />} />
                            <Route path="checkout" element={<CheckoutPage />} />
                            <Route path="payment-result" element={<PaymentResultPage />} />
                            <Route path="support" element={<EmployerSupportPage />} />

                            <Route path="notifications" element={<NotificationsPage />} />
                        </Route>

                        {/* ── Public site: aurora + header + footer ── */}
                        <Route path="*" element={
                            <div className="min-h-screen flex flex-col relative font-sans bg-white">
                                <Header />
                                <main className="flex-1 w-full relative z-10">
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/jobs" element={<Jobs />} />
                                        <Route path="/jobs/matching" element={<ProtectedRoute><MatchingJobsPage /></ProtectedRoute>} />
                                        <Route path="/jobs/:id" element={<JobDetail />} />
                                        <Route path="/companies" element={<Companies />} />
                                        <Route path="/companies/:id" element={<CompanyDetail />} />
                                        <Route path="/assessment-tests" element={<TestCatalogue />} />
                                        <Route path="/assessment-tests/:id/take" element={<ProtectedRoute><TakeTest /></ProtectedRoute>} />
                                        <Route path="/assessment-tests/:id/result" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />
                                        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                                        {/* Profile is now under /candidate/profile */}
                                        <Route path="/about" element={<About />} />
                                        <Route path="/contact" element={<Contact />} />
                                        <Route path="/pricing" element={<Pricing />} />
                                        <Route path="/faq" element={<FAQ />} />
                                        <Route path="/blog" element={<Blog />} />
                                        <Route path="/hr-solutions" element={<HRSolutions />} />
                                        <Route path="/terms" element={<Terms />} />
                                        <Route path="/privacy" element={<Privacy />} />
                                        <Route path="/cookie" element={<Cookie />} />
                                    </Routes>
                                </main>
                                <Footer />
                            </div>
                        } />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
