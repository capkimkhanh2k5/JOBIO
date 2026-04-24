import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { VerifyEmailView } from '../components/auth/VerifyEmailView';
import { TwoFactorView } from '../components/auth/TwoFactorView';
import { useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/shared/Logo';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' | '2fa';

const viewTitles: Record<AuthView, { title: string; desc: string }> = {
    'login': { title: 'Chào mừng trở lại', desc: 'Tìm kiếm cơ hội nghề nghiệp tốt nhất cùng JOBIO' },
    'register': { title: 'Tạo tài khoản mới', desc: 'Bắt đầu hành trình tìm việc mơ ước của bạn' },
    'forgot-password': { title: 'Khôi phục mật khẩu', desc: 'Nhập email của bạn để nhận hướng dẫn' },
    'reset-password': { title: 'Đặt lại mật khẩu', desc: 'Chọn mật khẩu mới an toàn hơn' },
    'verify-email': { title: 'Xác minh Email', desc: 'Chúng tôi đã gửi mã xác nhận đến email của bạn' },
    '2fa': { title: 'Xác minh 2FA', desc: 'Nhập mã xác thực từ ứng dụng của bạn' },
};

const Auth: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialMode = (searchParams.get('mode') as AuthView) || 'login';
    const [view, setView] = useState<AuthView>(initialMode);
    const [email, setEmail] = useState('');

    const renderView = () => {
        switch (view) {
            case 'login':
                return <LoginForm
                    onSwitchToRegister={() => setView('register')}
                    onForgotPassword={() => setView('forgot-password')}
                    onRequire2FA={(email: string) => { setEmail(email); setView('2fa'); }}
                />;
            case 'register':
                return <RegisterForm
                    onSwitchToLogin={() => setView('login')}
                    onRegistered={(email: string) => { setEmail(email); setView('login'); }}
                />;
            case 'forgot-password':
                return <ForgotPasswordForm
                    onBackToLogin={() => setView('login')}
                    onEmailSent={(email: string) => { setEmail(email); setView('reset-password'); }}
                />;
            case 'reset-password':
                return <ResetPasswordForm
                    email={email}
                    onSuccess={() => setView('login')}
                    onBackToForgot={() => {
                        setEmail('');
                        setView('forgot-password');
                    }}
                />;
            case 'verify-email':
                return <VerifyEmailView email={email} onVerified={() => setView('login')} />;
            case '2fa':
                return <TwoFactorView email={email} onSuccess={() => { }} />;
            default:
                return <LoginForm
                    onSwitchToRegister={() => setView('register')}
                    onForgotPassword={() => setView('forgot-password')}
                    onRequire2FA={(email: string) => { setEmail(email); setView('2fa'); }}
                />;
        }
    };

    const { title, desc } = viewTitles[view];

    return (
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 bg-white">
            {/* Left side: Premium Branding Panel (Hidden on Mobile) */}
            <div
                className="hidden lg:flex flex-col relative justify-between px-12 pb-12 pt-36 overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, oklch(0.92 0.06 265) 0%, oklch(0.95 0.04 280) 30%, oklch(0.97 0.02 220) 60%, #f8faff 100%)'
                }}
            >
                {/* Background Layer 1: Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-32 w-[560px] h-[560px] rounded-full"
                        style={{ background: 'radial-gradient(circle at 40% 40%, oklch(0.68 0.22 275 / 0.32) 0%, transparent 65%)' }} />
                    <div className="absolute top-4 -right-24 w-[480px] h-[480px] rounded-full"
                        style={{ background: 'radial-gradient(circle at 60% 30%, oklch(0.72 0.18 205 / 0.28) 0%, transparent 65%)' }} />
                    <div className="absolute -bottom-16 left-[35%] w-[400px] h-[400px] rounded-full"
                        style={{ background: 'radial-gradient(circle at 50% 60%, oklch(0.76 0.15 340 / 0.22) 0%, transparent 65%)' }} />
                </div>
                {/* Background Layer 2: Dot grid */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, oklch(0.50 0.20 265 / 0.15) 1.5px, transparent 1.5px)`,
                        backgroundSize: '24px 24px',
                    }}
                />
                {/* Background Layer 3: Diagonal lines */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            oklch(0.5 0.20 265) 0px,
                            oklch(0.5 0.20 265) 1px,
                            transparent 1px,
                            transparent 24px
                        )`,
                    }}
                />
                {/* Background Layer 4: Radial fade */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(255,255,255,0.4) 0%, transparent 100%)' }}
                />

                {/* Top Logo */}
                <div className="relative z-10 flex items-center h-8">
                    <Logo
                        to="/"
                        imageClassName="h-16 w-auto object-contain drop-shadow"
                        textClassName="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter"
                    />
                </div>

                {/* Main Content middle */}
                <div className="relative z-10 max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-primary/20 text-xs font-semibold text-primary mb-6 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Nền tảng tuyển dụng #1
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight mb-6 text-slate-900">
                        Tương lai của tuyển dụng bắt đầu từ đây.
                    </h2>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
                        Hàng nghìn doanh nghiệp và nhân tài đang tin tưởng JOBIO để kết nối, xây dựng đội ngũ và phát triển sự nghiệp.
                    </p>

                    {/* Stats/Avatars */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0 relative z-10 shadow-sm">
                                <img src="https://i.pravatar.cc/100?img=33" alt="User LD" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0 relative z-20 shadow-sm">
                                <img src="https://i.pravatar.cc/100?img=47" alt="User MT" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0 relative z-30 shadow-sm">
                                <img src="https://i.pravatar.cc/100?img=12" alt="User KN" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center shrink-0 relative z-40 shadow-sm">
                                <span className="text-xs font-bold text-white">9k+</span>
                            </div>
                        </div>
                        <div className="text-sm">
                            <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                                ★★★★★
                            </div>
                            <span className="text-slate-600 font-medium">Được đánh giá 4.9/5 bởi 10,000+ người dùng</span>
                        </div>
                    </div>
                </div>

                {/* Footer bottom */}
                <div className="relative z-10 text-sm text-slate-500 font-medium cursor-default">
                    © {new Date().getFullYear()} JOBIO Inc. Vận hành bởi sức mạnh công nghệ.
                </div>
            </div>

            {/* Right side: Form Area */}
            <div className="flex flex-col justify-center items-center px-6 pb-6 pt-28 sm:px-12 sm:pb-12 sm:pt-36 relative flex-1 bg-white">

                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-lg xl:max-w-xl mx-auto pt-16 lg:pt-0"
                >
                    <div className="mb-8 text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                            {title}
                        </h1>
                        <p className="text-[15px] font-medium text-slate-500">
                            {view === 'verify-email' ? `Chúng tôi đã gửi mã đến ${email}` : desc}
                        </p>
                    </div>

                    <div className="relative z-10">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                                transition={{ duration: 0.25 }}
                            >
                                {renderView()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Form Footer Text */}
                    {['login', 'register'].includes(view) && (
                        <div className="mt-8 text-center text-[13px] font-medium text-slate-400 sm:whitespace-nowrap">
                            Bằng cách tiếp tục, bạn đồng ý với{' '}
                            <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors underline underline-offset-2">Điều khoản dịch vụ</a>
                            {' '}và{' '}
                            <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors underline underline-offset-2">Chính sách bảo mật</a> của chúng tôi.
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Auth;
