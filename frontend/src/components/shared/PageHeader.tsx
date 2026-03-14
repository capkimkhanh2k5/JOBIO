import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ElementType;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
    return (
        <div className="relative w-full bg-white/40 backdrop-blur-md border-b border-slate-200/50 py-8 md:py-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100/40 via-cyan-50/20 to-transparent" />

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
                                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                                    <Icon className="w-6 h-6" />
                                </div>
                            )}
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                {title}
                            </h1>
                        </div>
                        {description && (
                            <p className="mt-3 text-base md:text-lg text-slate-600 max-w-3xl">
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
