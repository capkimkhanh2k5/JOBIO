import { motion } from 'framer-motion';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ElementType;
    action?: React.ReactNode;
}

/**
 * PageHeader — Editorial-style page headers with display font
 * and decorative teal-gold accent line.
 */
export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as any }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full px-6 lg:px-8 pt-2.5 lg:pt-3 pb-0"
        >
            <div className="editorial-line pt-3">
                <h1
                    className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {Icon && <Icon className="w-6 h-6 text-primary" />}
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-3xl">
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
    );
}
