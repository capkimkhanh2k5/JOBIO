import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, Mail, Phone, ExternalLink, Send, Award, CheckCircle } from 'lucide-react';
import { candidateService } from '@/services/candidateService';
import { toast } from 'sonner';

interface CandidateProfileSheetProps {
    candidateId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectCandidate?: (id: string) => void;
}

export const CandidateProfileSheet = ({ candidateId, open, onOpenChange, onSelectCandidate }: CandidateProfileSheetProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && candidateId) {
            fetchProfile(candidateId);
        } else {
            setProfile(null);
        }
    }, [open, candidateId]);

    const fetchProfile = async (id: string) => {
        setLoading(true);
        try {
            const profRes = await candidateService.getById(Number(id)).then(r => r.data);
            setProfile(profRes);
        } catch (error) {
            toast.error("Không thể tải thông tin ứng viên");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = () => {
        const candidateName = profile?.name || profile?.user?.full_name || 'ứng viên';
        toast.success(`Đã gửi lời mời ứng tuyển đến ${candidateName}`);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-background/95 backdrop-blur-xl border-l border-border/50 p-0 flex flex-col gap-0 shadow-2xl">
                {/* Custom Header with Aurora Glow Component */}
                <div className="relative overflow-hidden w-full pt-12 pb-6 px-6 bg-gradient-to-b from-violet-600/10 via-background/50 to-background">
                    <div className="absolute top-0 left-0 w-full h-32 bg-aurora-gradient opacity-20 blur-2xl" />

                    {loading ? (
                        <div className="flex gap-4 items-center relative z-10 w-full">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        </div>
                    ) : profile ? (
                        <div className="flex flex-col gap-4 relative z-10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4 items-center">
                                    <Avatar className="h-20 w-20 border-2 border-background shadow-lg ring-2 ring-violet-600/20">
                                        <AvatarImage src={profile.avatar_url || profile.user?.avatar_url} />
                                        <AvatarFallback className="text-2xl bg-violet-100 text-violet-600">
                                            {(profile.name || profile.user?.full_name || 'N/A').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                            {profile.name || profile.user?.full_name || 'N/A'}
                                            <CheckCircle className="w-5 h-5 text-violet-600" />
                                        </h2>
                                        <p className="text-foreground/80 font-medium text-lg">{profile.current_position || 'Chưa cập nhật vị trí'}</p>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" /> 
                                                {typeof profile.current_company === 'string' 
                                                    ? profile.current_company 
                                                    : profile.current_company?.company_name || 'Chưa rõ công ty'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> 
                                                {profile.location || 
                                                 profile.address?.province_name || 
                                                 profile.address?.province?.province_name || 
                                                 'Toàn quốc'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
 
                            <div className="flex gap-3 mt-2">
                                <Button onClick={handleInvite} className="flex-1 shadow-lg shadow-violet-600/20 bg-violet-600 hover:bg-violet-700 text-white">
                                    <Send className="w-4 h-4 mr-2" />
                                    Mời ứng tuyển
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
 
                <ScrollArea className="flex-1 px-6 pb-6">
                    {loading ? (
                        <div className="space-y-6 mt-6">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : profile ? (
                        <div className="space-y-8 mt-2 pb-8">
 
                            {/* Bio */}
                            <section>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-violet-600" />
                                    Tổng quan
                                </h3>
                                <div className="p-4 rounded-xl bg-card border border-border/50 text-foreground/90 leading-relaxed text-sm shadow-sm">
                                    {profile.bio || 'Chưa có thông tin giới thiệu.'}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                        <p className="text-xs text-muted-foreground mb-1">Kinh nghiệm</p>
                                        <p className="font-semibold">{profile.years_of_experience || 0} năm</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                        <p className="text-xs text-muted-foreground mb-1">Mức lương mong đợi</p>
                                        <p className="font-semibold text-violet-600">
                                            {profile.desired_salary_min ? `${(profile.desired_salary_min / 1000000).toFixed(0)}tr` : 'Thỏa thuận'}
                                            {profile.desired_salary_max ? ` - ${(profile.desired_salary_max / 1000000).toFixed(0)}tr` : ''}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="bg-border/50" />

                            {/* Skills */}
                            <section>
                                <h3 className="text-lg font-semibold mb-3">Kỹ năng chuyên môn</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(profile.skills || []).map((skill: any) => (
                                        <div key={skill.id || skill.skill_name || skill.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card shadow-sm">
                                            <span className="font-medium text-sm">{skill.skill_name || skill.name}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                {skill.proficiency_level === 'basic' ? 'Cơ bản' : 
                                                 skill.proficiency_level === 'intermediate' ? 'Trung bình' : 
                                                 skill.proficiency_level === 'advanced' ? 'Nâng cao' : 
                                                 skill.proficiency_level === 'expert' ? 'Chuyên gia' : 
                                                 skill.level || 'Khác'}
                                            </span>
                                        </div>
                                    ))}
                                    {(!profile.skills || profile.skills.length === 0) && (
                                        <p className="text-sm text-muted-foreground italic">Chưa cập nhật kỹ năng</p>
                                    )}
                                </div>
                            </section>

                            <Separator className="bg-border/50" />

                            {/* Experience */}
                            <section>
                                <h3 className="text-lg font-semibold mb-4">Kinh nghiệm làm việc</h3>
                                <div className="space-y-6">
                                    {(profile.experiences || profile.experience || []).map((exp: any) => (
                                        <div key={exp.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-border last:before:hidden">
                                            <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-background border-2 border-violet-600 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-violet-600" />
                                            </div>
                                            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:border-violet-600/20 transition-colors">
                                                <h4 className="font-semibold text-foreground">{exp.job_title || exp.title}</h4>
                                                <p className="text-sm font-medium text-violet-600 mt-1">{exp.company_name || exp.company}</p>
                                                <p className="text-xs text-muted-foreground mt-1 mb-2">
                                                    {exp.start_date} - {exp.is_current ? 'Hiện tại' : (exp.end_date || 'Chưa rõ')}
                                                </p>
                                                <p className="text-sm text-foreground/80">{exp.description || exp.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!(profile.experiences || profile.experience) || (profile.experiences || profile.experience).length === 0) && (
                                        <p className="text-sm text-muted-foreground italic pl-6 border-l-2 border-border ml-[11px]">Chưa cập nhật kinh nghiệm</p>
                                    )}
                                </div>
                            </section>

                            <Separator className="bg-border/50" />

                            {/* Contact Info */}
                            <section>
                                <h3 className="text-lg font-semibold mb-3">Thông tin liên hệ & Mạng xã hội</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm truncate">{profile.email || profile.user?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                                        <Phone className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm">{profile.phone || profile.user?.phone_number || 'N/A'}</span>
                                    </div>
                                    <a href={profile.linkedin_url || profile.social_links?.linkedin || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-violet-600/30 transition-colors group">
                                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">in</div>
                                        <span className="text-sm group-hover:text-violet-600 transition-colors">LinkedIn Profile</span>
                                        <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-violet-600" />
                                    </a>
                                    <a href={profile.github_url || profile.social_links?.github || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-violet-600/30 transition-colors group">
                                        <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center text-background font-bold border">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                                        </div>
                                        <span className="text-sm group-hover:text-violet-600 transition-colors">Github Profile</span>
                                        <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-violet-600" />
                                    </a>
                                </div>
                            </section>

                        </div>
                    ) : null}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
