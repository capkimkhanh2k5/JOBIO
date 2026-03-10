import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Newspaper, Lightbulb, ArrowRight, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardService } from '@/services/dashboardService';

export default function Blog() {
    const { data, isLoading } = useQuery({
        queryKey: ['blog-posts', 'published'],
        queryFn: () => dashboardService.listPosts({ status: 'published', page_size: 9 }),
        staleTime: 1000 * 60 * 5,
    });

    const posts = data?.data?.results ?? [];

    return (
        <div className="relative min-h-screen pb-24 bg-gray-50/30">
            {/* Hero Section */}
            <section className="relative pt-28 pb-16 px-4 text-center overflow-hidden bg-white border-b border-gray-100">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto relative z-10"
                >
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 mb-6 px-4 py-1.5 font-semibold">
                        <BookOpen className="w-4 h-4 mr-2 inline" />
                        Blog Nghề Nghiệp
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-gray-900">
                        Kiến thức phát triển sự nghiệp
                    </h1>
                    <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Khám phá bí quyết ứng tuyển, xu hướng thị trường, và câu chuyện nghề nghiệp từ những chuyên gia hàng đầu.
                    </p>
                </motion.div>

                {/* Background blur effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />
            </section>

            {/* Featured Posts and List */}
            <section className="max-w-7xl mx-auto px-4 pt-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <Newspaper className="w-6 h-6 text-primary" />
                        Bài viết mới nhất
                    </h2>
                    <div className="flex gap-2 hidden sm:flex">
                        {['Tất cả', 'Kỹ năng tìm việc', 'Xu hướng thị trường', 'Góc phòng vấn'].map(cat => (
                            <Badge key={cat} variant={cat === 'Tất cả' ? 'default' : 'outline'} className={cat === 'Tất cả' ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' : 'border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer text-sm font-medium py-1 px-3'}>
                                {cat}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading
                        ? Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-96 w-full rounded-3xl bg-gray-100" />
                        ))
                        : posts.map((post, idx) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group flex flex-col h-full"
                        >
                            <div className="aspect-[16/10] overflow-hidden relative">
                                {post.thumbnail ? (
                                    <img
                                        src={post.thumbnail}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                                        <BookOpen className="w-12 h-12 text-indigo-200" />
                                    </div>
                                )}
                                {post.category && (
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-white/90 text-indigo-700 backdrop-blur-md border-0 uppercase font-bold tracking-wider text-[10px]">
                                            {post.category.name}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 md:p-8 flex flex-col flex-grow">
                                <h3 className="text-xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {post.summary ?? ''}
                                </p>

                                <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <UserCircle className="w-5 h-5" />
                                        </div>
                                        <div className="text-xs">
                                            <p className="font-semibold text-gray-900">{post.author_name}</p>
                                            <p className="text-gray-400">
                                                {post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                <div className="flex justify-center mt-12">
                    <Button variant="outline" className="rounded-xl h-12 px-8 font-semibold border-gray-200 hover:bg-gray-50">
                        Xem thêm bài viết
                    </Button>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="max-w-4xl mx-auto px-4 mt-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                            <Lightbulb className="w-8 h-8 text-indigo-100" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Đừng bỏ lỡ các bí quyết nghề nghiệp!
                        </h2>
                        <p className="text-indigo-100 max-w-lg mx-auto md:text-lg">
                            Đăng ký nhận bản tin định kỳ hàng tuần từ đội ngũ chuyên gia của chúng tôi.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Email của bạn..."
                                className="flex-1 h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-white placeholder:text-indigo-200 outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium"
                                required
                            />
                            <Button className="h-12 bg-white text-indigo-600 hover:bg-gray-50 rounded-xl font-bold px-6 shadow-none">
                                Đăng ký
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
