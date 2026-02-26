import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Users, Briefcase, MessageSquareText, Send } from 'lucide-react';

interface Stats {
    job_count: number;
    follower_count: number;
    review_count: number;
    avg_rating: number;
    application_count: number;
}

interface Props {
    stats?: Stats;
}

function StatItem({
    icon: Icon,
    label,
    value,
    color,
    delay,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={15} className="text-white" />
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <span className="font-bold text-foreground tabular-nums">
                {typeof value === 'number' && value > 999
                    ? `${(value / 1000).toFixed(1)}k`
                    : value}
            </span>
        </motion.div>
    );
}

export function CompanyStatsSidebar({ stats }: Props) {
    if (!stats) {
        return (
            <div className="glass-card-tinted rounded-2xl p-6 border border-white/10 space-y-3">
                <Skeleton className="h-6 w-32 bg-white/5" />
                {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card-tinted rounded-2xl p-6 border border-white/10"
        >
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                    <Star size={11} className="text-white" />
                </div>
                Tổng quan
            </h3>

            <div className="space-y-2.5">
                <StatItem
                    icon={Briefcase}
                    label="Đang tuyển dụng"
                    value={stats.job_count}
                    color="bg-cyan-500/80"
                    delay={0.05}
                />
                <StatItem
                    icon={Users}
                    label="Người theo dõi"
                    value={stats.follower_count}
                    color="bg-violet-500/80"
                    delay={0.1}
                />
                <StatItem
                    icon={MessageSquareText}
                    label="Đánh giá"
                    value={stats.review_count}
                    color="bg-lime-500/80"
                    delay={0.15}
                />
                <StatItem
                    icon={Star}
                    label="Điểm đánh giá"
                    value={`${stats.avg_rating.toFixed(1)} / 5`}
                    color="bg-amber-500/80"
                    delay={0.2}
                />
                <StatItem
                    icon={Send}
                    label="Ứng tuyển"
                    value={stats.application_count}
                    color="bg-pink-500/80"
                    delay={0.25}
                />
            </div>

            {/* Mini rating display */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-amber-400">{stats.avg_rating.toFixed(1)}</span>
                    <div>
                        <div className="flex gap-0.5 mb-0.5">
                            {Array(5).fill(0).map((_, i) => (
                                <Star
                                    key={i}
                                    size={13}
                                    className={i < Math.round(stats.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{stats.review_count} đánh giá</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
