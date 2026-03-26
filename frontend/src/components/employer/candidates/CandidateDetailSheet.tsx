import { useEffect, useState } from 'react';
import { useCandidateStore } from '@/store/candidateStore';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Briefcase, GraduationCap, MapPin, Mail, Phone, Calendar,
    FileText, Download, Target, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Submitted', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'];

export function CandidateDetailSheet() {
    const { selectedCandidateId, setSelectedCandidateId } = useCandidateStore();
    const [details, setDetails] = useState<any>(null);
    const [education, setEducation] = useState<any[]>([]);
    const [experience, setExperience] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        let isMtd = true;
        const load = async () => {
            if (!selectedCandidateId) return;
            setIsLoading(true);
            try {
                const appNumId = Number(selectedCandidateId);
                const appRes = await applicationService.getById(appNumId);
                const appData = appRes.data;
                const recruiterId = appData.recruiter_id;

                const [prof, edu, exp, skls, hist] = await Promise.all([
                    candidateService.getById(recruiterId).then(r => r.data),
                    candidateService.listEducation(recruiterId).then(r => r.data),
                    candidateService.listExperience(recruiterId).then(r => r.data),
                    candidateService.listSkills(recruiterId).then(r => r.data),
                    applicationService.getStatusHistory(appNumId).then(r => r.data),
                ]);
                if (!isMtd) return;
                setDetails({ ...prof, ...appData });
                setEducation(edu);
                setExperience(exp);
                setSkills(skls);
                setHistory(hist);
            } catch (err) {
                console.error(err);
                if (isMtd) toast.error("Lỗi khi tải thông tin chi tiết ứng viên");
            } finally {
                if (isMtd) setIsLoading(false);
            }
        };
        load();
        return () => { isMtd = false; };
    }, [selectedCandidateId]);

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedCandidateId) return;
        setUpdatingStatus(true);
        try {
            await applicationService.updateStatus(Number(selectedCandidateId), newStatus);
            toast.success("Đã cập nhật trạng thái");
            // Add to history locally 
            setHistory([{
                id: Math.random().toString(),
                status: newStatus,
                changed_at: new Date().toISOString(),
                changed_by: "You",
                notes: ""
            }, ...history]);
        } catch (err) {
            toast.error("Lỗi cập nhật trạng thái");
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (!selectedCandidateId) return null;

    return (
        <Sheet open={!!selectedCandidateId} onOpenChange={(v) => !v && setSelectedCandidateId(null)}>
            <SheetContent className="w-full sm:max-w-2xl bg-background border-l border-border/50 p-0 flex flex-col hide-scrollbar overflow-y-auto z-[200] shadow-2xl">
                {isLoading ? (
                    <div className="p-8 flex flex-col gap-6 w-full animate-pulse">
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-full bg-secondary"></div>
                            <div className="space-y-2">
                                <div className="w-48 h-5 bg-secondary rounded"></div>
                                <div className="w-32 h-4 bg-secondary rounded"></div>
                            </div>
                        </div>
                        <div className="h-10 bg-secondary rounded-lg w-full"></div>
                        <div className="h-64 bg-secondary rounded-xl w-full"></div>
                    </div>
                ) : details ? (
                    <>
                        <div className="flex flex-col sticky top-0 z-10 bg-background border-b border-border/50 p-6 pb-4 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                                        <AvatarImage src={details.recruiter_avatar} />
                                        <AvatarFallback className="text-xl">{(details.recruiter_name || 'U').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">{details.recruiter_name}</h2>
                                        <p className="text-muted-foreground flex items-center gap-1.5 mt-1 text-sm">
                                            <Briefcase className="w-4 h-4" /> {details.current_position}
                                            {details.current_company && ` tại ${details.current_company}`}
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {details.recruiter_email}</span>
                                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {details.recruiter_phone || (details.user && details.user.phone)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" className="h-9 w-9 border-border/50">
                                        <MessageSquare className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="h-9 w-9 border-border/50">
                                        <Calendar className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20">
                                        <Download className="w-3.5 h-3.5 mr-1.5" /> Tải CV
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <Select
                                        defaultValue={history[0]?.status || 'Submitted'}
                                        onValueChange={handleStatusChange}
                                        disabled={updatingStatus}
                                    >
                                        <SelectTrigger className="w-full h-10 border-border/50 bg-secondary/30">
                                            <SelectValue placeholder="Cập nhật trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold whitespace-nowrap">
                                    AI Match: {details.ai_score || 0}%
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0 flex-1">
                            <Tabs defaultValue="cv" className="w-full mt-4">
                                <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-inner mb-6">
                                    <TabsTrigger value="cv" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-slate-600">CV & Đơn</TabsTrigger>
                                    <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-slate-600">Hồ sơ</TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-slate-600">Hoạt động</TabsTrigger>
                                </TabsList>

                                <TabsContent value="cv" className="space-y-6 m-0">
                                    <div className="bg-secondary/30 border border-border/50 rounded-xl p-5">
                                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-violet-600" /> Cover Letter
                                        </h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                            {details.cover_letter || "Không có thư giới thiệu."}
                                        </p>
                                    </div>
                                    <div className="bg-secondary/30 border border-border/50 rounded-xl p-5 flex flex-col h-[600px]">
                                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-violet-600" /> CV Đính kèm
                                        </h3>
                                        <div className="flex-1 bg-secondary/30 rounded-lg flex items-center justify-center border border-dashed border-border/50">
                                            {/* Simulate iframe for PDF */}
                                            <div className="text-center text-muted-foreground">
                                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>{details.cv_url ? "Dữ liệu CV hiện có" : "Chưa tải lên CV"}</p>
                                                {details.cv_url && (
                                                    <Button variant="link" className="mt-2 text-primary" onClick={() => window.open(details.cv_url, '_blank')}>
                                                        Mở trong tab mới
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="profile" className="space-y-6 m-0">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-violet-600" /> Học vấn
                                            </h3>
                                            <div className="space-y-4">
                                                {education.map(edu => (
                                                    <div key={edu.id} className="border-l-2 border-primary/30 pl-4 py-1">
                                                        <h4 className="font-medium">{edu.school_name}</h4>
                                                        <p className="text-sm text-foreground/80">{edu.degree} - {edu.field_of_study}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {new Date(edu.start_date).getFullYear()} - {edu.is_current ? 'Hiện tại' : new Date(edu.end_date).getFullYear()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-border/50"></div>

                                        <div>
                                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-violet-600" /> Kinh nghiệm
                                            </h3>
                                            <div className="space-y-6">
                                                {experience.map(exp => (
                                                    <div key={exp.id} className="border-l-2 border-primary/30 pl-4 py-1">
                                                        <h4 className="font-medium">{exp.job_title}</h4>
                                                        <p className="text-sm text-foreground/80">{exp.company_name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                            <span>{new Date(exp.start_date).getFullYear()} - {exp.is_current ? 'Hiện tại' : new Date(exp.end_date).getFullYear()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {exp.location}</span>
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-border/50"></div>

                                        <div>
                                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Target className="w-4 h-4 text-violet-600" /> Kỹ năng
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.map(skill => (
                                                    <Badge key={skill.id} variant="secondary" className="px-3 py-1 bg-secondary/50">
                                                        {skill.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>


                                <TabsContent value="history" className="space-y-6 m-0">
                                    <div className="space-y-6">
                                        <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                                            <Textarea placeholder="Thêm ghi chú nội bộ (chỉ team tuyển dụng xem được)..." className="resize-none bg-secondary/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary h-20" />
                                            <div className="flex justify-end mt-3">
                                                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20">Lưu ghi chú</Button>
                                            </div>
                                        </div>

                                        <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                            {history.map((mod) => (
                                                <div key={mod.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative left-[-24px] md:left-0"></div>
                                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-secondary/30 border border-border/50 p-4 rounded-xl shadow-sm">
                                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                                            <div className="font-semibold text-sm">{mod.status}</div>
                                                            <time className="text-xs text-muted-foreground">{new Date(mod.changed_at).toLocaleDateString('vi-VN')} {new Date(mod.changed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">Bởi {mod.changed_by}</div>
                                                        {mod.notes && <div className="text-sm mt-2 p-2 bg-secondary/30 rounded-md border border-border/50">{mod.notes}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
