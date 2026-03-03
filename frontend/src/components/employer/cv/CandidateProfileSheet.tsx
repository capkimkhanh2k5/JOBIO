import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, Mail, Phone, ExternalLink, MessageSquare, Send, Award, CheckCircle } from 'lucide-react';
import { mockApi } from '@/services/mockApi';
import { toast } from 'sonner';

interface CandidateProfileSheetProps {
    candidateId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectCandidate?: (id: string) => void;
}

export const CandidateProfileSheet = ({ candidateId, open, onOpenChange, onSelectCandidate }: CandidateProfileSheetProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && candidateId) {
            fetchProfile(candidateId);
        } else {
            setProfile(null);
            setRecommendations([]);
        }
    }, [open, candidateId]);

    const fetchProfile = async (id: string) => {
        setLoading(true);
        try {
            const [profRes, recRes] = await Promise.all([
                mockApi.getCandidatePublicProfile(id),
                mockApi.getCandidateRecommendations(id)
            ]);
            setProfile(profRes);
            setRecommendations(recRes);
        } catch (error) {
            toast.error("Không thể tải thông tin ứng viên");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = () => {
        toast.success(`Đã gửi lời mời ứng tuyển đến ${profile?.name}`);
    };

    const handleMessage = () => {
        toast.info(`Mở cửa sổ chat với ${profile?.name}`);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl bg-background/95 backdrop-blur-xl border-l border-border/50 p-0 flex flex-col gap-0 shadow-2xl">
                {/* Custom Header with Aurora Glow Component */}
                <div className="relative overflow-hidden w-full pt-12 pb-6 px-6 bg-gradient-to-b from-primary/10 via-background/50 to-background">
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
                                    <Avatar className="h-20 w-20 border-2 border-background shadow-lg ring-2 ring-primary/20">
                                        <AvatarImage src={profile.avatar_url} />
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {profile.name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                            {profile.name}
                                            <CheckCircle className="w-5 h-5 text-primary" />
                                        </h2>
                                        <p className="text-foreground/80 font-medium text-lg">{profile.current_position}</p>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {profile.current_company}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <Button onClick={handleMessage} variant="outline" className="flex-1 bg-background/50 backdrop-blur-md border-primary/20 hover:bg-primary/5 hover:text-primary">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Nhắn tin
                                </Button>
                                <Button onClick={handleInvite} className="flex-1 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
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
                                    <Award className="w-5 h-5 text-primary" />
                                    Tổng quan
                                </h3>
                                <div className="p-4 rounded-xl bg-card border border-border/50 text-foreground/90 leading-relaxed text-sm shadow-sm">
                                    {profile.bio}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                        <p className="text-xs text-muted-foreground mb-1">Kinh nghiệm</p>
                                        <p className="font-semibold">{profile.years_of_experience} năm</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                                        <p className="text-xs text-muted-foreground mb-1">Mức lương mong đợi</p>
                                        <p className="font-semibold text-primary">{profile.expected_salary_range}</p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="bg-border/50" />

                            {/* Skills */}
                            <section>
                                <h3 className="text-lg font-semibold mb-3">Kỹ năng chuyên môn</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill: any) => (
                                        <div key={skill.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card shadow-sm">
                                            <span className="font-medium text-sm">{skill.name}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{skill.level}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <Separator className="bg-border/50" />

                            {/* Experience */}
                            <section>
                                <h3 className="text-lg font-semibold mb-4">Kinh nghiệm làm việc</h3>
                                <div className="space-y-6">
                                    {profile.experience.map((exp: any) => (
                                        <div key={exp.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] before:w-px before:bg-border last:before:hidden">
                                            <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-background border-2 border-primary flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                                                <h4 className="font-semibold text-foreground">{exp.title}</h4>
                                                <p className="text-sm font-medium text-primary mt-1">{exp.company}</p>
                                                <p className="text-xs text-muted-foreground mt-1 mb-2">{exp.duration}</p>
                                                <p className="text-sm text-foreground/80">{exp.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <Separator className="bg-border/50" />

                            {/* Contact Info */}
                            <section>
                                <h3 className="text-lg font-semibold mb-3">Thông tin liên hệ & Mạng xã hội</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm">{profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                                        <Phone className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm">{profile.phone}</span>
                                    </div>
                                    <a href={profile.social_links.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors group">
                                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">in</div>
                                        <span className="text-sm group-hover:text-primary transition-colors">LinkedIn Profile</span>
                                        <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
                                    </a>
                                    <a href={profile.social_links.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors group">
                                        <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center text-background font-bold border">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                                        </div>
                                        <span className="text-sm group-hover:text-primary transition-colors">Github Profile</span>
                                        <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
                                    </a>
                                </div>
                            </section>

                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <>
                                    <Separator className="bg-border/50" />
                                    <section>
                                        <h3 className="text-lg font-semibold mb-4">Ứng viên tương tự</h3>
                                        <div className="grid gap-4">
                                            {recommendations.map(rec => (
                                                <div key={rec.id} onClick={() => onSelectCandidate && onSelectCandidate(rec.id)} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card transition-colors cursor-pointer group">
                                                    <Avatar className="h-12 w-12 border border-border">
                                                        <AvatarImage src={rec.avatar_url} />
                                                        <AvatarFallback>{rec.name.substring(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm group-hover:text-primary truncate">{rec.name}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{rec.current_position}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-primary">{rec.match_score}%</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase">Độ phù hợp</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </>
                            )}

                        </div>
                    ) : null}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
