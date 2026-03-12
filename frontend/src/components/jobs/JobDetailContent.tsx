import { motion } from 'framer-motion';
import {
    FileText,
    ListCheck,
    Gift
} from 'lucide-react';

interface JobDetailContentProps {
    description: string;
    requirements: string;
    benefits: string | null;
}

export const JobDetailContent = ({ description, requirements, benefits }: JobDetailContentProps) => {
    return (
        <div className="flex flex-col gap-6">
            {/* Description Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden group"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                        <FileText size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Mô tả công việc</h3>
                </div>
                <div
                    className="prose prose-slate max-w-none 
                    text-slate-700 leading-relaxed
                    prose-p:mb-4
                    prose-strong:text-slate-900 prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-4
                    prose-li:mb-2"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            </motion.section>

            {/* Requirements Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden group"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                        <ListCheck size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Yêu cầu ứng viên</h3>
                </div>
                <div
                    className="prose prose-slate max-w-none 
                    text-slate-700 leading-relaxed
                    prose-strong:text-slate-900
                    [&>ul]:list-none [&>ul]:p-0
                    [&>ul>li]:relative [&>ul>li]:pl-8 [&>ul>li]:mb-3"
                    dangerouslySetInnerHTML={{
                        __html: requirements.replace(/<li>/g, '<li class="flex items-start"><span class="absolute left-0 top-1 text-sky-600 bg-sky-50 p-1 rounded-md"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>')
                    }}
                />
            </motion.section>

            {/* Benefits Section */}
            {benefits && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden group"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                            <Gift size={22} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Quyền lợi</h3>
                    </div>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        dangerouslySetInnerHTML={{
                            __html: benefits.replace(/<li>/g, '<div class="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-sky-300 transition-all group/benefit"><span class="flex-shrink-0 w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 group-hover/benefit:scale-110 transition-transform"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></span><p class="text-sm font-semibold text-slate-700">')
                                .replace(/<\/li>/g, '</p></div>')
                                .replace(/<ul>/g, '')
                                .replace(/<\/ul>/g, '')
                        }}
                    />
                </motion.section>
            )}
        </div>
    );
};

