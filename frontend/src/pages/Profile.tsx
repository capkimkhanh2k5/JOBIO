
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { useUserStore } from '@/store/userStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Trophy, User, GraduationCap, Briefcase, Zap, Award, Languages as LangIcon, FolderGit2, FileText } from 'lucide-react';

// Components
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalForm } from '@/components/profile/PersonalForm';
import { EducationSection } from '@/components/profile/EducationSection';
import { ExperienceSection } from '@/components/profile/ExperienceSection';
import { SkillsSection } from '@/components/profile/SkillsSection';
import { CertificationsSection } from '@/components/profile/CertificationsSection';
import { LanguagesSection } from '@/components/profile/LanguagesSection';
import { ProjectsSection } from '@/components/profile/ProjectsSection';
import { SectionWrapper } from '@/components/profile/SectionWrapper';


const SECTION_NAV = [
    { id: 'header', label: 'Tổng quan', icon: User },
    { id: 'personal-info', label: 'Cá nhân', icon: FileText },
    { id: 'experience', label: 'Kinh nghiệm', icon: Briefcase },
    { id: 'education', label: 'Học vấn', icon: GraduationCap },
    { id: 'skills', label: 'Kỹ năng', icon: Zap },
    { id: 'certifications', label: 'Chứng chỉ', icon: Award },
    { id: 'languages', label: 'Ngoại ngữ', icon: LangIcon },
    { id: 'projects', label: 'Dự án', icon: FolderGit2 },
];

const ProfileSkeleton = () => (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Skeleton className="h-64 w-full rounded-[32px] mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-[24px]" />)}
            </div>
            <div className="space-y-6">
                <Skeleton className="h-96 w-full rounded-[24px]" />
                <Skeleton className="h-48 w-full rounded-[24px]" />
            </div>
        </div>
    </div>
);

const Profile = () => {
    const { user, updateUser } = useUserStore();
    const userId = user?.id;

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const res = await candidateService.getMyProfile();
            // Update user candidate_id in store if it's not set
            if (res.data?.id && user && user.candidate_id !== res.data.id) {
                updateUser({ candidate_id: res.data.id });
            }
            return res.data;
        },
        staleTime: 60_000,
        enabled: !!userId,
    });

    const candidateId = profile?.id;

    const { data: completeness, isLoading: completenessLoading } = useQuery({
        queryKey: ['profile-completeness', candidateId],
        queryFn: () => candidateService.getProfileCompleteness(Number(candidateId)).then(r => r.data),
        staleTime: 30_000,
        enabled: !!candidateId,
    });


    if (profileLoading || completenessLoading) return <ProfileSkeleton />;

    const score = completeness?.score ?? 0;
    const completedCount = completeness?.checklist?.filter((c: any) => c.completed).length ?? 0;
    const totalCount = completeness?.checklist?.length ?? 0;

    // Score color based on value
    const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-destructive';
    const progressColor = score >= 80
        ? 'from-emerald-500 to-cyan-400'
        : score >= 50 ? 'from-amber-500 to-primary' : 'from-destructive to-orange-500';

    return (
        <div className="relative pb-12 w-full flex-1">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 lg:p-8 w-full flex-1 relative z-10"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Main Content ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <ProfileHeader
                            profile={profile}
                        />

                        <SectionWrapper title="Thông tin cá nhân" id="personal-info">
                            <PersonalForm profile={profile} />
                        </SectionWrapper>

                        <ExperienceSection userId={candidateId as number} />

                        <EducationSection userId={candidateId as number} />

                        <SkillsSection userId={candidateId as number} />

                        <CertificationsSection userId={candidateId as number} />

                        <LanguagesSection userId={candidateId as number} />

                        <ProjectsSection userId={candidateId as number} />

                    </div>

                    {/* ── Sidebar ── */}
                    <div>
                        {/* Profile Completeness + Navigation Card (combined & sticky) */}
                        <Card className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl sticky top-24">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-violet-100 rounded-xl">
                                    <Trophy className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Độ hoàn thiện</h3>
                                    <p className="text-xs text-muted-foreground">{completedCount}/{totalCount} mục hoàn thành</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Score display */}
                                <div className="flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <span className={`text-5xl font-black ${scoreColor}`}>{score}%</span>
                                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Hồ sơ của bạn</p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full text-xs font-semibold ${score >= 80
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : score >= 50 ? 'bg-violet-100 text-violet-600 border-violet-200'
                                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}
                                    >
                                        {score >= 80 ? '✨ Nổi bật' : score >= 50 ? '📈 Phát triển' : '🚀 Bắt đầu'}
                                    </Badge>
                                </div>

                                {/* Progress bar */}
                                <div className="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ duration: 1.2, ease: [0.1, 0.9, 0.2, 1] }}
                                    />
                                </div>

                                {/* Checklist */}
                                <ul className="space-y-3">
                                    {completeness?.checklist?.map((item: any, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm group">
                                            <div className={`mt-0.5 shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                {item.completed
                                                    ? <CheckCircle2 className="w-4 h-4" />
                                                    : <Circle className="w-4 h-4" />
                                                }
                                            </div>
                                            <span className={`transition-all leading-snug ${item.completed
                                                ? 'text-slate-400 line-through text-xs'
                                                : 'font-medium text-sm text-slate-700 group-hover:text-violet-600 cursor-default'
                                                }`}
                                            >
                                                {item.task}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {score >= 90 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-3 bg-gradient-to-r from-violet-100 to-emerald-500/10 rounded-xl border border-violet-100 text-center"
                                    >
                                        <p className="text-xs font-bold text-violet-600">🏆 Verified Excellence</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Hồ sơ của bạn đã đạt chuẩn vàng!</p>
                                    </motion.div>
                                )}

                                {score < 90 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                                            Đạt <strong>{90 - score}% nữa</strong> để nhận huy hiệu <strong>Verified Excellence</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* ── Navigation Shortcuts (inside same card) ── */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-3">Điều hướng nhanh</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SECTION_NAV.map(({ id, label, icon: Icon }) => (
                                            <button
                                                key={id}
                                                onClick={() => {
                                                    const el = document.getElementById(id);
                                                    if (el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-[11px] font-semibold uppercase tracking-wider transition-all group text-left cursor-pointer border border-slate-100 hover:border-violet-100"
                                            >
                                                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 transition-colors shrink-0" />
                                                <span className="truncate">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
