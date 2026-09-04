import { useEffect, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { blogService } from '@/services/blogService';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    Facebook,
    FolderOpen,
    Lightbulb,
    Linkedin,
    Loader2,
    Share2,
    Tag as TagIcon,
    Twitter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import type { BlogPost } from '@/types/api';
import { plainSeoText, setPageSeo } from '@/lib/seo';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const formatDate = (value?: string | null) => (
    value
        ? new Date(value).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Chưa xuất bản'
);

const estimateReadingTime = (html: string) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const minutes = Math.max(1, Math.ceil(text.split(' ').filter(Boolean).length / 220));
    return `${minutes} phút đọc`;
};

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useUserStore();

    const { data: post, isLoading, isError } = useQuery({
        queryKey: ['blog-post', slug],
        queryFn: () => blogService.getPost(slug!).then(r => r.data),
        enabled: !!slug,
        staleTime: 60_000,
    });

    const { data: relatedResp } = useQuery({
        queryKey: ['blog-related', post?.category?.id, post?.id],
        queryFn: () => blogService.listPosts({ category_id: post!.category!.id, page_size: 4 }).then(r => r.data),
        enabled: !!post?.category?.id,
        staleTime: 60_000,
    });

    const { data: latestResp } = useQuery({
        queryKey: ['blog-latest-sidebar'],
        queryFn: () => blogService.listPosts({ page_size: 5, ordering: '-published_at' }).then(r => r.data),
        staleTime: 60_000,
    });

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

    const { mutate: addView } = useMutation({
        mutationFn: (postSlug: string) => blogService.incrementViewCount(postSlug),
    });

    useEffect(() => {
        if (slug && post) addView(slug);
    }, [slug, post?.id, addView]);

    useEffect(() => {
        if (post) {
            return setPageSeo({
                title: post.meta_title || `${post.title} | JOBIO Blog`,
                description: post.meta_description || plainSeoText(post.summary || post.content, 155),
                canonicalPath: `/blog/${post.slug}`,
                jsonLd: {
                    '@context': 'https://schema.org',
                    '@type': 'BlogPosting',
                    headline: post.title,
                    description: post.meta_description || post.summary || '',
                    datePublished: post.published_at || post.created_at,
                    dateModified: post.updated_at,
                    author: {
                        '@type': 'Person',
                        name: post.author_name || 'JOBIO',
                    },
                    image: post.thumbnail || undefined,
                },
            });
        }
        return undefined;
    }, [post]);

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
                <p className="text-muted-foreground font-medium tracking-tight">Đang tải bài viết...</p>
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Eye className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy bài viết</h2>
                <p className="text-muted-foreground mb-8 max-w-md">Bài viết có thể đã bị xóa, ẩn hoặc đường dẫn không chính xác.</p>
                <Link to="/blog">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all">
                        Quay lại
                    </Button>
                </Link>
            </div>
        );
    }

    const relatedCandidates = [
        ...(relatedResp?.results ?? []),
        ...(latestResp?.results ?? []),
    ];
    const relatedPosts = relatedCandidates
        .filter((item, index, arr) => item.id !== post.id && arr.findIndex(other => other.id === item.id) === index)
        .slice(0, 2);

    const authorName = post.company_name || post.author_name?.trim() || (post.author === user?.id ? user?.full_name : '') || 'JOBIO VN';
    const authorAvatar = post.company_logo || post.author_avatar || (post.author === user?.id ? user?.avatar_url : null);
    const authorInitial = authorName.charAt(0).toUpperCase();

    return (
        <div className="relative min-h-screen bg-[#F8FAFC] overflow-hidden pb-20">
            {/* Ambient mesh background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/15 rounded-full blur-[120px]" />
                <div className="absolute top-[25%] right-[-5%] w-[35%] h-[45%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-teal-500/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-card/20 backdrop-blur-[1px]" />
            </div>

            <section className="relative z-10 pt-24 pb-2">
                <div className="max-w-7xl mx-auto px-6">
                    <Link to="/blog" className="inline-flex items-center h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-teal-600 transition-colors mb-4 rounded-lg hover:bg-muted">
                        <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Blog
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                        <motion.div {...fadeUp(0)} className="lg:col-span-8">
                            <div className="flex flex-wrap items-center gap-2.5 mb-4">
                                {post.category && (
                                    <Link to={`/blog?category_id=${post.category.id}`}>
                                        <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-transparent rounded-lg px-2.5 py-0.5 font-bold text-xs">
                                            {post.category.name}
                                        </Badge>
                                    </Link>
                                )}
                                {post.is_featured && (
                                    <Badge className="bg-amber-50 text-amber-700 border-transparent rounded-lg px-2.5 py-0.5 font-bold text-xs">
                                        Bài nổi bật
                                    </Badge>
                                )}
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                    <Calendar className="w-3.5 h-3.5" /> {formatDate(post.published_at)}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                    <Eye className="w-3.5 h-3.5" /> {post.view_count.toLocaleString('vi-VN')} lượt xem
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">{estimateReadingTime(post.content)}</span>
                            </div>

                            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-snug mb-4">
                                {post.title}
                            </h1>

                            {post.summary && (
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                                    {post.summary}
                                </p>
                            )}
                        </motion.div>

                        <motion.aside {...fadeUp(0.08)} className="lg:col-span-4">
                            <div className="rounded-2xl bg-card border border-border/80 p-5 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
                                        <Lightbulb size={16} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-teal-600">JOBIO Blog</p>
                                </div>
                                <h2 className="text-sm font-bold text-foreground leading-snug">
                                    Đọc thêm để chuẩn bị tốt hơn
                                </h2>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Gợi ý nhanh để bạn tiếp tục đọc các nội dung liên quan về phỏng vấn, hồ sơ và lộ trình ứng tuyển.
                                </p>
                            </div>
                        </motion.aside>
                    </div>
                </div>
            </section>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-4 lg:pt-5 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                <article className="lg:col-span-8">
                    <motion.div {...fadeUp(0.1)} className="space-y-8">
                        {post.thumbnail ? (
                            <figure className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                                <img src={post.thumbnail} alt={post.title} className="w-full max-h-[520px] object-cover" loading="eager" />
                            </figure>
                        ) : (
                            <div className="rounded-2xl bg-gradient-to-br from-teal-50 via-white to-cyan-50 border border-border/60 p-12 flex items-center justify-center text-muted-foreground/40">
                                <BookOpen className="w-16 h-16" />
                            </div>
                        )}

                        <div
                            className="prose prose-sm sm:prose-base prose-slate max-w-none
                                       prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                                       prose-h2:text-lg prose-h3:text-base
                                       prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-sm
                                       prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
                                       prose-img:rounded-2xl prose-img:shadow-sm
                                       prose-blockquote:border-teal-500 prose-blockquote:bg-card prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-r-xl
                                       prose-li:text-muted-foreground prose-li:text-sm"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                        />

                        {post.tags.length > 0 && (
                            <div className="pt-2">
                                <h3 className="text-sm font-bold tracking-widest text-muted-foreground/60 uppercase mb-4">Topic trong bài viết</h3>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map(tag => (
                                        <Link key={tag.id} to={`/blog?tag_id=${tag.id}`}>
                                            <Badge className="bg-card text-muted-foreground hover:bg-teal-50 hover:text-teal-700 shadow-none border border-border transition-colors px-3 py-1 font-semibold">
                                                #{tag.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-50 border border-teal-100 shrink-0">
                                    {authorAvatar ? (
                                        <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full text-teal-600 flex items-center justify-center font-bold text-lg">
                                            {authorInitial}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-base">{authorName}</p>
                                    <p className="text-sm text-muted-foreground font-medium">Đăng bởi</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-muted-foreground mr-1 flex items-center gap-2">
                                    <Share2 className="w-4 h-4" /> Chia sẻ
                                </span>
                                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground/60 hover:bg-primary/80 hover:border-primary hover:text-white transition-all" aria-label="Chia sẻ Facebook">
                                    <Facebook className="w-4 h-4" />
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground/60 hover:bg-sky-500 hover:border-sky-500 hover:text-white transition-all" aria-label="Chia sẻ Twitter">
                                    <Twitter className="w-4 h-4" />
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground/60 hover:bg-primary hover:border-primary hover:text-white transition-all" aria-label="Chia sẻ LinkedIn">
                                    <Linkedin className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </article>

                <aside className="lg:col-span-4">
                    <div className="lg:sticky lg:top-28 space-y-6">
                        <SidebarCard title="Bài viết tương tự" icon={<BookOpen className="w-5 h-5 text-teal-600" />}>
                            {relatedPosts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Chưa có bài viết tương tự.</p>
                            ) : (
                                <div className="space-y-4">
                                    {relatedPosts.map(item => (
                                        <RelatedPostCard key={item.id} post={item} />
                                    ))}
                                </div>
                            )}
                        </SidebarCard>

                        <SidebarCard title="Danh mục" icon={<FolderOpen className="w-5 h-5 text-teal-600" />}>
                            <p className="text-sm leading-6 text-muted-foreground mb-4">
                                Chọn nhóm nội dung phù hợp để đọc tiếp các bài viết về phỏng vấn, phát triển sự nghiệp và thị trường công nghệ.
                            </p>
                            <div className="space-y-2">
                                <Link to="/blog" className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                    Tất cả bài viết
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                                </Link>
                                {categories?.map(category => (
                                    <Link
                                        key={category.id}
                                        to={`/blog?category_id=${category.id}`}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-teal-50 hover:text-teal-700 transition-colors"
                                    >
                                        <span>{category.name}</span>
                                        <span className="text-xs text-muted-foreground/60">{category.post_count}</span>
                                    </Link>
                                ))}
                            </div>
                        </SidebarCard>

                        {tags && tags.length > 0 && (
                            <SidebarCard title="Topic" icon={<TagIcon className="w-5 h-5 text-teal-600" />}>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <Link key={tag.id} to={`/blog?tag_id=${tag.id}`}>
                                            <Badge className="bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-700 font-semibold px-3 py-1.5 border border-border transition-colors shadow-none">
                                                #{tag.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </SidebarCard>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}

function SidebarCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
    return (
        <motion.section {...fadeUp(0.2)} className="bg-card rounded-2xl border border-border/80 shadow-sm p-5">
            <h2 className="text-sm font-bold text-foreground tracking-tight mb-4 flex items-center gap-2">
                {icon} {title}
            </h2>
            {children}
        </motion.section>
    );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
    return (
        <Link to={`/blog/${post.slug}`} className="group flex gap-3 rounded-2xl p-2 hover:bg-muted transition-colors">
            <div className="w-20 h-20 rounded-xl bg-muted border border-border/60 overflow-hidden shrink-0 flex items-center justify-center text-muted-foreground/40">
                {post.thumbnail ? (
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <BookOpen className="w-7 h-7" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                {post.category && (
                    <p className="text-[11px] font-bold text-teal-600 mb-1 truncate">{post.category.name}</p>
                )}
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {post.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    {formatDate(post.published_at)}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
            </div>
        </Link>
    );
}
