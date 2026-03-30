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
    
    // Determine base path for redirects (employer or candidate)
    const isEmployer = location.pathname.startsWith('/employer');
    const basePath = isEmployer ? '/employer/blog' : '/candidate/blog';

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
        <div className="min-h-screen overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-[-20%] w-[60%] h-[500px] bg-gradient-to-l from-violet-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

            <div className="w-full mx-auto space-y-8 relative z-10 p-6 lg:p-8 animate-in fade-in duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 shadow-sm border border-violet-100">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                                Quản lý <span className="text-violet-600">Blog</span>
                            </h1>
                        </div>
                        <p className="mt-4 text-base md:text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
                            Nơi bạn chia sẻ kiến thức, kinh nghiệm và những câu chuyện thú vị trong sự nghiệp.
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                        <Button 
                            onClick={() => navigate(`${basePath}/create`)}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 px-8 h-12 shrink-0 group relative overflow-hidden rounded-2xl font-bold"
                        >
                            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                            <div className="relative flex items-center">
                                <Plus className="w-5 h-5 mr-2" />
                                <span>Viết bài mới</span>
                            </div>
                        </Button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md p-2 border border-slate-200/60 rounded-2xl">
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
                                <div className="w-full md:w-32 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 group-hover:scale-[1.02] transition-transform">
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
                                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-200 w-48 shadow-xl">
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
                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl px-8 h-12 font-black shadow-lg shadow-violet-200"
                            >
                                Viết bài ngay <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer status */}
                <div className="pt-10 flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dữ liệu được cập nhật thời gian thực</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
