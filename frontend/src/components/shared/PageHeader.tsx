import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ElementType;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
    return (
        <div className="relative w-full bg-white/40 backdrop-blur-md border-b border-slate-200/50 py-5 md:py-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100/30 via-cyan-50/10 to-transparent" />

            <div className="w-full px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            {Icon && (
                                <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm transition-all duration-300">
                                    <Icon className="w-6 h-6" />
                                </div>
                            )}
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight transition-all duration-300">
                                {title}
                            </h1>
                        </div>
                        {description && (
                            <p className="mt-1 text-sm text-slate-500 max-w-3xl transition-all duration-300">
                                {description}
                            </p>
                        )}
                    </div>

                    {action && (
                        <div className="flex items-center gap-3 shrink-0">
                            {action}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
