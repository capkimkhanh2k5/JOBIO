import { LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    className?: string;
    compact?: boolean;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    compact = false,
}: EmptyStateProps) {
    const ActionIcon = action?.icon || ArrowRight;

    return (
        <div
            className={cn(
                'w-full flex-1 min-h-[calc(100vh-210px)] bg-card border border-border/60 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs transition-all',
                compact ? 'min-h-[380px] p-8' : '',
                className
            )}
        >
            {/* Icon Container Badge with Teal Theme */}
            <div className="w-16 h-16 rounded-full bg-muted border border-border/60 text-muted-foreground flex items-center justify-center mb-5 shadow-xs shrink-0">
                <Icon className="w-7 h-7 stroke-[1.75]" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold font-display text-foreground mb-2 tracking-tight">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed mb-7">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <Button
                    onClick={action.onClick}
                    className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 h-10 text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                    <span>{action.label}</span>
                    <ActionIcon className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}
