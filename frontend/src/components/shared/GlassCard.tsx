import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className }) => {
    return (
        <div className={cn(
            "relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden",
            className
        )}>
            {children}
        </div>
    );
};
