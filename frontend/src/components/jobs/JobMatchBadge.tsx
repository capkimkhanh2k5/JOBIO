import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface JobMatchBadgeProps {
    score: number;
    className?: string;
    showIcon?: boolean;
}

export function JobMatchBadge({ score, className, showIcon = true }: JobMatchBadgeProps) {
    const getColors = (s: number) => {
        if (s >= 90) return "from-emerald-400 to-cyan-400 shadow-emerald-500/20 text-emerald-950 dark:text-emerald-50";
        if (s >= 80) return "from-cyan-400 to-blue-400 shadow-cyan-500/20 text-cyan-950 dark:text-cyan-50";
        if (s >= 70) return "from-blue-400 to-indigo-400 shadow-blue-500/20 text-blue-950 dark:text-blue-50";
        return "from-slate-400 to-slate-500 shadow-slate-500/20 text-slate-950 dark:text-slate-50";
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-tight",
                "bg-gradient-to-r backdrop-blur-md border border-white/20 shadow-lg",
                getColors(score),
                className
            )}
        >
            {showIcon && <Sparkles size={12} className="animate-pulse" />}
            <span>{score}% Match</span>

            {/* Glow effect */}
            <div className={cn(
                "absolute inset-0 rounded-full blur-[8px] -z-10 opacity-40",
                "bg-gradient-to-r",
                getColors(score).split(' ').find(c => c.startsWith('from-')),
                getColors(score).split(' ').find(c => c.startsWith('to-'))
            )} />
        </motion.div>
    );
}
