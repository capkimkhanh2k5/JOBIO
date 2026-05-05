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
    Linkedin,
    Loader2,
    Share2,
    Tag as TagIcon,
    Twitter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BlogPost } from '@/types/api';

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
            document.title = post.meta_title || `${post.title} | JOBIO Blog`;
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', post.meta_description || post.summary || '');
        }
        return () => {
            document.title = 'JOBIO';
        };
    }, [post]);

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-4" />
                <p className="text-slate-500 font-medium tracking-tight">Đang tải bài viết...</p>
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Eye className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy bài viết</h2>
                <p className="text-slate-500 mb-8 max-w-md">Bài viết có thể đã bị xóa, ẩn hoặc đường dẫn không chính xác.</p>
                <Link to="/blog">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11 px-6 font-semibold shadow-sm hover:shadow-md transition-all">
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

    const authorName = post.author_name?.trim() || (post.author === user?.id ? user?.full_name : '') || 'Tác giả JOBIO';
    const authorAvatar = post.author_avatar || (post.author === user?.id ? user?.avatar_url : null);
    const authorInitial = authorName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50/60 pb-20">
            <section className="bg-white border-b border-slate-100 pt-28 md:pt-32 pb-2">
                <div className="max-w-7xl mx-auto px-6">
                    <Link to="/blog" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors mb-8">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Blog
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                        <motion.div {...fadeUp(0)} className="lg:col-span-8">
                            <div className="flex flex-wrap items-center gap-3 mb-5">
                                {post.category && (
                                    <Link to={`/blog?category_id=${post.category.id}`}>
                                        <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-100 border-transparent rounded-lg px-3 py-1 font-bold">
                                            {post.category.name}
                                        </Badge>
                                    </Link>
                                )}
                                {post.is_featured && (
                                    <Badge className="bg-amber-50 text-amber-700 border-transparent rounded-lg px-3 py-1 font-bold">
                                        Bài nổi bật
                                    </Badge>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                    <Calendar className="w-4 h-4" /> {formatDate(post.published_at)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                    <Eye className="w-4 h-4" /> {post.view_count.toLocaleString('vi-VN')} lượt xem
                                </span>
                                <span className="text-sm text-slate-500 font-medium">{estimateReadingTime(post.content)}</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.08] mb-6">
                                {post.title}
                            </h1>

                            {post.summary && (
                                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl">
                                    {post.summary}
                                </p>
                            )}
                        </motion.div>

                        <motion.aside {...fadeUp(0.08)} className="lg:col-span-4 lg:pt-12">
                            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/80">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 mb-3">
                                    JOBIO Blog
                                </p>
                                <h2 className="text-xl font-black tracking-tight leading-tight mb-3">
                                    Đọc thêm để chuẩn bị tốt hơn
                                </h2>
                                <p className="text-sm leading-6 text-slate-300">
                                    Gợi ý nhanh để bạn tiếp tục đọc các nội dung liên quan về phỏng vấn, hồ sơ và lộ trình ứng tuyển.
                                </p>
                            </div>
                        </motion.aside>
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 pt-4 lg:pt-5 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                <article className="lg:col-span-8">
                    <motion.div {...fadeUp(0.1)} className="space-y-8">
                        {post.thumbnail ? (
                            <figure className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                                <img src={post.thumbnail} alt={post.title} className="w-full max-h-[520px] object-cover" loading="eager" />
                            </figure>
                        ) : (
                            <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-white to-cyan-50 border border-slate-100 p-12 flex items-center justify-center text-slate-300">
                                <BookOpen className="w-16 h-16" />
                            </div>
                        )}

                        <div
                            className="prose prose-lg prose-slate max-w-none
                                       prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-950
                                       prose-p:text-slate-600 prose-p:leading-relaxed
                                       prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline
                                       prose-img:rounded-2xl prose-img:shadow-sm
                                       prose-blockquote:border-violet-500 prose-blockquote:bg-white prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-r-xl
                                       prose-li:text-slate-600"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {post.tags.length > 0 && (
                            <div className="pt-2">
                                <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Topic trong bài viết</h3>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map(tag => (
                                        <Link key={tag.id} to={`/blog?tag_id=${tag.id}`}>
                                            <Badge className="bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700 shadow-none border border-slate-200 transition-colors px-3 py-1 font-semibold">
                                                #{tag.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-violet-50 border border-violet-100 shrink-0">
                                    {authorAvatar ? (
                                        <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full text-violet-600 flex items-center justify-center font-bold text-lg">
                                            {authorInitial}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-base">{authorName}</p>
                                    <p className="text-sm text-slate-500 font-medium">Tác giả</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-500 mr-1 flex items-center gap-2">
                                    <Share2 className="w-4 h-4" /> Chia sẻ
                                </span>
                                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all" aria-label="Chia sẻ Facebook">
                                    <Facebook className="w-4 h-4" />
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-sky-500 hover:border-sky-500 hover:text-white transition-all" aria-label="Chia sẻ Twitter">
                                    <Twitter className="w-4 h-4" />
                                </button>
                                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-blue-700 hover:border-blue-700 hover:text-white transition-all" aria-label="Chia sẻ LinkedIn">
                                    <Linkedin className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </article>

                <aside className="lg:col-span-4">
                    <div className="lg:sticky lg:top-28 space-y-6">
                        <SidebarCard title="Bài viết tương tự" icon={<BookOpen className="w-5 h-5 text-violet-600" />}>
                            {relatedPosts.length === 0 ? (
                                <p className="text-sm text-slate-500">Chưa có bài viết tương tự.</p>
                            ) : (
                                <div className="space-y-4">
                                    {relatedPosts.map(item => (
                                        <RelatedPostCard key={item.id} post={item} />
                                    ))}
                                </div>
                            )}
                        </SidebarCard>

                        <SidebarCard title="Danh mục" icon={<FolderOpen className="w-5 h-5 text-violet-600" />}>
                            <p className="text-sm leading-6 text-slate-500 mb-4">
                                Chọn nhóm nội dung phù hợp để đọc tiếp các bài viết về phỏng vấn, phát triển sự nghiệp và thị trường công nghệ.
                            </p>
                            <div className="space-y-2">
                                <Link to="/blog" className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    Tất cả bài viết
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </Link>
                                {categories?.map(category => (
                                    <Link
                                        key={category.id}
                                        to={`/blog?category_id=${category.id}`}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                                    >
                                        <span>{category.name}</span>
                                        <span className="text-xs text-slate-400">{category.post_count}</span>
                                    </Link>
                                ))}
                            </div>
                        </SidebarCard>

                        {tags && tags.length > 0 && (
                            <SidebarCard title="Topic" icon={<TagIcon className="w-5 h-5 text-violet-600" />}>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <Link key={tag.id} to={`/blog?tag_id=${tag.id}`}>
                                            <Badge className="bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700 font-semibold px-3 py-1.5 border border-slate-200 transition-colors shadow-none">
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
        <motion.section {...fadeUp(0.2)} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-black text-slate-900 tracking-tight mb-5 flex items-center gap-2">
                {icon} {title}
            </h2>
            {children}
        </motion.section>
    );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
    return (
        <Link to={`/blog/${post.slug}`} className="group flex gap-3 rounded-2xl p-2 hover:bg-slate-50 transition-colors">
            <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                {post.thumbnail ? (
                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <BookOpen className="w-7 h-7" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                {post.category && (
                    <p className="text-[11px] font-bold text-violet-600 mb-1 truncate">{post.category.name}</p>
                )}
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">
                    {post.title}
                </h3>
                <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    {formatDate(post.published_at)}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
            </div>
        </Link>
    );
}
