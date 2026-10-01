import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface Skill {
    id: number;
    skill?: {
        id: number;
        name: string;
    } | string | null;
    skill_name?: string;
    is_required: boolean;
    proficiency_level?: string | null;
}

interface JobSkillsListProps {
    skills: Skill[];
}

export const JobSkillsList = ({ skills }: JobSkillsListProps) => {
    if (!skills || skills.length === 0) return null;

    return (
        <section className="bg-card rounded-2xl p-5 md:p-7 border border-border/80 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <Brain size={17} />
                </div>
                <h3 className="text-base font-bold text-foreground">Kỹ năng yêu cầu</h3>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
                {skills.map((s, index) => {
                    const skillName = s.skill_name || (typeof s.skill === 'string' ? s.skill : s.skill?.name) || 'Kỹ năng';
                    return (
                        <motion.div
                            key={s.id ?? index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.03 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 hover:bg-card hover:border-teal-500/30 transition-all cursor-default"
                        >
                            <span className="text-xs font-semibold text-foreground">
                                {skillName}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

