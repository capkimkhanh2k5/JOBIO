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
            <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 flex items-center justify-center mb-4 shadow-2xs border border-teal-500/20 shrink-0">
                <Icon className="w-7 h-7 stroke-[1.75]" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-foreground mb-1.5 tracking-tight">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-xs sm:text-sm font-medium text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {action && (
                <Button
                    onClick={action.onClick}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-full px-6 h-10 text-xs font-bold shadow-md shadow-teal-500/20 inline-flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                    <span>{action.label}</span>
                    <ActionIcon className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}
