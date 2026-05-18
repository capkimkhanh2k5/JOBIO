import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Users, Briefcase, Send } from 'lucide-react';

interface Stats {
    job_count: number;
    follower_count: number;
    application_count: number;
}

interface Props {
    stats?: Stats;
    followerCount?: number;
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

export function CompanyStatsSidebar({ stats, followerCount: syncedFollowerCount }: Props) {
    if (!stats) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
                <Skeleton className="h-6 w-32 bg-gray-100" />
                {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl bg-gray-50" />
                ))}
            </div>
        );
    }

    const getSafeNumber = (val: unknown): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return Number(val) || 0;
        if (typeof val === 'object' && val !== null) {
            const values = Object.values(val);
            const num = values.find(v => typeof v === 'number' || typeof v === 'string');
            return Number(num) || 0;
        }
        return 0;
    };

    const jobCount = getSafeNumber(stats.job_count);
    const followerCount = syncedFollowerCount ?? getSafeNumber(stats.follower_count);
    const applicationCount = getSafeNumber(stats.application_count);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 size={14} className="text-primary" />
                </div>
                Tổng quan
            </h3>

            <div className="space-y-2.5">
                <StatItem
                    icon={Briefcase}
                    label="Đang tuyển dụng"
                    value={jobCount}
                    color="bg-indigo-500/10"
                    delay={0.05}
                />
                <StatItem
                    icon={Users}
                    label="Người theo dõi"
                    value={followerCount}
                    color="bg-violet-500/10"
                    delay={0.1}
                />
                <StatItem
                    icon={Send}
                    label="Lượt ứng tuyển"
                    value={applicationCount}
                    color="bg-rose-500/10"
                    delay={0.15}
                />
            </div>
        </motion.div>
    );
}
