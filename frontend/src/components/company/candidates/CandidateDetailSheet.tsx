import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCandidateStore } from '@/store/candidateStore';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Briefcase,
    GraduationCap,
    MapPin,
    Mail,
    Phone,
    Calendar,
    FileText,
    Download,
    Target,
    Building2,
    Award,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = [
    { value: 'pending', label: 'Submitted' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview', label: 'Interview' },
    { value: 'offered', label: 'Offered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
];

const STATUS_LABEL_MAP: Record<string, string> = {
    pending: 'Submitted',
    reviewing: 'Reviewing',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offered: 'Offered',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['pending', 'reviewing', 'shortlisted', 'rejected'],
    reviewing: ['reviewing', 'shortlisted', 'rejected'],
    shortlisted: ['shortlisted', 'interview', 'rejected'],
    interview: ['interview', 'offered', 'rejected'],
    offered: ['offered', 'accepted', 'rejected'],
    accepted: ['accepted'],
    rejected: ['rejected'],
    withdrawn: ['withdrawn'],
};

export function CandidateDetailSheet() {
    const { selectedCandidateId, setSelectedCandidateId } = useCandidateStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [details, setDetails] = useState<any>(null);
    const [education, setEducation] = useState<any[]>([]);
    const [experience, setExperience] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [certifications, setCertifications] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [activityNote, setActivityNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    const currentStatus = details?.status || history[0]?.new_status || history[0]?.status || 'pending';
    const statusOptions = useMemo(
        () => STATUSES.filter((status) => (STATUS_TRANSITIONS[currentStatus] || [currentStatus]).includes(status.value)),
        [currentStatus]
    );

    const timelineItems = useMemo(() => {
        const sortedHistory = [...(history || [])].sort(
            (a, b) => new Date(b.changed_at || b.created_at).getTime() - new Date(a.changed_at || a.created_at).getTime()
        );

        if (!details?.applied_at) return [];

        const submittedItem = {
            id: `submitted-${details.id}`,
            status: 'pending',
            new_status: 'pending',
            changed_at: details.applied_at,
            created_at: details.applied_at,
            changed_by: null,
            notes: 'Đơn ứng tuyển đã được gửi thành công.',
        };

        const hasSubmitted = sortedHistory.some(
            (item) => (item.new_status || item.status) === 'pending'
        );

        if (hasSubmitted) return sortedHistory;

        return [...sortedHistory, submittedItem].sort(
            (a, b) => new Date(b.changed_at || b.created_at).getTime() - new Date(a.changed_at || a.created_at).getTime()
        );
    }, [details?.applied_at, details?.id, history]);

    const handlePreviewCv = async () => {
        if (!details) return;

        if (details.cv_url) {
            window.open(details.cv_url, '_blank');
            return;
        }

        if (!details.cv_id) {
            toast.error('Không tìm thấy dữ liệu CV');
            return;
        }

        try {
            toast.loading('Đang tải dữ liệu CV...');
            const res = await applicationService.previewCv(details.id);
            setPreviewHtml(res.data.html_content);
            setPreviewOpen(true);
            toast.dismiss();
        } catch (_error) {
            toast.dismiss();
            toast.error('Không thể tải bản xem trước CV');
        }
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!selectedCandidateId) return;

            setIsLoading(true);
            try {
                const applicationId = Number(selectedCandidateId);
                const appRes = await applicationService.getById(applicationId);
                const appData = appRes.data;
                const candidateId = Number(appData.recruiter_id);

                if (!candidateId) {
                    toast.error('Không tìm thấy thông tin ứng viên');
                    setIsLoading(false);
                    return;
                }

                const [profile, edu, exp, skillList, certificationList, statusHistory] = await Promise.all([
                    candidateService.getById(candidateId).then((r) => r.data),
                    candidateService.listEducation(candidateId).then((r) => r.data),
                    candidateService.listExperience(candidateId).then((r) => r.data),
                    candidateService.listSkills(candidateId).then((r) => r.data),
                    candidateService.listCertifications(candidateId).then((r) => r.data),
                    applicationService.getStatusHistory(applicationId).then((r) => r.data),
                ]);

                if (!mounted) return;

                setDetails({
                    ...profile,
                    ...appData,
                    candidate_id: appData.recruiter_id,
                    candidate_name: appData.recruiter_name,
                    candidate_avatar: appData.recruiter_avatar,
                    candidate_email: appData.recruiter_email,
                    candidate_phone: appData.recruiter_phone,
                    job_title: appData.job_title || appData.job?.title || '',
                    company_name: appData.company_name || appData.job?.company_name || '',
                    cv_name: appData.cv?.file_name || appData.cv_name || 'CV.pdf',
                    cv_id: appData.cv?.id || appData.cv_id || null,
                    applied_at: appData.applied_at,
                });
                setEducation(edu);
                setExperience(exp);
                setSkills(skillList);
                setCertifications(certificationList);
                setHistory(statusHistory || []);
            } catch (error) {
                console.error(error);
                if (mounted) toast.error('Lỗi khi tải thông tin chi tiết ứng viên');
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [selectedCandidateId]);

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedCandidateId) return;
        if (newStatus === currentStatus) return;

        setUpdatingStatus(true);
        try {
            await applicationService.updateStatus(Number(selectedCandidateId), newStatus);
            setDetails((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
            setHistory((prev) => [
                {
                    id: `local-${Date.now()}`,
                    status: newStatus,
                    new_status: newStatus,
                    changed_at: new Date().toISOString(),
                    changed_by: 'You',
                    notes: '',
                },
                ...prev,
            ]);
            queryClient.invalidateQueries({ queryKey: ['company-candidates'] });
            toast.success('Đã cập nhật trạng thái');
        } catch (_error) {
            toast.error('Lỗi cập nhật trạng thái');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedCandidateId || !activityNote.trim()) return;

        setSavingNote(true);
        try {
            const response = await applicationService.addNotes(Number(selectedCandidateId), activityNote.trim());
            setDetails((prev: any) => (prev ? { ...prev, notes: response.data.notes } : prev));
            setHistory((prev) => [
                {
                    id: `note-${Date.now()}`,
                    status: currentStatus,
                    new_status: currentStatus,
                    changed_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    changed_by: 'You',
                    notes: `Ghi chú: ${activityNote.trim()}`,
                },
                ...prev,
            ]);
            setActivityNote('');
            queryClient.invalidateQueries({ queryKey: ['company-candidates'] });
            toast.success('Đã lưu ghi chú');
        } catch (_error) {
            toast.error('Lưu ghi chú thất bại');
        } finally {
            setSavingNote(false);
        }
    };

    const handleCreateInterview = () => {
        if (!selectedCandidateId) return;

        setSelectedCandidateId(null);
        navigate('/company/interviews', {
            state: {
                openCreateInterview: true,
                preselectedApplicationId: String(selectedCandidateId),
            },
        });
    };

    if (!selectedCandidateId) return null;

    return (
        <Sheet open={!!selectedCandidateId} onOpenChange={(open) => !open && setSelectedCandidateId(null)}>
            <SheetContent className="w-full sm:max-w-2xl bg-background border-l border-border/50 p-0 flex flex-col hide-scrollbar overflow-hidden z-[200] shadow-2xl">
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
                            <div className="flex justify-between items-start mb-6 pr-14 gap-4">
                                <div className="flex gap-4 min-w-0">
                                    <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md shrink-0">
                                        <AvatarImage src={details.candidate_avatar} />
                                        <AvatarFallback className="text-xl">
                                            {(details.candidate_name || 'U').charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold tracking-tight">{details.candidate_name}</h2>
                                        <p className="text-muted-foreground flex items-center gap-1.5 mt-1 text-sm">
                                            <Briefcase className="w-4 h-4" />
                                            {details.current_position || 'Chưa có vị trí hiện tại'}
                                            {details.current_company && ` tại ${details.current_company}`}
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                {details.candidate_email || 'Chưa có email'}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5" />
                                                {details.candidate_phone || details.user?.phone || 'Chưa có số điện thoại'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-9 w-9 border-border/50"
                                        onClick={handleCreateInterview}
                                    >
                                        <Calendar className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20"
                                        onClick={handlePreviewCv}
                                    >
                                        <Download className="w-3.5 h-3.5 mr-1.5" />
                                        Tải CV
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                        Trạng thái ứng tuyển
                                    </p>
                                    <Combobox
                                        options={statusOptions}
                                        value={currentStatus}
                                        onChange={(value) => handleStatusChange(String(value))}
                                        placeholder="Cập nhật trạng thái"
                                        searchPlaceholder="Tìm trạng thái..."
                                        emptyMessage="Không tìm thấy trạng thái phù hợp."
                                        disabled={updatingStatus}
                                        className="h-10 border-border/50 bg-secondary/30 justify-between font-normal"
                                    />
                                </div>

                                <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold whitespace-nowrap">
                                    Match: {details.match_score ?? details.ai_score ?? 0}%
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0 flex-1 overflow-y-auto hide-scrollbar">
                            <Tabs defaultValue="cv" className="w-full mt-4">
                                <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-inner mb-6">
                                    <TabsTrigger value="cv" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-slate-600">
                                        CV & Đơn
                                    </TabsTrigger>
                                    <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-slate-600">
                                        Hồ sơ
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md font-bold transition-all duration-300 text-slate-600">
                                        Hoạt động
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="cv" className="space-y-6 m-0">
                                    <div className="bg-secondary/30 border border-border/50 rounded-xl p-5">
                                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                                            <Building2 className="w-4 h-4 text-violet-600" />
                                            Thông tin job ứng tuyển
                                        </h3>
                                        <div className="grid gap-4 text-sm">
                                            <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 gap-4">
                                                <span className="text-muted-foreground">Vị trí ứng tuyển:</span>
                                                <span className="font-medium text-right">{details.job_title || 'Chưa có thông tin'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 gap-4">
                                                <span className="text-muted-foreground">Ngày ứng tuyển:</span>
                                                <span className="font-medium text-right">
                                                    {details.applied_at ? new Date(details.applied_at).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 border border-border/50 rounded-xl p-5">
                                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-violet-600" />
                                            Cover Letter
                                        </h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                            {details.cover_letter || 'Không có thư giới thiệu.'}
                                        </p>
                                    </div>

                                    <div className="bg-secondary/30 border border-border/50 rounded-xl p-5">
                                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-violet-600" />
                                            CV đính kèm
                                        </h3>
                                        <div className="grid gap-4 text-sm">
                                            <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 gap-4">
                                                <span className="text-muted-foreground">CV đính kèm:</span>
                                                {details.cv_url || details.cv_id ? (
                                                    <button
                                                        type="button"
                                                        onClick={handlePreviewCv}
                                                        className="flex cursor-pointer items-center gap-1.5 font-medium text-violet-600 transition-colors hover:text-violet-700 hover:underline"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {details.cv_name || 'CV.pdf'}
                                                    </button>
                                                ) : (
                                                    <span className="font-medium text-slate-900">Chưa tải lên CV</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 border border-border/50 rounded-xl p-5">
                                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                                            <Calendar className="w-4 h-4 text-violet-600" />
                                            Lịch sử trạng thái
                                        </h3>
                                        <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[18px] before:top-2 before:w-px before:bg-cyan-200">
                                            {timelineItems.map((item) => (
                                                <div key={item.id} className="relative pl-12">
                                                    <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cyan-400 bg-white shadow-sm">
                                                        <div className="h-2.5 w-2.5 rounded-full bg-cyan-500"></div>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                        <div className="mb-1 flex items-start justify-between gap-3">
                                                            <div className="font-bold text-slate-900">
                                                                {STATUS_LABEL_MAP[item.new_status || item.status] || item.new_status || item.status}
                                                            </div>
                                                            <div className="shrink-0 text-xs text-slate-500">
                                                                {new Date(item.changed_at || item.created_at).toLocaleTimeString('vi-VN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    second: '2-digit',
                                                                })}{' '}
                                                                {new Date(item.changed_at || item.created_at).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            {item.notes || 'Không có ghi chú cho lần cập nhật này.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="profile" className="space-y-6 m-0">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4 text-violet-600" />
                                                Học vấn
                                            </h3>
                                            <div className="space-y-4">
                                                {education.map((edu) => (
                                                    <div key={edu.id} className="border-l-2 border-primary/30 pl-4 py-1">
                                                        <h4 className="font-medium">{edu.school_name}</h4>
                                                        <p className="text-sm text-foreground/80">
                                                            {edu.degree} - {edu.field_of_study}
                                                        </p>
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
                                                <Briefcase className="w-4 h-4 text-violet-600" />
                                                Kinh nghiệm
                                            </h3>
                                            <div className="space-y-6">
                                                {experience.map((exp) => (
                                                    <div key={exp.id} className="border-l-2 border-primary/30 pl-4 py-1">
                                                        <h4 className="font-medium">{exp.job_title}</h4>
                                                        <p className="text-sm text-foreground/80">{exp.company_name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                            <span>
                                                                {new Date(exp.start_date).getFullYear()} - {exp.is_current ? 'Hiện tại' : new Date(exp.end_date).getFullYear()}
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {exp.location}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-border/50"></div>

                                        <div>
                                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Target className="w-4 h-4 text-violet-600" />
                                                Kỹ năng
                                            </h3>
                                            {skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {skills.map((skill) => (
                                                        <Badge key={skill.id} variant="secondary" className="px-3 py-1 bg-secondary/50">
                                                            {skill.skill_name || skill.skill?.name || skill.name || 'Kỹ năng'}
                                                            {skill.proficiency_level ? ` (${skill.proficiency_level})` : ''}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Chưa có thông tin kỹ năng.</p>
                                            )}
                                        </div>

                                        <div className="h-px w-full bg-border/50"></div>

                                        <div>
                                            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Award className="w-4 h-4 text-violet-600" />
                                                Chứng chỉ
                                            </h3>
                                            {certifications.length > 0 ? (
                                                <div className="space-y-4">
                                                    {certifications.map((cert) => (
                                                        <div key={cert.id} className="border-l-2 border-primary/30 pl-4 py-1">
                                                            <h4 className="font-medium">{cert.certification_name}</h4>
                                                            <p className="text-sm text-foreground/80">
                                                                {cert.issuing_organization || 'Chưa có tổ chức cấp'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('vi-VN') : 'Chưa có ngày cấp'}
                                                                {cert.expiry_date ? ` - ${new Date(cert.expiry_date).toLocaleDateString('vi-VN')}` : ' - Không có hạn'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Chưa có thông tin chứng chỉ.</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="space-y-6 m-0">
                                    <div className="space-y-6">
                                        <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
                                            <Textarea
                                                placeholder="Thêm ghi chú nội bộ (chỉ team tuyển dụng xem được)..."
                                                value={activityNote}
                                                onChange={(e) => setActivityNote(e.target.value)}
                                                className="resize-none bg-secondary/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary h-20"
                                            />
                                            <div className="flex justify-end mt-3">
                                                <Button
                                                    size="sm"
                                                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20"
                                                    onClick={handleSaveNote}
                                                    disabled={savingNote || !activityNote.trim()}
                                                >
                                                    Lưu ghi chú
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="relative space-y-4 before:absolute before:bottom-2 before:left-5 before:top-2 before:w-0.5 before:bg-border">
                                            {timelineItems.map((item, idx) => (
                                                <div key={item.id} className="relative pl-14">
                                                    <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-200 bg-white text-slate-700 shadow-sm">
                                                        <Calendar className={`w-4 h-4 ${idx === 0 ? 'text-violet-600' : 'text-slate-500'}`} />
                                                    </div>
                                                    <div className="rounded-xl border border-border/50 bg-white/80 p-4 shadow-sm">
                                                        <div className="mb-1 flex items-center justify-between gap-3">
                                                            <div className="font-semibold text-slate-900">
                                                                {STATUS_LABEL_MAP[item.new_status || item.status] || item.new_status || item.status}
                                                            </div>
                                                            <div className="shrink-0 text-xs text-muted-foreground">
                                                                {new Date(item.changed_at || item.created_at).toLocaleString('vi-VN')}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {item.notes || 'Không có ghi chú cho lần cập nhật này.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {timelineItems.length === 0 && (
                                                <div className="rounded-xl border border-dashed border-border/50 bg-secondary/20 px-4 py-5 text-sm text-muted-foreground">
                                                    Chưa có lịch sử trạng thái.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </>
                ) : null}
            </SheetContent>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-[850px] w-[95vw] h-[90vh] overflow-hidden p-0 bg-transparent border-none shadow-none z-[300] flex justify-center">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Xem trước CV</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-full overflow-auto flex justify-center items-start pt-4 hide-scrollbar">
                        <div
                            className="bg-white shadow-2xl relative rounded overflow-hidden"
                            style={{
                                width: '210mm',
                                height: '297mm',
                                transform: 'scale(0.8)',
                                transformOrigin: 'top center',
                                flexShrink: 0,
                                marginBottom: '-50mm',
                            }}
                        >
                            {previewHtml && (
                                <iframe
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                            <head>
                                                <style>
                                                    body { margin: 0; padding: 0; background: white; }
                                                    ::-webkit-scrollbar { width: 0px; background: transparent; }
                                                </style>
                                            </head>
                                            <body>
                                                ${previewHtml}
                                            </body>
                                        </html>
                                    `}
                                    className="w-full pointer-events-auto rounded"
                                    style={{
                                        height: '100%',
                                        border: 'none',
                                    }}
                                    title="CV Preview"
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            )}
                            <Button
                                variant="default"
                                size="sm"
                                className="absolute top-4 right-4 z-50 bg-slate-900/50 hover:bg-slate-900 backdrop-blur-sm transition-opacity"
                                onClick={() => setPreviewOpen(false)}
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Sheet>
    );
}
