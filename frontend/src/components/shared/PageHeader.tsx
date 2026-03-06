import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div className="relative w-full bg-white/40 backdrop-blur-md border-b border-slate-200/50 py-8 md:py-12 overflow-hidden overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100/40 via-cyan-50/20 to-transparent" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-3 text-base md:text-lg text-slate-600 max-w-2xl">
                            {description}
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
