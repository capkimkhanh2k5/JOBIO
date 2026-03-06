import { motion } from "framer-motion";
import { MatchScoreBreakdown as BreakdownType } from "@/types/matching";
import { cn } from "@/lib/utils";

interface MatchScoreBreakdownProps {
    breakdown: BreakdownType;
    className?: string;
}

const LABELS: { key: keyof BreakdownType; label: string }[] = [
    { key: 'skill_match_score', label: 'Skills' },
    { key: 'experience_match_score', label: 'Experience' },
    { key: 'education_match_score', label: 'Education' },
    { key: 'location_match_score', label: 'Location' },
    { key: 'salary_match_score', label: 'Salary' },
];

export function MatchScoreBreakdown({ breakdown, className }: MatchScoreBreakdownProps) {
    const size = 300;
    const center = size / 2;
    const radius = center * 0.7;
    const angleStep = (Math.PI * 2) / LABELS.length;

    // Calculate points for the polygon
    const getPoint = (score: number, index: number, maxScore = 100) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = (score / maxScore) * radius;
        return {
            x: center + distance * Math.cos(angle),
            y: center + distance * Math.sin(angle),
        };
    };

    const points = LABELS.map((item, i) => getPoint(breakdown[item.key], i));
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    const gridPoints50 = LABELS.map((_, i) => getPoint(50, i));
    const gridString50 = gridPoints50.map(p => `${p.x},${p.y}`).join(' ');

    const gridPoints100 = LABELS.map((_, i) => getPoint(100, i));
    const gridString100 = gridPoints100.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-8 items-center", className)}>
            <div className="relative flex justify-center items-center">
                {/* Radar Chart SVG */}
                <svg width={size} height={size} className="drop-shadow-2xl">
                    {/* Grid lines */}
                    <polygon
                        points={gridString100}
                        className="fill-none stroke-border/20"
                        strokeWidth="1"
                    />
                    <polygon
                        points={gridString50}
                        className="fill-none stroke-border/10"
                        strokeWidth="1"
                    />

                    {/* Axis lines */}
                    {LABELS.map((_, i) => {
                        const p = getPoint(100, i);
                        return (
                            <line
                                key={`axis-${i}`}
                                x1={center}
                                y1={center}
                                x2={p.x}
                                y2={p.y}
                                className="stroke-border/10"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Actual Score Polygon */}
                    <motion.polygon
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.3, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        points={pointsString}
                        className="fill-primary/40 stroke-primary"
                        strokeWidth="2"
                    />

                    {/* Points on the polygon */}
                    {points.map((p, i) => (
                        <motion.circle
                            key={`point-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 + i * 0.1 }}
                            className="fill-primary stroke-background"
                            strokeWidth="1.5"
                        />
                    ))}

                    {/* Labels */}
                    {LABELS.map((item, i) => {
                        const p = getPoint(120, i);
                        const anchor = i === 0 ? "middle" : i < 3 ? "start" : i === 3 ? "middle" : "end";
                        return (
                            <text
                                key={`label-${i}`}
                                x={p.x}
                                y={p.y}
                                textAnchor={anchor}
                                className="text-[10px] font-bold uppercase tracking-widest fill-muted-foreground"
                            >
                                {item.label}
                            </text>
                        );
                    })}
                </svg>

                {/* Aurora Background for the chart */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/5 via-accent/5 to-transparent blur-3xl rounded-full" />
            </div>

            <div className="space-y-4">
                {LABELS.map((item, i) => (
                    <div key={item.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground font-medium">{item.label}</span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="font-bold text-primary"
                            >
                                {breakdown[item.key]}%
                            </motion.span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${breakdown[item.key]}%` }}
                                transition={{ duration: 1, delay: 0.8 + i * 0.1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full bg-gradient-to-r",
                                    breakdown[item.key] > 80
                                        ? "from-primary to-accent"
                                        : breakdown[item.key] > 50
                                            ? "from-blue-500 to-primary"
                                            : "from-orange-500 to-red-500"
                                )}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
