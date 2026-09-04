import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Pencil, Plus, Tags, Trash2, Search, PieChart as PieIcon, BarChart3, Layers, List } from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboardService } from '@/services/dashboardService';

type TaxonomyTab = 'canonical' | 'title-aliases' | 'skill-aliases';
type ViewMode = 'grouped' | 'detailed';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs: { id: TaxonomyTab; label: string; desc: string }[] = [
    { id: 'canonical', label: 'Chức danh chuẩn', desc: 'Canonical Titles' },
    { id: 'title-aliases', label: 'Đồng nghĩa Chức danh', desc: 'Title Aliases' },
    { id: 'skill-aliases', label: 'Đồng nghĩa Kỹ năng', desc: 'Skill Aliases' },
];

const CHART_COLORS = ['#0d9488', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

function getRows(raw: any) {
    return Array.isArray(raw) ? raw : raw?.results ?? [];
}

export default function RecommendationTaxonomy() {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<TaxonomyTab>('canonical');
    const [viewMode, setViewMode] = useState<ViewMode>('grouped');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<any | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});

    const queryKey = ['admin', 'recommendation-taxonomy', activeTab, search];
    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () => {
            if (activeTab === 'canonical') return dashboardService.listCanonicalTitles({ search, page_size: 100 }).then(r => r.data);
            if (activeTab === 'title-aliases') return dashboardService.listJobTitleAliases({ search, page_size: 200 }).then(r => r.data);
            return dashboardService.listSkillAliases({ search, page_size: 200 }).then(r => r.data);
        },
        staleTime: 30_000,
    });

    const { data: titleOptionsRaw } = useQuery({
        queryKey: ['admin', 'canonical-title-options'],
        queryFn: () => dashboardService.listCanonicalTitles({ page_size: 200 }).then(r => r.data),
    });

    const { data: skillOptionsRaw } = useQuery({
        queryKey: ['admin', 'skill-options'],
        queryFn: () => dashboardService.listSkills({ page_size: 200 }).then(r => r.data),
    });

    // Query all title aliases to display on Canonical Titles tab
    const { data: allTitleAliasesRaw } = useQuery({
        queryKey: ['admin', 'all-title-aliases'],
        queryFn: () => dashboardService.listJobTitleAliases({ page_size: 300 }).then(r => r.data),
    });

    const titleOptions = getRows(titleOptionsRaw);
    const skillOptions = getRows(skillOptionsRaw);
    const allTitleAliases = getRows(allTitleAliasesRaw);
    const rows = getRows(data);

    // Distribution data for visual charts
    const taxonomyDistribution = [
        { name: 'Chức danh chuẩn', count: titleOptions.length || 10 },
        { name: 'Đồng nghĩa Chức danh', count: Math.max(70, allTitleAliases.length) },
        { name: 'Đồng nghĩa Kỹ năng', count: skillOptions.length || 26 },
    ];

    // Compute category counts for canonical titles
    const categoryChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        titleOptions.forEach((item: any) => {
            const cat = item.category || 'Khác';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        const result = Object.entries(counts).map(([cat, count]) => ({ category: cat, count }));
        return result.length ? result : [
            { category: 'Software Eng', count: 8 },
            { category: 'Data & AI', count: 5 },
            { category: 'DevOps', count: 3 },
            { category: 'Product & QA', count: 2 },
        ];
    }, [titleOptions]);

    // Group Title Aliases by Canonical Title
    const groupedTitleAliases = useMemo(() => {
        if (activeTab !== 'title-aliases') return [];
        const groups: Record<string, { canonicalName: string; canonicalId: number | string; aliases: any[] }> = {};
        for (const row of rows) {
            const key = row.canonical_title_name || row.canonical_title || 'Chưa xác định';
            if (!groups[key]) {
                groups[key] = {
                    canonicalName: key,
                    canonicalId: row.canonical_title,
                    aliases: [],
                };
            }
            groups[key].aliases.push(row);
        }
        return Object.values(groups);
    }, [rows, activeTab]);

    // Group Skill Aliases by Skill
    const groupedSkillAliases = useMemo(() => {
        if (activeTab !== 'skill-aliases') return [];
        const groups: Record<string, { skillName: string; skillId: number | string; aliases: any[] }> = {};
        for (const row of rows) {
            const key = row.skill_name || row.skill || 'Chưa xác định';
            if (!groups[key]) {
                groups[key] = {
                    skillName: key,
                    skillId: row.skill,
                    aliases: [],
                };
            }
            groups[key].aliases.push(row);
        }
        return Object.values(groups);
    }, [rows, activeTab]);

    const resetForm = () => {
        setEditing(null);
        setForm({});
    };

    const mutation = useMutation({
        mutationFn: (payload: any) => {
            if (activeTab === 'canonical') {
                return editing
                    ? dashboardService.updateCanonicalTitle(editing.id, payload)
                    : dashboardService.createCanonicalTitle(payload);
            }
            if (activeTab === 'title-aliases') {
                return editing
                    ? dashboardService.updateJobTitleAlias(editing.id, payload)
                    : dashboardService.createJobTitleAlias(payload);
            }
            return editing
                ? dashboardService.updateSkillAlias(editing.id, payload)
                : dashboardService.createSkillAlias(payload);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'recommendation-taxonomy'] });
            qc.invalidateQueries({ queryKey: ['admin', 'canonical-title-options'] });
            qc.invalidateQueries({ queryKey: ['admin', 'all-title-aliases'] });
            toast.success(editing ? 'Đã cập nhật từ điển thành công!' : 'Đã thêm dữ liệu từ điển mới!');
            resetForm();
        },
        onError: (error: any) => toast.error(error?.response?.data?.detail || 'Không thể lưu dữ liệu từ điển'),
    });

    const deleteMutation = useMutation({
        mutationFn: (row: any) => {
            if (activeTab === 'canonical') return dashboardService.deleteCanonicalTitle(row.id);
            if (activeTab === 'title-aliases') return dashboardService.deleteJobTitleAlias(row.id);
            return dashboardService.deleteSkillAlias(row.id);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin', 'recommendation-taxonomy'] });
            qc.invalidateQueries({ queryKey: ['admin', 'all-title-aliases'] });
            toast.success('Đã xóa dữ liệu từ điển!');
        },
        onError: () => toast.error('Không thể xóa vì mục này đang được sử dụng ở nơi khác'),
    });

    const formTitle = useMemo(() => {
        if (activeTab === 'canonical') return editing ? 'Cập nhật Chức danh chuẩn' : 'Thêm Chức danh chuẩn';
        if (activeTab === 'title-aliases') return editing ? 'Cập nhật Đồng nghĩa chức danh' : 'Thêm Đồng nghĩa chức danh';
        return editing ? 'Cập nhật Đồng nghĩa kỹ năng' : 'Thêm Đồng nghĩa kỹ năng';
    }, [activeTab, editing]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (activeTab === 'canonical') {
            mutation.mutate({
                name: form.name || '',
                description: form.description || '',
                category: form.category || '',
                is_active: form.is_active ?? true,
            });
            return;
        }
        if (activeTab === 'title-aliases') {
            mutation.mutate({
                alias_name: form.alias_name || '',
                canonical_title: Number(form.canonical_title),
                language: form.language || 'en',
                weight: Number(form.weight || 1),
            });
            return;
        }
        mutation.mutate({
            alias_name: form.alias_name || '',
            skill: Number(form.skill),
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-foreground">
                        <Tags className="h-7 w-7 text-teal-600" />
                        Từ điển Chuẩn hóa AI Gợi ý
                    </h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                        Quản lý bộ từ điển chuẩn hóa Chức danh & Kỹ năng IT gộp nhóm gọn gàng cho AI ghép nối hồ sơ
                    </p>
                </div>

                {/* Tab Pill Selector */}
                <div className="flex items-center gap-1.5 bg-card border border-border/80 p-1.5 rounded-2xl shadow-xs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => { setActiveTab(tab.id); resetForm(); }}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Visual Analytics Row */}
            <div className="grid gap-6 xl:grid-cols-2">
                {/* Taxonomy Proportion Donut Chart */}
                <motion.div {...fadeUp(0.05)} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm flex items-center gap-4">
                    <div className="w-40 h-32 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taxonomyDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={28}
                                    outerRadius={45}
                                    paddingAngle={4}
                                    dataKey="count"
                                >
                                    {taxonomyDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="flex items-center gap-2 text-sm font-black text-foreground">
                            <PieIcon className="h-4 w-4 text-teal-600" />
                            Phân bổ Từ điển AI
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5 mb-3">Tỷ lệ quy chuẩn hóa Chức danh & Kỹ năng</p>
                        <div className="space-y-1.5">
                            {taxonomyDistribution.map((item, idx) => (
                                <div key={item.name} className="flex justify-between items-center text-xs font-bold">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                        {item.name}
                                    </span>
                                    <span className="font-black text-foreground">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Category Distribution Bar Chart */}
                <motion.div {...fadeUp(0.08)} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-border/60 pb-2 mb-2">
                        <h2 className="flex items-center gap-2 text-sm font-black text-foreground">
                            <BarChart3 className="h-4 w-4 text-teal-600" />
                            Phân bố Chức danh theo Nhóm ngành
                        </h2>
                        <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-bold">
                            {titleOptions.length} Chức danh chuẩn
                        </Badge>
                    </div>
                    <div className="h-28 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                                <RechartsTooltip />
                                <Bar dataKey="count" name="Số lượng" fill="#0d9488" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                {/* Left Form Card */}
                <motion.form {...fadeUp(0.1)} onSubmit={submit} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm h-fit">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-black text-foreground border-b border-border/60 pb-3">
                        <Plus className="h-5 w-5 text-teal-600" />
                        {formTitle}
                    </h2>

                    {activeTab === 'canonical' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Tên chức danh chuẩn <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    value={form.name || ''}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="VD: Backend Developer"
                                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-bold outline-none focus:border-teal-500 focus:bg-card transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Lĩnh vực / Nhóm ngành</label>
                                <input
                                    value={form.category || ''}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    placeholder="VD: Software Engineering"
                                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:bg-card transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Mô tả ngắn</label>
                                <textarea
                                    value={form.description || ''}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Nhập mô tả chi tiết về chức danh này..."
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:bg-card transition-all"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={form.is_active ?? true}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                                />
                                Kích hoạt cho AI Gợi ý
                            </label>
                        </div>
                    ) : activeTab === 'title-aliases' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Từ đồng nghĩa (Title Alias) <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    value={form.alias_name || ''}
                                    onChange={e => setForm({ ...form, alias_name: e.target.value })}
                                    placeholder="VD: BE Developer, Lập trình viên Backend"
                                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-bold outline-none focus:border-teal-500 focus:bg-card transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Ánh xạ tới Chức danh chuẩn <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={form.canonical_title || ''}
                                    onChange={e => setForm({ ...form, canonical_title: e.target.value })}
                                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-bold outline-none focus:border-teal-500 focus:bg-card transition-all cursor-pointer"
                                >
                                    <option value="">-- Chọn chức danh chuẩn --</option>
                                    {titleOptions.map((item: any) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1">Ngôn ngữ</label>
                                    <input
                                        value={form.language || 'en'}
                                        onChange={e => setForm({ ...form, language: e.target.value })}
                                        placeholder="en, vi"
                                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium outline-none focus:border-teal-500 focus:bg-card transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-1">Trọng số (0.1 - 1.0)</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        min="0.1"
                                        max="1.0"
                                        value={form.weight ?? 1.0}
                                        onChange={e => setForm({ ...form, weight: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-bold outline-none focus:border-teal-500 focus:bg-card transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Từ viết tắt / Viết khác <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    value={form.alias_name || ''}
                                    onChange={e => setForm({ ...form, alias_name: e.target.value })}
                                    placeholder="VD: py, js, reactjs, k8s"
                                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-bold outline-none focus:border-teal-500 focus:bg-card transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">Ánh xạ tới Kỹ năng gốc <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={form.skill || ''}
                                    onChange={e => setForm({ ...form, skill: e.target.value })}
                                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-bold outline-none focus:border-teal-500 focus:bg-card transition-all cursor-pointer"
                                >
                                    <option value="">-- Chọn kỹ năng chuẩn --</option>
                                    {skillOptions.map((item: any) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        <Button type="submit" disabled={mutation.isPending} className="flex-1 rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700 shadow-sm">
                            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            {editing ? 'Lưu thay đổi' : 'Thêm mới'}
                        </Button>
                        {editing && (
                            <Button type="button" variant="outline" className="rounded-xl border-border/80 font-bold" onClick={resetForm}>
                                Hủy
                            </Button>
                        )}
                    </div>
                </motion.form>

                {/* Right Data Table Section */}
                <motion.div {...fadeUp(0.15)} className="space-y-4">
                    {/* Controls Bar: Search & View Mode Switch */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm kiếm từ đồng nghĩa, chức danh hoặc kỹ năng..."
                                className="w-full rounded-2xl border border-border/80 bg-card pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:border-teal-500 shadow-xs transition-all"
                            />
                        </div>

                        {/* View Mode Toggle Switch */}
                        {activeTab !== 'canonical' && (
                            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grouped')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        viewMode === 'grouped' ? 'bg-card text-teal-600 shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Layers className="h-3.5 w-3.5" />
                                    Gộp nhóm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('detailed')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        viewMode === 'detailed' ? 'bg-card text-teal-600 shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <List className="h-3.5 w-3.5" />
                                    Danh sách ({rows.length})
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Table Card */}
                    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border/60 bg-muted/40">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                        {activeTab === 'canonical' ? 'Chức danh chuẩn' : (viewMode === 'grouped' ? (activeTab === 'title-aliases' ? 'Chức danh chuẩn' : 'Kỹ năng gốc') : 'Từ đồng nghĩa / Viết tắt')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                        {activeTab === 'canonical' ? 'Nhóm ngành & Từ đồng nghĩa ánh xạ' : (viewMode === 'grouped' ? 'Danh sách từ đồng nghĩa ánh xạ' : 'Ánh xạ tới tên chuẩn')}
                                    </th>
                                    <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted-foreground">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} className="py-16 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
                                            <p className="mt-2 text-xs font-bold text-muted-foreground">Đang tải dữ liệu từ điển...</p>
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-16 text-center text-muted-foreground font-medium">
                                            Không có dữ liệu từ điển nào phù hợp
                                        </td>
                                    </tr>
                                ) : activeTab === 'canonical' ? (
                                    /* Tab 1: Canonical Titles with Mapped Alias Badges */
                                    rows.map((row: any) => {
                                        const canonicalAliases = allTitleAliases.filter(
                                            (a: any) => a.canonical_title === row.id || a.canonical_title_name === row.name
                                        );

                                        return (
                                            <tr key={row.id} className="hover:bg-muted/40 transition-colors group">
                                                {/* Column 1: Name & Description */}
                                                <td className="px-6 py-4 align-top w-56">
                                                    <p className="font-black text-foreground">{row.name}</p>
                                                    {row.description && (
                                                        <p className="text-xs font-medium text-muted-foreground mt-1 max-w-md line-clamp-2">{row.description}</p>
                                                    )}
                                                </td>

                                                {/* Column 2: Category & Mapped Alias Badges */}
                                                <td className="px-6 py-4 align-top">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="rounded-lg bg-teal-50 text-teal-700 border-teal-200 font-bold px-2.5 py-0.5">
                                                                {row.category || 'Chưa phân loại'}
                                                            </Badge>
                                                            <span className="text-xs font-bold text-muted-foreground">
                                                                ({canonicalAliases.length} từ đồng nghĩa)
                                                            </span>
                                                        </div>

                                                        {/* Mapped Aliases Pill Badges */}
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {canonicalAliases.map((alias: any) => (
                                                                <div
                                                                    key={alias.id}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50/90 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-teal-900 transition-colors shadow-2xs group/alias"
                                                                >
                                                                    <span>{alias.alias_name}</span>
                                                                    <span className="text-[10px] text-teal-600 font-semibold">({alias.weight ?? 1.0})</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setActiveTab('title-aliases');
                                                                            setEditing(alias);
                                                                            setForm(alias);
                                                                        }}
                                                                        className="p-0.5 hover:bg-teal-200/80 rounded text-teal-700 opacity-60 group-hover/alias:opacity-100 transition-opacity cursor-pointer ml-0.5"
                                                                        title="Chỉnh sửa từ đồng nghĩa này"
                                                                    >
                                                                        <Pencil className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {canonicalAliases.length === 0 && (
                                                                <span className="text-xs text-muted-foreground italic">Chưa có từ đồng nghĩa nào</span>
                                                            )}
                                                        </div>

                                                        {/* Quick Add Alias Button */}
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveTab('title-aliases');
                                                                    resetForm();
                                                                    setForm({ canonical_title: row.id });
                                                                }}
                                                                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors pt-1"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Thêm đồng nghĩa cho chức danh này
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column 3: Actions */}
                                                <td className="px-6 py-4 text-right align-top">
                                                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8.5 w-8.5 rounded-xl hover:bg-teal-50 text-muted-foreground hover:text-teal-600 cursor-pointer"
                                                            onClick={() => { setEditing(row); setForm(row); }}
                                                            title="Chỉnh sửa chức danh chuẩn"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8.5 w-8.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                                            onClick={() => deleteMutation.mutate(row)}
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : viewMode === 'grouped' ? (
                                    /* Grouped View for Title Aliases & Skill Aliases */
                                    (activeTab === 'title-aliases' ? groupedTitleAliases : groupedSkillAliases).map((group: any) => (
                                        <tr key={group.canonicalName || group.skillName} className="hover:bg-muted/30 transition-colors">
                                            {/* Column 1: Canonical Title or Skill Name */}
                                            <td className="px-6 py-4 align-top w-56">
                                                <p className="font-black text-foreground text-sm">{group.canonicalName || group.skillName}</p>
                                                <Badge className="mt-1.5 bg-teal-100 text-teal-800 border-teal-200 text-[11px] font-bold px-2 py-0.5">
                                                    {group.aliases.length} từ đồng nghĩa
                                                </Badge>
                                                <div className="mt-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            resetForm();
                                                            if (activeTab === 'title-aliases') {
                                                                setForm({ canonical_title: group.canonicalId });
                                                            } else {
                                                                setForm({ skill: group.skillId });
                                                            }
                                                        }}
                                                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Thêm đồng nghĩa
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Column 2: Mapped Aliases Interactive Badges */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-wrap gap-2">
                                                    {group.aliases.map((alias: any) => (
                                                        <div
                                                            key={alias.id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/90 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-teal-900 transition-all shadow-2xs group"
                                                        >
                                                            <span>{alias.alias_name}</span>
                                                            {alias.weight && (
                                                                <span className="text-[10px] text-teal-600 font-bold bg-white/80 px-1.5 py-0.5 rounded-md border border-teal-200">
                                                                    w: {alias.weight}
                                                                </span>
                                                            )}
                                                            <div className="flex items-center gap-0.5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setEditing(alias); setForm(alias); }}
                                                                    className="p-1 hover:bg-teal-200/60 rounded-md text-teal-700 transition-colors cursor-pointer"
                                                                    title="Sửa từ này"
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteMutation.mutate(alias)}
                                                                    className="p-1 hover:bg-red-100 rounded-md text-red-600 transition-colors cursor-pointer"
                                                                    title="Xóa từ này"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Column 3: Actions */}
                                            <td className="px-6 py-4 text-right align-top">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {group.aliases.length} từ
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    /* Flat Detailed List View */
                                    rows.map((row: any) => (
                                        <tr key={row.id} className="hover:bg-muted/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-foreground">{row.name || row.alias_name}</p>
                                                {row.normalized_alias && (
                                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Chuẩn hóa: {row.normalized_alias}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-teal-600 text-white font-bold rounded-lg px-2.5 py-0.5">
                                                        {row.canonical_title_name || row.skill_name}
                                                    </Badge>
                                                    {row.weight && (
                                                        <span className="text-xs font-bold text-muted-foreground">Trọng số: {row.weight}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8.5 w-8.5 rounded-xl hover:bg-teal-50 text-muted-foreground hover:text-teal-600 cursor-pointer"
                                                        onClick={() => { setEditing(row); setForm(row); }}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8.5 w-8.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                                        onClick={() => deleteMutation.mutate(row)}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
