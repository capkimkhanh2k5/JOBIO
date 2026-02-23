import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/shared/GlassCard';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { VerifyEmailView } from '../components/auth/VerifyEmailView';
import { TwoFactorView } from '../components/auth/TwoFactorView';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' | '2fa';

const Auth: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
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
                return <ResetPasswordForm
                    email={email}
                    onSuccess={() => setView('login')}
                />;
            case 'verify-email':
                return <VerifyEmailView
                    email={email}
                    onVerified={() => setView('login')}
                />;
            case '2fa':
                return <TwoFactorView
                    email={email}
                    onSuccess={() => { /* Store handled inside */ }}
                />;
            default:
                return <LoginForm
                    onSwitchToRegister={() => setView('register')}
                    onForgotPassword={() => setView('forgot-password')}
                    onRequire2FA={(email: string) => { setEmail(email); setView('2fa'); }}
                />;
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 py-12 md:py-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg"
            >
                <GlassCard className="p-8 md:p-10 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />

                    <div className="mb-8 text-center relative z-10">
                        <motion.h1
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            key={`title-${view}`}
                            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2"
                        >
                            {view === 'login' && 'Chào mừng trở lại'}
                            {view === 'register' && 'Tạo tài khoản mới'}
                            {view === 'forgot-password' && 'Khôi phục mật khẩu'}
                            {view === 'reset-password' && 'Đặt lại mật khẩu'}
                            {view === 'verify-email' && 'Xác minh Email'}
                            {view === '2fa' && 'Xác minh 2FA'}
                        </motion.h1>
                        <motion.p
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            key={`desc-${view}`}
                            className="text-slate-700 font-medium"
                        >
                            {view === 'login' && 'Tìm kiếm cơ hội nghề nghiệp tốt nhất cùng JOBIO'}
                            {view === 'register' && 'Bắt đầu hành trình tìm việc mơ ước của bạn'}
                            {view === 'forgot-password' && 'Nhập email của bạn để nhận hướng dẫn'}
                            {view === 'reset-password' && 'Chọn mật khẩu mới an toàn hơn'}
                            {view === 'verify-email' && `Chúng tôi đã gửi mã đến ${email}`}
                            {view === '2fa' && 'Nhập mã xác thực từ ứng dụng của bạn'}
                        </motion.p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="relative z-10"
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </GlassCard>

                {/* Footer text */}
                <div className="mt-8 text-center text-sm text-muted-foreground/60 px-4">
                    Bằng cách tiếp tục, bạn đồng ý với{' '}
                    <a href="#" className="hover:text-cyan-400 transition-colors underline underline-offset-4">Điều khoản dịch vụ</a>
                    {' '}và{' '}
                    <a href="#" className="hover:text-cyan-400 transition-colors underline underline-offset-4">Chính sách bảo mật</a>
                    {' '}của chúng tôi.
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
