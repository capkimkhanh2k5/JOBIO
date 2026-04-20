import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Database, Search, Plus, Pencil, Trash2, Loader2,
    ChevronLeft, ChevronRight, Check, X, Tag, Briefcase, Building2, Gift
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'skills', label: 'Kỹ năng', icon: Tag },
    { id: 'industries', label: 'Ngành nghề', icon: Building2 },
    { id: 'job-categories', label: 'Danh mục việc làm', icon: Briefcase },
    { id: 'benefits', label: 'Phúc lợi', icon: Gift },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface EditModal {
    open: boolean;
    mode: 'create' | 'edit';
    tab: TabId;
    item?: any;
}

// ─── Generic List Table ──────────────────────────────────────────────────────

function DataTable({
    data, loading, columns, onEdit, onDelete, page, setPage, totalPages, total
}: {
    data: any[];
    loading: boolean;
    columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
    page: number;
    setPage: (p: number) => void;
    totalPages: number;
    total: number;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            {columns.map(col => (
                                <th key={col.key} className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">{col.label}</th>
                            ))}
                            <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500 w-24">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={columns.length + 1} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="py-16 text-center text-slate-400 font-medium text-sm">Không có dữ liệu</td></tr>
                        ) : data.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                {columns.map(col => (
                                    <td key={col.key} className="py-4 px-6">
                                        {col.render ? col.render(row) : (
                                            <span className="font-medium text-slate-900">{row[col.key] ?? '—'}</span>
                                        )}
                                    </td>
                                ))}
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(row)} className="p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-all cursor-pointer" title="Sửa">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDelete(row.id)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer" title="Xóa">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                    Hiển thị <span className="font-bold text-slate-900">{data.length}</span> / <span className="font-bold text-slate-900">{total}</span>
                </p>
                <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <span className="text-xs font-black text-violet-600">{page}</span>
                        <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                        <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Quick Edit/Create Form ──────────────────────────────────────────────────

