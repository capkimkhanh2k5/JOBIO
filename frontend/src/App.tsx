import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import { useUiStore, UiState } from '@/store/uiStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute, PublicRoute, NotFoundRedirect, RoleBasedRedirect } from '@/components/layout/RouteGuards';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { SuspenseFallback } from '@/components/shared/PageSkeleton';

const Home = lazy(() => import('@/pages/Home'));
const CandidateProfile = lazy(() => import('@/pages/Profile'));
const Jobs = lazy(() => import('@/pages/Jobs'));
const Companies = lazy(() => import('@/pages/Companies'));
const JobDetail = lazy(() => import('@/pages/JobDetailPage'));
const Auth = lazy(() => import('@/pages/Auth'));
const CompanyDetail = lazy(() => import('@/pages/CompanyDetailPage'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogDetail = lazy(() => import('@/pages/BlogDetailPage'));
const HRSolutions = lazy(() => import('@/pages/HRSolutions'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Cookie = lazy(() => import('@/pages/Cookie'));

// Company area – own layout shell (no public Header/Footer)
const CompanyLayout = lazy(() => import('@/components/company/CompanyLayout').then((module) => ({ default: module.CompanyLayout })));
const CompanyDashboard = lazy(() => import('@/pages/company/CompanyDashboard'));
const PostJob = lazy(() => import('@/pages/company/PostJob'));
const ManageJobs = lazy(() => import('@/pages/company/ManageJobs'));
const ManageCandidates = lazy(() => import('@/pages/company/ManageCandidates'));
const CompanySupportPage = lazy(() => import('@/pages/company/Support/CompanySupportPage'));
const CompanyAnalyticsPage = lazy(() => import('@/pages/company/CompanyAnalyticsPage').then((module) => ({ default: module.CompanyAnalyticsPage })));
const CompanySettingsPage = lazy(() => import('@/pages/company/CompanySettingsPage').then((module) => ({ default: module.CompanySettingsPage })));
const CandidateSettingsPage = lazy(() => import('@/pages/candidate/CandidateSettingsPage'));
const PaymentResultPage = lazy(() => import('@/pages/company/Billing/PaymentResult'));
const BillingDashboard = lazy(() => import('@/pages/company/Billing/BillingDashboard'));
const CompanyInterviewsPage = lazy(() => import('@/pages/company/CompanyInterviews'));
const CompanyProfile = lazy(() => import('@/pages/company/CompanyProfile'));

// Candidate area
const CandidateLayout = lazy(() => import('@/components/candidate/CandidateLayout').then((module) => ({ default: module.CandidateLayout })));
const CandidateDashboard = lazy(() => import('@/pages/candidate/CandidateDashboard'));
const CVManager = lazy(() => import('@/pages/candidate/CVManager'));
const SuggestedJobs = lazy(() => import('@/pages/candidate/SuggestedJobs'));
const MyApplications = lazy(() => import('@/pages/candidate/MyApplications'));
const SavedJobs = lazy(() => import('@/pages/candidate/SavedJobs'));
const CandidateInterviews = lazy(() => import('@/pages/candidate/Interviews'));
const CandidateNotifications = lazy(() => import('@/pages/candidate/CandidateNotifications'));
const CompanyNotifications = lazy(() => import('@/pages/company/CompanyNotifications'));

const UserBlogManagement = lazy(() => import('@/pages/shared/BlogManagement'));
const CreateBlogPost = lazy(() => import('@/pages/shared/CreateBlogPost'));

// Admin area
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const SystemSettings = lazy(() => import('@/pages/admin/SystemSettings'));
const Moderation = lazy(() => import('@/pages/admin/Moderation'));
const BlogManagement = lazy(() => import('@/pages/admin/BlogManagement'));
const FinancialManagement = lazy(() => import('@/pages/admin/FinancialManagement'));
const JobMarketplace = lazy(() => import('@/pages/admin/JobMarketplace'));
const ViolationReports = lazy(() => import('@/pages/admin/ViolationReports'));
const MasterData = lazy(() => import('@/pages/admin/MasterData'));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotifications'));

// Inner component – must live inside <BrowserRouter> to access router hooks
function AppInner() {
    const theme = useUiStore((state: UiState) => state.theme);
    const toggleCommand = useUiStore((state: UiState) => state.toggleCommand);
    const location = useLocation();
    const lenisRef = useRef<Lenis | null>(null);

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
        lenisRef.current = lenis;

        let rafId: number;
        function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);
        return () => {
            if (lenisRef.current === lenis) {
                lenisRef.current = null;
            }
            lenis.destroy();
            cancelAnimationFrame(rafId);
        };
    }, [isDashboard]);

    useLayoutEffect(() => {
        const scrollToTop = () => {
            const lenis = lenisRef.current;
            if (lenis) {
                lenis.stop();
                lenis.scrollTo(0, { immediate: true, force: true });
                lenis.start();
            }

            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };

        scrollToTop();
        const frameId = requestAnimationFrame(scrollToTop);

        return () => cancelAnimationFrame(frameId);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const handleCustomScroll = () => {
            const lenis = lenisRef.current;
            if (lenis) {
                lenis.scrollTo(0, { duration: 1.2 });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('app:scroll-to-top', handleCustomScroll);
        return () => window.removeEventListener('app:scroll-to-top', handleCustomScroll);
    }, []);

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
                        <Route path="interviews" element={<CandidateInterviews />} />

                        <Route path="notifications" element={<CandidateNotifications />} />
                        <Route path="settings" element={<CandidateSettingsPage />} />

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
                        <Route path="analytics" element={<Navigate to="/admin/dashboard" replace />} />
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
                        <Route path="cv-search" element={<Navigate to="/company/jobs" replace />} />
                        <Route path="jobs/:id/candidates" element={<ManageCandidates />} />
                        <Route path="candidates" element={<ManageCandidates />} />
                        <Route path="interviews" element={<CompanyInterviewsPage />} />

                        <Route path="analytics" element={<CompanyAnalyticsPage />} />
                        <Route path="notifications" element={<CompanyNotifications />} />
                        <Route path="subscription" element={<Navigate to="/pricing" replace />} />
                        <Route path="billing" element={<BillingDashboard />} />
                        <Route path="payment-result" element={<PaymentResultPage />} />
                        <Route path="support" element={<CompanySupportPage />} />
                        <Route path="blog" element={<UserBlogManagement />} />
                        <Route path="blog/create" element={<CreateBlogPost />} />
                        <Route path="blog/edit/:slug" element={<CreateBlogPost />} />
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
                                        <Route path="/jobs" element={<Jobs />} />
                                        <Route path="/jobs/:id" element={<JobDetail />} />
                                        <Route path="/companies" element={<Companies />} />
                                        <Route path="/companies/:id" element={<CompanyDetail />} />
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
