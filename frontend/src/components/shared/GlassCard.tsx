import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * GlassCard — Editorial Luxury glass card with warm teal tinting.
 * Uses glass-card-tinted utility from the design system.
 */
export const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => {
    return (
        <div className={cn(
            "relative glass-card-tinted rounded-3xl overflow-hidden",
            className
        )}>
            {children}
        </div>
    );
};
