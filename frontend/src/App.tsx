import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetailPage';
import { AuroraBackground } from '@/components/shared/AuroraBackground';
import { useUiStore } from '@/store/uiStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
    const theme = useUiStore((state) => state.theme);
    const toggleCommand = useUiStore((state) => state.toggleCommand);

    useEffect(() => {
        // Lenis Smooth Scroll setup
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

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Lắng nghe phím tắt Ctrl+K để mở palette
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleCommand();
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [toggleCommand]);

    return (
        <BrowserRouter>
            <div className="min-h-screen flex flex-col relative font-sans">
                <AuroraBackground />
                <Toaster position="top-center" />
                <Header />
                <main className="flex-1 w-full relative z-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/jobs" element={<Jobs />} />
                        <Route path="/jobs/:id" element={<JobDetail />} />
                        <Route path="/profile" element={<Profile />} />
                        {/* Các routes khác sẽ được thêm tại đây */}
                    </Routes>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    );
}
