import React from 'react';
import { Button } from '@/components/ui/button';
import { Chrome, Linkedin, Facebook } from 'lucide-react';
import { mockApi } from '@/services/mockApi';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

export const SocialAuth: React.FC = () => {
    const setAuth = useUserStore(state => state.setAuth);

    const handleSocialLogin = async (provider: string) => {
        try {
            toast.loading(`Đang đăng nhập bằng ${provider}...`);
            const response = await mockApi.socialAuth(provider);
            setAuth(response.user as any, response.access_token, response.refresh_token);
            toast.dismiss();
            toast.success(`Chào mừng ${response.user.full_name}!`);
        } catch (error) {
            toast.dismiss();
            toast.error("Lỗi đăng nhập social. Vui lòng thử lại.");
        }
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            <Button
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300"
                onClick={() => handleSocialLogin('Google')}
            >
                <Chrome className="w-5 h-5" />
            </Button>
            <Button
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300"
                onClick={() => handleSocialLogin('LinkedIn')}
            >
                <Linkedin className="w-5 h-5 fill-current" />
            </Button>
            <Button
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300"
                onClick={() => handleSocialLogin('Facebook')}
            >
                <Facebook className="w-5 h-5 fill-current" />
            </Button>
        </div>
    );
};
