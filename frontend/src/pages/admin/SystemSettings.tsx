import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Loader2, Save, Settings, Wallet, Info, 
    Search, Calendar, User, Activity, 
    Trash2, File, HardDrive, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SystemSetting, ActivityLog, FileUpload } from '@/types/api';

type TabId = 'general' | 'plans' | 'notifications' | 'audit_logs' | 'file_uploads';

interface SubscriptionPlanItem {
    id: number;
    name: string;
    slug: string;
    price: string | number;
    currency: string;
    duration_days: number;
    is_active: boolean;
}

const formatVNPrice = (val: string | number) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Math.floor(Number(val));
    const str = String(num).replace(/\D/g, '');
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseVNPrice = (val: string) => {
    return val.replace(/\./g, '');
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs: Array<{ id: TabId; label: string; icon: any }> = [
    { id: 'general', label: 'Cấu hình chung', icon: Settings },
    { id: 'plans', label: 'Quản lý Gói dịch vụ', icon: Wallet },
    { id: 'audit_logs', label: 'Nhật ký hệ thống', icon: Activity },
    { id: 'file_uploads', label: 'Quản lý tập tin', icon: HardDrive },
];

export default function SystemSettings() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabId>('general');
    
    // --- PLANS STATE ---
    const [editedPlans, setEditedPlans] = useState<Record<number, { price?: string; duration_days?: number; is_active?: boolean }>>({});

    const { data: plansRaw, isLoading: loadingPlans } = useQuery({
        queryKey: ['admin-subscription-plans'],
        queryFn: () => dashboardService.listAdminSubscriptionPlans().then((response) => response.data),
        enabled: activeTab === 'plans',
    });

    const plans: SubscriptionPlanItem[] = Array.isArray(plansRaw) ? plansRaw : plansRaw?.results ?? [];

    const updatePlansMut = useMutation({
        mutationFn: async () => Promise.all(
            Object.entries(editedPlans).map(([id, payload]) => dashboardService.updateAdminSubscriptionPlan(Number(id), payload))
        ),
        onSuccess: async () => {
            toast.success('Đã cập nhật các gói dịch vụ');
            setEditedPlans({});
            await qc.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
        },
        onError: () => toast.error('Không thể cập nhật gói dịch vụ'),
    });

    // --- GENERAL SETTINGS STATE ---
    const [editedSettings, setEditedSettings] = useState<Record<number, string>>({});

    const { data: settingsData, isLoading: loadingSettings } = useQuery({
        queryKey: ['admin-system-settings'],
        queryFn: () => dashboardService.listSystemSettings().then((res) => res.data),
        enabled: activeTab === 'general',
    });

    const settings: SystemSetting[] = settingsData?.results || settingsData || [];

    const updateSettingsMut = useMutation({
        mutationFn: async () => {
            const promises = Object.entries(editedSettings).map(([id, value]) =>
                dashboardService.updateSystemSetting(Number(id), { setting_value: value })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success('Đã cập nhật cấu hình chung');
            setEditedSettings({});
            qc.invalidateQueries({ queryKey: ['admin-system-settings'] });
        },
        onError: () => toast.error('Lỗi khi cập nhật cấu hình'),
    });

    // --- AUDIT LOGS STATE ---
    const [logSearch, setLogSearch] = useState('');
    const [logPage, setLogPage] = useState(1);

    const { data: logsData, isLoading: loadingLogs } = useQuery({
        queryKey: ['admin-activity-logs', logPage, logSearch],
        queryFn: () => dashboardService.listActivityLogs({ page: logPage, page_size: 20, search: logSearch }).then(res => res.data),
        enabled: activeTab === 'audit_logs',
    });

    const logs: ActivityLog[] = logsData?.results || [];
    const logsCount = logsData?.count || 0;
    const logsTotalPages = Math.ceil(logsCount / 20);

    // --- FILE UPLOADS STATE ---
    const [filePage, setFilePage] = useState(1);

    const { data: statsData } = useQuery({
        queryKey: ['admin-file-uploads-stats'],
        queryFn: () => dashboardService.getFileUploadsStats().then(res => res.data),
        enabled: activeTab === 'file_uploads',
    });

    const { data: filesData, isLoading: loadingFiles } = useQuery({
        queryKey: ['admin-file-uploads', filePage],
        queryFn: () => dashboardService.listFileUploads({ page: filePage, page_size: 20 }).then(res => res.data),
        enabled: activeTab === 'file_uploads',
    });

    const files: FileUpload[] = filesData?.results || [];
    const filesCount = filesData?.count || 0;
    const filesTotalPages = Math.ceil(filesCount / 20);

    const deleteFileMut = useMutation({
        mutationFn: (id: number) => dashboardService.deleteFileUpload(id),
        onSuccess: () => {
            toast.success('Đã xóa tập tin');
            qc.invalidateQueries({ queryKey: ['admin-file-uploads'] });
            qc.invalidateQueries({ queryKey: ['admin-file-uploads-stats'] });
        },
        onError: () => toast.error('Lỗi khi xóa tập tin'),
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-violet-600" />
                    Cài đặt hệ thống
                </h1>
                <p className="text-sm text-slate-500 mt-1">Chỉ giữ các phần cấu hình chung, gói dịch vụ và thông báo</p>
            </motion.div>

            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-slate-50/50 border border-slate-200 p-1 w-fit rounded-xl overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {activeTab === 'plans' && (
                <motion.div {...fadeUp(0.1)} className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Quản lý gói dịch vụ</p>
                                <p className="text-xs text-slate-500 mt-1">Chỉnh sửa giá, thời hạn và trạng thái hoạt động</p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => updatePlansMut.mutate()}
                                disabled={Object.keys(editedPlans).length === 0 || updatePlansMut.isPending}
                                className="rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white"
                            >
                                {updatePlansMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                                Lưu tất cả thay đổi
                            </Button>
                        </div>

                        {loadingPlans ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : plans.length === 0 ? (
                            <div className="py-12 text-center text-sm font-medium text-slate-400">Chưa có gói</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {[...plans].sort((a, b) => {
                                    const getRank = (name: string) => {
                                        const n = name.toLowerCase();
                                        if (n.includes('plus')) return 1;
                                        if (n.includes('pro')) return 2;
                                        if (n.includes('max')) return 3;
                                        return 99;
                                    };
                                    const rA = getRank(a.name);
                                    const rB = getRank(b.name);
                                    if (rA !== rB) return rA - rB;
                                    return a.duration_days - b.duration_days;
                                }).map((plan) => {
                                    const draft = editedPlans[plan.id] || {};
                                    const currentPrice = draft.price !== undefined ? formatVNPrice(draft.price) : formatVNPrice(plan.price);
                                    const currentDuration = draft.duration_days ?? plan.duration_days;

                                    return (
                                        <div key={plan.id} className="px-6 py-4 grid grid-cols-1 lg:grid-cols-10 gap-4 items-center hover:bg-slate-50/30 transition-colors">
                                            <div className="lg:col-span-4">
                                                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                                                <p className="text-xs text-slate-500">{plan.slug}</p>
                                            </div>

                                            <div className="lg:col-span-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Giá ({plan.currency})</label>
                                                <Input
                                                    type="text"
                                                    value={currentPrice}
                                                    onChange={(event) => {
                                                        const raw = parseVNPrice(event.target.value);
                                                        setEditedPlans((prev) => ({
                                                            ...prev,
                                                            [plan.id]: { ...prev[plan.id], price: raw },
                                                        }));
                                                    }}
                                                    className="rounded-lg font-mono font-bold"
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="lg:col-span-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Thời hạn (ngày)</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={currentDuration}
                                                    onChange={(event) => setEditedPlans((prev) => ({
                                                        ...prev,
                                                        [plan.id]: { ...prev[plan.id], duration_days: Number(event.target.value) },
                                                    }))}
                                                    className="rounded-lg font-bold"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {activeTab === 'general' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Cấu hình chung hệ thống</p>
                                <p className="text-xs text-slate-500 mt-1">Quản lý các biến môi trường động</p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => updateSettingsMut.mutate()}
                                disabled={Object.keys(editedSettings).length === 0 || updateSettingsMut.isPending}
                                className="rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white"
                            >
                                {updateSettingsMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                                Lưu thay đổi
                            </Button>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {loadingSettings ? (
                                <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                            ) : settings.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-400">Không có cấu hình nào</div>
                            ) : (
                                settings.map((setting) => {
                                    const currentValue = editedSettings[setting.id] !== undefined ? editedSettings[setting.id] : setting.setting_value;
                                    
                                    return (
                                        <div key={setting.id} className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center hover:bg-slate-50/50 transition-colors">
                                            <div className="lg:col-span-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-sm font-bold text-slate-900">{setting.setting_key}</p>
                                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
                                            </div>
                                            <div className="lg:col-span-2">
                                                {setting.setting_type === 'boolean' ? (
                                                    <select
                                                        className="w-full text-sm border border-slate-200 rounded-lg h-10 px-3"
                                                        value={currentValue.toLowerCase()}
                                                        onChange={(e) => setEditedSettings(prev => ({ ...prev, [setting.id]: e.target.value }))}
                                                    >
                                                        <option value="true">True</option>
                                                        <option value="false">False</option>
                                                    </select>
                                                ) : (
                                                    <Input
                                                        type={setting.setting_type === 'integer' ? 'number' : 'text'}
                                                        value={currentValue}
                                                        onChange={(e) => setEditedSettings(prev => ({ ...prev, [setting.id]: e.target.value }))}
                                                        className="font-mono text-sm"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'audit_logs' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm hành động..."
                                value={logSearch}
                                onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
                                className="pl-9 h-10 bg-slate-50 border-transparent focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-bold tracking-wider">Thời gian</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Người dùng</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Hành động</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Phân loại</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingLogs ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Không tìm thấy nhật ký</td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.user ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                                {log.user.avatar_url ? (
                                                                    <img src={log.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900 truncate max-w-[150px]">{log.user.full_name || 'Admin'}</p>
                                                                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{log.user.email}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Hệ thống</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900">{log.action}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 max-w-[250px] truncate" title={JSON.stringify(log.details)}>
                                                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600">
                                                        <Activity className="w-3 h-3" />
                                                        {log.log_type?.type_name || 'General'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {logsTotalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-sm text-slate-500">
                                    Hiển thị trang {logPage} / {logsTotalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                        disabled={logPage === 1}
                                    >
                                        Trước
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setLogPage(p => Math.min(logsTotalPages, p + 1))}
                                        disabled={logPage === logsTotalPages}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {activeTab === 'file_uploads' && (
                <motion.div {...fadeUp(0.1)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                                <HardDrive className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Tổng dung lượng đã sử dụng</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">
                                    {formatBytes(statsData?.total_size_bytes || 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                                <File className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Tổng số tập tin</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">
                                    {statsData?.total_files || 0} <span className="text-base font-medium text-slate-400">files</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                            <h2 className="font-bold text-slate-900">Danh sách tập tin</h2>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Xóa file có thể ảnh hưởng dữ liệu hiển thị</span>
                                <span className="sm:hidden">Cẩn thận khi xóa</span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-bold tracking-wider">Tên File</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Kích thước</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Định dạng</th>
                                        <th className="px-6 py-4 font-bold tracking-wider">Liên kết</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingFiles ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                                            </td>
                                        </tr>
                                    ) : files.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chưa có tập tin nào</td>
                                        </tr>
                                    ) : (
                                        files.map((file) => (
                                            <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <File className="w-4 h-4" />
                                                        </div>
                                                        <div className="max-w-[150px] lg:max-w-[250px]">
                                                            <a href={file.file_path} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:text-violet-600 truncate block">
                                                                {file.original_name}
                                                            </a>
                                                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{file.file_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
                                                    {formatBytes(file.file_size)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600">
                                                        {file.file_type || 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {file.entity_type ? (
                                                        <div>
                                                            <span className="text-xs font-semibold text-slate-700">{file.entity_type}</span>
                                                            <span className="text-xs text-slate-500 ml-1">#{file.entity_id}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs italic text-slate-400">Không rõ</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            if(confirm('Bạn có chắc chắn muốn xóa file này? Thao tác không thể hoàn tác.')) {
                                                                deleteFileMut.mutate(file.id);
                                                            }
                                                        }}
                                                        disabled={deleteFileMut.isPending && deleteFileMut.variables === file.id}
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                                    >
                                                        {deleteFileMut.isPending && deleteFileMut.variables === file.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filesTotalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-sm text-slate-500">
                                    Hiển thị trang {filePage} / {filesTotalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilePage(p => Math.max(1, p - 1))}
                                        disabled={filePage === 1}
                                    >
                                        Trước
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilePage(p => Math.min(filesTotalPages, p + 1))}
                                        disabled={filePage === filesTotalPages}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
