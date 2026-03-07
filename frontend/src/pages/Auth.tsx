import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { VerifyEmailView } from '../components/auth/VerifyEmailView';
import { TwoFactorView } from '../components/auth/TwoFactorView';
import { Link, useSearchParams } from 'react-router-dom';

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
                    onRegistered={(email: string) => { setEmail(email); setView('verify-email'); }}
                />;
            case 'forgot-password':
                return <ForgotPasswordForm
                    onBackToLogin={() => setView('login')}
                    onEmailSent={(email: string) => { setEmail(email); setView('reset-password'); }}
                />;
            case 'reset-password':
                return <ResetPasswordForm email={email} onSuccess={() => setView('login')} />;
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
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 py-12 md:py-20 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, oklch(0.92 0.06 265) 0%, oklch(0.95 0.04 282) 45%, oklch(0.97 0.02 218) 100%)'
        }}>
            {/* Blobs */}
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, oklch(0.68 0.22 272 / 0.18) 0%, transparent 68%)' }} />
            <div className="absolute -bottom-24 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, oklch(0.72 0.18 202 / 0.15) 0%, transparent 68%)' }} />
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.14]" style={{
                backgroundImage: 'radial-gradient(circle, oklch(0.45 0.20 265) 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                {/* Brand mark */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-block text-2xl font-black bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                        JOBIO
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                    {/* Card header accent */}
                    <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-primary to-cyan-500" />

                    <div className="p-7 md:p-9">
                        {/* Title */}
                        <div className="mb-7 text-center">
                            <AnimatePresence mode="wait">
                                <motion.h1
                                    key={`title-${view}`}
                                    initial={{ y: -8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 8, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="text-2xl md:text-3xl font-bold text-gray-900 mb-1"
                                >
                                    {title}
                                </motion.h1>
                            </AnimatePresence>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={`desc-${view}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm text-gray-500"
                                >
                                    {view === 'verify-email' ? `Chúng tôi đã gửi mã đến ${email}` : desc}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Form area */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                {renderView()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer text */}
                <div className="mt-6 text-center text-xs text-gray-400 px-4">
                    Bằng cách tiếp tục, bạn đồng ý với{' '}
                    <a href="#" className="hover:text-primary transition-colors underline underline-offset-2">Điều khoản dịch vụ</a>
                    {' '}và{' '}
                    <a href="#" className="hover:text-primary transition-colors underline underline-offset-2">Chính sách bảo mật</a>.
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
