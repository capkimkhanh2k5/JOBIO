import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatchScoreRingProps {
    score: number;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function MatchScoreRing({ score, size = "md", className }: MatchScoreRingProps) {
    const radius = size === "sm" ? 18 : size === "md" ? 28 : 42;
    const stroke = size === "sm" ? 3.5 : size === "md" ? 5 : 7;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const dimensions = {
        sm: "w-12 h-12",
        md: "w-20 h-20",
        lg: "w-28 h-28",
    };

    const textSizes = {
        sm: "text-[11px]",
        md: "text-sm",
        lg: "text-xl font-bold",
    };

    const colors = {
        low: "stroke-red-500",
        medium: "stroke-yellow-500",
        high: "stroke-emerald-500",
    };

    const scoreColor = score < 40 ? colors.low : score < 75 ? colors.medium : colors.high;

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <span className="text-[10px] font-black uppercase tracking-tighter text-primary/80 mb-1.5 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10">Match</span>
            <div className={cn("relative flex items-center justify-center", dimensions[size])}>
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="rotate-[-90deg]"
                >
                    {/* Background circle */}
                    <circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + " " + circumference}
                        style={{ strokeDashoffset: 0 }}
                        className="text-muted/20"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Progress circle */}
                    <motion.circle
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + " " + circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        strokeLinecap="round"
                        className={cn("transition-all duration-500", scoreColor)}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className={cn("absolute inset-0 flex items-center justify-center text-center", textSizes[size])}>
                    <span className="font-black text-foreground">{score}%</span>
                </div>
            </div>
        </div>
    );
}
