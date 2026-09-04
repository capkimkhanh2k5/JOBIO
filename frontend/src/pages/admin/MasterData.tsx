import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { useUrlSearchParam } from '@/hooks/useUrlSearchParam';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const PAGE_SIZE = 20;

const tabs = [
    { id: 'skills', label: 'Kỹ năng', icon: Tag },
    { id: 'industries', label: 'Lĩnh vực CNTT', icon: Building2 },
    { id: 'job-categories', label: 'Danh mục việc làm', icon: Briefcase },
    { id: 'benefits', label: 'Phúc lợi', icon: Gift },
] as const;

type TabId = (typeof tabs)[number]['id'];

const isTabId = (value: string | null): value is TabId =>
    tabs.some((tab) => tab.id === value);

interface EditModal {
    open: boolean;
    mode: 'create' | 'edit';
    tab: TabId;
    item?: any;
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function generateSlug(text: string) {
    return text.toString().toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
        .replace(/đ/gi, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
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
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border/60">
                            {columns.map(col => (
                                <th key={col.key} className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-muted-foreground">{col.label}</th>
                            ))}
                            <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-muted-foreground w-24">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={columns.length + 1} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" /></td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="py-16 text-center text-muted-foreground/60 font-medium text-sm">Không có dữ liệu</td></tr>
                        ) : data.map((row) => (
                            <tr key={row.id} className="hover:bg-muted/50 transition-colors group">
                                {columns.map(col => (
                                    <td key={col.key} className="py-4 px-6">
                                        {col.render ? col.render(row) : (
                                            <span className="font-medium text-foreground">{row[col.key] ?? '—'}</span>
                                        )}
                                    </td>
                                ))}
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(row)} className="p-2 rounded-xl hover:bg-teal-50 text-muted-foreground/60 hover:text-teal-600 transition-all cursor-pointer" title="Sửa">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDelete(row.id)} className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground/60 hover:text-red-600 transition-all cursor-pointer" title="Xóa">
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
            <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground font-medium">
                    Hiển thị <span className="font-bold text-foreground">{data.length}</span> / <span className="font-bold text-foreground">{total}</span>
                </p>
                <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60">
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-card hover:shadow-sm" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center px-3 h-8 bg-card border border-border rounded-lg shadow-sm">
                        <span className="text-xs font-black text-teal-600">{page}</span>
                        <span className="mx-1.5 text-muted-foreground/40 text-[10px]">/</span>
                        <span className="text-xs font-bold text-muted-foreground">{totalPages}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-card hover:shadow-sm" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}>
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
    const [iconUrl, setIconUrl] = useState(modal.item?.icon_url ?? '');
    const [categoryId, setCategoryId] = useState<number | ''>(modal.item?.category ?? '');

    const { data: skillCategories } = useQuery({
        queryKey: ['skill-categories'],
        queryFn: () => dashboardService.listSkillCategories().then(r => r.data),
        enabled: modal.tab === 'skills',
    });

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
        onError: () => toast.error('Có lỗi xảy ra (kiểm tra lại kết nối hoặc dữ liệu URL)'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            name,
            slug: generateSlug(name)
        };

        if (desc) payload.description = desc;

        // Handle icons for models except skills
        if (modal.tab !== 'skills' && iconUrl) {
            payload.icon_url = iconUrl;
        }

        // Handle category validation for skills
        if (modal.tab === 'skills') {
            if (!categoryId) {
                toast.error('Vui lòng chọn danh mục kỹ năng');
                return;
            }
            payload.category = Number(categoryId);
        }

        mut.mutate(payload);
    };

