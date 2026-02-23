import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockApi } from '@/services/mockApi';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Loader2, ShieldAlert } from 'lucide-react';

interface TwoFactorViewProps {
    email: string;
    onSuccess: () => void;
}

export const TwoFactorView: React.FC<TwoFactorViewProps> = ({
    email,
    onSuccess
}) => {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const setAuth = useUserStore(state => state.setAuth);

    const handleVerify2FA = async () => {
        if (code.length < 6) return;
        setIsSubmitting(true);
        try {
            // In a real app, this would return the final tokens or authorize the previous session
            await mockApi.verify2fa(code);

            // Mocking the final auth response for 2FA
            const response = await mockApi.login({ email, password: 'mock-auth-authorized' });
            setAuth(response.user as any, response.access_token, response.refresh_token);

            toast.success("Xác thực 2FA thành công!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Mã 2FA không đúng.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-600 shadow-lg shadow-amber-500/10 border border-amber-500/20">
                    <ShieldAlert className="w-10 h-10" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-center gap-2">
                    <Input
                        placeholder="000000"
                        maxLength={6}
                        className="bg-white/5 border-white/10 focus:border-amber-500/50 h-12 text-center text-2xl tracking-[0.5em] max-w-[200px] font-mono"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                </div>

                <p className="text-sm text-muted-foreground">
                    Vui lòng nhập mã 6 số từ ứng dụng xác thực của bạn.
                </p>

                <Button
                    onClick={handleVerify2FA}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 transition-opacity font-semibold h-12"
                    disabled={isSubmitting || code.length < 6}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Xác nhận
                </Button>
            </div>
        </div>
    );
};
