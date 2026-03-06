import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '@/services/candidateService';
import { RecommendationItem } from './RecommendationItem';
import { RequestRecommendationModal } from './RequestRecommendationModal';
import { WriteRecommendationModal } from './WriteRecommendationModal';
import { SectionWrapper } from '@/components/profile/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquarePlus, Star } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationsSectionProps {
    userId: number;
    userName?: string;
    isOwner: boolean;
}

export const RecommendationsSection = ({ userId, userName, isOwner }: RecommendationsSectionProps) => {
    const queryClient = useQueryClient();
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [writeModalOpen, setWriteModalOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['recommendations', userId],
        queryFn: () => recommendationService.getRecommendations(userId),
        staleTime: 60_000,
        enabled: !!userId,
    });

    const toggleVisibilityMutation = useMutation({
        mutationFn: ({ id, isVisible }: { id: number, isVisible: boolean }) =>
            recommendationService.toggleVisibility(id, isVisible),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
            toast.success("Đã cập nhật trạng thái hiển thị");
        },
        onError: () => {
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    });

    const handleToggleVisibility = (id: number, isVisible: boolean) => {
        toggleVisibilityMutation.mutate({ id, isVisible });
    };

    return (
        <SectionWrapper
            id="recommendations"
            title="Lời giới thiệu"
            action={isOwner ? (
                <Button variant="outline" size="sm" onClick={() => setRequestModalOpen(true)} className="gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Xin lời giới thiệu</span>
                </Button>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setWriteModalOpen(true)} className="gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Viết lời giới thiệu</span>
                </Button>
            )}
        >
            <div className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : !data || data.results.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                            <Star className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-foreground">Bạn chưa có lời giới thiệu nào</h4>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            {isOwner
                                ? "Những lời giới thiệu tốt sẽ giúp hồ sơ của bạn nổi bật hơn trong mắt nhà tuyển dụng. Hãy chủ động xin lời giới thiệu từ đồng nghiệp cũ nhé!"
                                : "Ứng viên này chưa có lời giới thiệu nào hiển thị."}
                        </p>
                        {isOwner && (
                            <Button variant="outline" onClick={() => setRequestModalOpen(true)} className="mt-4">
                                Bắt đầu xin lời giới thiệu
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {data.results.map((rec) => (
                            <RecommendationItem
                                key={rec.id}
                                recommendation={rec}
                                isOwner={isOwner}
                                onToggleVisibility={handleToggleVisibility}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isOwner ? (
                <RequestRecommendationModal
                    candidateId={userId}
                    open={requestModalOpen}
                    onOpenChange={setRequestModalOpen}
                />
            ) : (
                <WriteRecommendationModal
                    candidateId={userId}
                    candidateName={userName || 'Ứng viên'}
                    open={writeModalOpen}
                    onOpenChange={setWriteModalOpen}
                />
            )}
        </SectionWrapper>
    );
};
