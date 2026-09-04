import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { label: 'Thông tin cơ bản' },
    { label: 'Mô tả công việc' },
    { label: 'Yêu cầu & Quyền lợi' },
    { label: 'Xem trước & Đăng tin' },
];

interface WizardProgressProps {
    current: number; // 1-based
}

export function WizardProgress({ current }: WizardProgressProps) {
    return (
        <div className="flex items-center gap-0 w-full">
            {STEPS.map((step, idx) => {
                const stepNum = idx + 1;
                const done = stepNum < current;
                const active = stepNum === current;

                return (
                    <div key={idx} className={cn("flex items-center", idx < STEPS.length - 1 ? "flex-1" : "")}>
                        {/* Step pill */}
                        <div className="flex items-center gap-2 shrink-0">
                            <motion.div
                                animate={{ scale: active ? 1.05 : 1 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200',
                                    done && 'bg-teal-600 text-white',
                                    active && 'bg-teal-600 text-white shadow-md shadow-teal-500/25',
                                    !done && !active && 'bg-muted text-muted-foreground/50 border border-border'
                                )}
                            >
                                {done ? <Check size={14} /> : stepNum}
                            </motion.div>
                            <span className={cn(
                                'text-xs font-bold whitespace-nowrap hidden sm:inline',
                                active ? 'text-teal-600' : done ? 'text-foreground/70' : 'text-muted-foreground/50'
                            )}>
                                {step.label}
                            </span>
                        </div>

                        {/* Connector */}
                        {idx < STEPS.length - 1 && (
                            <div className="flex-1 h-px mx-3 rounded-full overflow-hidden bg-border">
                                <motion.div
                                    className="h-full bg-teal-600"
                                    initial={{ width: '0%' }}
                                    animate={{ width: done ? '100%' : '0%' }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
