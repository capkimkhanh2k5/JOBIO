import { motion } from 'framer-motion';
import {
    FileText,
    ListCheck,
    Gift
} from 'lucide-react';

interface JobDetailContentProps {
    description: string;
    requirements: string;
    benefits: string;
}

export const JobDetailContent = ({ description, requirements, benefits }: JobDetailContentProps) => {
    return (
        <div className="flex flex-col gap-8">
            {/* Description Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card-tinted rounded-[32px] p-8 md:p-10 border-white/20 relative overflow-hidden group"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-aurora-cyan/10 flex items-center justify-center text-aurora-cyan">
                        <FileText size={22} />
                    </div>
                    <h3 className="text-xl font-bold">Mô tả công việc</h3>
                </div>
                <div
                    className="prose prose-slate dark:prose-invert max-w-none 
                    prose-p:text-muted-foreground prose-li:text-muted-foreground
                    prose-strong:text-foreground prose-h4:text-foreground
                    [&>ul]:list-none [&>ul]:p-0
                    [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:mb-2
                    [&>ul>li::before]:content-[''] [&>ul>li::before]:absolute [&>ul>li::before]:left-0 [&>ul>li::before]:top-[0.6em]
                    [&>ul>li::before]:w-2 [&>ul>li::before]:h-2 [&>ul>li::before]:rounded-full [&>ul>li::before]:bg-aurora-cyan"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            </motion.section>

            {/* Requirements Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card-tinted rounded-[32px] p-8 md:p-10 border-white/20 relative overflow-hidden group"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-aurora-violet/10 flex items-center justify-center text-aurora-violet">
                        <ListCheck size={22} />
                    </div>
                    <h3 className="text-xl font-bold">Yêu cầu ứng viên</h3>
                </div>
                <div
                    className="prose prose-slate dark:prose-invert max-w-none 
                    prose-p:text-muted-foreground prose-li:text-muted-foreground
                    prose-strong:text-foreground
                    [&>ul]:list-none [&>ul]:p-0
                    [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:mb-2
                    [&>ul>li::before]:content-[attr(before)] [&>ul>li::before]:absolute [&>ul>li::before]:left-0 [&>ul>li::before]:text-aurora-violet
                    [&>ul>li]:flex [&>ul>li]:items-start
                    [&>ul>li]:gap-2"
                    dangerouslySetInnerHTML={{ __html: requirements.replace(/<li>/g, '<li><span class="mr-2 text-aurora-violet mt-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>') }}
                />
            </motion.section>

            {/* Benefits Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card-tinted rounded-[32px] p-8 md:p-10 border-white/20 relative overflow-hidden group"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-aurora-lime/10 flex items-center justify-center text-aurora-lime">
                        <Gift size={22} />
                    </div>
                    <h3 className="text-xl font-bold">Quyền lợi</h3>
                </div>
                <div
                    className="prose prose-slate dark:prose-invert max-w-none 
                    prose-p:text-muted-foreground prose-li:text-muted-foreground
                    prose-strong:text-foreground
                    [&>ul]:list-none [&>ul]:p-0
                    [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:mb-4 
                    grid grid-cols-1 md:grid-cols-2 gap-x-4"
                    dangerouslySetInnerHTML={{ __html: benefits.replace(/<li>/g, '<li class="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"><span class="flex-shrink-0 w-8 h-8 rounded-lg bg-aurora-lime/10 flex items-center justify-center text-aurora-lime"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="m17 5-5-3-5 3"></path><path d="m17 19-5 3-5-3"></path><path d="M2 12h20"></path><path d="m5 7 3 5-3 5"></path><path d="m19 7-3 5 3 5"></path></svg></span>') }}
                />
            </motion.section>
        </div>
    );
};
