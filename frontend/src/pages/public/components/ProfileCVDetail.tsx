import { useQuery } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Briefcase, Code, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type SkillApiFallback = {
    skill?: { name?: string } | null;
    skill_name?: string | null;
    proficiency_level?: string | null;
    id?: number | string;
};

const getSkillDisplayName = (skill: SkillApiFallback) => (
    skill.skill?.name ?? skill.skill_name ?? 'Kỹ năng'
);

const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Hiện tại';
    try {
        return format(new Date(dateString), 'MM/yyyy', { locale: vi });
    } catch {
        return dateString;
    }
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
    icon,
    title,
    iconColor,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    iconColor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <span className={iconColor}>{icon}</span>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Empty placeholder ────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
    return <p className="text-xs text-slate-400 text-center py-3">{text}</p>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export const ProfileCVDetail = ({ userId }: { userId: number }) => {
    const { data: education, isLoading: isLoadingEdu } = useQuery({
        queryKey: ['public-education', userId],
        queryFn: () => candidateService.listEducation(userId).then(r => r.data),
    });

    const { data: experience, isLoading: isLoadingExp } = useQuery({
        queryKey: ['public-experience', userId],
        queryFn: () => candidateService.listExperience(userId).then(r => r.data),
    });

    const { data: skills, isLoading: isLoadingSkills } = useQuery({
        queryKey: ['public-skills', userId],
        queryFn: () => candidateService.listSkills(userId).then(r => r.data),
    });

    return (
        <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900 tracking-tight px-1">Chi tiết Hồ sơ</h2>

            {/* ── Kinh nghiệm làm việc ── */}
            <Section
                icon={<Briefcase className="w-4 h-4" />}
                title="Kinh nghiệm làm việc"
                iconColor="text-orange-500"
            >
                {isLoadingExp ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                ) : experience?.length ? (
                    <div className="space-y-3">
                        {experience.map((exp, index) => (
                            <div
                                key={exp.id || index}
                                className="flex gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                {/* Icon dot */}
                                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Briefcase className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 text-sm leading-snug truncate">
                                        {exp.job_title}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                        {exp.company_name}
                                    </p>
                                    <p className="text-[11px] text-orange-500 font-semibold mt-1">
                                        {formatDate(exp.start_date)} – {formatDate(exp.end_date)}
                                    </p>
                                    {exp.description && (
                                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                                            {exp.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty text="Chưa có thông tin kinh nghiệm." />
                )}
            </Section>

            {/* ── Học vấn ── */}
            <Section
                icon={<GraduationCap className="w-4 h-4" />}
                title="Học vấn"
                iconColor="text-violet-500"
            >
                {isLoadingEdu ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                ) : education?.length ? (
                    <div className="space-y-3">
                        {education.map((edu, index) => (
                            <div
                                key={edu.id || index}
                                className="flex gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <GraduationCap className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 text-sm leading-snug">
                                        {edu.school_name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {edu.degree}{edu.field_of_study ? ` – ${edu.field_of_study}` : ''}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {formatDate(edu.start_date)} – {formatDate(edu.end_date)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty text="Chưa có thông tin học vấn." />
                )}
            </Section>

            {/* ── Kỹ năng ── */}
            <Section
                icon={<Code className="w-4 h-4" />}
                title="Kỹ năng"
                iconColor="text-fuchsia-500"
            >
                {isLoadingSkills ? (
                    <div className="flex gap-2 flex-wrap">
                        <Skeleton className="h-7 w-20 rounded-full" />
                        <Skeleton className="h-7 w-28 rounded-full" />
                        <Skeleton className="h-7 w-16 rounded-full" />
                    </div>
                ) : skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                        {(skills as SkillApiFallback[]).map((skill, index) => {
                            const skillName = getSkillDisplayName(skill);
                            return (
                                <div
                                    key={skill.id || index}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 rounded-full border border-fuchsia-100 text-xs font-semibold hover:border-fuchsia-300 transition-colors"
                                >
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    {skillName}
                                    {skill.proficiency_level && (
                                        <span className="opacity-60">({skill.proficiency_level})</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Empty text="Chưa có thông tin kỹ năng." />
                )}
            </Section>
        </div>
    );
};
