import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { label: 'Thông tin cơ bản', sub: 'Vị trí & lương' },
    { label: 'Mô tả & Yêu cầu', sub: 'JD & kỹ năng' },
    { label: 'Địa điểm & Công ty', sub: 'Nơi làm việc' },
    { label: 'SEO & Đăng tin', sub: 'Xem trước & xuất bản' },
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
                        <div key={idx} className="flex items-center flex-1">
                            {/* Circle */}
                            <div className="flex flex-col items-center flex-shrink-0">
                                <motion.div
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        boxShadow: active
                                            ? '0 0 0 4px rgba(6,182,212,0.2)'
                                            : 'none',
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300',
                                        done && 'bg-gradient-to-br from-cyan-500 to-violet-500 text-white',
                                        active && 'bg-gradient-to-br from-cyan-400 to-violet-500 text-white ring-2 ring-cyan-500/30',
                                        !done && !active && 'bg-white/10 text-white/40 border border-white/10'
                                    )}
                                >
                                    {done ? <Check size={16} /> : stepNum}
                                </motion.div>
                                {/* Label */}
                                <div className="mt-2 text-center hidden sm:block">
                                    <p className={cn(
                                        'text-xs font-semibold whitespace-nowrap',
                                        active ? 'text-white' : done ? 'text-cyan-400' : 'text-white/40'
                                    )}>
                                        {step.label}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-0.5 whitespace-nowrap">{step.sub}</p>
                                </div>
                            </div>

                            {/* Connector line (not after last) */}
                            {idx < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 mt-0 sm:-mt-6 rounded-full overflow-hidden bg-white/10">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
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
