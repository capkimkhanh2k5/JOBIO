import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, Flag, UserCircle, PenLine } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    companyId: string;
    user: { id: string; full_name: string } | null;
}

function RatingBar({ label, rating }: { label: string; rating: number }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground w-36 shrink-0 text-xs">{label}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(rating / 5) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                />
            </div>
            <span className="font-bold text-xs text-amber-400 w-8 shrink-0">{rating.toFixed(1)}</span>
        </div>
    );
}

function ReviewCard({ review }: { review: any }) {
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
    const [hasUpvoted, setHasUpvoted] = useState(false);

    const helpfulMutation = useMutation({
        mutationFn: () => api.post(`/api/reviews/${review.id}/helpful/`),
        onSuccess: () => {
            setHelpfulCount((c: number) => c + 1);
            setHasUpvoted(true);
        },
    });

    const reportMutation = useMutation({
        mutationFn: () => api.post(`/api/reviews/${review.id}/report/`),
        onSuccess: () => toast.success('Đã gửi báo cáo. Cảm ơn bạn!'),
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-tinted rounded-2xl p-5 border border-white/10 space-y-3"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {review.is_anonymous ? (
                        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <UserCircle size={20} className="text-muted-foreground" />
                        </div>
                    ) : (
                        <img
                            src={review.user_avatar}
                            alt={review.user_name}
                            className="h-9 w-9 rounded-full object-cover border border-white/20 shrink-0"
                        />
                    )}
                    <div>
                        <p className="font-semibold text-sm">
                            {review.is_anonymous ? 'Ẩn danh' : review.user_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {review.is_anonymous ? '' : review.position + ' · '}
                            {review.employment_status}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                            <Star
                                key={i}
                                size={13}
                                className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{review.created_at}</span>
                </div>
            </div>

            {/* Content */}
            <div>
                <p className="font-bold text-sm mb-1.5">{review.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
            </div>

            {/* Pros / Cons */}
            {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {review.pros && (
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5">
                            <p className="text-xs font-bold text-emerald-400 mb-1">👍 Ưu điểm</p>
                            <p className="text-xs text-muted-foreground">{review.pros}</p>
                        </div>
                    )}
                    {review.cons && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5">
                            <p className="text-xs font-bold text-red-400 mb-1">👎 Nhược điểm</p>
                            <p className="text-xs text-muted-foreground">{review.cons}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-3 rounded-lg text-xs gap-1.5 transition-all ${hasUpvoted
                        ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                    disabled={hasUpvoted || helpfulMutation.isPending}
                    onClick={() => helpfulMutation.mutate()}
                >
                    <ThumbsUp size={12} className={hasUpvoted ? 'fill-cyan-400' : ''} />
                    Hữu ích ({helpfulCount})
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-1.5 transition-all"
                    disabled={reportMutation.isPending}
                    onClick={() => reportMutation.mutate()}
                >
                    <Flag size={12} />
                    Báo cáo
                </Button>
            </div>
        </motion.div>
    );
}

export function CompanyReviewsTab({ companyId, user }: Props) {
    const { data, isLoading } = useQuery({
        queryKey: ['company-reviews', companyId],
        queryFn: () => api.get(`/api/companies/${companyId}/reviews/`).then(r => r.data),
        staleTime: 1000 * 60 * 3,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
                {Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/5" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Rating summary */}
            <div className="glass-card-tinted rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    {/* Big number */}
                    <div className="text-center shrink-0">
                        <div className="text-6xl font-black text-amber-400">{data.average_rating.toFixed(1)}</div>
                        <div className="flex justify-center gap-0.5 my-2">
                            {Array(5).fill(0).map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={i < Math.round(data.average_rating) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{data.reviews.length} đánh giá</p>
                    </div>

                    <Separator orientation="vertical" className="h-28 bg-white/10 hidden sm:block" />

                    {/* Breakdown */}
                    <div className="flex-1 w-full space-y-2.5">
                        {data.rating_breakdown.map((item: { label: string; rating: number }) => (
                            <RatingBar key={item.label} label={item.label} rating={item.rating} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Write review CTA (if logged in) */}
            {user && (
                <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-white/10 hover:from-cyan-500/30 hover:to-violet-500/30 text-foreground font-semibold gap-2 transition-all">
                    <PenLine size={16} />
                    Viết đánh giá
                </Button>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                    Tất cả đánh giá ({data.reviews.length})
                </h3>
                {data.reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
}
