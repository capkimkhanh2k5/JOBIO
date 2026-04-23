import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight, UserCircle, Loader2, Tag as TagIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blogService } from '@/services/blogService';
import { useUserStore } from '@/store/userStore';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
});

export default function Blog() {
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const { user } = useUserStore();

    // ── Queries ──
    const { data: featuredResp } = useQuery({
        queryKey: ['blog-featured'],
        queryFn: () => blogService.listPosts({ is_featured: true, page_size: 1 }).then(r => r.data),
        staleTime: 60_000,
    });
    const featuredPost = featuredResp?.results?.[0];

    const { data: postsResp, isLoading: isLoadingPosts } = useQuery({
        queryKey: ['blog-posts', selectedCategory],
        queryFn: () => blogService.listPosts({ category_id: selectedCategory, page_size: 10 }).then(r => r.data),
        staleTime: 60_000,
    });
    const posts = postsResp?.results ?? [];

    const { data: categories } = useQuery({
        queryKey: ['blog-categories'],
        queryFn: () => blogService.listCategories().then(r => r.data.results),
        staleTime: 1000 * 60 * 60,
    });

    const { data: tags } = useQuery({
        queryKey: ['blog-tags'],
        queryFn: () => blogService.listTags().then(r => r.data.results),
        staleTime: 1000 * 60 * 60,
    });

    const resolveAuthorName = (post: { author_name?: string | null; author?: number }) =>
        post.author_name?.trim() || (post.author === user?.id ? user?.full_name : '') || 'Tác giả JOBIO';

    const resolveAuthorAvatar = (post: { author_avatar?: string | null; author?: number }) =>
        post.author_avatar || (post.author === user?.id ? user?.avatar_url : null);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
            {/* ── Page Header ── */}
            <section className="bg-white border-b border-slate-100 pt-24 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
                <motion.div {...fadeUp(0)} className="max-w-7xl mx-auto text-center relative z-10">
                    <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-100 mb-6 px-4 py-1.5 font-bold tracking-tight border-none">
                        <BookOpen className="w-4 h-4 mr-2 inline" /> Blog Chuyên Đề
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 text-slate-900 leading-[1.15]">
                        Khám phá bí quyết <br className="hidden md:block"/> phát triển nghề nghiệp
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                        Cập nhật xu hướng tuyển dụng, đọc tin tức chuyên ngành và tìm hiểu văn hóa doanh nghiệp từ các chuyên gia hàng đầu.
                    </p>
                </motion.div>
            </section>

            <main className="max-w-7xl mx-auto px-6 pt-12 lg:pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* ── MAIN CONTENT ── */}
                <div className="lg:col-span-8 space-y-12">
                    
                    {/* Featured Hero Card */}
                    {featuredPost && !selectedCategory && (
                        <motion.div {...fadeUp(0.1)} className="group cursor-pointer">
                            <Link to={`/blog/${featuredPost.slug}`} className="block relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-violet-600/5 transition-all duration-300">
                                <div className="absolute top-4 left-4 z-20">
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none font-bold uppercase tracking-wider text-[10px] shadow-sm">
                                        Bài nổi bật
                                    </Badge>
                                </div>
                                <div className="aspect-[21/9] md:aspect-[2/1] relative overflow-hidden bg-slate-100">
                                    {featuredPost.thumbnail ? (
                                        <img src={featuredPost.thumbnail} alt={featuredPost.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen className="w-16 h-16" /></div>
                                    )}
                                </div>
                                <div className="p-6 md:p-8 relative z-10">
                                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-3">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(featuredPost.published_at!).toLocaleDateString('vi-VN')}</span>
                                        {featuredPost.category && <span className="flex items-center gap-1.5 before:content-['•'] before:mr-1.5 before:opacity-50">{featuredPost.category.name}</span>}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug mb-3 group-hover:text-violet-600 transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-slate-600 line-clamp-2 md:text-lg mb-6 max-w-3xl">
                                        {featuredPost.summary}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                                            {resolveAuthorAvatar(featuredPost) ? (
                                                <img src={resolveAuthorAvatar(featuredPost) || ''} alt={resolveAuthorName(featuredPost)} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle className="w-6 h-6" />
                                            )}
                                        </div>
                                        <span className="font-semibold text-slate-900">{resolveAuthorName(featuredPost)}</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}

                    {/* Posts Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                {selectedCategory ? 'Tất cả bài viết' : 'Bài viết mới nhất'}
                            </h3>
                        </div>

                        {isLoadingPosts ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12"><p className="text-slate-500 font-medium">Không tìm thấy bài viết nào.</p></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                {posts.map((post, idx) => {
                                    if (featuredPost && post.id === featuredPost.id && !selectedCategory) return null; // Deduplicate
                                    return (
                                        <motion.article 
                                            key={post.id} 
                                            {...fadeUp(0.1 + idx * 0.05)}
                                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-violet-600/5 transition-all duration-300 overflow-hidden flex flex-col group"
                                        >
                                            <Link to={`/blog/${post.slug}`} className="flex flex-col h-full">
                                                <div className="aspect-[16/10] overflow-hidden bg-slate-50 relative">
                                                    {post.thumbnail ? (
                                                        <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200"><BookOpen className="w-10 h-10" /></div>
                                                    )}
                                                    {post.category && (
                                                        <Badge className="absolute top-3 left-3 bg-white/90 text-violet-700 backdrop-blur border-none font-bold text-[10px] uppercase shadow-sm">
                                                            {post.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="p-6 flex flex-col flex-1">
                                                    <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" /> 
                                                        {new Date(post.published_at!).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                                                        {post.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                                                        {post.summary}
                                                    </p>
                                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                                                {resolveAuthorAvatar(post) ? (
                                                                    <img src={resolveAuthorAvatar(post) || ''} alt={resolveAuthorName(post)} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserCircle className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-700">{resolveAuthorName(post)}</span>
                                                        </div>
                                                        <span className="text-violet-600 text-xs font-bold flex items-center gap-1 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                                            Đọc tiếp <ArrowRight className="w-3 h-3" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    );
                                })}
                            </div>
                        )}
                        
                        {posts.length > 0 && (
                            <div className="flex justify-center mt-12">
                                <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold px-8 h-12 shadow-sm">
                                    Tải thêm bài viết
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── SIDEBAR ── */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Search / Newsletter snippet -> repurposed as Category list */}
                    <motion.div {...fadeUp(0.2)} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
                        <h4 className="font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-violet-600" /> Danh mục
                        </h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedCategory(undefined)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                                    ${!selectedCategory ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                Tất cả bài viết
                                {!selectedCategory && <ChevronRight className="w-4 h-4 opacity-50" />}
                            </button>
                            {categories?.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                                        ${selectedCategory === cat.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    {cat.name}
                                    {selectedCategory === cat.id && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Popular Tags */}
                    {tags && tags.length > 0 && (
                        <motion.div {...fadeUp(0.3)} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8">
                            <h4 className="font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
                                <TagIcon className="w-5 h-5 text-violet-600" /> Chủ đề quan tâm
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <Badge key={tag.id} className="bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700 font-semibold px-3 py-1.5 border border-slate-200 transition-colors shadow-none cursor-pointer">
                                        #{tag.name}
                                    </Badge>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Banner Ads / Promo CTA */}
                    <motion.div {...fadeUp(0.4)} className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-violet-600/20 text-center">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur mb-6">
                                <span className="text-2xl font-bold font-serif">"</span>
                            </div>
                            <h4 className="text-xl font-bold mb-4 leading-tight">Đăng ký nhận bài viết mới hàng tuần</h4>
                            <p className="text-violet-100 text-sm mb-6">Trọn bộ cẩm nang từ chuyên gia nhân sự.</p>
                            <Button className="w-full bg-white text-violet-700 hover:bg-slate-50 font-bold h-11 rounded-xl shadow-sm">
                                Theo dõi ngay
                            </Button>
                        </div>
                    </motion.div>
                </aside>
            </main>
        </div>
    );
}