function QuickFormModal({ modal, onClose }: { modal: EditModal; onClose: () => void }) {
    const qc = useQueryClient();
    const [name, setName] = useState(modal.item?.name ?? '');
    const [desc, setDesc] = useState(modal.item?.description ?? '');
    const [icon, setIcon] = useState(modal.item?.icon ?? '');

    const svc = dashboardService as any;
    const createKey = modal.tab === 'skills' ? 'createSkill' : modal.tab === 'industries' ? 'createIndustry' : modal.tab === 'job-categories' ? 'createJobCategory' : 'createBenefitCategory';
    const updateKey = modal.tab === 'skills' ? 'updateSkill' : modal.tab === 'industries' ? 'updateIndustry' : modal.tab === 'job-categories' ? 'updateJobCategory' : 'updateBenefitCategory';
    const listKey = ['master-data', modal.tab];

    const mut = useMutation({
        mutationFn: (data: any) => modal.mode === 'create'
            ? svc[createKey](data)
            : svc[updateKey](modal.item.id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: listKey });
            toast.success(modal.mode === 'create' ? 'Đã tạo thành công!' : 'Đã cập nhật!');
            onClose();
        },
        onError: () => toast.error('Có lỗi xảy ra'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = { name };
        if (desc) payload.description = desc;
        if (icon) payload.icon = icon;
        mut.mutate(payload);
    };

    const tabLabels: Record<TabId, string> = {
        'skills': 'Kỹ năng',
        'industries': 'Ngành nghề',
        'job-categories': 'Danh mục việc làm',
        'benefits': 'Phúc lợi',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md mx-4 z-10"
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-slate-900 text-lg">
                        {modal.mode === 'create' ? `Thêm ${tabLabels[modal.tab]}` : `Sửa ${tabLabels[modal.tab]}`}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Tên *</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder={`Nhập tên ${tabLabels[modal.tab]}...`}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        />
                    </div>
                    {modal.tab !== 'skills' && (
                        <div>
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Icon (emoji / class)</label>
                            <input
                                value={icon}
                                onChange={e => setIcon(e.target.value)}
                                placeholder="Ví dụ: 💻 hoặc fa-code"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Mô tả</label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            rows={3}
                            placeholder="Mô tả ngắn..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Hủy</Button>
                        <Button type="submit" disabled={mut.isPending} className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold">
                            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                            {modal.mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterData() {
    const [activeTab, setActiveTab] = useState<TabId>('skills');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState<EditModal | null>(null);
    const qc = useQueryClient();

    // Reset page on tab change
    const switchTab = (tab: TabId) => { setActiveTab(tab); setPage(1); setSearch(''); };

    // ── Queries ──────────────────────────────────────────────────────────

    const { data: skillsData, isLoading: loadingSkills } = useQuery({
        queryKey: ['master-data', 'skills', page, search],
        queryFn: () => dashboardService.listSkills({ search: search || undefined, page }).then(r => r.data),
        enabled: activeTab === 'skills',
    });

    const { data: industriesData, isLoading: loadingIndustries } = useQuery({
        queryKey: ['master-data', 'industries', page, search],
        queryFn: () => dashboardService.listIndustries({ search: search || undefined, page }).then(r => r.data),
        enabled: activeTab === 'industries',
    });

    const { data: jobCatsData, isLoading: loadingJobCats } = useQuery({
        queryKey: ['master-data', 'job-categories', page, search],
        queryFn: () => dashboardService.listJobCategories({ search: search || undefined, page }).then(r => r.data),
        enabled: activeTab === 'job-categories',
    });

    const { data: benefitsData, isLoading: loadingBenefits } = useQuery({
        queryKey: ['master-data', 'benefits', page, search],
        queryFn: () => dashboardService.listBenefitCategories({ search: search || undefined }).then(r => r.data),
        enabled: activeTab === 'benefits',
    });

    // ── Current data ─────────────────────────────────────────────────────

    const getActiveData = () => {
        switch (activeTab) {
            case 'skills': return { raw: skillsData, loading: loadingSkills };
            case 'industries': return { raw: industriesData, loading: loadingIndustries };
            case 'job-categories': return { raw: jobCatsData, loading: loadingJobCats };
            case 'benefits': return { raw: benefitsData, loading: loadingBenefits };
        }
    };

    const { raw, loading } = getActiveData();
    const rows = Array.isArray(raw) ? raw : raw?.results ?? [];
    const total = Array.isArray(raw) ? rows.length : raw?.count ?? 0;
    const totalPages = Math.ceil(total / 20) || 1;

    // ── Delete ────────────────────────────────────────────────────────────

    const svc = dashboardService as any;
    const deleteKey = activeTab === 'skills' ? 'deleteSkill' : activeTab === 'industries' ? 'deleteIndustry' : activeTab === 'job-categories' ? 'deleteJobCategory' : 'deleteBenefitCategory';

    const deleteMut = useMutation({
        mutationFn: (id: number) => svc[deleteKey](id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-data', activeTab] }); toast.success('Đã xóa!'); },
        onError: () => toast.error('Không thể xóa — có thể đang được sử dụng'),
    });

    // ── Columns ───────────────────────────────────────────────────────────

    const getColumns = () => {
        switch (activeTab) {
            case 'skills': return [
                { key: 'name', label: 'Tên kỹ năng', render: (r: any) => <span className="font-bold text-slate-900">{r.name}</span> },
                { key: 'category', label: 'Danh mục', render: (r: any) => <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px] font-bold">{r.category?.name ?? r.category ?? '—'}</Badge> },
                { key: 'usage_count', label: 'Lượt dùng', render: (r: any) => <span className="font-bold text-slate-600">{r.usage_count ?? 0}</span> },
            ];
            case 'industries': return [
                { key: 'name', label: 'Ngành nghề', render: (r: any) => <div className="flex items-center gap-2"><span className="text-xl">{r.icon || '🏢'}</span><span className="font-bold text-slate-900">{r.name}</span></div> },
                { key: 'slug', label: 'Slug', render: (r: any) => <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">{r.slug}</code> },
                { key: 'description', label: 'Mô tả', render: (r: any) => <span className="text-slate-500 text-xs line-clamp-1">{r.description || '—'}</span> },
            ];
            case 'job-categories': return [
                { key: 'name', label: 'Danh mục', render: (r: any) => <div className="flex items-center gap-2"><span className="text-xl">{r.icon || '📁'}</span><div><p className="font-bold text-slate-900">{r.name}</p>{r.parent && <p className="text-xs text-slate-400">{r.parent?.name}</p>}</div></div> },
                { key: 'slug', label: 'Slug', render: (r: any) => <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">{r.slug}</code> },
            ];
            case 'benefits': return [
                { key: 'name', label: 'Phúc lợi', render: (r: any) => <div className="flex items-center gap-2"><span className="text-xl">{r.icon || '🎁'}</span><span className="font-bold text-slate-900">{r.name}</span></div> },
                { key: 'description', label: 'Mô tả', render: (r: any) => <span className="text-slate-500 text-xs line-clamp-1">{r.description || '—'}</span> },
            ];
        }
    };

    // ── Stats ─────────────────────────────────────────────────────────────

    const statCards = [
        { label: 'Kỹ năng', icon: Tag, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Ngành nghề', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Danh mục việc làm', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Phúc lợi', icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Database className="w-6 h-6 text-violet-600" />
                        Dữ liệu danh mục
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý kỹ năng, ngành nghề, danh mục và phúc lợi toàn hệ thống</p>
                </div>
                <Button
                    onClick={() => setModal({ open: true, mode: 'create', tab: activeTab })}
                    className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Thêm mới
                </Button>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-slate-50/50 border border-slate-200 p-1 w-fit rounded-xl flex-wrap">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
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

            {/* Search */}
            <motion.div {...fadeUp(0.1)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Tìm kiếm ${tabs.find(t => t.id === activeTab)?.label?.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 bg-slate-50/50 text-sm font-medium transition-all"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div {...fadeUp(0.15)}>
                <DataTable
                    data={rows}
                    loading={loading}
                    columns={getColumns()}
                    onEdit={(item) => setModal({ open: true, mode: 'edit', tab: activeTab, item })}
                    onDelete={(id) => {
                        if (confirm('Bạn có chắc muốn xóa? Hành động này không thể hoàn tác.')) {
                            deleteMut.mutate(id);
                        }
                    }}
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                    total={total}
                />
            </motion.div>

            {/* Modal */}
            {modal?.open && (
                <QuickFormModal modal={modal} onClose={() => setModal(null)} />
            )}
        </div>
    );
}
