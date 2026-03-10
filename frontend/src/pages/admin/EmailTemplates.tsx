import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Mail, Plus, Edit3, Trash2, Send,
    CheckCircle2, XCircle, Clock, Code, FolderOpen, ToggleRight, ToggleLeft
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

/* ── Mock Data ── */
const MOCK_TEMPLATES = [
    { id: 1, name: 'Welcome Email', slug: 'welcome-email', category: 'Onboarding', subject: 'Chào mừng bạn đến với JOBIO, {{ user_name }}!', isActive: true, variables: ['user_name', 'email', 'role'] },
    { id: 2, name: 'Password Reset', slug: 'password-reset', category: 'Authentication', subject: 'Yêu cầu đặt lại mật khẩu — JOBIO', isActive: true, variables: ['user_name', 'reset_link', 'expiry_time'] },
    { id: 3, name: 'Application Received', slug: 'application-received', category: 'Applications', subject: 'Đơn ứng tuyển của bạn cho vị trí {{ job_title }} đã được gửi', isActive: true, variables: ['user_name', 'job_title', 'company_name'] },
    { id: 4, name: 'Interview Invitation', slug: 'interview-invitation', category: 'Interviews', subject: 'Lời mời phỏng vấn từ {{ company_name }}', isActive: true, variables: ['user_name', 'company_name', 'job_title', 'interview_date', 'interview_time'] },
    { id: 5, name: 'Job Alert', slug: 'job-alert', category: 'Notifications', subject: '{{ match_count }} việc làm mới phù hợp với bạn', isActive: false, variables: ['user_name', 'match_count', 'jobs_list'] },
    { id: 6, name: 'Company Verified', slug: 'company-verified', category: 'Admin', subject: 'Công ty {{ company_name }} đã được xác minh!', isActive: true, variables: ['company_name', 'admin_name'] },
];

const MOCK_SENT = [
    { id: 1, recipient: 'an.nguyen@email.com', template: 'Welcome Email', subject: 'Chào mừng bạn đến với JOBIO, An!', status: 'sent', sentAt: '10/03/2026 09:15' },
    { id: 2, recipient: 'binh.tran@company.vn', template: 'Company Verified', subject: 'Công ty TechVN đã được xác minh!', status: 'sent', sentAt: '10/03/2026 08:30' },
    { id: 3, recipient: 'cuong.le@gmail.com', template: 'Password Reset', subject: 'Yêu cầu đặt lại mật khẩu — JOBIO', status: 'sent', sentAt: '09/03/2026 16:45' },
    { id: 4, recipient: 'dung.pham@techvn.com', template: 'Job Alert', subject: '5 việc làm mới phù hợp với bạn', status: 'failed', sentAt: '09/03/2026 12:00' },
    { id: 5, recipient: 'test@invalid.xxx', template: 'Welcome Email', subject: 'Chào mừng bạn...', status: 'bounced', sentAt: '08/03/2026 10:30' },
];

const MOCK_EMAIL_CATEGORIES = [
    { id: 1, name: 'Onboarding', count: 3 },
    { id: 2, name: 'Authentication', count: 2 },
    { id: 3, name: 'Applications', count: 4 },
    { id: 4, name: 'Interviews', count: 2 },
    { id: 5, name: 'Notifications', count: 5 },
    { id: 6, name: 'Admin', count: 2 },
];

export default function EmailTemplates() {
    const [activeTab, setActiveTab] = useState<TabId>('templates');

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
                    {MOCK_TEMPLATES.map((tpl) => (
                        <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                                        <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{tpl.category}</Badge>
                                        {tpl.isActive ? (
                                            <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold"><ToggleRight className="w-4 h-4" />Active</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold"><ToggleLeft className="w-4 h-4" />Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 truncate">Subject: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{tpl.subject}</code></p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {tpl.variables.map(v => (
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
                                {MOCK_SENT.map((email) => (
                                    <tr key={email.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 text-xs font-medium text-slate-900">{email.recipient}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600">{email.template}</td>
                                        <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate">{email.subject}</td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${sentStatusColors[email.status]} border text-[10px] font-bold`}>
                                                {email.status === 'sent' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                {email.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                                                {email.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                                {email.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-slate-500">{email.sentAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MOCK_EMAIL_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-blue-600" /></div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                                            <p className="text-xs text-slate-500">{cat.count} templates</p>
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
                </motion.div>
            )}
        </div>
    );
}
