import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/services/mockApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';

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

const Profile = () => {
    const queryClient = useQueryClient();
    const userId = "mock-user-id";

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['profile', userId],
        queryFn: () => mockApi.getProfile(userId),
    });

    const { data: completeness, isLoading: completenessLoading } = useQuery({
        queryKey: ['profile-completeness', userId],
        queryFn: () => mockApi.getProfileCompleteness(userId),
    });

    const updatePrivacyMutation = useMutation({
        mutationFn: (isPublic: boolean) => mockApi.updateProfile(userId, { is_profile_public: isPublic }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            toast.success("Đã cập nhật cài đặt quyền riêng tư");
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => mockApi.updateProfile(userId, { job_search_status: status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            toast.success("Đã cập nhật trạng thái tìm việc");
        }
    });

    if (profileLoading || completenessLoading) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <Skeleton className="h-64 w-full rounded-[32px] mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-80 w-full rounded-[24px]" />
                        <Skeleton className="h-80 w-full rounded-[24px]" />
                    </div>
                    <div className="space-y-8">
                        <Skeleton className="h-96 w-full rounded-[24px]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 py-12 max-w-6xl relative z-10"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <ProfileHeader
                        profile={profile}
                        onUpdateStatus={(s) => updateStatusMutation.mutate(s)}
                        onTogglePrivacy={(p) => updatePrivacyMutation.mutate(p)}
                    />

                    <SectionWrapper title="Thông tin cá nhân" id="personal-info">
                        <PersonalForm profile={profile} />
                    </SectionWrapper>

                    <ExperienceSection userId={userId} />

                    <EducationSection userId={userId} />

                    <SkillsSection userId={userId} />

                    <CertificationsSection userId={userId} />

                    <LanguagesSection userId={userId} />

                    <ProjectsSection userId={userId} />
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Profile Completeness */}
                    <Card className="glass-effect p-8 rounded-[32px] border-none sticky top-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Hoàn thiện hồ sơ</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-4xl font-black text-primary">{completeness?.score}%</span>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mức độ tin cậy</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-full">Pro Candidate</Badge>
                                </div>
                            </div>

                            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completeness?.score}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>

                            <ul className="space-y-4">
                                {completeness?.checklist.map((item: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-4 text-sm group">
                                        <div className={`mt-0.5 rounded-full p-0.5 transition-colors ${item.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                            {item.completed ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                <Circle className="w-4 h-4" />
                                            )}
                                        </div>
                                        <span className={`transition-all ${item.completed ? "text-muted-foreground/60 line-through" : "font-medium group-hover:text-primary"}`}>
                                            {item.task}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-6 border-t border-border/50">
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Hồ sơ đạt trên <strong>90%</strong> sẽ nhận được huy hiệu <strong>Verified Excellence</strong>.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Navigation Shortcut */}
                    <Card className="glass-effect p-6 rounded-[24px] border-none">
                        <h4 className="font-bold text-sm mb-4">Lối tắt</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {['header', 'personal-info', 'experience', 'education', 'skills'].map((id) => (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    className="px-3 py-2 rounded-xl bg-background/40 hover:bg-primary/10 hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-all text-center"
                                >
                                    {id.replace('-', ' ')}
                                </a>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
