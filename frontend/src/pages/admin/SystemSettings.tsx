import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Activity, FileUp, Save, Search,
    Eye, Trash2, ToggleLeft, ToggleRight, RefreshCw, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'files', label: 'File Uploads', icon: FileUp },
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
    details: string;
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
                <div className="flex gap-1 bg-white/60 backdrop-blur border border-white/40 shadow-sm p-1 w-fit rounded-xl">
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
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">Cấu hình hệ thống</p>
                            <Button size="sm" className="rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white">
                                <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu thay đổi
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
                                            {setting.setting_type === 'boolean' ? (
                                                <button className={`flex items-center gap-2 cursor-pointer ${setting.setting_value === 'true' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {setting.setting_value === 'true' ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                                    <span className="text-xs font-semibold">{setting.setting_value === 'true' ? 'Bật' : 'Tắt'}</span>
                                                </button>
                                            ) : (
                                                <input
                                                    type={setting.setting_type === 'number' ? 'number' : 'text'}
                                                    defaultValue={setting.setting_value}
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
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-4 flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm trong logs..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                            />
                        </div>
                        <Button variant="outline" className="rounded-xl font-semibold text-sm border-slate-200 text-slate-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200">
                            <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
                        </Button>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                        {loadingLogs ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">User</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Action</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Entity</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Chi tiết</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">IP</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-900">{log.user_email}</td>
                                            <td className="py-3 px-4">
                                                <Badge className={`${actionColors[log.action] || 'bg-slate-50 text-slate-600'} border text-[10px] font-bold`}>
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">{log.entity_type}</td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{log.details}</td>
                                            <td className="py-3 px-4 text-slate-400 text-xs font-mono">{log.ip_address}</td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString('vi-VN')}</td>
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
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50">
                            <p className="text-sm font-bold text-slate-900">Tệp tải lên gần đây</p>
                        </div>
                        {loadingFiles ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Tên file</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Loại</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Kích thước</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Entity</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Public</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-500">Ngày</th>
                                        <th className="text-right py-3 px-4 font-semibold text-slate-500 w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file) => (
                                        <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-900 text-xs">{file.original_name}</td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{file.mime_type}</td>
                                            <td className="py-3 px-4 text-slate-600 text-xs font-medium">{file.file_size < 1024 * 1024 ? `${(file.file_size / 1024).toFixed(1)} KB` : `${(file.file_size / 1024 / 1024).toFixed(1)} MB`}</td>
                                            <td className="py-3 px-4"><Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">{file.entity_type}</Badge></td>
                                            <td className="py-3 px-4">
                                                {file.is_public ? <span className="text-emerald-600 text-xs font-semibold">Public</span> : <span className="text-slate-400 text-xs">Private</span>}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{new Date(file.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td className="py-3 px-4 text-right">
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
        </div>
    );
}
