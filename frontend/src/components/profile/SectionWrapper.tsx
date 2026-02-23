import React from 'react';
import { motion } from 'framer-motion';

interface SectionWrapperProps {
    children: React.ReactNode;
    title?: string;
    id?: string;
}

export const SectionWrapper = ({ children, title, id }: SectionWrapperProps) => {
    return (
        <motion.div
            id={id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.1, 0.9, 0.2, 1] }}
            className="glass-effect p-8 rounded-[24px] relative overflow-hidden group"
        >
            {/* Subtle Aurora Detail inside section */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors" />

            {title && (
                <h2 className="text-2xl font-bold mb-8 relative z-10">{title}</h2>
            )}

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
