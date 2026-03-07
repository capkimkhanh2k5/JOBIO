import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';
import { employerService } from '@/services/employerService';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { NotificationSettings as APINotificationSettings } from '@/types/api';

export function NotificationSettings() {
    const [settings, setSettings] = useState<APINotificationSettings>({
        email_notifications: true,
        push_notifications: false,
        job_alerts: false,
        application_updates: true,
        message_notifications: true
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await employerService.getNotificationSettings();
                if (res.data) setSettings(res.data);
            } catch (error) {
                console.error("Lỗi khi tải cài đặt thông báo:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = async (key: keyof APINotificationSettings) => {
        const newValue = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newValue }));
        setIsSaving(true);

        try {
            await employerService.updateNotificationSettings({ [key]: newValue });
            toast.success("Đã cập nhật cài đặt thông báo");
        } catch (error: any) {
            // Rollback on fail
            setSettings(prev => ({ ...prev, [key]: !newValue }));
            toast.error("Không thể lưu thay đổi");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Cài đặt Thông báo</h2>
                        <p className="text-sm text-muted-foreground mt-1">Quản lý cách chúng tôi liên lạc và gửi thông báo cho bạn.</p>
                    </div>
                </div>
                {isSaving && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
            </div>

            <div className="space-y-4">
                <Card className="p-4 border border-slate-100 shadow-none flex items-center justify-between">
                    <div>
                        <Label className="text-base font-semibold">Ứng viên mới ứng tuyển</Label>
                        <p className="text-sm text-muted-foreground mt-1">Nhận email ngay khi có ứng viên nộp hồ sơ vào tin tuyển dụng của bạn.</p>
                    </div>
                    <Switch
                        checked={settings.application_updates}
                        onCheckedChange={() => handleToggle('application_updates')}
                        disabled={isSaving}
                    />
                </Card>

                <Card className="p-4 border border-slate-100 shadow-none flex items-center justify-between">
                    <div>
                        <Label className="text-base font-semibold">Tin nhắn mới</Label>
                        <p className="text-sm text-muted-foreground mt-1">Thông báo khi ứng viên phản hồi tin nhắn của bạn.</p>
                    </div>
                    <Switch
                        checked={settings.message_notifications}
                        onCheckedChange={() => handleToggle('message_notifications')}
                        disabled={isSaving}
                    />
                </Card>

                <Card className="p-4 border border-slate-100 shadow-none flex items-center justify-between">
                    <div>
                        <Label className="text-base font-semibold">Thông tin tiếp thị & Ưu đãi</Label>
                        <p className="text-sm text-muted-foreground mt-1">Nhận các bản tin về tính năng, dịch vụ và ưu đãi giảm giá.</p>
                    </div>
                    <Switch
                        checked={settings.email_notifications}
                        onCheckedChange={() => handleToggle('email_notifications')}
                        disabled={isSaving}
                    />
                </Card>
            </div>
        </div>
    );
}
