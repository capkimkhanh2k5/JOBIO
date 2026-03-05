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
            className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}>
                    <Icon size={16} className={color.replace('bg-', 'text-').replace('/10', '')} />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
            </div>
            <span className="font-bold text-gray-900 tabular-nums">
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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
                <Skeleton className="h-6 w-32 bg-gray-100" />
                {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl bg-gray-50" />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Star size={14} className="text-primary fill-current" />
                </div>
                Tổng quan
            </h3>

            <div className="space-y-2.5">
                <StatItem
                    icon={Briefcase}
                    label="Đang tuyển dụng"
                    value={stats.job_count}
                    color="bg-indigo-500/10"
                    delay={0.05}
                />
                <StatItem
                    icon={Users}
                    label="Người theo dõi"
                    value={stats.follower_count}
                    color="bg-violet-500/10"
                    delay={0.1}
                />
                <StatItem
                    icon={MessageSquareText}
                    label="Đánh giá"
                    value={stats.review_count}
                    color="bg-emerald-500/10"
                    delay={0.15}
                />
                <StatItem
                    icon={Star}
                    label="Điểm trung bình"
                    value={`${stats.avg_rating.toFixed(1)} / 5`}
                    color="bg-amber-500/10"
                    delay={0.2}
                />
                <StatItem
                    icon={Send}
                    label="Lượt ứng tuyển"
                    value={stats.application_count}
                    color="bg-rose-500/10"
                    delay={0.25}
                />
            </div>

            {/* Mini rating display */}
            <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-amber-400">{stats.avg_rating.toFixed(1)}</span>
                    <div>
                        <div className="flex gap-0.5 mb-0.5">
                            {Array(5).fill(0).map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    className={i < Math.round(stats.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{stats.review_count} đánh giá</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
