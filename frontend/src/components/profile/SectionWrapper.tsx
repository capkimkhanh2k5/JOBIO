import React from 'react';
import { motion } from 'framer-motion';

interface SectionWrapperProps {
    children: React.ReactNode;
    title?: string;
    id?: string;
    action?: React.ReactNode;
}

export const SectionWrapper = ({ children, title, id, action }: SectionWrapperProps) => {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.1, 0.9, 0.2, 1] }}
            className="bg-white border border-slate-200 shadow-sm p-8 rounded-[24px] relative overflow-hidden group"
        >
            {/* Subtle gradient accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-100/60 blur-[80px] rounded-full group-hover:bg-violet-200/60 transition-colors pointer-events-none" />

            {title && (
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                    {action && <div>{action}</div>}
                </div>
            )}

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

