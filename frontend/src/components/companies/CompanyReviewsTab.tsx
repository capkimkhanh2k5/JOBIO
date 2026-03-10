import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, Flag, UserCircle, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { WriteReviewModal } from './WriteReviewModal';

interface Props {
    companyId: string | number;
    user: { id: string; full_name: string } | null;
}

function RatingBar({ label, rating }: { label: string; rating: number }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 w-36 shrink-0 text-xs font-medium">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
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
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4 hover:shadow transition-shadow"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {review.is_anonymous ? (
                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                            <UserCircle size={22} className="text-gray-400" />
                        </div>
                    ) : (
                        <img
                            src={review.user_avatar}
                            alt={review.user_name}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200 shrink-0 shadow-sm"
                        />
                    )}
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">
                            {review.is_anonymous ? 'Ẩn danh' : review.user_name}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                            {review.is_anonymous ? '' : review.position + ' · '}
                            {review.employment_status}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex gap-0.5">
                        {Array(5).fill(0).map((_, i) => (
                            <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{review.created_at}</span>
                </div>
            </div>

            {/* Content */}
            <div>
                <p className="font-bold text-gray-900 text-sm mb-1.5">{review.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{review.content}</p>
            </div>

            {/* Pros / Cons */}
            {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {review.pros && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                            <p className="text-xs font-bold text-emerald-600 mb-1.5 flex items-center gap-1.5">
                                <span className="text-base">👍</span> Ưu điểm
                            </p>
                            <p className="text-sm text-emerald-800 leading-relaxed">{review.pros}</p>
                        </div>
                    )}
                    {review.cons && (
                        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                            <p className="text-xs font-bold text-red-600 mb-1.5 flex items-center gap-1.5">
                                <span className="text-base">👎</span> Nhược điểm
                            </p>
                            <p className="text-sm text-red-800 leading-relaxed">{review.cons}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 rounded-lg text-xs font-medium gap-1.5 transition-colors ${hasUpvoted
                        ? 'text-primary bg-primary/5 hover:bg-primary/10'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    disabled={hasUpvoted || helpfulMutation.isPending}
                    onClick={() => helpfulMutation.mutate()}
                >
                    <ThumbsUp size={14} className={hasUpvoted ? 'fill-primary' : ''} />
                    Hữu ích ({helpfulCount})
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5 transition-colors"
                    disabled={reportMutation.isPending}
                    onClick={() => reportMutation.mutate()}
                >
                    <Flag size={14} />
                    Báo cáo
                </Button>
            </div>
        </motion.div>
    );
}

export function CompanyReviewsTab({ companyId, user }: Props) {
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const parsedCompanyId = Number(companyId);

    const { data, isLoading } = useQuery({
        queryKey: ['company-reviews', parsedCompanyId],
        queryFn: () =>
            api.get(`/api/companies/${parsedCompanyId}/reviews/`).then(r => r.data),
        staleTime: 1000 * 60 * 3,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl bg-gray-100" />
                {Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl bg-gray-50" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Rating summary */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    {/* Big number */}
                    <div className="text-center shrink-0">
                        <div className="text-6xl font-black text-amber-400">{data.average_rating.toFixed(1)}</div>
                        <div className="flex justify-center gap-1 my-2">
                            {Array(5).fill(0).map((_, i) => (
                                <Star
                                    key={i}
                                    size={18}
                                    className={i < Math.round(data.average_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{data.reviews.length} đánh giá</p>
                    </div>

                    <Separator orientation="vertical" className="h-28 bg-gray-100 hidden sm:block" />

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
                <Button
                    onClick={() => setIsWriteModalOpen(true)}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
                >
                    <PenLine size={18} />
                    Viết đánh giá
                </Button>
            )}

            {/* Write Review Modal */}
            <WriteReviewModal
                companyId={parsedCompanyId}
                isOpen={isWriteModalOpen}
                onClose={() => setIsWriteModalOpen(false)}
            />

            {/* Reviews list */}
            <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500">
                    Tất cả đánh giá ({data.reviews.length})
                </h3>
                {data.reviews.map((review: any) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
}
