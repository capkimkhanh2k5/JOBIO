import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, Activity, FileUp, Save, Search,
    Eye, Trash2, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

/* ── Mock Data ── */
const MOCK_SETTINGS = [
    { id: 1, key: 'site_name', value: 'JOBIO', type: 'string', category: 'General', description: 'Tên trang web' },
    { id: 2, key: 'maintenance_mode', value: 'false', type: 'boolean', category: 'General', description: 'Chế độ bảo trì' },
    { id: 3, key: 'max_upload_size', value: '10', type: 'number', category: 'Upload', description: 'Dung lượng upload tối đa (MB)' },
    { id: 4, key: 'allow_registration', value: 'true', type: 'boolean', category: 'Auth', description: 'Cho phép đăng ký mới' },
    { id: 5, key: 'default_language', value: 'vi', type: 'string', category: 'General', description: 'Ngôn ngữ mặc định' },
    { id: 6, key: 'smtp_host', value: 'smtp.gmail.com', type: 'string', category: 'Email', description: 'SMTP Server' },
    { id: 7, key: 'jobs_per_page', value: '20', type: 'number', category: 'Display', description: 'Số việc làm mỗi trang' },
    { id: 8, key: 'enable_ai_matching', value: 'true', type: 'boolean', category: 'AI', description: 'Bật AI Matching' },
];

const MOCK_LOGS = [
    { id: 1, user: 'Admin Giang', action: 'UPDATE', entity: 'SystemSetting', details: 'Changed maintenance_mode', ip: '192.168.1.100', time: '10/03/2026 09:00' },
    { id: 2, user: 'Admin Giang', action: 'DELETE', entity: 'User', details: 'Deleted spam user #234', ip: '192.168.1.100', time: '10/03/2026 08:45' },
    { id: 3, user: 'System', action: 'CREATE', entity: 'Notification', details: 'Batch notification sent', ip: 'system', time: '10/03/2026 08:00' },
    { id: 4, user: 'Admin Giang', action: 'UPDATE', entity: 'Company', details: 'Verified company TechVN', ip: '192.168.1.100', time: '09/03/2026 16:30' },
    { id: 5, user: 'System', action: 'CREATE', entity: 'Report', details: 'Daily analytics generated', ip: 'system', time: '09/03/2026 00:00' },
];

const MOCK_FILES = [
    { id: 1, filename: 'company_logo_techvn.png', type: 'image/png', size: '245 KB', user: 'Phạm Đức Dũng', entity: 'Company', isPublic: true, date: '10/03/2026' },
    { id: 2, filename: 'cv_nguyenvan.pdf', type: 'application/pdf', size: '1.2 MB', user: 'Nguyễn Văn An', entity: 'CV', isPublic: false, date: '09/03/2026' },
    { id: 3, filename: 'banner_campaign.jpg', type: 'image/jpeg', size: '890 KB', user: 'Trần Thị Bình', entity: 'Campaign', isPublic: true, date: '08/03/2026' },
    { id: 4, filename: 'report_feb2026.xlsx', type: 'application/excel', size: '356 KB', user: 'Admin Giang', entity: 'Report', isPublic: false, date: '07/03/2026' },
];

const actionColors: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
};

export default function SystemSettings() {
    const [activeTab, setActiveTab] = useState<TabId>('settings');
    const [logSearch, setLogSearch] = useState('');

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-blue-600" />
                    Cài đặt hệ thống
                </h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý cấu hình, nhật ký và tệp tải lên</p>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1 w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                                    ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-sm'
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
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">Cấu hình hệ thống</p>
                            <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
                                <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu thay đổi
                            </Button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {MOCK_SETTINGS.map((setting) => (
                                <div key={setting.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-700">{setting.key}</code>
                                            <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{setting.category}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                                    </div>
                                    <div className="ml-4 min-w-[200px]">
                                        {setting.type === 'boolean' ? (
                                            <button className={`flex items-center gap-2 cursor-pointer ${setting.value === 'true' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {setting.value === 'true' ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                                <span className="text-xs font-semibold">{setting.value === 'true' ? 'Bật' : 'Tắt'}</span>
                                            </button>
                                        ) : (
                                            <input
                                                type={setting.type === 'number' ? 'number' : 'text'}
                                                defaultValue={setting.value}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'logs' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm trong logs..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                            />
                        </div>
                        <Button variant="outline" className="rounded-xl font-semibold text-sm">
                            <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
                        </Button>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                                {MOCK_LOGS.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-900">{log.user}</td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${actionColors[log.action] || 'bg-slate-50 text-slate-600'} border text-[10px] font-bold`}>
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">{log.entity}</td>
                                        <td className="py-3 px-4 text-slate-500 text-xs">{log.details}</td>
                                        <td className="py-3 px-4 text-slate-400 text-xs font-mono">{log.ip}</td>
                                        <td className="py-3 px-4 text-slate-500 text-xs">{log.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* File Uploads Tab */}
            {activeTab === 'files' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-900">Tệp tải lên gần đây</p>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Tên file</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Loại</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Kích thước</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Người upload</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Entity</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Public</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Ngày</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-500 w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_FILES.map((file) => (
                                    <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-900 text-xs">{file.filename}</td>
                                        <td className="py-3 px-4 text-slate-500 text-xs">{file.type}</td>
                                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">{file.size}</td>
                                        <td className="py-3 px-4 text-slate-600 text-xs">{file.user}</td>
                                        <td className="py-3 px-4"><Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">{file.entity}</Badge></td>
                                        <td className="py-3 px-4">
                                            {file.isPublic ? <span className="text-emerald-600 text-xs font-semibold">Public</span> : <span className="text-slate-400 text-xs">Private</span>}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 text-xs">{file.date}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
