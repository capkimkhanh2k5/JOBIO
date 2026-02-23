import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Brain, Star } from 'lucide-react';

interface Skill {
    id: string;
    name: string;
    is_required: boolean;
    proficiency_level: string;
}

interface JobSkillsListProps {
    skills: Skill[];
}

export const JobSkillsList = ({ skills }: JobSkillsListProps) => {
    return (
        <section className="glass-card-tinted rounded-[32px] p-8 md:p-10 border-white/20 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Brain size={22} />
                </div>
                <h3 className="text-xl font-bold">Kỹ năng yêu cầu</h3>
            </div>

            <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                    <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                    >
                        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all cursor-default min-w-[140px]">
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-bold text-foreground">{skill.name}</span>
                                {skill.is_required && (
                                    <Badge variant="destructive" className="h-5 text-[10px] uppercase px-1.5 py-0">Bắt buộc</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map((star) => (
                                        <Star
                                            key={star}
                                            size={10}
                                            className={`${skill.proficiency_level === 'expert' ||
                                                (skill.proficiency_level === 'advanced' && star <= 2) ||
                                                (skill.proficiency_level === 'middle' && star <= 2) ||
                                                (skill.proficiency_level === 'basic' && star <= 1)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-muted-foreground/30'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">
                                    {skill.proficiency_level}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
