import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import {
    Bell, CheckCheck, Trash2, Settings, Loader2,
    FileText, Calendar, Eye, AlertTriangle, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const getIcon = (type: string) => {
    switch (type) {
        case 'application': return <FileText className="w-5 h-5 text-blue-400" />;
        case 'interview': return <Calendar className="w-5 h-5 text-violet-400" />;
        case 'view': return <Eye className="w-5 h-5 text-cyan-400" />;
        case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
        case 'review': return <Star className="w-5 h-5 text-yellow-400" />;
        case 'system': return <Bell className="w-5 h-5 text-slate-400" />;
        default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
};

export default function NotificationsPage() {
    const [tab, setTab] = useState<'all' | 'unread'>('all');

    // Global store actions to sync state
    const {
        markAsRead: markReadGlobal,
        markAllAsRead: markAllReadGlobal,
    } = useNotificationStore();

    // Data fetching for page
    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['notifications', 'page', tab],
        queryFn: () => notificationService.listNotifications({ is_read: tab === 'unread' ? false : undefined }).then(r => r.data.results),
        staleTime: 30000,
    });

    // Settings
    const { data: settings, isLoading: settingsLoading } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: () => notificationService.getNotificationSettings().then(r => r.data)
    });

    const [localSettings, setLocalSettings] = useState<any>(null);

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markReadGlobal(id);
        notificationService.markNotificationRead(Number(id)).then(() => refetch());
    };

    const handleMarkAllAsRead = async () => {
        await markAllReadGlobal();
        notificationService.markAllNotificationsRead().then(() => refetch());
    };

    const handleClearAll = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) {
            await companyService.clearAllNotifications();
            refetch();
        }
    };

    const handleDelete = async (_id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Xóa thông báo này?")) {
            await companyService.deleteNotification(Number(id));
            refetch();
        }
    }

    const handleSettingChange = (key: string, checked: boolean) => {
        const newSettings = { ...localSettings, [key]: checked };
        setLocalSettings(newSettings);
        notificationService.updateNotificationSettings(newSettings);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 tracking-tight">
                        Thông báo của bạn
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Quản lý và theo dõi các cập nhật quan trọng từ hệ thống
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted"
                        onClick={handleMarkAllAsRead}
                    >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Đánh dấu tất cả đã đọc
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm border-border/50">
                                <Settings className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] glass-effect border-white/10">
                            <DialogHeader>
                                <DialogTitle>Cài đặt thông báo</DialogTitle>
                            </DialogHeader>
                            {settingsLoading || !localSettings ? (
                                <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                            ) : (
                                <div className="grid gap-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Email thông báo</Label>
                                            <p className="text-xs text-muted-foreground">Nhận cập nhật qua email</p>
                                        </div>
                                        <Switch
                                            checked={localSettings.email_notifications}
                                            onCheckedChange={(c) => handleSettingChange('email_notifications', c)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Push notifications</Label>
                                            <p className="text-xs text-muted-foreground">Nhận thông báo trình duyệt</p>
                                        </div>
                                        <Switch
                                            checked={localSettings.push_notifications}
                                            onCheckedChange={(c) => handleSettingChange('push_notifications', c)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Cập nhật ứng tuyển</Label>
                                            <p className="text-xs text-muted-foreground">Khi có thay đổi trạng thái hồ sơ</p>
                                        </div>
                                        <Switch
                                            checked={localSettings.application_updates}
                                            onCheckedChange={(c) => handleSettingChange('application_updates', c)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Nhắc nhở phỏng vấn</Label>
                                            <p className="text-xs text-muted-foreground">Sắp đến giờ hẹn phỏng vấn</p>
                                        </div>
                                        <Switch
                                            checked={localSettings.interview_reminders}
                                            onCheckedChange={(c) => handleSettingChange('interview_reminders', c)}
                                        />
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-muted/50 p-1 rounded-xl glass-effect">
                        <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                            Tất cả
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">
                            Chưa đọc
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        onClick={handleClearAll}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa tất cả
                    </Button>
                </div>

                <div className="space-y-4 relative min-h-[400px]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                        </div>
                    ) : notifications && notifications.length > 0 ? (
                        <AnimatePresence mode="popLayout">
                            {notifications.map((notif: any, i: number) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                    className={`group flex flex-col sm:flex-row items-start gap-4 p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${!notif.is_read
                                        ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                                        : 'bg-card/40 border-border/40 hover:border-border/80 glass-effect'
                                        }`}
                                >
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mt-1 bg-background/50 shadow-sm border border-border/30`}>
                                        {getIcon(notif.type)}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className={`text-base font-semibold leading-none ${!notif.is_read ? 'text-foreground' : 'text-foreground/80'}`}>
                                                    {notif.title}
                                                </h3>
                                                {!notif.is_read && (
                                                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none font-bold text-[10px] px-2 uppercase tracking-wide">Mới</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground/70 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                                                <Bell className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end sm:justify-start">
                                            {!notif.is_read && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    className="h-8 text-xs bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors"
                                                >
                                                    <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                                                    Đã đọc
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => handleDelete(notif.id, e)}
                                                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Bell className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Không có thông báo nào</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                {tab === 'unread'
                                    ? "Bạn đã đọc tất cả các thông báo. Hãy kiểm tra lại sau nhé."
                                    : "Hiện tại hệ thống chưa có thông báo nào dành cho bạn."}
                            </p>
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
