import { motion } from 'framer-motion';
import {
    HeartPulse, GraduationCap, MapPin, Laptop, Coffee,
    DollarSign, Palmtree, Gift, Users, Zap
} from 'lucide-react';

interface Benefit {
    id: string | number;
    category?: string | number | { id: number; name: string };
    category_name?: string;
    benefit_name?: string;
    name?: string;
    description?: string | null;
    icon_url?: string | null;
    category_icon?: string | null;
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

const CATEGORY_COLORS: Record<number, string> = {
    0: 'from-cyan-50 to-white border-cyan-100 text-cyan-600 bg-cyan-100', // colorCls structure: gradient_from gradient_to border_col block_col
    1: 'from-violet-50 to-white border-violet-100 text-violet-600 bg-violet-100',
    2: 'from-emerald-50 to-white border-emerald-100 text-emerald-600 bg-emerald-100',
    3: 'from-amber-50 to-white border-amber-100 text-amber-600 bg-amber-100',
};

const getBenefitName = (benefit: Benefit) => benefit.benefit_name || benefit.name || 'Phúc lợi';

const getBenefitCategoryName = (benefit: Benefit) => (
    benefit.category_name
    || (typeof benefit.category === 'object' ? benefit.category.name : undefined)
    || (benefit.category ? String(benefit.category) : undefined)
    || 'Chưa phân loại'
);

export function CompanyBenefitsTab({ benefits }: Props) {
    if (!benefits || benefits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
                    <Gift size={28} />
                </div>
                <p className="font-medium text-gray-500">Chưa có thông tin phúc lợi</p>
            </div>
        );
    }

    const grouped = benefits.reduce<Record<string, Benefit[]>>((acc, benefit) => {
        const category = getBenefitCategoryName(benefit);
        (acc[category] = acc[category] || []).push(benefit);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([category, items], catIdx) => (
                <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: catIdx * 0.1 }}
                >
                    <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[catIdx % 4].split(' ')[0]} ${CATEGORY_COLORS[catIdx % 4].split(' ')[1]}`} />
                        {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((benefit, bIdx) => {
                            const Icon = iconMap[benefit.icon_url || benefit.category_icon || ''] || Gift;
                            const colorCls = CATEGORY_COLORS[catIdx % 4];
                            return (
                                <motion.div
                                    key={benefit.id}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: catIdx * 0.1 + bIdx * 0.05 }}
                                    className={`rounded-2xl bg-gradient-to-br ${colorCls.split(' ')[0]} ${colorCls.split(' ')[1]} border ${colorCls.split(' ')[2]} p-5 flex gap-4 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200`}
                                >
                                    <div className={`h-10 w-10 shrink-0 rounded-xl ${colorCls.split(' ')[4]} flex items-center justify-center ${colorCls.split(' ')[3]}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm mb-1">{getBenefitName(benefit)}</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{benefit.description}</p>
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