    const tabLabels: Record<TabId, string> = {
        'skills': 'Kỹ năng',
        'industries': 'Lĩnh vực CNTT',
        'job-categories': 'Danh mục việc làm',
        'benefits': 'Phúc lợi',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-card rounded-2xl shadow-2xl border border-border p-6 w-full max-w-md mx-4 z-10"
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-black text-foreground text-lg">
                        {modal.mode === 'create' ? `Thêm ${tabLabels[modal.tab]}` : `Sửa ${tabLabels[modal.tab]}`}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground/60 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-foreground/80 uppercase tracking-wider mb-1.5 block">Tên *</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder={`Nhập tên ${tabLabels[modal.tab]}...`}
                            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                        />
                    </div>

                    {modal.tab === 'skills' && (
                        <div>
                            <label className="text-xs font-black text-foreground/80 uppercase tracking-wider mb-1.5 block">Danh mục *</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-card"
                            >
                                <option value="" disabled>Chọn danh mục</option>
                                {skillCategories?.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {modal.tab !== 'skills' && (
                        <div>
                            <label className="text-xs font-black text-foreground/80 uppercase tracking-wider mb-1.5 block">URL Icon (Tùy chọn)</label>
                            <input
                                value={iconUrl}
                                onChange={e => setIconUrl(e.target.value)}
                                placeholder="https://example.com/icon.png"
                                type="url"
                                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-black text-foreground/80 uppercase tracking-wider mb-1.5 block">Mô tả</label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            rows={3}
                            placeholder="Mô tả ngắn..."
                            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Hủy</Button>
                        <Button type="submit" disabled={mut.isPending} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold">
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
    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<TabId>(isTabId(urlTab) ? urlTab : 'skills');
    const [search, setSearch] = useUrlSearchParam();
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState<EditModal | null>(null);
    const qc = useQueryClient();

    useEffect(() => {
        if (isTabId(urlTab)) {
            setActiveTab(urlTab);
            setPage(1);
        }
    }, [urlTab]);

    // Reset page on tab change
    const switchTab = (tab: TabId) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tab', tab);
        nextParams.delete('search');
        setSearchParams(nextParams, { replace: true });
        setActiveTab(tab);
        setPage(1);
        setSearch('');
    };

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
        queryFn: () => dashboardService.listBenefitCategories({ search: search || undefined, page }).then(r => r.data),
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
    const totalPages = Math.max(1, Array.isArray(raw) ? Math.ceil(total / PAGE_SIZE) : raw?.total_pages ?? Math.ceil(total / PAGE_SIZE));

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
                { key: 'name', label: 'Tên kỹ năng', render: (r: any) => (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{r.name}</span>
                        {r.is_verified === false && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] px-1.5 py-0 uppercase">Chờ duyệt</Badge>
                        )}
                    </div>
                )},
                { key: 'category', label: 'Danh mục', render: (r: any) => <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-bold">{r.category_name ?? r.category ?? '—'}</Badge> },
                { key: 'usage_count', label: 'Lượt dùng', render: (r: any) => <span className="font-bold text-muted-foreground">{r.usage_count ?? 0}</span> },
            ];
            case 'industries': return [
                { key: 'name', label: 'Lĩnh vực CNTT', render: (r: any) => <div className="flex items-center gap-2"><span className="font-bold text-foreground">{r.name}</span></div> },
                { key: 'slug', label: 'Slug', render: (r: any) => <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{r.slug}</code> },
                { key: 'description', label: 'Mô tả', render: (r: any) => <span className="text-muted-foreground text-xs line-clamp-1">{r.description || '—'}</span> },
            ];
            case 'job-categories': return [
                { key: 'name', label: 'Danh mục', render: (r: any) => <div className="flex items-center gap-2"><div><p className="font-bold text-foreground">{r.name}</p>{r.parent_name && <p className="text-xs text-muted-foreground/60">{r.parent_name}</p>}</div></div> },
                { key: 'slug', label: 'Slug', render: (r: any) => <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{r.slug}</code> },
            ];
            case 'benefits': return [
                { key: 'name', label: 'Phúc lợi', render: (r: any) => <div className="flex items-center gap-2"><span className="font-bold text-foreground">{r.name}</span></div> },
                { key: 'description', label: 'Mô tả', render: (r: any) => <span className="text-muted-foreground text-xs line-clamp-1">{r.description || '—'}</span> },
            ];
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <Database className="w-6 h-6 text-teal-600" />
                        Dữ liệu danh mục
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý kỹ năng, lĩnh vực CNTT, danh mục và phúc lợi toàn hệ thống</p>
                </div>
                <Button
                    onClick={() => setModal({ open: true, mode: 'create', tab: activeTab })}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Thêm mới
                </Button>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex items-center gap-1.5 bg-card border border-border/80 p-1.5 w-fit rounded-2xl shadow-sm flex-wrap">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
                                className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer
                                    ${isActive
                                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Search */}
            <motion.div {...fadeUp(0.1)}>
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                        <input
                            type="text"
                            placeholder={`Tìm kiếm ${tabs.find(t => t.id === activeTab)?.label?.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 bg-muted/50 text-sm font-medium transition-all"
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
                        toast('Bạn có chắc muốn xóa?', {
                            description: 'Hành động này không thể hoàn tác.',
                            action: {
                                label: 'Xóa',
                                onClick: () => deleteMut.mutate(id),
                            },
                            cancel: {
                                label: 'Hủy',
                                onClick: () => {},
                            },
                        });
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
