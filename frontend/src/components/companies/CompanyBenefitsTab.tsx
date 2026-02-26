import { motion } from 'framer-motion';
import {
    HeartPulse, GraduationCap, MapPin, Laptop, Coffee,
    DollarSign, Palmtree, Gift, Users, Zap
} from 'lucide-react';

interface Benefit {
    id: string;
    category: string;
    name: string;
    description: string;
    icon_url: string;
}

interface Props {
    benefits: Benefit[];
}

// Map icon string → Lucide component
const iconMap: Record<string, React.ElementType> = {
    HeartPulse,
    GraduationCap,
    MapPin,
    Laptop,
    Coffee,
    DollarSign,
    Palmtree,
    Gift,
    Users,
    Zap,
    Beer: Coffee, // fallback
};

// Group benefits by category
function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce((acc, item) => {
        const k = String(item[key]);
        (acc[k] = acc[k] || []).push(item);
        return acc;
    }, {} as Record<string, T[]>);
}

const CATEGORY_COLORS: Record<number, string> = {
    0: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    1: 'from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400',
    2: 'from-lime-500/20 to-lime-500/5 border-lime-500/20 text-lime-400',
    3: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
};

export function CompanyBenefitsTab({ benefits }: Props) {
    if (!benefits || benefits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground mb-4">
                    <Gift size={28} />
                </div>
                <p className="font-medium text-muted-foreground">Chưa có thông tin phúc lợi</p>
            </div>
        );
    }

    const grouped = groupBy(benefits, 'category');

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([category, items], catIdx) => (
                <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: catIdx * 0.1 }}
                >
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[catIdx % 4].split(' ')[0].replace('from-', '').replace('/20', '')}`} />
                        {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((benefit, bIdx) => {
                            const Icon = iconMap[benefit.icon_url] || Gift;
                            const colorCls = CATEGORY_COLORS[catIdx % 4];
                            return (
                                <motion.div
                                    key={benefit.id}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: catIdx * 0.1 + bIdx * 0.05 }}
                                    className={`rounded-2xl bg-gradient-to-br ${colorCls.split(' ').slice(0, 2).join(' ')} border ${colorCls.split(' ')[2]} p-5 flex gap-4 hover:scale-[1.02] transition-transform duration-200`}
                                >
                                    <div className={`h-10 w-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center ${colorCls.split(' ')[3]}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm mb-1">{benefit.name}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
