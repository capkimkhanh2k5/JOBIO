import { ReactNode, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    PencilLine,
    Plus,
    Search,
    Send,
    Sparkles,
    Save,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { dashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';

type EmailStatus = 'sent' | 'failed' | 'pending';

type EmailStats = {
    total_sent: number;
    success_count: number;
    success_rate: number;
    failed_count: number;
    failed_rate: number;
    pending_count: number;
    pending_rate: number;
    daily_trend: Array<{ date: string; count: number }>;
    by_template: Array<{ template__name: string; count: number }>;
    last_sent: string | null;
};

type TemplateFormState = {
    name: string;
    slug: string;
    category_id: string;
    subject: string;
    body: string;
    variables: string;
    is_active: boolean;
};

type CategoryFormState = {
    name: string;
    slug: string;
    description: string;
};

interface EmailTemplateCategoryItem {
    id: number;
    name: string;
    slug: string;
    description: string;
}

interface EmailTemplateItem {
    id: number;
    name: string;
    slug: string;
    category: EmailTemplateCategoryItem | null;
    subject: string;
    body: string;
    variables: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
}

interface SentEmailItem {
    id: number;
    recipient: string;
    subject: string;
    content: string;
    template_name: string | null;
    status: EmailStatus;
    error_message: string;
    created_at: string;
}

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const colors = ['#4f46e5', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];

const emptyTemplateForm = (): TemplateFormState => ({
    name: '',
    slug: '',
    category_id: '',
    subject: '',
    body: '',
    variables: '{}',
    is_active: true,
});

const emptyCategoryForm = (): CategoryFormState => ({
    name: '',
    slug: '',
    description: '',
});

const toArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    return payload?.results ?? [];
};

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export default function EmailManager() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [templateSearch, setTemplateSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [logSearch, setLogSearch] = useState('');
    const [logStatus, setLogStatus] = useState<'all' | EmailStatus>('all');
    const [logPage, setLogPage] = useState(1);
    const [selectedTemplateSlug, setSelectedTemplateSlug] = useState('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
    const [testRecipient, setTestRecipient] = useState('');
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [templateForm, setTemplateForm] = useState<TemplateFormState>(emptyTemplateForm());
    const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm());

    const { data: statsData, isLoading: statsLoading } = useQuery<EmailStats>({
        queryKey: ['email-stats'],
        queryFn: () => dashboardService.getEmailStats().then((response) => response.data),
    });

    const { data: templatesData, isLoading: templatesLoading } = useQuery({
        queryKey: ['email-templates', templateSearch],
        queryFn: () => dashboardService.listEmailTemplates({ search: templateSearch || undefined, page_size: 100 }).then((response) => response.data),
    });

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['email-categories', categorySearch],
        queryFn: () => dashboardService.listEmailCategories({ search: categorySearch || undefined, page_size: 100 }).then((response) => response.data),
    });

    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['email-logs', logSearch, logStatus, logPage],
        queryFn: () => dashboardService.listSentEmails({
            search: logSearch || undefined,
            status: logStatus === 'all' ? undefined : logStatus,
            page: logPage,
            page_size: 10,
        }).then((response) => response.data),
    });

    const stats: EmailStats = statsData ?? {
        total_sent: 0,
        success_count: 0,
        success_rate: 0,
        failed_count: 0,
        failed_rate: 0,
        pending_count: 0,
        pending_rate: 0,
        daily_trend: [],
        by_template: [],
        last_sent: null,
    };

    const templates = toArray<EmailTemplateItem>(templatesData);
    const categories = toArray<EmailTemplateCategoryItem>(categoriesData);
    const logs = toArray<SentEmailItem>(logsData);
    const totalLogs = logsData?.count ?? logs.length;
    const totalLogPages = Math.max(1, Math.ceil(totalLogs / 10));

    const templateDistribution = useMemo(
        () => stats.by_template.slice(0, 8).map((item) => ({ name: item.template__name || 'Unknown', count: item.count })),
        [stats.by_template]
    );

    const statusDistribution = [
        { name: 'Thành công', value: stats.success_count },
        { name: 'Thất bại', value: stats.failed_count },
        { name: 'Chờ xử lý', value: stats.pending_count },
    ];

    const selectedTemplate = templates.find((item) => item.slug === selectedTemplateSlug) ?? null;
    const selectedCategory = categories.find((item) => item.slug === selectedCategorySlug) ?? null;

    const saveTemplateMutation = useMutation({
        mutationFn: async () => {
            let variables: Record<string, unknown> = {};

            try {
                variables = templateForm.variables.trim() ? JSON.parse(templateForm.variables) : {};
            } catch {
                throw new Error('Biến JSON không hợp lệ');
            }

            const payload = {
                name: templateForm.name.trim(),
                slug: templateForm.slug.trim(),
                subject: templateForm.subject.trim(),
                body: templateForm.body,
                is_active: templateForm.is_active,
                variables,
                category_id: templateForm.category_id ? Number(templateForm.category_id) : undefined,
            };

            if (selectedTemplateSlug) {
                return dashboardService.updateEmailTemplate(selectedTemplateSlug, payload);
            }

            return dashboardService.createEmailTemplate(payload);
        },
        onSuccess: async () => {
            toast.success('Đã lưu email template');
            setSelectedTemplateSlug('');
            setTemplateForm(emptyTemplateForm());
            setTemplateDialogOpen(false);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['email-templates'] }),
                queryClient.invalidateQueries({ queryKey: ['email-stats'] }),
            ]);
        },
        onError: (error: any) => toast.error(error?.message ?? 'Không thể lưu template'),
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (slug: string) => dashboardService.deleteEmailTemplate(slug),
        onSuccess: async () => {
            toast.success('Đã xóa template');
            setSelectedTemplateSlug('');
            setTemplateForm(emptyTemplateForm());
            await queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
        onError: () => toast.error('Không thể xóa template'),
    });

    const testTemplateMutation = useMutation({
        mutationFn: () => {
            if (!selectedTemplateSlug) {
                throw new Error('Hãy chọn template trước khi test gửi');
            }

            if (!testRecipient.trim()) {
                throw new Error('Nhập địa chỉ email người nhận');
            }

            return dashboardService.testEmailTemplate(selectedTemplateSlug, testRecipient.trim());
        },
        onSuccess: async () => {
            toast.success('Đã gửi email test');
            setTestRecipient('');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['email-logs'] }),
                queryClient.invalidateQueries({ queryKey: ['email-stats'] }),
            ]);
        },
        onError: (error: any) => toast.error(error?.message ?? 'Không thể gửi email test'),
    });

    const saveCategoryMutation = useMutation({
        mutationFn: () => {
            const payload = {
                name: categoryForm.name.trim(),
                slug: categoryForm.slug.trim(),
                description: categoryForm.description.trim(),
            };

            if (selectedCategorySlug) {
                return dashboardService.updateEmailCategory(selectedCategorySlug, payload);
            }

            return dashboardService.createEmailCategory(payload);
        },
        onSuccess: async () => {
            toast.success('Đã lưu danh mục email');
            setSelectedCategorySlug('');
            setCategoryForm(emptyCategoryForm());
            setCategoryDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['email-categories'] });
        },
        onError: () => toast.error('Không thể lưu danh mục'),
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (slug: string) => dashboardService.deleteEmailCategory(slug),
        onSuccess: async () => {
            toast.success('Đã xóa danh mục');
            setSelectedCategorySlug('');
            setCategoryForm(emptyCategoryForm());
            await queryClient.invalidateQueries({ queryKey: ['email-categories'] });
        },
        onError: () => toast.error('Không thể xóa danh mục'),
    });

    const handlePickTemplate = (template: EmailTemplateItem) => {
        setSelectedTemplateSlug(template.slug);
        setTemplateForm({
            name: template.name,
            slug: template.slug,
            category_id: template.category?.id ? String(template.category.id) : '',
            subject: template.subject,
            body: template.body,
            variables: JSON.stringify(template.variables ?? {}, null, 2),
            is_active: template.is_active,
        });
        setTemplateDialogOpen(true);
        setActiveTab('templates');
    };

    const handleOpenCreateTemplate = () => {
        setSelectedTemplateSlug('');
        setTemplateForm(emptyTemplateForm());
        setTestRecipient('');
        setTemplateDialogOpen(true);
    };

    const handleResetTemplate = () => {
        setSelectedTemplateSlug('');
        setTemplateForm(emptyTemplateForm());
        setTestRecipient('');
        setTemplateDialogOpen(false);
    };

    const handlePickCategory = (category: EmailTemplateCategoryItem) => {
        setSelectedCategorySlug(category.slug);
        setCategoryForm({
            name: category.name,
            slug: category.slug,
            description: category.description,
        });
        setCategoryDialogOpen(true);
        setActiveTab('categories');
    };

    const handleOpenCreateCategory = () => {
        setSelectedCategorySlug('');
        setCategoryForm(emptyCategoryForm());
        setCategoryDialogOpen(true);
    };

    const handleResetCategory = () => {
        setSelectedCategorySlug('');
        setCategoryForm(emptyCategoryForm());
        setCategoryDialogOpen(false);
    };

    const handleDeleteTemplate = (template: EmailTemplateItem) => {
        if (!window.confirm(`Xóa template "${template.name}"?`)) return;
        deleteTemplateMutation.mutate(template.slug);
    };

    const handleDeleteCategory = (category: EmailTemplateCategoryItem) => {
        if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;
        deleteCategoryMutation.mutate(category.slug);
    };

    const statusBadgeClass = (status: EmailStatus) => {
        if (status === 'sent') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Mail className="w-6 h-6 text-indigo-600" />
                    Quản lý Email
                </h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý template, danh mục, nhật ký gửi và thống kê vận hành</p>
            </motion.div>

            <motion.div {...fadeUp(0.05)} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard label="Tổng email" value={stats.total_sent} icon={<Mail className="w-5 h-5 text-indigo-600" />} />
                <StatCard label="Thành công" value={`${stats.success_rate}%`} subValue={`${stats.success_count} email`} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
                <StatCard label="Thất bại" value={`${stats.failed_rate}%`} subValue={`${stats.failed_count} email`} icon={<AlertCircle className="w-5 h-5 text-red-600" />} />
                <StatCard label="Chờ xử lý" value={`${stats.pending_rate}%`} subValue={`${stats.pending_count} email`} icon={<Clock className="w-5 h-5 text-amber-600" />} />
                <StatCard label="Gửi gần nhất" value={formatDateTime(stats.last_sent)} subValue="Email cuối cùng" icon={<TrendingUp className="w-5 h-5 text-violet-600" />} />
            </motion.div>

            <motion.div {...fadeUp(0.1)}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1 w-full justify-start h-auto overflow-x-auto">
                        <TabsTrigger value="overview" className="rounded-xl text-sm font-bold px-4 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <BarChart3 className="w-4 h-4 mr-2" /> Tổng quan
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="rounded-xl text-sm font-bold px-4 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <Mail className="w-4 h-4 mr-2" /> Templates
                        </TabsTrigger>
                        <TabsTrigger value="categories" className="rounded-xl text-sm font-bold px-4 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <Sparkles className="w-4 h-4 mr-2" /> Danh mục
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="rounded-xl text-sm font-bold px-4 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <TrendingUp className="w-4 h-4 mr-2" /> Nhật ký
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartPanel title="Xu hướng gửi email 30 ngày">
                                {statsLoading || stats.daily_trend.length === 0 ? (
                                    <EmptyChartState loading={statsLoading} />
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={stats.daily_trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartPanel>

                            <ChartPanel title="Phân bố trạng thái">
                                {statsLoading || statusDistribution.every((item) => item.value === 0) ? (
                                    <EmptyChartState loading={statsLoading} />
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={statusDistribution} dataKey="value" nameKey="name" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartPanel>

                            <ChartPanel title="Mẫu email được dùng nhiều nhất" className="lg:col-span-2">
                                {statsLoading || templateDistribution.length === 0 ? (
                                    <EmptyChartState loading={statsLoading} />
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={templateDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={70} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#4f46e5" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartPanel>
                        </div>
                    </TabsContent>

                    <TabsContent value="templates" className="space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Template email</p>
                                        <p className="text-xs text-slate-500">Tạo, sửa, xóa và test gửi template</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative w-full sm:w-72">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Tìm template..." className="pl-10 rounded-xl" />
                                        </div>
                                        <Button variant="outline" onClick={handleOpenCreateTemplate} className="rounded-xl">
                                            <Plus className="w-4 h-4 mr-2" /> Tạo mới
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    {templatesLoading ? (
                                        <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                                    ) : templates.length === 0 ? (
                                        <div className="py-16 text-center text-slate-400 font-medium">Chưa có template email</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Tên</th>
                                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Danh mục</th>
                                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày tạo</th>
                                                    <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {templates.map((template) => (
                                                    <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="font-semibold text-slate-900">{template.name}</div>
                                                            <div className="text-xs text-slate-400">{template.slug}</div>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-slate-600">{template.category?.name ?? '—'}</td>
                                                        <td className="py-4 px-6">
                                                            <Badge className={`${template.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'} border text-[10px] font-bold`}>
                                                                {template.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-6 text-xs text-slate-500">{formatDateTime(template.created_at)}</td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handlePickTemplate(template)}>
                                                                    <PencilLine className="w-3.5 h-3.5 mr-1.5" /> Sửa
                                                                </Button>
                                                                <Button variant="outline" size="sm" className="rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => handlePickTemplate(template)}>
                                                                    <Send className="w-3.5 h-3.5 mr-1.5" /> Test
                                                                </Button>
                                                                <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDeleteTemplate(template)}>
                                                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Chế độ chỉnh sửa</p>
                                            <p className="text-xs text-slate-500">Form tạo/sửa template được mở bằng dialog để giữ layout gọn hơn</p>
                                        </div>
                                        {selectedTemplateSlug && <Badge className="bg-violet-50 text-violet-700 border-violet-200">Đang chọn</Badge>}
                                    </div>

                                    <div className="space-y-3 text-sm text-slate-600">
                                        <p>Template hiện tại: <span className="font-semibold text-slate-900">{selectedTemplate?.name || 'Chưa chọn'}</span></p>
                                        <p>Hành động nhanh:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button onClick={handleOpenCreateTemplate} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                                <Plus className="w-4 h-4 mr-2" /> Tạo template
                                            </Button>
                                            <Button variant="outline" onClick={() => selectedTemplate && handlePickTemplate(selectedTemplate)} disabled={!selectedTemplate} className="rounded-xl">
                                                <PencilLine className="w-4 h-4 mr-2" /> Sửa template
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-5 border-t border-slate-100 pt-5">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Gửi email test</p>
                                                <p className="text-xs text-slate-500">Chạy test-send trên template đang chọn</p>
                                            </div>
                                            <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">API /test-send</Badge>
                                        </div>
                                        <Input value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} placeholder="recipient@example.com" className="rounded-xl" />
                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            <Button onClick={() => testTemplateMutation.mutate()} disabled={testTemplateMutation.isPending || !selectedTemplateSlug} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                                                {testTemplateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                                Gửi test
                                            </Button>
                                            <Button variant="outline" onClick={() => setTestRecipient('')} className="rounded-xl">
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Danh mục template</p>
                                        <p className="text-xs text-slate-500">Quản lý nhóm template email</p>
                                    </div>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="Tìm danh mục..." className="pl-10 rounded-xl" />
                                    </div>
                                </div>

                                {categoriesLoading ? (
                                    <div className="py-12 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                                ) : categories.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400 font-medium">Chưa có danh mục</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {categories.map((category) => (
                                            <div key={category.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-slate-900">{category.name}</p>
                                                        <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px]">{category.slug}</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{category.description || '—'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handlePickCategory(category)}>
                                                        <PencilLine className="w-3.5 h-3.5 mr-1.5" /> Sửa
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDeleteCategory(category)}>
                                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Chế độ chỉnh sửa</p>
                                        <p className="text-xs text-slate-500">Form tạo/sửa danh mục cũng mở bằng dialog</p>
                                    </div>
                                    {selectedCategorySlug && <Badge className="bg-violet-50 text-violet-700 border-violet-200">Đang chọn</Badge>}
                                </div>

                                <div className="space-y-3 text-sm text-slate-600">
                                    <p>Danh mục hiện tại: <span className="font-semibold text-slate-900">{selectedCategory?.name || 'Chưa chọn'}</span></p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={handleOpenCreateCategory} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                                            <Plus className="w-4 h-4 mr-2" /> Tạo danh mục
                                        </Button>
                                        <Button variant="outline" onClick={() => selectedCategory && handlePickCategory(selectedCategory)} disabled={!selectedCategory} className="rounded-xl">
                                            <PencilLine className="w-4 h-4 mr-2" /> Sửa danh mục
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1 relative max-w-2xl">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={logSearch}
                                    onChange={(event) => {
                                        setLogSearch(event.target.value);
                                        setLogPage(1);
                                    }}
                                    placeholder="Tìm theo người nhận, subject, template..."
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {(['all', 'sent', 'pending', 'failed'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setLogStatus(status);
                                            setLogPage(1);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${logStatus === status ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        {status === 'all' ? 'Tất cả' : status === 'sent' ? 'Đã gửi' : status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {logsLoading ? (
                                <div className="py-16 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                            ) : logs.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 font-medium">Không có nhật ký email</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Người nhận</th>
                                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Subject</th>
                                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Template</th>
                                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Lỗi</th>
                                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {logs.map((email) => (
                                                <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6 text-slate-900 text-xs font-medium">{email.recipient}</td>
                                                    <td className="py-4 px-6 text-slate-600 text-xs max-w-sm truncate">{email.subject}</td>
                                                    <td className="py-4 px-6 text-slate-600 text-xs">{email.template_name || '—'}</td>
                                                    <td className="py-4 px-6">
                                                        <Badge className={`${statusBadgeClass(email.status)} border text-[10px] font-bold`}>
                                                            {email.status === 'sent' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                            {email.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                                                            {email.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                                            {email.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">{email.error_message || '—'}</td>
                                                    <td className="py-4 px-6 text-xs text-slate-500">{formatDateTime(email.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalLogPages > 1 && (
                                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
                                    <p className="text-xs font-medium text-slate-500">Trang {logPage} / {totalLogPages} - {totalLogs} bản ghi</p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="rounded-lg" disabled={logPage <= 1} onClick={() => setLogPage((page) => Math.max(1, page - 1))}>
                                            Trước
                                        </Button>
                                        <Button variant="outline" size="sm" className="rounded-lg" disabled={logPage >= totalLogPages} onClick={() => setLogPage((page) => Math.min(totalLogPages, page + 1))}>
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>

            <Dialog open={templateDialogOpen} onOpenChange={(open) => {
                setTemplateDialogOpen(open);
                if (!open) {
                    setSelectedTemplateSlug('');
                    setTemplateForm(emptyTemplateForm());
                }
            }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedTemplateSlug ? 'Chỉnh sửa template' : 'Tạo template mới'}</DialogTitle>
                        <DialogDescription>Điền nội dung template email, biến JSON và trạng thái hoạt động.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input value={templateForm.name} onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Tên template" />
                        <Input value={templateForm.slug} onChange={(event) => setTemplateForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="slug-template" />
                        <select value={templateForm.category_id} onChange={(event) => setTemplateForm((prev) => ({ ...prev, category_id: event.target.value }))} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                            <option value="">Không có danh mục</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                        <Input value={templateForm.subject} onChange={(event) => setTemplateForm((prev) => ({ ...prev, subject: event.target.value }))} placeholder="Subject" />
                        <Textarea value={templateForm.body} onChange={(event) => setTemplateForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="Nội dung email" rows={8} />
                        <Textarea value={templateForm.variables} onChange={(event) => setTemplateForm((prev) => ({ ...prev, variables: event.target.value }))} placeholder='{"full_name": "..."}' rows={6} className="font-mono text-xs" />
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input type="checkbox" checked={templateForm.is_active} onChange={(event) => setTemplateForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
                            Kích hoạt template
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleResetTemplate} className="rounded-xl">
                            Hủy
                        </Button>
                        <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                            {saveTemplateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Lưu template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
                setCategoryDialogOpen(open);
                if (!open) {
                    setSelectedCategorySlug('');
                    setCategoryForm(emptyCategoryForm());
                }
            }}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedCategorySlug ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}</DialogTitle>
                        <DialogDescription>Dùng để nhóm các template email theo chủ đề.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Tên danh mục" />
                        <Input value={categoryForm.slug} onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="slug-danh-muc" />
                        <Textarea value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Mô tả" rows={5} />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleResetCategory} className="rounded-xl">
                            Hủy
                        </Button>
                        <Button onClick={() => saveCategoryMutation.mutate()} disabled={saveCategoryMutation.isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                            {saveCategoryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Lưu danh mục
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, subValue, icon }: { label: string; value: string | number; subValue?: string; icon: ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="text-xl font-black text-slate-900 mt-2 break-words">{value}</p>
                    {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">{icon}</div>
            </div>
        </div>
    );
}

function ChartPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${className}`}>
            <p className="text-sm font-bold text-slate-900 mb-4">{title}</p>
            {children}
        </div>
    );
}

function EmptyChartState({ loading }: { loading: boolean }) {
    return (
        <div className="h-[300px] flex items-center justify-center text-slate-400">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Không có dữ liệu'}
        </div>
    );
}
