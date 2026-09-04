import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { VerifyEmailView } from '../components/auth/VerifyEmailView';
import { TwoFactorView } from '../components/auth/TwoFactorView';
import { useSearchParams, Link } from 'react-router-dom';
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
    const [rememberMe, setRememberMe] = useState(false);
    const [twoFactorChallengeId, setTwoFactorChallengeId] = useState('');

    const renderView = () => {
        switch (view) {
            case 'login':
                return <LoginForm
                    onSwitchToRegister={() => setView('register')}
                    onForgotPassword={() => setView('forgot-password')}
                    onRequire2FA={(email: string, rememberMe: boolean, challengeId: string) => {
                        setEmail(email);
                        setRememberMe(rememberMe);
                        setTwoFactorChallengeId(challengeId);
                        setView('2fa');
                    }}
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
                return <TwoFactorView
                    email={email}
                    rememberMe={rememberMe}
                    challengeId={twoFactorChallengeId}
                    onSuccess={() => { }}
                />;
            default:
                return <LoginForm
                    onSwitchToRegister={() => setView('register')}
                    onForgotPassword={() => setView('forgot-password')}
                    onRequire2FA={(email: string, rememberMe: boolean, challengeId: string) => {
                        setEmail(email);
                        setRememberMe(rememberMe);
                        setTwoFactorChallengeId(challengeId);
                        setView('2fa');
                    }}
                />;
        }
    };

    const { title, desc } = viewTitles[view];

    return (
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 bg-background">
            {/* Left side: Editorial Luxury Branding Panel */}
            <div
                className="hidden lg:flex flex-col relative justify-between px-12 pb-12 pt-36 overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, oklch(0.16 0.04 175) 0%, oklch(0.13 0.03 175) 40%, oklch(0.11 0.02 175) 100%)'
                }}
            >
                {/* Noise texture */}
                <div className="absolute inset-0 noise-texture opacity-40 pointer-events-none" />

                {/* Warm teal glow */}
                <div className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 40% 40%, oklch(0.45 0.14 175 / 0.25) 0%, transparent 65%)' }} />
                {/* Gold glow */}
                <div className="absolute top-4 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 60% 30%, oklch(0.65 0.12 85 / 0.15) 0%, transparent 65%)' }} />

                {/* Diagonal accent lines */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            oklch(0.65 0.14 175) 0px,
                            oklch(0.65 0.14 175) 1px,
                            transparent 1px,
                            transparent 24px
                        )`,
                    }}
                />

                {/* Top Logo */}
                <div className="relative z-10 flex items-center h-8">
                    <Logo
                        to="/"
                        imageClassName="h-16 w-auto object-contain drop-shadow"
                        textClassName="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 tracking-tighter"
                    />
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/[0.06] backdrop-blur-sm border border-white/[0.08] text-xs font-bold text-[var(--brand-teal-light)] uppercase tracking-[0.15em] mb-6">
                        <span className="w-2 h-2 rounded-full bg-[var(--brand-teal-light)] animate-pulse" />
                        Nền tảng tuyển dụng #1
                    </div>
                    <h2
                        className="text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight mb-6 text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Tương lai của tuyển dụng bắt đầu từ đây.
                    </h2>
                    <p className="text-lg text-white/40 font-light leading-relaxed mb-10">
                        Hàng nghìn doanh nghiệp và nhân tài đang tin tưởng JOBIO để kết nối, xây dựng đội ngũ và phát triển sự nghiệp.
                    </p>

                    {/* Stats/Avatars */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 bg-card/10 overflow-hidden shrink-0 relative z-10">
                                <img src="https://i.pravatar.cc/100?img=33" alt="User LD" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 bg-card/10 overflow-hidden shrink-0 relative z-20">
                                <img src="https://i.pravatar.cc/100?img=47" alt="User MT" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 bg-card/10 overflow-hidden shrink-0 relative z-30">
                                <img src="https://i.pravatar.cc/100?img=12" alt="User KN" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shrink-0 relative z-40">
                                <span className="text-xs font-bold text-white">9k+</span>
                            </div>
                        </div>
                        <div className="text-sm">
                            <div className="flex items-center gap-1 text-[var(--brand-gold)] mb-0.5">
                                ★★★★★
                            </div>
                            <span className="text-white/40 font-medium">Đánh giá 4.9/5 bởi 10,000+ người dùng</span>
                        </div>
                    </div>
                </div>

                {/* Footer bottom */}
                <div className="relative z-10 text-sm text-white/20 font-medium cursor-default">
                    © {new Date().getFullYear()} JOBIO Inc. Vận hành bởi sức mạnh công nghệ.
                </div>
            </div>

            {/* Right side: Form Area */}
            <div className="flex flex-col justify-center items-center px-6 pb-6 pt-28 sm:px-12 sm:pb-12 sm:pt-36 relative flex-1 bg-card">

                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-lg xl:max-w-xl mx-auto pt-16 lg:pt-0"
                >
                    <div className="mb-8 text-left">
                        <h1
                            className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {title}
                        </h1>
                        <p className="text-[15px] font-medium text-muted-foreground">
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
                        <div className="mt-8 text-center text-[13px] font-medium text-muted-foreground/60 sm:whitespace-nowrap">
                            Bằng cách tiếp tục, bạn đồng ý với{' '}
                            <Link to="/terms" className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2">Điều khoản dịch vụ</Link>
                            {' '}và{' '}
                            <Link to="/privacy" className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2">Chính sách bảo mật</Link> của chúng tôi.
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Auth;
