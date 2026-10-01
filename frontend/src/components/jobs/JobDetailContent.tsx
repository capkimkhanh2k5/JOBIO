import { motion } from 'framer-motion';
import {
    FileText,
    ListCheck,
    Gift
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { Separator } from '@/components/ui/separator';

interface JobDetailContentProps {
    description: string;
    requirements: string;
    benefits: string | null;
}

export const JobDetailContent = ({ description, requirements, benefits }: JobDetailContentProps) => {
    const safeDescription = sanitizeHtml(description);
    const safeRequirements = sanitizeHtml(requirements);
    const safeBenefits = sanitizeHtml(benefits);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-2xl p-5 md:p-7 border border-border/80 shadow-sm space-y-7"
        >
            {/* Description Section */}
            <section className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        <FileText size={17} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Mô tả công việc</h3>
                </div>
                <div
                    className="prose prose-slate max-w-none text-sm text-foreground/80 leading-relaxed prose-p:mb-3 prose-strong:text-foreground prose-strong:font-semibold prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-3 prose-li:mb-1.5"
                    dangerouslySetInnerHTML={{ __html: safeDescription }}
                />
            </section>

            <Separator className="bg-border/50" />

            {/* Requirements Section */}
            <section className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        <ListCheck size={17} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Yêu cầu ứng viên</h3>
                </div>
                <div
                    className="prose prose-slate max-w-none text-sm text-foreground/80 leading-relaxed prose-strong:text-foreground [&>ul]:list-none [&>ul]:p-0 [&>ul>li]:relative [&>ul>li]:pl-7 [&>ul>li]:mb-2"
                    dangerouslySetInnerHTML={{
                        __html: safeRequirements.replace(/<li>/g, '<li class="flex items-start"><span class="absolute left-0 top-0.5 text-teal-600 bg-teal-500/10 p-0.5 rounded-md"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>')
                    }}
                />
            </section>

            {/* Benefits Section */}
            {benefits && (
                <>
                    <Separator className="bg-border/50" />
                    <section className="space-y-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                                <Gift size={17} />
                            </div>
                            <h3 className="text-base font-bold text-foreground">Quyền lợi</h3>
                        </div>
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            dangerouslySetInnerHTML={{
                                __html: safeBenefits.replace(/<li>/g, '<div class="flex items-start gap-2.5 p-3 rounded-xl bg-muted/60 border border-border/70 hover:bg-card hover:border-teal-300 transition-all group/benefit"><span class="flex-shrink-0 w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover/benefit:scale-110 transition-transform"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></span><p class="text-xs font-semibold text-foreground/80">')
                                    .replace(/<\/li>/g, '</p></div>')
                                    .replace(/<ul>/g, '')
                                    .replace(/<\/ul>/g, '')
                            }}
                        />
                    </section>
                </>
            )}
        </motion.div>
    );
};
