import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    FileText, Plus, Search, Edit3, Trash2, Eye,
    Tag, FolderOpen, MoreHorizontal, Loader2, Star,
    ChevronLeft, ChevronRight, Clock, CheckCircle2,
    TrendingUp, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blogService } from '@/services/blogService';
import { toast } from 'sonner';

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

const statusColors: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    archived: 'bg-amber-50 text-amber-700 border-amber-200',
};

const statusLabels: Record<string, string> = {
    published: 'Đã đăng',
    draft: 'Bản nháp',
    archived: 'Lưu trữ',
};

export default function BlogManagement() {
    const [activeTab, setActiveTab] = useState<TabId>('posts');
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const queryClient = useQueryClient();

    // Debounce search
    useEffect(() => {
        const h = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(h);
    }, [searchQuery]);

    // Stats Query
    const { data: statsData } = useQuery({
        queryKey: ['admin-blog-stats'],
        queryFn: () => blogService.getAdminStats().then(r => r.data),
    });

    // Posts Query
    const { data: postsData, isLoading: loadingPosts } = useQuery({
        queryKey: ['admin-blog-posts', page, debouncedSearch],
        queryFn: () => blogService.listPosts({
            page,
            search: debouncedSearch || undefined,
            page_size: 10
        }).then(r => r.data),
        enabled: activeTab === 'posts',
    });

    // Categories Query
    const { data: categoriesData, isLoading: loadingCategories } = useQuery({
        queryKey: ['admin-blog-categories'],
        queryFn: () => blogService.listCategories().then(r => r.data),
        enabled: activeTab === 'categories',
    });

    // Tags Query
    const { data: tagsData, isLoading: loadingTags } = useQuery({
        queryKey: ['admin-blog-tags'],
        queryFn: () => blogService.listTags().then(r => r.data),
        enabled: activeTab === 'tags',
    });

    const deletePostMutation = useMutation({
        mutationFn: (slug: string) => blogService.deletePost(slug),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
            queryClient.invalidateQueries({ queryKey: ['admin-blog-stats'] });
            toast.success('Đã xóa bài viết thành công');
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi xóa bài viết');
        }
    });

    const handleDeletePost = (slug: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            deletePostMutation.mutate(slug);
        }
    };

    const posts = postsData?.results ?? [];
    const totalCount = postsData?.count ?? 0;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    const statCards = [
        { label: 'Tổng bài viết', value: statsData?.total_posts || 0, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Đã xuất bản', value: statsData?.published_posts || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Bản nháp', value: statsData?.draft_posts || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Tổng lượt xem', value: statsData?.total_views || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-violet-600" />
                        Quản lý Blog
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý nội dung và bài viết chuyên sâu.</p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 rounded-xl font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 h-11 px-6">
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

            <motion.div {...fadeUp(0.2)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={`Tìm kiếm ${activeTab === 'posts' ? 'bài viết' : activeTab === 'categories' ? 'danh mục' : 'tag'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 bg-slate-50/50 text-sm font-medium transition-all"
                    />
                </div>

                <div className="flex gap-1 bg-slate-50/50 border border-slate-200 p-1 w-fit rounded-xl">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
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


            {/* Main Content */}
            <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                                        <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" /></td></tr>
                                    ) : posts.length === 0 ? (
                                        <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium">Không tìm thấy bài viết nào</td></tr>
                                    ) : posts.map((post: any) => (
                                        <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                                        {post.thumbnail ? (
                                                            <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                                                        ) : <FileText className="w-5 h-5 text-slate-400" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-sm truncate">{post.title}</span>
                                                            {post.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight truncate">Tác giả: {post.author_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    {post.category?.name || 'Không có'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge className={`${statusColors[post.status] || ''} text-[10px] font-bold border rounded-md px-2 py-0.5`}>
                                                    {statusLabels[post.status] || post.status}
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
                                                    <span className="text-xs font-bold text-slate-700">{post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : '—'}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">Lần cuối: {new Date(post.updated_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.slug)} className="w-8 h-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
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
                                Hiển thị <span className="font-bold text-slate-900">{posts.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> bài viết
                            </p>
                            <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-xs font-black text-violet-600">{page}</span>
                                    <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                    <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'categories' && (
                    <div className="p-6">
                        {loadingCategories ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {categoriesData?.results?.map((cat: any) => (
                                    <div key={cat.id} className="p-4 rounded-xl border border-slate-200 hover:border-violet-200 hover:shadow-md transition-all group flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                                                <FolderOpen className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">/{cat.slug}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="h-full min-h-[66px] rounded-xl border-dashed border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/50 flex flex-col items-center justify-center gap-1">
                                    <Plus className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Thêm danh mục</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tags' && (
                    <div className="p-6">
                        {loadingTags ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" /></div>
                        ) : (
                            <div className="flex flex-wrap gap-2.5">
                                {tagsData?.results?.map((tag: any) => (
                                    <div key={tag.id} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/30 hover:border-violet-200 hover:bg-violet-50 transition-all cursor-pointer">
                                        <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-violet-700 transition-colors">{tag.name}</span>
                                        <button className="ml-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <Button variant="outline" className="h-9 px-4 rounded-lg border-dashed border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/50 flex items-center gap-2">
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
