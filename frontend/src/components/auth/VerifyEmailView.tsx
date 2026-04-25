import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';

interface VerifyEmailViewProps {
    email: string;
    onVerified: () => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
    email,
    onVerified
}) => {
    const [token, setToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleVerify = async () => {
        if (!token) return;
        setIsSubmitting(true);
        try {
            await authService.verifyEmail(token);
            toast.success("Xác minh Email thành công!");
            onVerified();
        } catch (error: any) {
            const msg = error.response?.data?.detail
                || error.response?.data?.message
                || 'Mã xác thực không đúng.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await authService.resendVerification(email);
            toast.success("Đã gửi lại mã xác thực.");
        } catch (error: any) {
            toast.error("Không thể gửi lại mã lúc này.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-600 shadow-lg shadow-cyan-500/10 border border-cyan-500/20">
                    <MailCheck className="w-10 h-10" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-center gap-2">
                    <Input
                        placeholder="Nhập mã xác thực"
                        className="bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 h-12 text-center text-xl tracking-widest max-w-[240px]"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </div>

                <Button
                    onClick={handleVerify}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 transition-colors"
                    disabled={isSubmitting || !token}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xác nhận mã
                </Button>

                <div className="pt-4">
                    <p className="text-sm text-slate-600 font-medium mb-2">Bạn không nhận được mã?</p>
                    <Button
                        variant="link"
                        className="text-primary hover:text-primary/80 p-0 h-auto font-bold"
                        onClick={handleResend}
                        disabled={isResending}
                    >
                        {isResending && <RefreshCw className="mr-2 h-3 w-3 animate-spin" />}
                        Gửi lại mã ngay
                    </Button>
                </div>
            </div>
        </div>
    );
};
