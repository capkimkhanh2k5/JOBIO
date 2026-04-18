import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BookOpen, Plus, Search, Filter, 
    MoreVertical, Edit3, Trash2, Eye,
    CheckCircle2, Clock, AlertCircle, ArrowRight
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { blogService } from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BlogPost } from '@/types/api';
import { PageHeader } from '@/components/shared/PageHeader';

const statusMap = {
    published: { label: 'Đã đăng', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    draft: { label: 'Bản nháp', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: <Clock className="w-3.5 h-3.5" /> },
    archived: { label: 'Đã lưu trữ', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function BlogManagement() {
    const navigate = useNavigate();
    const location = useLocation();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Determine base path for redirects (company or candidate)
    const isCompany = location.pathname.startsWith('/company');
    const basePath = isCompany ? '/company/blog' : '/candidate/blog';

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const response = await blogService.listMyPosts({ search: searchQuery });
            setPosts(response.data.results);
        } catch (error) {
            toast.error('Không thể tải danh sách bài viết');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [searchQuery]);

    const handleDelete = async (slug: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
        try {
            await blogService.deletePost(slug);
            toast.success('Đã xóa bài viết thành công');
            fetchPosts();
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết');
        }
    };

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            {/* Page header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Quản lý Blog"
                    description="Nơi bạn chia sẻ kiến thức, kinh nghiệm và những câu chuyện thú vị trong sự nghiệp."
                    icon={BookOpen}
                    action={
                        <Button 
                            onClick={() => navigate(`${basePath}/create`)}
                            className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 px-6 h-11 shrink-0 rounded-xl font-bold"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            <span>Viết bài mới</span>
                        </Button>
                    }
                />
            </div>

            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6 w-full flex-1 relative z-10">
                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md p-2 border border-slate-200/60 rounded-3xl">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <Input 
                            placeholder="Tìm kiếm bài viết của bạn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-11 rounded-xl border-slate-200 bg-white/50 focus:bg-white transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white/50 hover:bg-white gap-2 flex-1 md:flex-none font-bold">
                            <Filter className="w-4 h-4" /> Lọc
                        </Button>
                        <Badge variant="outline" className="h-11 px-4 rounded-xl border-slate-200 bg-white/10 text-slate-500 font-bold">
                            Tổng: {posts.length} bài viết
                        </Badge>
                    </div>
                </div>

                {/* Posts List */}
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-100/50 rounded-3xl animate-pulse border border-slate-200/50" />
                        ))
                    ) : posts.length > 0 ? (
                        posts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all p-5 flex flex-col md:flex-row gap-6 items-start md:items-center relative"
                            >
                                {/* Thumbnail */}
                                <div className="w-full md:w-32 h-24 rounded-3xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 group-hover:scale-[1.02] transition-transform">
                                    {post.thumbnail ? (
                                        <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Badge className={`${statusMap[post.status as keyof typeof statusMap]?.color} border font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5`}>
                                            {statusMap[post.status as keyof typeof statusMap]?.icon}
                                            {statusMap[post.status as keyof typeof statusMap]?.label}
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-400 capitalize">
                                            {post.category?.name || 'Chưa phân loại'}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-violet-600 transition-colors truncate">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium line-clamp-1 opacity-80">
                                        {post.summary || 'Không có tóm tắt...'}
                                    </p>
                                </div>

                                {/* Stats & Actions */}
                                <div className="flex items-center gap-6 w-full md:w-auto shrink-0 md:pl-6 md:border-l border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-tighter">Lượt xem</p>
                                            <div className="flex items-center gap-1 text-slate-900 font-black justify-center">
                                                <Eye className="w-3.5 h-3.5" /> {post.view_count}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto">
                                        <Link to={`/blog/${post.slug}`} target="_blank">
                                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50">
                                                <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        </Link>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-slate-100">
                                                    <MoreVertical className="w-5 h-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-3xl p-2 border-slate-200 w-48 shadow-xl">
                                                <DropdownMenuItem 
                                                    onClick={() => navigate(`${basePath}/edit/${post.slug}`)}
                                                    className="rounded-xl px-4 py-2.5 font-bold text-slate-600 cursor-pointer hover:bg-violet-50 hover:text-violet-600 focus:bg-violet-50 focus:text-violet-600 transition-colors gap-3"
                                                >
                                                    <Edit3 className="w-4 h-4" /> Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(post.slug)}
                                                    className="rounded-xl px-4 py-2.5 font-bold text-red-500 cursor-pointer hover:bg-red-50 focus:bg-red-50 transition-colors gap-3"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Xóa bài viết
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <BookOpen className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900">Chưa có bài viết nào</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                    Bắt đầu chia sẻ những kiến thức đầu tiên của bạn với cộng đồng ngay hôm nay!
                                </p>
                            </div>
                            <Button 
                                onClick={() => navigate(`${basePath}/create`)}
                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-3xl px-8 h-12 font-black shadow-lg shadow-violet-200"
                            >
                                Viết bài ngay <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
