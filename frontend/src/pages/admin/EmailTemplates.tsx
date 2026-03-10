import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { motion } from 'framer-motion';
import {
    Mail, Plus, Edit3, Trash2, Send,
    CheckCircle2, XCircle, Clock, Code, FolderOpen, ToggleRight, ToggleLeft, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'templates', label: 'Templates', icon: Code },
    { id: 'sent', label: 'Emails đã gửi', icon: Send },
    { id: 'categories', label: 'Danh mục', icon: FolderOpen },
] as const;

type TabId = (typeof tabs)[number]['id'];

const sentStatusColors: Record<string, string> = {
    sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    bounced: 'bg-slate-100 text-slate-600 border-slate-200',
};

/* Data is now fetched via useQuery hooks inside component */

interface EmailTemplate {
    id: number;
    name: string;
    slug: string;
    category: { id: number; name: string; slug: string } | null;
    subject: string;
    variables: string[] | null;
    is_active: boolean;
    created_at: string;
}

interface SentEmail {
    id: number;
    recipient: string;
    subject: string;
    template_name: string;
    status: string;
    created_at: string;
}

interface EmailCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

export default function EmailTemplates() {
    const [activeTab, setActiveTab] = useState<TabId>('templates');

    const { data: templatesResp, isLoading: loadingTemplates } = useQuery({
        queryKey: ['admin-email-templates'],
        queryFn: () => dashboardService.listEmailTemplates().then(r => r.data),
        staleTime: 30_000,
    });
    const templates: EmailTemplate[] = Array.isArray(templatesResp) ? templatesResp : (templatesResp as { results?: EmailTemplate[] })?.results ?? [];

    const { data: sentResp, isLoading: loadingSent } = useQuery({
        queryKey: ['admin-email-sent'],
        queryFn: () => dashboardService.listSentEmails().then(r => r.data),
        staleTime: 30_000,
    });
    const sentEmails: SentEmail[] = Array.isArray(sentResp) ? sentResp : (sentResp as { results?: SentEmail[] })?.results ?? [];

    const { data: categoriesResp, isLoading: loadingCategories } = useQuery({
        queryKey: ['admin-email-categories'],
        queryFn: () => dashboardService.listEmailCategories().then(r => r.data),
        staleTime: 60_000,
    });
    const emailCategories: EmailCategory[] = Array.isArray(categoriesResp) ? categoriesResp : [];

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-600" />
                        Email Templates
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý mẫu email và theo dõi gửi mail</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Tạo template
                </Button>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1 w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                                    ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                                <Icon className="w-4 h-4" />{tab.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    {loadingTemplates ? (
                        <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                    ) : templates.map((tpl) => (
                        <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                                        <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{tpl.category?.name ?? '—'}</Badge>
                                        {tpl.is_active ? (
                                            <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold"><ToggleRight className="w-4 h-4" />Active</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold"><ToggleLeft className="w-4 h-4" />Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 truncate">Subject: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{tpl.subject}</code></p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(tpl.variables ?? []).map(v => (
                                            <code key={v} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-mono">{`{{ ${v} }}`}</code>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold">
                                        <Send className="w-3.5 h-3.5 mr-1" /> Test
                                    </Button>
                                    <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold">
                                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Sửa
                                    </Button>
                                    <button className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Sent Emails Tab */}
            {activeTab === 'sent' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {loadingSent ? (
                            <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                        ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Người nhận</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Template</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Subject</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Trạng thái</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sentEmails.map((email) => (
                                    <tr key={email.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 text-xs font-medium text-slate-900">{email.recipient}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600">{email.template_name}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate">{email.subject}</td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${sentStatusColors[email.status] ?? ''} border text-[10px] font-bold`}>
                                                {email.status === 'sent' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                {email.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                                                {email.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                                {email.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500">{new Date(email.created_at).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <motion.div {...fadeUp(0.1)}>
                    {loadingCategories ? (
                        <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {emailCategories.map((cat) => (
                            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-blue-600" /></div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                                            {cat.description && <p className="text-xs text-slate-500">{cat.description}</p>}
                                        </div>
                                    </div>
                                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                        <button className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-5 flex items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer">
                            <Plus className="w-5 h-5" />
                            <span className="text-sm font-semibold">Thêm danh mục</span>
                        </button>
                    </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
