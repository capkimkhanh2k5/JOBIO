import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VerifySocialLink: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [provider, setProvider] = useState('');

    const token = searchParams.get('token');

    const getSettingsPath = (): string => {
        try {
            const raw = localStorage.getItem('jobio-user-storage');
            if (!raw) return '/auth?mode=login';
            const parsed = JSON.parse(raw);
            const role = parsed?.state?.user?.role;
            if (role === 'company') return '/company/settings';
            if (role === 'candidate') return '/candidate/settings';
            if (role === 'admin') return '/admin/settings';
            return '/auth?mode=login';
        } catch {
            return '/auth?mode=login';
        }
    };

    const settingsPath = getSettingsPath();
    const isLoggedIn = settingsPath !== '/auth?mode=login';

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Mã xác thực không hợp lệ hoặc đã thiếu.');
            return;
        }

        const verifyToken = async () => {
            try {
                const { data } = await authService.verifySocialLink(token);
                setStatus('success');
                setMessage(data.detail);
                setProvider(data.provider);
                toast.success(data.detail);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.detail || 'Đã có lỗi xảy ra trong quá trình xác thực.');
                toast.error('Xác thực thất bại');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 text-center"
            >
                {status === 'loading' && (
                    <div className="py-10 space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 bg-violet-100 rounded-full animate-ping opacity-25" />
                            <div className="relative z-10 w-full h-full bg-violet-50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Đang xác thực...</h2>
                            <p className="text-slate-500 font-medium">Vui lòng chờ trong giây lát để hệ thống xử lý liên kết của bạn.</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-6 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Liên kết thành công!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                {message || `Tài khoản của bạn đã được liên kết thành công với ${provider}.`}
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button 
                                onClick={() => navigate(settingsPath)} 
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                                {isLoggedIn ? 'Quay lại cài đặt' : 'Đi đến đăng nhập'} <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-6 space-y-6">
                        <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Xác thực thất bại</h2>
                            <p className="text-red-500/80 font-medium leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <Button 
                                onClick={() => navigate(settingsPath)} 
                                variant="outline"
                                className="w-full h-12 border-slate-200 text-slate-600 font-bold rounded-xl"
                            >
                                {isLoggedIn ? 'Thử lại từ trang cài đặt' : 'Đi đến đăng nhập'}
                            </Button>
                            <Button 
                                onClick={() => navigate('/')} 
                                variant="ghost"
                                className="w-full h-12 text-slate-400 font-medium"
                            >
                                Về trang chủ
                            </Button>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Jobio Secure Verification</span>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifySocialLink;
