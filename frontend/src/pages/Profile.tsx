import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { RecommendationsSection } from '@/components/candidate/recommendations/RecommendationsSection';

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
    const queryClient = useQueryClient();
    const { user } = useUserStore();
    const userId = user?.id;

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile', userId],
        queryFn: () => candidateService.getMyProfile().then(r => r.data),
        staleTime: 60_000,
        enabled: !!userId,
    });

    const { data: completeness, isLoading: completenessLoading } = useQuery({
        queryKey: ['profile-completeness', userId],
        queryFn: () => candidateService.getMyProfile().then(r => r.data),
        staleTime: 30_000,
        enabled: !!userId,
    });

    const updatePrivacyMutation = useMutation({
        mutationFn: (isPublic: boolean) => candidateService.update(Number(userId), { is_public: isPublic } as any).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            toast.success("Đã cập nhật cài đặt quyền riêng tư");
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => candidateService.update(Number(userId), { job_search_status: status } as any).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            toast.success("Đã cập nhật trạng thái tìm việc");
        }
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
        <div className="min-h-screen bg-slate-50 pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="container mx-auto px-4 py-10 max-w-6xl relative z-10"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Main Content ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <ProfileHeader
                            profile={profile}
                            onUpdateStatus={(s) => updateStatusMutation.mutate(s)}
                            onTogglePrivacy={(p) => updatePrivacyMutation.mutate(p)}
                        />

                        <SectionWrapper title="Thông tin cá nhân" id="personal-info">
                            <PersonalForm profile={profile} />
                        </SectionWrapper>

                        <ExperienceSection userId={Number(userId)} />

                        <EducationSection userId={Number(userId)} />

                        <SkillsSection userId={Number(userId)} />

                        <CertificationsSection userId={Number(userId)} />

                        <LanguagesSection userId={Number(userId)} />

                        <ProjectsSection userId={Number(userId)} />

                        <RecommendationsSection userId={Number(userId)} isOwner={true} />
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-6">
                        {/* Profile Completeness Card */}
                        <Card className="glass-effect p-6 rounded-[28px] border-none sticky top-24">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Trophy className="w-5 h-5 text-primary" />
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
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Hồ sơ của bạn</p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`rounded-full text-xs font-semibold ${score >= 80
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : score >= 50 ? 'bg-primary/10 text-primary border-primary/20'
                                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}
                                    >
                                        {score >= 80 ? '✨ Nổi bật' : score >= 50 ? '📈 Phát triển' : '🚀 Bắt đầu'}
                                    </Badge>
                                </div>

                                {/* Progress bar */}
                                <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${progressColor} rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ duration: 1.2, ease: [0.1, 0.9, 0.2, 1] }}
                                    />
                                </div>

                                {/* Checklist */}
                                <ul className="space-y-3">
                                    {completeness?.checklist.map((item: any, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm group">
                                            <div className={`mt-0.5 shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                                                {item.completed
                                                    ? <CheckCircle2 className="w-4 h-4" />
                                                    : <Circle className="w-4 h-4" />
                                                }
                                            </div>
                                            <span className={`transition-all leading-snug ${item.completed
                                                ? 'text-muted-foreground/50 line-through text-xs'
                                                : 'font-medium text-sm group-hover:text-primary cursor-default'
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
                                        className="p-3 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl border border-primary/10 text-center"
                                    >
                                        <p className="text-xs font-bold text-primary">🏆 Verified Excellence</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Hồ sơ của bạn đã đạt chuẩn vàng!</p>
                                    </motion.div>
                                )}

                                {score < 90 && (
                                    <div className="pt-4 border-t border-border/50">
                                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                                            Đạt <strong>{90 - score}% nữa</strong> để nhận huy hiệu <strong>Verified Excellence</strong>.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Navigation Shortcuts */}
                        <Card className="glass-effect p-5 rounded-[24px] border-none">
                            <h4 className="font-bold text-sm mb-4 text-muted-foreground uppercase tracking-wider text-xs">Điều hướng nhanh</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {SECTION_NAV.map(({ id, label, icon: Icon }) => (
                                    <a
                                        key={id}
                                        href={`#${id}`}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background/40 hover:bg-primary/10 hover:text-primary text-[11px] font-semibold uppercase tracking-wider transition-all group"
                                    >
                                        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                        <span className="truncate">{label}</span>
                                    </a>
                                ))}
                            </div>
                        </Card>

                        {/* Quick tips */}
                        <Card className="glass-effect p-5 rounded-[24px] border-none">
                            <h4 className="font-bold text-sm mb-3">💡 Mẹo tăng cơ hội</h4>
                            <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold shrink-0">→</span>
                                    Giữ trạng thái <strong className="text-foreground">Đang tìm việc</strong> để xuất hiện trong tìm kiếm của nhà tuyển dụng.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold shrink-0">→</span>
                                    Thêm ít nhất <strong className="text-foreground">5 kỹ năng</strong> với mức độ chính xác để tăng điểm match.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold shrink-0">→</span>
                                    Hồ sơ có <strong className="text-foreground">ảnh đại diện</strong> được xem nhiều hơn 14 lần so với hồ sơ không có ảnh.
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
