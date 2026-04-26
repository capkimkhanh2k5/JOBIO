import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Activity, FileUp, Save, Search,
    Eye, Trash2, ToggleLeft, ToggleRight,
    Mail, Send, Bell, RefreshCw, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';

type DetailType = Record<string, any> | string | null;

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'files', label: 'File Uploads', icon: FileUp },
    { id: 'email-templates', label: 'Email Templates', icon: Mail },
    { id: 'sent-emails', label: 'Lịch sử Email', icon: Send },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface SystemSetting {
    id: number;
    setting_key: string;
    setting_value: string;
    setting_type: string;
    category: string;
    description: string;
    is_public: boolean;
    updated_at: string;
}

interface ActivityLog {
    id: number;
    user_email: string;
    action: string;
    entity_type: string;
    details: DetailType;
    ip_address: string;
    created_at: string;
}

interface FileUploadItem {
    id: number;
    file_name: string;
    original_name: string;
    file_type: string;
    file_size: number;
    mime_type: string;
    entity_type: string;
    is_public: boolean;
    created_at: string;
}

const actionColors: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-violet-50 text-violet-700 border-violet-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
};

export default function SystemSettings() {
    const [activeTab, setActiveTab] = useState<TabId>('settings');
    const [logSearch, setLogSearch] = useState('');
    const { data: settingsRaw, isLoading: loadingSettings } = useQuery({
        queryKey: ['system-settings'],
        queryFn: () => dashboardService.listSystemSettings().then(r => r.data),
    });
    const settings: SystemSetting[] = Array.isArray(settingsRaw) ? settingsRaw : settingsRaw?.results ?? [];

    const { data: logsRaw, isLoading: loadingLogs } = useQuery({
        queryKey: ['activity-logs', logSearch],
        queryFn: () => dashboardService.listActivityLogs({ search: logSearch || undefined }).then(r => r.data),
        enabled: activeTab === 'logs',
    });
    const logs: ActivityLog[] = Array.isArray(logsRaw) ? logsRaw : logsRaw?.results ?? [];

    const { data: filesRaw, isLoading: loadingFiles } = useQuery({
        queryKey: ['file-uploads'],
        queryFn: () => dashboardService.listFileUploads().then(r => r.data),
        enabled: activeTab === 'files',
    });
    const files: FileUploadItem[] = Array.isArray(filesRaw) ? filesRaw : filesRaw?.results ?? [];

    const [editedSettings, setEditedSettings] = useState<Record<number, string>>({});
    const updateSettingsMut = useMutation({
        mutationFn: async () => {
            const promises = Object.entries(editedSettings).map(([id, val]) =>
                dashboardService.updateSystemSetting(Number(id), { setting_value: val })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success('Đã lưu cấu hình hệ thống!');
            setEditedSettings({});
        },
        onError: () => toast.error('Có lỗi xảy ra khi lưu cấu hình.'),
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-violet-600" />
                    Cài đặt hệ thống
                </h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý cấu hình, nhật ký và tệp tải lên</p>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-slate-50/50 border border-slate-200 p-1 w-fit rounded-xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                                    ${activeTab === tab.id
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">Cấu hình hệ thống</p>
                            <Button size="sm" onClick={() => updateSettingsMut.mutate()} disabled={Object.keys(editedSettings).length === 0 || updateSettingsMut.isPending} className="rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white">
                                {updateSettingsMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />} Lưu thay đổi
                            </Button>
                        </div>
                        {loadingSettings ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {settings.map((setting) => (
                                    <div key={setting.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-700">{setting.setting_key}</code>
                                                <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{setting.category}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                                        </div>
                                        <div className="ml-4 min-w-[200px]">
                                            {setting.setting_type === 'boolean' ? (() => {
                                                const currentVal = editedSettings[setting.id] !== undefined ? editedSettings[setting.id] : setting.setting_value;
                                                const isTrue = currentVal === 'true';
                                                return (
                                                    <button onClick={() => setEditedSettings(prev => ({ ...prev, [setting.id]: isTrue ? 'false' : 'true' }))} className={`flex items-center gap-2 cursor-pointer ${isTrue ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {isTrue ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                                        <span className="text-xs font-semibold">{isTrue ? 'Bật' : 'Tắt'}</span>
                                                    </button>
                                                );
                                            })() : (
                                                <input
                                                    type={setting.setting_type === 'number' ? 'number' : 'text'}
                                                    value={editedSettings[setting.id] !== undefined ? editedSettings[setting.id] : setting.setting_value}
                                                    onChange={e => setEditedSettings(prev => ({ ...prev, [setting.id]: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 bg-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'logs' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm trong logs..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
                            />
                        </div>
                        <Button variant="outline" className="rounded-xl font-semibold text-sm border-slate-200 text-slate-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200">
                            <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
                        </Button>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {loadingLogs ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">User</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Action</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Entity</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Chi tiết</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">IP</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6 font-medium text-slate-900">{log.user_email}</td>
                                            <td className="py-4 px-6">
                                                <Badge className={`${actionColors[log.action] || 'bg-slate-50 text-slate-600'} border text-[10px] font-bold`}>
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">{log.entity_type}</td>
                                            <td className="py-4 px-6 text-slate-500 text-xs">
                                                {typeof log.details === 'object' && log.details !== null ? (
                                                    <pre className="whitespace-pre-wrap max-w-xs truncate font-sans text-[11px]">{JSON.stringify(log.details)}</pre>
                                                ) : (log.details || '—')}
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-xs font-mono">{log.ip_address}</td>
                                            <td className="py-4 px-6 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            )}

            {/* File Uploads Tab */}
            {activeTab === 'files' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50">
                            <p className="text-sm font-bold text-slate-900">Tệp tải lên gần đây</p>
                        </div>
                        {loadingFiles ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Tên file</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Loại</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Kích thước</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Entity</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Public</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày</th>
                                        <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500 w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file) => (
                                        <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6 font-medium text-slate-900 text-xs">{file.original_name}</td>
                                            <td className="py-4 px-6 text-slate-500 text-xs">{file.mime_type}</td>
                                            <td className="py-4 px-6 text-slate-600 text-xs font-medium">{file.file_size < 1024 * 1024 ? `${(file.file_size / 1024).toFixed(1)} KB` : `${(file.file_size / 1024 / 1024).toFixed(1)} MB`}</td>
                                            <td className="py-4 px-6"><Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">{file.entity_type}</Badge></td>
                                            <td className="py-4 px-6">
                                                {file.is_public ? <span className="text-emerald-600 text-xs font-semibold">Public</span> : <span className="text-slate-400 text-xs">Private</span>}
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-xs">{new Date(file.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button className="p-1.5 rounded-lg hover:bg-slate-100/50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                                                    <button className="p-1.5 rounded-lg hover:bg-slate-100/50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Email Templates Tab */}
            {activeTab === 'email-templates' && (
                <motion.div {...fadeUp(0.1)}>
                    <EmailTemplatesTab />
                </motion.div>
            )}

            {/* Sent Emails Tab */}
            {activeTab === 'sent-emails' && (
                <motion.div {...fadeUp(0.1)}>
                    <SentEmailsTab />
                </motion.div>
            )}

            {/* Notification Broadcast Tab */}
            {activeTab === 'notifications' && (
                <motion.div {...fadeUp(0.1)}>
                    <NotificationBroadcastTab />
                </motion.div>
            )}
        </div>
    );
}

// ─── Email Templates Sub-component ───────────────────────────────────────────

function EmailTemplatesTab() {
    const { data: raw, isLoading } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => dashboardService.listEmailTemplates().then(r => r.data),
    });
    const templates: any[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100/50 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-violet-600" /> Email Templates
                </p>
                <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px]">{templates.length} templates</Badge>
            </div>
            {isLoading ? (
                <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
            ) : templates.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-sm">Chưa có email templates</div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Tên template</th>
                            <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Danh mục</th>
                            <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Subject</th>
                            <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {templates.map((t: any) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-900">{t.name}</td>
                                <td className="py-4 px-6">
                                    <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">{t.category?.name ?? '—'}</Badge>
                                </td>
                                <td className="py-4 px-6 text-slate-600 text-xs">{t.subject}</td>
                                <td className="py-4 px-6 text-slate-400 text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// ─── Sent Emails Sub-component ────────────────────────────────────────────────

function SentEmailsTab() {
    const [statusFilter, setStatusFilter] = useState('all');
    const { data: raw, isLoading } = useQuery({
        queryKey: ['sent-emails', statusFilter],
        queryFn: () => dashboardService.listSentEmails({ status: statusFilter !== 'all' ? statusFilter : undefined }).then(r => r.data),
    });
    const emails: any[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];

    const statusCls: Record<string, string> = {
        sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        failed: 'bg-red-50 text-red-700 border-red-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-2 flex-wrap">
                {['all', 'sent', 'pending', 'failed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border
                            ${statusFilter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
                        {s === 'all' ? 'Tất cả' : s === 'sent' ? 'Đã gửi' : s === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                    </button>
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                ) : emails.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-medium text-sm">Không có email nào</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Người nhận</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Subject</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {emails.map((e: any) => (
                                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6 font-medium text-slate-900 text-xs">{e.recipient ?? e.recipient_email ?? e.to_email ?? '—'}</td>
                                    <td className="py-4 px-6 text-slate-600 text-xs">{e.subject}</td>
                                    <td className="py-4 px-6">
                                        <Badge className={`${statusCls[e.status] ?? 'bg-slate-50 text-slate-600'} border text-[10px] font-bold`}>{e.status}</Badge>
                                    </td>
                                    <td className="py-4 px-6 text-slate-400 text-xs">{e.sent_at ? new Date(e.sent_at).toLocaleString('vi-VN') : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ─── Notification Broadcast Sub-component ────────────────────────────────────

function NotificationBroadcastTab() {
    const [form, setForm] = useState({ title: '', message: '', target: 'all' as 'all' | 'candidate' | 'company' });

    const mut = useMutation({
        mutationFn: () => dashboardService.broadcastNotification(form),
        onSuccess: () => {
            toast.success('Đã gửi thông báo thành công!');
            setForm({ title: '', message: '', target: 'all' });
        },
        onError: () => toast.error('Gửi thất bại — kiểm tra lại API endpoint broadcast'),
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                    <h3 className="font-black text-slate-900">Gửi thông báo hàng loạt</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Gửi push notification đến nhóm users theo vai trò</p>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Đối tượng nhận</label>
                    <div className="flex gap-2 flex-wrap">
                        {[{ value: 'all', label: 'Tất cả' }, { value: 'candidate', label: 'Ứng viên' }, { value: 'company', label: 'Nhà tuyển dụng' }].map(opt => (
                            <button key={opt.value} onClick={() => setForm(f => ({ ...f, target: opt.value as any }))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border
                                    ${form.target === opt.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Tiêu đề *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Tiêu đề thông báo..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Nội dung *</label>
                    <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        rows={4} placeholder="Nội dung thông báo..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none" />
                </div>
                <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.title || !form.message}
                    className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold h-11">
                    {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Gửi thông báo
                </Button>
            </div>
        </div>
    );
}
