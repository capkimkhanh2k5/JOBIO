import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { label: 'Thông tin cơ bản', sub: 'Vị trí & lương' },
    { label: 'Mô tả & Yêu cầu', sub: 'JD & kỹ năng' },
    { label: 'Địa điểm & Công ty', sub: 'Nơi làm việc' },
    { label: 'Xem trước & Đăng tin', sub: 'Kiểm tra & xuất bản' },
];

interface WizardProgressProps {
    current: number; // 1-based
}

export function WizardProgress({ current }: WizardProgressProps) {
    return (
        <div className="w-full">
            {/* Step bar */}
            <div className="flex items-center gap-0">
                {STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const done = stepNum < current;
                    const active = stepNum === current;

                    return (
                        <div key={idx} className={cn("flex items-center", idx < STEPS.length - 1 ? "flex-1" : "")}>
                            {/* Circle */}
                            <div className="flex flex-col items-center flex-shrink-0">
                                <motion.div
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        boxShadow: active
                                            ? '0 0 0 4px rgba(124, 58, 237, 0.15)'
                                            : 'none',
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300',
                                        done && 'bg-violet-600 text-white',
                                        active && 'bg-violet-600 text-white shadow-lg shadow-violet-500/20',
                                        !done && !active && 'bg-slate-100 text-slate-400 border border-slate-200'
                                    )}
                                >
                                    {done ? <Check size={16} /> : stepNum}
                                </motion.div>
                                {/* Label */}
                                <div className="mt-2 text-center hidden sm:block">
                                    <p className={cn(
                                        'text-xs font-bold whitespace-nowrap',
                                        active ? 'text-violet-600' : done ? 'text-slate-900' : 'text-slate-400'
                                    )}>
                                        {step.label}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{step.sub}</p>
                                </div>
                            </div>

                            {/* Connector line (not after last) */}
                            {idx < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 mt-0 sm:-mt-6 rounded-full overflow-hidden bg-slate-100">
                                    <motion.div
                                        className="h-full bg-violet-600"
                                        initial={{ width: '0%' }}
                                        animate={{ width: done ? '100%' : '0%' }}
                                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
