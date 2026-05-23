import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react';

export const ProfileTimelineFeed = ({ userId }: { userId: number }) => {
    // Note: We might need to pass author_id or user_id depending on the backend API support
    // Here we assume taking `author: userId` or similar. If not supported, we may fetch all and filter,
    // but ideally the backend supports filtering.
    const { data: postsData, isLoading } = useQuery({
        queryKey: ['public-timeline-posts', userId],
        queryFn: () => dashboardService.listPosts({
            // Attempting to filter by user. Adjust param key if backend differs.
            // author: userId
        }).then(r => r.data),
    });

    const posts = postsData?.results || []; // We might need to filter locally if backend doesn't support query param yet

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-[24px]" />
                <Skeleton className="h-48 w-full rounded-[24px]" />
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <Card className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-8 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Ứng viên chưa có bài viết nào trên trang cá nhân.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Hoạt động & Bài viết</h2>
            {posts.map((post) => (
                <Card key={post.slug} className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                        {/* Post Header */}
                        <div className="p-5 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    {/* Assuming author info is nested. If not, fallback */}
                                    <span className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                        {post.title.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">
                                        Bài viết mới
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {formatDistanceToNow(new Date(post.created_at || new Date()), { addSuffix: true, locale: vi })}
                                    </p>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Post Content */}
                        <div className="px-5 pb-4">
                            <h4 className="text-lg font-bold text-slate-900 mb-2">{post.title}</h4>
                            <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                                {post.summary || post.content.replace(/<[^>]+>/g, '')}
                            </p>
                        </div>

                        {/* Post Image (if any) */}
                        {post.thumbnail && (
                            <div className="w-full h-64 bg-slate-100 relative">
                                <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Post Actions */}
                        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-slate-500">
                            <button className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm">
                                <Heart className="w-5 h-5" />
                                <span>Thích</span>
                            </button>
                            <button className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm">
                                <MessageSquare className="w-5 h-5" />
                                <span>Bình luận</span>
                            </button>
                            <button className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm">
                                <Share2 className="w-5 h-5" />
                                <span>Chia sẻ</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
