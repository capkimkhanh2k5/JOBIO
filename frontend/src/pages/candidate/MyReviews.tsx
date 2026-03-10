import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star, MoreVertical, Edit2, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

function MyReviewCard({ review, onEdit, onDelete }: { review: any; onEdit: () => void; onDelete: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md group"
        >
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        {review.company.logo_url ? (
                            <img src={review.company.logo_url} alt={review.company.company_name} className="h-6 w-6 object-contain" />
                        ) : (
                            <Building2 className="text-gray-400" size={20} />
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                            {review.company.company_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-0.5">
                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                <span className="font-bold text-gray-700">{review.rating.toFixed(1)}</span>
                            </span>
                            <span>•</span>
                            <span>{format(new Date(review.created_at), 'dd MMM yyyy', { locale: vi })}</span>
                            {review.is_anonymous && (
                                <>
                                    <span>•</span>
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium">Ẩn danh</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 -mr-2">
                            <MoreVertical size={18} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
                            <Edit2 size={15} /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                            <Trash2 size={15} /> Xóa đánh giá
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-4 pl-14">
                <h5 className="font-bold text-sm text-gray-800 mb-1">{review.title}</h5>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">{review.content}</p>

                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                        <ThumbsUp size={13} className="fill-emerald-600 text-emerald-600" />
                        <span>{review.helpful_count} hữu ích</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <span>{review.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Simple ThumbsUp SVG because lucide ThumbsUp doesn't have a fill option out of box easily directly on the component
function ThumbsUp({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
    )
}

export function MyReviews() {
    const queryClient = useQueryClient();
    const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
    const { user } = useUserStore();
    const candidateId = user?.id;

    const { data, isLoading } = useQuery({
        queryKey: ['my-reviews', candidateId],
        queryFn: () => api.get(`/api/recruiters/${candidateId}/reviews/`).then(r => ({
            results: r.data.reviews,
            count: r.data.total,
        })),
        enabled: !!candidateId,
    });

    const deleteMutation = useMutation({
        mutationFn: (reviewId: number) => api.delete(`/api/reviews/${reviewId}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reviews', candidateId] });
            toast.success('Đã xóa đánh giá thành công.');
            setReviewToDelete(null);
        },
    });

    const handleEdit = (review: any) => {
        toast.info('Tính năng chỉnh sửa đang được phát triển.');
    };

    return (
        <div className="max-w-4xl max-w-full w-full mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Đánh giá của tôi</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý các đánh giá bạn đã viết cho các công ty.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
            ) : data?.results.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có đánh giá nào</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Bạn chưa viết đánh giá cho công ty nào. Hãy để lại đánh giá sau khi phỏng vấn hoặc làm việc nhé.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {data?.results.map((review) => (
                            <MyReviewCard
                                key={review.id}
                                review={review}
                                onEdit={() => handleEdit(review)}
                                onDelete={() => setReviewToDelete(review.id)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AlertDialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa đánh giá này?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => reviewToDelete && deleteMutation.mutate(reviewToDelete)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa đánh giá'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default MyReviews;
