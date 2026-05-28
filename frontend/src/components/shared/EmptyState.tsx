import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Optional height override (default: 300px) */
    height?: number;
}

/**
 * EmptyState — Unified empty data state component for all modules.
 * Follows the admin design language: clean white, no glassmorphism.
 * @see UI_RULES.md §13
 */
export function EmptyState({ icon, title, description, action, height = 300 }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm"
            style={{ minHeight: height }}
        >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
            {action && (
                <Button
                    onClick={action.onClick}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-sm"
                >
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}
