import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { blogService } from '@/services/blogService';
import { useUserStore } from '@/store/userStore';
import { motion } from 'framer-motion';
import { 
    Calendar, Eye, ChevronLeft, Share2, 
    Facebook, Twitter, Linkedin, Loader2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
});

export default function BlogDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useUserStore();

    // Fetch Post Detail
    const { data: post, isLoading, isError } = useQuery({
        queryKey: ['blog-post', slug],
        queryFn: () => blogService.getPost(slug!).then(r => r.data),
        enabled: !!slug,
        staleTime: 60_000,
    });

    // Increment View Count
    const { mutate: addView } = useMutation({
        mutationFn: (postSlug: string) => blogService.incrementViewCount(postSlug)
    });

    useEffect(() => {
        if (slug && post) {
            addView(slug);
        }
    }, [slug, post?.id]); // Run once when post loads

    // SEO Meta Tags update
    useEffect(() => {
        if (post) {
            document.title = post.meta_title || `${post.title} | JOBIO Blog`;
            // Add meta description manually
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', post.meta_description || post.summary || '');
        }
        return () => {
            document.title = 'JOBIO'; // reset on unmount
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
                        Quay lại trang Blog
                    </Button>
                </Link>
            </div>
        );
    }

    const formattedDate = post.published_at 
        ? new Date(post.published_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Chưa xuất bản';

    const resolvedAuthorName = post.author_name?.trim() || (post.author === user?.id ? user.full_name : '') || 'Tác giả JOBIO';
    const authorInitial = resolvedAuthorName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-white">
            <article className="w-full max-w-4xl mx-auto px-6 pt-32 md:pt-40 pb-12 md:pb-20">
                {/* ── Breadcrumb & Back ── */}
            <motion.div {...fadeUp(0)} className="mb-8">
                <Link to="/blog" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Blog
                </Link>
            </motion.div>

            {/* ── Main Header ── */}
            <header className="mb-10 lg:mb-14">
                <motion.div {...fadeUp(0.1)} className="flex items-center gap-3 mb-6">
                    {post.category && (
                        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-transparent rounded-md px-3 py-1 font-bold tracking-tight">
                            {post.category.name}
                        </Badge>
                    )}
                    <div className="flex items-center text-sm text-slate-500 gap-4 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formattedDate}</span>
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {post.view_count.toLocaleString()} lượt xem</span>
                    </div>
                </motion.div>

                <motion.h1 {...fadeUp(0.15)} className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-8">
                    {post.title}
                </motion.h1>

                {/* Author & Share */}
                <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-y border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {post.author_avatar ? (
                                <img src={post.author_avatar} alt={resolvedAuthorName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg">
                                    {authorInitial}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-base">{resolvedAuthorName}</p>
                            <p className="text-sm text-slate-500 font-medium">Tác giả</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-500 mr-2 flex items-center gap-2"><Share2 className="w-4 h-4" /> Chia sẻ:</span>
                        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-blue-500 hover:text-white transition-all">
                            <Facebook className="w-4 h-4" />
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
                            <Twitter className="w-4 h-4" />
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-blue-700 hover:text-white transition-all">
                            <Linkedin className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </header>

            {/* ── Featured Image ── */}
            {post.thumbnail && (
                <motion.figure {...fadeUp(0.25)} className="mb-14 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 max-h-[500px] flex items-center justify-center shadow-sm">
                    <img 
                        src={post.thumbnail} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                </motion.figure>
            )}

            {/* ── Content Body (Prose) ── */}
            <motion.div {...fadeUp(0.3)} className="bg-white">
                {post.summary && (
                    <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed tracking-tight mb-10 border-l-4 border-violet-500 pl-6 py-1">
                        {post.summary}
                    </p>
                )}
                
                {/* HTML Render Container */}
                <div 
                    className="prose prose-lg prose-slate max-w-none 
                               prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                               prose-p:text-slate-600 prose-p:leading-relaxed
                               prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline
                               prose-img:rounded-2xl prose-img:shadow-sm
                               prose-blockquote:border-violet-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-r-xl
                               prose-li:text-slate-600"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </motion.div>

            {/* ── Tags Footer ── */}
            {post.tags && post.tags.length > 0 && (
                <motion.div {...fadeUp(0.4)} className="mt-16 pt-8 border-t border-slate-100">
                    <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-4">Tags chuyên mục</h3>
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                            <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                                <Badge className="bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700 shadow-none border border-slate-200 transition-colors px-3 py-1 font-semibold">
                                    #{tag.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}
        </article>
        </div>
    );
}
