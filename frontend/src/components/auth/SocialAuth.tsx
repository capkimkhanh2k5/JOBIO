import React from 'react';
import { Button } from '@/components/ui/button';
import { Chrome, Linkedin, Facebook } from 'lucide-react';
import { authService } from '@/services/authService';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

export const SocialAuth: React.FC = () => {
    const setAuth = useUserStore(state => state.setAuth);

    const handleSocialLogin = async (provider: string) => {
        try {
            toast.loading(`Đang đăng nhập bằng ${provider}...`);
            // TODO: Integrate real OAuth popup to get access_token from provider
            // For now, send provider name; backend will handle the flow
            const { data } = await authService.socialAuth({
                provider: provider.toLowerCase(),
                access_token: '', // Will come from OAuth popup
            });
            setAuth(data.user, data.access, data.refresh);
            toast.dismiss();
            toast.success(`Chào mừng ${data.user.full_name}!`);
        } catch (error) {
            toast.dismiss();
            toast.error("Lỗi đăng nhập social. Vui lòng thử lại.");
        }
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            <Button
                variant="outline"
                className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 transition-all duration-300 shadow-sm"
                onClick={() => handleSocialLogin('Google')}
            >
                <Chrome className="w-5 h-5 text-red-500" />
            </Button>
            <Button
                variant="outline"
                className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 transition-all duration-300 shadow-sm"
                onClick={() => handleSocialLogin('LinkedIn')}
            >
                <Linkedin className="w-5 h-5 text-blue-600 fill-current" />
            </Button>
            <Button
                variant="outline"
                className="bg-white border-gray-200 hover:bg-gray-50 text-gray-600 transition-all duration-300 shadow-sm"
                onClick={() => handleSocialLogin('Facebook')}
            >
                <Facebook className="w-5 h-5 text-blue-500 fill-current" />
            </Button>
        </div>
    );
};
