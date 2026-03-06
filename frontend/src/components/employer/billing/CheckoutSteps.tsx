import React from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, ShoppingBag, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutStepsProps {
    currentStep: number;
}

const STEPS = [
    { id: 1, label: 'Xác nhận gói', icon: ShoppingBag },
    { id: 2, label: 'Phương thức', icon: CreditCard },
    { id: 3, label: 'Thanh toán', icon: Landmark },
];

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ currentStep }) => {
    return (
        <div className="flex items-center justify-center w-full max-w-2xl mx-auto mb-12">
            {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center relative">
                        <motion.div
                            initial={false}
                            animate={{
                                backgroundColor: currentStep >= step.id ? 'rgb(6, 182, 212)' : 'transparent',
                                color: currentStep >= step.id ? '#fff' : 'rgb(148, 163, 184)',
                            }}
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 transition-colors duration-500",
                                currentStep >= step.id ? "shadow-lg shadow-cyan-500/20 border-transparent" : "border border-slate-200"
                            )}
                        >
                            {currentStep > step.id ? (
                                <Check className="w-6 h-6" />
                            ) : (
                                <step.icon className="w-6 h-6" />
                            )}

                            {/* Active indicator ring */}
                            {currentStep === step.id && (
                                <motion.div
                                    layoutId="active-ring"
                                    className="absolute -inset-1 rounded-[18px] border-2 border-cyan-500/30"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </motion.div>

                        <span className={cn(
                            "text-xs font-bold mt-3 transition-colors duration-500",
                            currentStep >= step.id ? "text-slate-900" : "text-slate-400"
                        )}>
                            {step.label}
                        </span>
                    </div>

                    {idx < STEPS.length - 1 && (
                        <div className="w-24 h-[2px] mx-4 mb-6 bg-slate-100 relative overflow-hidden">
                            <motion.div
                                initial={{ left: '-100%' }}
                                animate={{ left: currentStep > step.id ? '0%' : '-100%' }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500"
                            />
                        </div>
                    )}

                </React.Fragment>
            ))}
        </div>
    );
};
