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
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/40 rounded-3xl bg-white/60 backdrop-blur-xl shadow-sm h-[300px]"
        >
            <div className="p-4 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white/60 mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-md mb-6">{description}</p>
            {action && (
                <Button
                    onClick={action.onClick}
                    className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white"
                >
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}
