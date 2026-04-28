import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    FileText, Plus, Search, Edit3, Trash2, Eye,
    Tag, FolderOpen, Loader2, Star,
    ChevronLeft, ChevronRight, Clock, CheckCircle2,
    TrendingUp, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blogService } from '@/services/blogService';
import type { BlogPost, BlogCategory, BlogTag } from '@/types/api';
import { toast } from 'sonner';
import BlogPostFormModal from './BlogPostFormModal';
import { CategoryFormModal, TagFormModal } from './BlogCategoryTagModals';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'posts', label: 'Bài viết', icon: FileText },
    { id: 'categories', label: 'Danh mục', icon: FolderOpen },
    { id: 'tags', label: 'Tags', icon: Tag },
] as const;

type TabId = (typeof tabs)[number]['id'];

const STATUS_COLORS: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    archived: 'bg-amber-50 text-amber-700 border-amber-200',
};
const STATUS_LABELS: Record<string, string> = {
    published: 'Đã đăng',
    draft: 'Bản nháp',
    archived: 'Lưu trữ',
};

export default function BlogManagement() {
    const [activeTab, setActiveTab] = useState<TabId>('posts');
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    // Modal states
    const [showPostForm, setShowPostForm] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [showCatForm, setShowCatForm] = useState(false);
    const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);
    const [showTagForm, setShowTagForm] = useState(false);

    const qc = useQueryClient();

    useEffect(() => {
        const h = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 300);
        return () => clearTimeout(h);
    }, [searchQuery]);

    // ─── Queries ──────────────────────────────────────────────────────────────

    const { data: statsData } = useQuery({
        queryKey: ['admin-blog-stats'],
        queryFn: () => blogService.getAdminStats().then(r => r.data),
    });

    const { data: postsData, isLoading: loadingPosts } = useQuery({
        queryKey: ['admin-blog-posts', page, debouncedSearch, statusFilter],
        queryFn: () => blogService.listPosts({
            page,
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            page_size: 10
        }).then(r => r.data),
        enabled: activeTab === 'posts',
    });

    const { data: categoriesData, isLoading: loadingCats } = useQuery({
        queryKey: ['admin-blog-categories'],
        queryFn: () => blogService.listCategories().then(r => r.data),
        enabled: activeTab === 'categories',
    });

    const { data: tagsData, isLoading: loadingTags } = useQuery({
        queryKey: ['admin-blog-tags'],
        queryFn: () => blogService.listTags().then(r => r.data),
        enabled: activeTab === 'tags',
    });

    // ─── Mutations ────────────────────────────────────────────────────────────

    const deletePostMut = useMutation({
        mutationFn: (slug: string) => blogService.deletePost(slug),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            qc.invalidateQueries({ queryKey: ['admin-blog-stats'] });
            toast.success('Đã xóa bài viết');
        },
        onError: () => toast.error('Xóa thất bại'),
    });

    const banPostMut = useMutation({
        mutationFn: ({ slug, reason }: { slug: string; reason?: string }) => blogService.banPost(slug, reason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            qc.invalidateQueries({ queryKey: ['admin-blog-stats'] });
            toast.success('Đã cảnh báo và lưu trữ bài viết');
        },
        onError: () => toast.error('Không thể cảnh báo bài viết'),
    });

    const deleteCatMut = useMutation({
        mutationFn: (slug: string) => blogService.deleteCategory(slug),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            qc.invalidateQueries({ queryKey: ['admin-blog-categories'] });
            qc.invalidateQueries({ queryKey: ['admin-blog-stats'] });
            toast.success('Đã xóa danh mục');
        },
        onError: () => toast.error('Xóa thất bại'),
    });

    const deleteTagMut = useMutation({
        mutationFn: (slug: string) => blogService.deleteTag(slug),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-blog-tags'] });
            toast.success('Đã xóa tag');
        },
        onError: () => toast.error('Xóa thất bại'),
    });

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleDeletePost = (slug: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            deletePostMut.mutate(slug);
        }
    };
    const handleBanPost = (slug: string, title: string) => {
        const ok = window.confirm(`Cảnh báo bài viết "${title}" và chuyển sang lưu trữ?`);
        if (!ok) return;

        const reason = window.prompt('Nhập lý do cảnh báo (không bắt buộc):') ?? undefined;
        banPostMut.mutate({ slug, reason });
    };
    const handleDeleteCat = (slug: string, name: string) => {
        if (window.confirm(`Xóa danh mục "${name}"? Các bài viết thuộc danh mục này sẽ bị mất liên kết.`)) {
            deleteCatMut.mutate(slug);
        }
    };
    const handleDeleteTag = (slug: string) => {
        if (window.confirm('Xóa tag này?')) deleteTagMut.mutate(slug);
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setShowPostForm(true);
    };
    const handleEditCat = (cat: BlogCategory) => {
        setEditingCat(cat);
        setShowCatForm(true);
    };
    const handleNewPost = () => { setEditingPost(null); setShowPostForm(true); };
    const handleNewCat = () => { setEditingCat(null); setShowCatForm(true); };
    const handleClosePostForm = () => { setShowPostForm(false); setEditingPost(null); };
    const handleCloseCatForm = () => { setShowCatForm(false); setEditingCat(null); };

    // ─── Derived data ─────────────────────────────────────────────────────────

    const posts = postsData?.results ?? [];
    const totalCount = postsData?.count ?? 0;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    // Client-side filter for categories and tags by search
    const filteredCats = (categoriesData?.results ?? []).filter(c =>
        !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredTags = (tagsData?.results ?? []).filter(t =>
        !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statCards = [
        { label: 'Tổng bài viết', value: statsData?.total_posts ?? 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Đã xuất bản', value: statsData?.published_posts ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Bản nháp', value: statsData?.draft_posts ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Tổng lượt xem', value: statsData?.total_views ?? 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Modals */}
            {showPostForm && (
                <BlogPostFormModal post={editingPost} onClose={handleClosePostForm} />
            )}
            {showCatForm && (
                <CategoryFormModal category={editingCat} onClose={handleCloseCatForm} />
            )}
            {showTagForm && (
                <TagFormModal onClose={() => setShowTagForm(false)} />
            )}

            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Quản lý Blog
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý nội dung và bài viết chuyên sâu.</p>
                </div>
                <Button
                    onClick={handleNewPost}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 h-11 px-6">
                    <Plus className="w-5 h-5 mr-2" />
                    Viết bài mới
                </Button>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} {...fadeUp(0.1 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                        <div className="relative">
                            <div className="mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString('vi-VN')}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <motion.div {...fadeUp(0.2)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Tìm kiếm ${activeTab === 'posts' ? 'bài viết' : activeTab === 'categories' ? 'danh mục' : 'tag'}...`}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50 text-sm font-medium transition-all"
                        />
                    </div>
                    {activeTab === 'posts' && (
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50 text-sm font-medium">
                            <option value="">Tất cả trạng thái</option>
                            <option value="published">Đã đăng</option>
                            <option value="draft">Bản nháp</option>
                            <option value="archived">Lưu trữ</option>
                        </select>
                    )}
                </div>
                <div className="flex gap-1 bg-slate-50/50 border border-slate-200 p-1 w-fit rounded-xl">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}>
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Main Content */}
            <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* ── POSTS TAB ── */}
                {activeTab === 'posts' && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500 w-[40%]">Bài viết</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Danh mục</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Lượt xem</th>
                                        <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày đăng</th>
                                        <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500 w-32">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingPosts ? (
                                        <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                                    ) : posts.length === 0 ? (
                                        <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium">Không tìm thấy bài viết nào</td></tr>
                                    ) : posts.map((post: BlogPost) => (
                                        <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                                        {post.thumbnail
                                                            ? <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                                                            : <FileText className="w-5 h-5 text-slate-400" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-sm truncate">{post.title}</span>
                                                            {post.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium truncate">Tác giả: {post.author_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    {post.category?.name || 'Không có'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={`${STATUS_COLORS[post.status] || ''} text-[10px] font-bold border rounded-md px-2 py-0.5`}>
                                                    {STATUS_LABELS[post.status] || post.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span className="font-bold">{post.view_count?.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : '—'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        Cập nhật: {new Date(post.updated_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditPost(post)}
                                                        className="w-8 h-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa bài viết">
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm"
                                                        onClick={() => window.open(`/blog/${post.slug}`, '_blank', 'noopener,noreferrer')}
                                                        className="w-8 h-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Xem bài viết">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleBanPost(post.slug, post.title)}
                                                        className="w-8 h-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Cảnh báo và lưu trữ">
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.slug)}
                                                        className="w-8 h-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa bài viết">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">
                                Hiển thị <span className="font-bold text-slate-900">{posts.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> bài viết
                            </p>
                            <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-xs font-black text-blue-600">{page}</span>
                                    <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                    <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── CATEGORIES TAB ── */}
                {activeTab === 'categories' && (
                    <div className="p-6">
                        {loadingCats ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredCats.map((cat: BlogCategory) => (
                                    <div key={cat.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                <FolderOpen className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-900 text-sm truncate">{cat.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {cat.post_count ?? 0} bài viết · /{cat.slug}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button onClick={() => handleEditCat(cat)}
                                                className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeleteCat(cat.slug, cat.name)}
                                                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={handleNewCat}
                                    className="h-full min-h-[66px] rounded-xl border-dashed border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1">
                                    <Plus className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Thêm danh mục</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAGS TAB ── */}
                {activeTab === 'tags' && (
                    <div className="p-6">
                        {loadingTags ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
                        ) : (
                            <div className="flex flex-wrap gap-2.5">
                                {filteredTags.map((tag: BlogTag) => (
                                    <div key={tag.id} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/30 hover:border-blue-200 hover:bg-blue-50 transition-all">
                                        <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{tag.name}</span>
                                        {tag.post_count !== undefined && (
                                            <span className="text-[10px] text-slate-400 font-medium">({tag.post_count})</span>
                                        )}
                                        <button
                                            onClick={() => handleDeleteTag(tag.slug)}
                                            className="ml-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={() => setShowTagForm(true)}
                                    className="h-9 px-4 rounded-lg border-dashed border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    <span className="text-xs font-bold">Thêm Tag</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
