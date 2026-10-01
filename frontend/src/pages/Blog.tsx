import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, ArrowRight, UserCircle, Loader2, Tag as TagIcon, ChevronRight, Sparkles, Briefcase } from 'lucide-react';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useUserStore();
    const selectedCategory = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined;
    const selectedTag = searchParams.get('tag_id') ? Number(searchParams.get('tag_id')) : undefined;

    const [limit, setLimit] = useState(6);

    // Reset limit when category or tag changes
    useEffect(() => {
        setLimit(6);
    }, [selectedCategory, selectedTag]);

    // ── Queries ──
    const { data: featuredResp } = useQuery({
        queryKey: ['blog-featured'],
        queryFn: () => blogService.listPosts({ is_featured: true, page_size: 1 }).then(r => r.data),
        staleTime: 60_000,
    });
    const featuredPost = featuredResp?.results?.[0];

    const { data: postsResp, isLoading: isLoadingPosts } = useQuery({
        queryKey: ['blog-posts', selectedCategory, selectedTag, limit],
        queryFn: () => {
            const fetchLimit = (!selectedCategory && !selectedTag) ? limit + 1 : limit;
            return blogService.listPosts({ category_id: selectedCategory, tag_id: selectedTag, page_size: fetchLimit }).then(r => r.data);
        },
        staleTime: 60_000,
    });
    const posts = postsResp?.results ?? [];

    // Filter out featured post to avoid duplication, then ensure we only show up to `limit` items
    const displayPosts = posts
        .filter(post => !(featuredPost && post.id === featuredPost.id && !selectedCategory && !selectedTag))
        .slice(0, limit);

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

    const resolveAuthorName = (post: { company_name?: string | null; author_name?: string | null; author?: number }) =>
        post.company_name || post.author_name?.trim() || (post.author === user?.id ? user?.full_name : '') || 'JOBIO VN';

    const resolveAuthorAvatar = (post: { company_logo?: string | null; author_avatar?: string | null; author?: number }) =>
        post.company_logo || post.author_avatar || (post.author === user?.id ? user?.avatar_url : null);

    const setCategoryFilter = (categoryId?: number) => {
        if (categoryId) setSearchParams({ category_id: String(categoryId) });
        else setSearchParams({});
    };

    const setTagFilter = (tagId: number) => {
        setSearchParams({ tag_id: String(tagId) });
    };

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] pb-24 overflow-hidden">
            {/* ── Background Mesh Gradient (Same as Pricing page) ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-5%] w-[35%] h-[45%] bg-orange-400/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-card/40 backdrop-blur-[2px]" />
            </div>

            {/* ── Page Header ── */}
            <section className="relative z-10 pt-28 pb-14 px-6 text-center">
                <motion.div {...fadeUp(0)} className="max-w-7xl mx-auto text-center relative z-10">
                    <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-100 mb-6 px-4 py-1.5 font-bold tracking-tight border-none shadow-sm">
                        <BookOpen className="w-4 h-4 mr-2 inline" /> Blog Chuyên Đề
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 text-foreground leading-[1.15]" style={{ fontFamily: 'var(--font-display)' }}>
                        Khám phá bí quyết <br className="hidden md:block"/> phát triển nghề nghiệp
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                        Cập nhật xu hướng tuyển dụng, đọc tin tức chuyên ngành và tìm hiểu văn hóa doanh nghiệp từ các chuyên gia hàng đầu.
                    </p>
                </motion.div>
            </section>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-6 lg:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* ── MAIN CONTENT ── */}
                <div className="lg:col-span-8 space-y-12">
                    
                    {/* Featured Hero Card */}
                    {featuredPost && !selectedCategory && !selectedTag && (
                        <motion.div {...fadeUp(0.1)} className="group cursor-pointer">
                            <Link to={`/blog/${featuredPost.slug}`}>
                                <div className="bg-card rounded-3xl overflow-hidden border border-border/60 shadow-lg group-hover:shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-12">
                                    <div className="md:col-span-7 h-64 md:h-auto overflow-hidden relative">
                                        <img
                                            src={featuredPost.thumbnail || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=80'}
                                            alt={featuredPost.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {featuredPost.category && (
                                            <Badge className="absolute top-4 left-4 bg-teal-600 text-white font-bold px-3 py-1 border-none shadow-md">
                                                {featuredPost.category.name}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="md:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(featuredPost.created_at!).toLocaleDateString('vi-VN')}
                                            </div>
                                            <h3 className="text-xl lg:text-2xl font-black text-foreground group-hover:text-teal-600 transition-colors line-clamp-3 leading-snug mb-3">
                                                {featuredPost.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                                                {featuredPost.summary}
                                            </p>
                                        </div>
                                        <div className="pt-6 border-t border-border/40 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {resolveAuthorAvatar(featuredPost) ? (
                                                    <img src={resolveAuthorAvatar(featuredPost)!} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                                                ) : (
                                                    <UserCircle className="w-8 h-8 text-muted-foreground/60" />
                                                )}
                                                <span className="text-xs font-bold text-foreground">
                                                    {resolveAuthorName(featuredPost)}
                                                </span>
                                            </div>
                                            <span className="text-teal-600 font-bold text-xs flex items-center group-hover:translate-x-1 transition-transform">
                                                Đọc tiếp <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}

                    {/* Articles Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                                {selectedCategory ? (
                                    <>Danh mục: <span className="text-teal-600">{categories?.find(c => c.id === selectedCategory)?.name}</span></>
                                ) : selectedTag ? (
                                    <>Chủ đề: <span className="text-teal-600">#{tags?.find(t => t.id === selectedTag)?.name}</span></>
                                ) : (
                                    'Bài viết mới nhất'
                                )}
                            </h2>
                            {(selectedCategory || selectedTag) && (
                                <button
                                    onClick={() => setSearchParams({})}
                                    className="text-xs font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                                >
                                    Xem tất cả bài viết
                                </button>
                            )}
                        </div>

                        {isLoadingPosts ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                            </div>
                        ) : displayPosts.length === 0 ? (
                            <div className="bg-card rounded-3xl p-12 text-center border border-border/60 shadow-sm">
                                <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-foreground mb-2">Chưa có bài viết nào</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                                    Hiện chưa có bài viết thuộc mục này. Hãy quay lại sau hoặc khám phá chủ đề khác.
                                </p>
                                <Button onClick={() => setSearchParams({})} className="bg-teal-600 hover:bg-teal-700 font-bold rounded-xl text-xs">
                                    Quay về tất cả bài viết
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {displayPosts.map((post, idx) => (
                                    <motion.div key={post.id} {...fadeUp(0.1 + idx * 0.05)}>
                                        <Link to={`/blog/${post.slug}`} className="group block h-full">
                                            <div className="bg-card rounded-3xl overflow-hidden border border-border/60 shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col h-full">
                                                <div className="h-48 overflow-hidden relative">
                                                    <img
                                                        src={post.thumbnail || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80'}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    {post.category && (
                                                        <Badge className="absolute top-4 left-4 bg-teal-600 text-white font-bold px-2.5 py-0.5 border-none shadow-sm text-xs">
                                                            {post.category.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="p-6 flex flex-col justify-between flex-1">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mb-2.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(post.created_at!).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <h3 className="text-lg font-black text-foreground group-hover:text-teal-600 transition-colors line-clamp-2 mb-2 leading-snug">
                                                            {post.title}
                                                        </h3>
                                                        <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-6">
                                                            {post.summary}
                                                        </p>
                                                    </div>
                                                    <div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
                                                        <div className="flex items-center gap-2">
                                                            {resolveAuthorAvatar(post) ? (
                                                                <img src={resolveAuthorAvatar(post)!} alt="Avatar" className="w-6 h-6 rounded-full object-cover border" />
                                                            ) : (
                                                                <UserCircle className="w-6 h-6 text-muted-foreground/60" />
                                                            )}
                                                            <span className="text-[11px] font-bold text-foreground truncate max-w-[120px]">
                                                                {resolveAuthorName(post)}
                                                            </span>
                                                        </div>
                                                        <span className="text-teal-600 font-bold text-xs flex items-center group-hover:translate-x-1 transition-transform">
                                                            Đọc ngay <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Load More Button */}
                        {posts.length > displayPosts.length && (
                            <div className="mt-12 text-center">
                                <Button
                                    onClick={() => setLimit(prev => prev + 6)}
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 h-12 rounded-2xl shadow-md cursor-pointer transition-all hover:scale-105"
                                >
                                    Xem thêm bài viết ({posts.length - displayPosts.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── SIDEBAR ── */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Categories */}
                    <motion.div {...fadeUp(0.2)} className="bg-card rounded-3xl border border-border/60 shadow-sm p-6 lg:p-8">
                        <h4 className="font-black text-foreground tracking-tight mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-teal-600" /> Danh mục
                        </h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => setCategoryFilter(undefined)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                                    ${!selectedCategory && !selectedTag ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                                Tất cả bài viết
                                {!selectedCategory && !selectedTag && <ChevronRight className="w-4 h-4 opacity-50" />}
                            </button>
                            {categories?.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryFilter(cat.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                                        ${selectedCategory === cat.id ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                >
                                    {cat.name}
                                    {selectedCategory === cat.id && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Popular Tags */}
                    {tags && tags.length > 0 && (
                        <motion.div {...fadeUp(0.3)} className="bg-card rounded-3xl border border-border/60 shadow-sm p-6 lg:p-8">
                            <h4 className="font-black text-foreground tracking-tight mb-6 flex items-center gap-2">
                                <TagIcon className="w-5 h-5 text-teal-600" /> Chủ đề quan tâm
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <button key={tag.id} onClick={() => setTagFilter(tag.id)}>
                                        <Badge className={`${selectedTag === tag.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-700 border-border'} font-semibold px-3 py-1.5 border transition-colors shadow-none cursor-pointer`}>
                                            #{tag.name}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* High-Value Career Tools Widget — Light Style */}
                    <motion.div {...fadeUp(0.4)} className="bg-card/95 backdrop-blur-xl rounded-3xl p-7 text-foreground relative overflow-hidden shadow-lg border border-teal-100 dark:border-border text-center">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-12 h-12 bg-teal-50 text-teal-600 border border-teal-200/60 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <h4 className="text-lg font-black tracking-tight text-foreground mb-2 leading-tight">
                                Tối ưu CV & Gợi ý Việc làm AI
                            </h4>
                            <p className="text-muted-foreground text-xs mb-6 leading-relaxed max-w-xs mx-auto font-medium">
                                Hệ thống AI tự động phân tích CV, chuẩn hóa kỹ năng và gợi ý công việc phù hợp 95%.
                            </p>
                            <div className="flex flex-col gap-3.5 w-full">
                                <Link to={user?.role === 'candidate' ? '/candidate/cv' : '/auth'} className="block w-full">
                                    <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold h-11 rounded-xl shadow-md shadow-teal-600/20 text-xs cursor-pointer active:scale-[0.98] transition-all">
                                        <Sparkles className="w-4 h-4 mr-2" /> Tạo & Đánh giá CV AI
                                    </Button>
                                </Link>
                                <Link to="/jobs" className="block w-full">
                                    <Button variant="outline" className="w-full border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 text-teal-800 font-bold h-11 rounded-xl text-xs cursor-pointer active:scale-[0.98] transition-all shadow-none">
                                        <Briefcase className="w-4 h-4 mr-2 text-teal-600" /> Khám phá việc làm HOT
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </aside>
            </main>
        </div>
    );
}
