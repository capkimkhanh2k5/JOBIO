import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Brain, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Skill {
    id: number;
    skill: {
        id: number;
        name: string;
    };
    is_required: boolean;
    proficiency_level: string | null;
}

interface JobSkillsListProps {
    skills: Skill[];
}

export const JobSkillsList = ({ skills }: JobSkillsListProps) => {
    if (!skills || skills.length === 0) return null;

    return (
        <section className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-sm shadow-indigo-500/5 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Brain size={22} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Kỹ năng yêu cầu</h3>
            </div>

            <div className="flex flex-wrap gap-3">
                {skills.map((s, index) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-white transition-all cursor-default min-w-[140px]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-gray-900">{s.skill.name}</span>
                                {s.is_required && (
                                    <Badge variant="destructive" className="h-5 text-[10px] uppercase px-1.5 py-0 bg-red-50 text-red-600 border-red-100 hover:bg-red-50">
                                        Bắt buộc
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map((star) => (
                                        <Star
                                            key={star}
                                            size={10}
                                            className={cn(
                                                "transition-colors",
                                                (s.proficiency_level === 'expert' ||
                                                    (s.proficiency_level === 'advanced' && star <= 2) ||
                                                    (s.proficiency_level === 'middle' && star <= 2) ||
                                                    (s.proficiency_level === 'basic' && star <= 1) ||
                                                    (!s.proficiency_level && star <= 1))
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-gray-200'
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                    {s.proficiency_level || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

