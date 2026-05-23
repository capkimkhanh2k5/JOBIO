import React from 'react';
import { Recommendation } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RecommendationItemProps {
    recommendation: Recommendation;
    isOwner: boolean;
    onToggleVisibility?: (id: number, isVisible: boolean) => void;
}

export const RecommendationItem: React.FC<RecommendationItemProps> = ({
    recommendation,
    isOwner,
    onToggleVisibility,
}) => {
    return (
        <div className="group relative p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/20 transition-all overflow-hidden flex flex-col gap-4">
            {/* The subtile glow on hover */}
            <div className="absolute inset-x-0 -top-full h-full bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src={recommendation.recommender.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {recommendation.recommender.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">{recommendation.recommender.full_name}</h4>
                        <p className="text-sm font-medium text-foreground/80 truncate">
                            {recommendation.recommender.current_position}{recommendation.recommender.current_company ? ` tại ${recommendation.recommender.current_company}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {recommendation.relationship} • {new Date(recommendation.created_at).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`visibility-${recommendation.id}`} className="text-xs font-medium cursor-pointer">
                                {recommendation.is_visible ? 'Hiện' : 'Ẩn'}
                            </Label>
                            <Switch
                                id={`visibility-${recommendation.id}`}
                                checked={recommendation.is_visible}
                                onCheckedChange={(checked) => onToggleVisibility && onToggleVisibility(recommendation.id, checked)}
                                className="scale-75 origin-right"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line italic text-opacity-90">
                    "{recommendation.content}"
                </p>
            </div>

            {/* Action buttons (if any) could go here for the user who wrote it to edit/delete */}
        </div>
    );
};
