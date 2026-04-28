import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2, Save, Settings, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';

type TabId = 'general' | 'plans' | 'notifications';

interface SystemSetting {
    id: number;
    setting_key: string;
    setting_value: string;
    setting_type: string;
    category: string;
    description: string;
    is_public: boolean;
}

interface SubscriptionPlanItem {
    id: number;
    name: string;
    slug: string;
    price: string | number;
    currency: string;
    duration_days: number;
    is_active: boolean;
}

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs: Array<{ id: TabId; label: string; icon: typeof Settings }> = [
    { id: 'general', label: 'Cài đặt chung', icon: Settings },
    { id: 'plans', label: 'Gói plan', icon: Wallet },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
];

export default function SystemSettings() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const [editedSettings, setEditedSettings] = useState<Record<number, string>>({});
    const [editedPlans, setEditedPlans] = useState<Record<number, { price?: string; duration_days?: number; is_active?: boolean }>>({});

    const { data: settingsRaw, isLoading: loadingSettings } = useQuery({
        queryKey: ['system-settings'],
        queryFn: () => dashboardService.listSystemSettings().then((response) => response.data),
        enabled: activeTab === 'general',
    });

    const { data: plansRaw, isLoading: loadingPlans } = useQuery({
        queryKey: ['admin-subscription-plans'],
        queryFn: () => dashboardService.listAdminSubscriptionPlans().then((response) => response.data),
        enabled: activeTab === 'plans',
    });

    const settings: SystemSetting[] = Array.isArray(settingsRaw) ? settingsRaw : settingsRaw?.results ?? [];
    const plans: SubscriptionPlanItem[] = Array.isArray(plansRaw) ? plansRaw : plansRaw?.results ?? [];

    const updateSettingsMut = useMutation({
        mutationFn: async () => Promise.all(
            Object.entries(editedSettings).map(([id, value]) => dashboardService.updateSystemSetting(Number(id), { setting_value: value }))
        ),
        onSuccess: async () => {
            toast.success('Đã lưu cấu hình hệ thống');
            setEditedSettings({});
            await qc.invalidateQueries({ queryKey: ['system-settings'] });
        },
        onError: () => toast.error('Không thể lưu cấu hình'),
    });

    const updatePlanMut = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: { price?: string; duration_days?: number; is_active?: boolean } }) =>
            dashboardService.updateAdminSubscriptionPlan(id, payload),
        onSuccess: async () => {
            toast.success('Đã cập nhật gói plan');
            setEditedPlans({});
            await qc.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
        },
        onError: () => toast.error('Không thể cập nhật gói plan'),
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-violet-600" />
                    Cài đặt hệ thống
                </h1>
                <p className="text-sm text-slate-500 mt-1">Chỉ giữ các phần cấu hình chung, gói plan và thông báo</p>
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

            {activeTab === 'general' && (
                <motion.div {...fadeUp(0.1)} className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Cấu hình chung</p>
                                <p className="text-xs text-slate-500 mt-1">Chỉnh sửa các giá trị hệ thống đang được dùng trực tiếp</p>
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

                        {loadingSettings ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : settings.length === 0 ? (
                            <div className="py-12 text-center text-sm font-medium text-slate-400">Không có cấu hình nào</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {settings.map((setting) => {
                                    const currentValue = editedSettings[setting.id] ?? setting.setting_value;
                                    const isBoolean = setting.setting_type === 'boolean';
                                    const isTrue = currentValue === 'true';

                                    return (
                                        <div key={setting.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-700">{setting.setting_key}</code>
                                                    <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{setting.category}</Badge>
                                                    {setting.is_public && <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px]">Public</Badge>}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                                            </div>

                                            <div className="min-w-[220px] max-w-sm w-full">
                                                {isBoolean ? (
                                                    <button
                                                        onClick={() => setEditedSettings((prev) => ({ ...prev, [setting.id]: isTrue ? 'false' : 'true' }))}
                                                        className={`flex items-center gap-2 cursor-pointer ${isTrue ? 'text-emerald-600' : 'text-slate-400'}`}
                                                    >
                                                        {isTrue ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                                        <span className="text-xs font-semibold">{isTrue ? 'Bật' : 'Tắt'}</span>
                                                    </button>
                                                ) : (
                                                    <Input
                                                        type={setting.setting_type === 'number' ? 'number' : 'text'}
                                                        value={currentValue}
                                                        onChange={(event) => setEditedSettings((prev) => ({ ...prev, [setting.id]: event.target.value }))}
                                                        className="rounded-lg"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {activeTab === 'plans' && (
                <motion.div {...fadeUp(0.1)} className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100/50">
                            <p className="text-sm font-bold text-slate-900">Quản lý gói plan</p>
                            <p className="text-xs text-slate-500 mt-1">Chỉ giữ các trường giá, thời hạn và trạng thái hoạt động</p>
                        </div>

                        {loadingPlans ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                        ) : plans.length === 0 ? (
                            <div className="py-12 text-center text-sm font-medium text-slate-400">Chưa có gói plan</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {plans.map((plan) => {
                                    const draft = editedPlans[plan.id] || {};
                                    const currentPrice = draft.price ?? String(plan.price);
                                    const currentDuration = draft.duration_days ?? plan.duration_days;
                                    const currentActive = draft.is_active ?? plan.is_active;
                                    const hasChanges = Object.keys(draft).length > 0;

                                    return (
                                        <div key={plan.id} className="px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                            <div className="lg:col-span-4">
                                                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                                                <p className="text-xs text-slate-500">{plan.slug}</p>
                                            </div>

                                            <div className="lg:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Giá ({plan.currency})</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={currentPrice}
                                                    onChange={(event) => setEditedPlans((prev) => ({
                                                        ...prev,
                                                        [plan.id]: { ...prev[plan.id], price: event.target.value },
                                                    }))}
                                                    className="rounded-lg"
                                                />
                                            </div>

                                            <div className="lg:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Thời hạn (ngày)</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={currentDuration}
                                                    onChange={(event) => setEditedPlans((prev) => ({
                                                        ...prev,
                                                        [plan.id]: { ...prev[plan.id], duration_days: Number(event.target.value) },
                                                    }))}
                                                    className="rounded-lg"
                                                />
                                            </div>

                                            <div className="lg:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Trạng thái</label>
                                                <button
                                                    onClick={() => setEditedPlans((prev) => ({
                                                        ...prev,
                                                        [plan.id]: { ...prev[plan.id], is_active: !currentActive },
                                                    }))}
                                                    className={`flex items-center gap-2 cursor-pointer ${currentActive ? 'text-emerald-600' : 'text-slate-400'}`}
                                                >
                                                    {currentActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                                                    <span className="text-xs font-semibold">{currentActive ? 'Đang bật' : 'Đang tắt'}</span>
                                                </button>
                                            </div>

                                            <div className="lg:col-span-2 lg:text-right">
                                                <Button
                                                    size="sm"
                                                    disabled={!hasChanges || updatePlanMut.isPending}
                                                    onClick={() => updatePlanMut.mutate({ id: plan.id, payload: draft })}
                                                    className="rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white"
                                                >
                                                    {updatePlanMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                                                    Lưu plan
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {activeTab === 'notifications' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Cấu hình thông báo</h3>
                                <p className="text-xs text-slate-500 mt-1">Tab này được giữ lại như điểm nối cho cấu hình thông báo hệ thống</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Trạng thái</p>
                                <p className="text-sm text-slate-700">Chưa có endpoint cấu hình thông báo riêng, nên tạm giữ khung này để mở rộng sau.</p>
                            </div>
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                Có thể nối thêm email template defaults, push preferences hoặc broadcast rules ở bước tiếp theo.
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
