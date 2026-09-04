import { useEffect, useState, type ReactNode } from 'react';
import {
    Bookmark,
    Users,
    Zap,
    MapPin,
    Calendar,
    Clock,
    DollarSign,
    CheckCircle2,
    Facebook,
    Linkedin,
    Link as LinkIcon,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { savedJobService } from '@/services/savedJobService';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { showCandidateOnlyFeatureWarning } from '@/lib/candidateOnlyFeature';

const JOB_TYPE_LABELS: Record<string, string> = {
    'full-time': 'Toàn thời gian',
    'part-time': 'Bán thời gian',
    full_time: 'Toàn thời gian',
    part_time: 'Bán thời gian',
    contract: 'Hợp đồng',
    internship: 'Thực tập',
    freelance: 'Freelance',
};

const LEVEL_LABELS: Record<string, string> = {
    intern: 'Intern',
    fresher: 'Fresher',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
    manager: 'Manager',
    director: 'Director',
};

interface JobDetailHeaderProps {
    job: {
        id: number;
        title: string;
        company: {
            id: number;
            company_name: string;
            logo_url: string | null;
            banner_url?: string | null;
            verification_status?: string;
        };
        banner_url?: string | null;
        job_type: string;
        level: string;
        salary_min: number | null;
        salary_max: number | null;
        salary_currency: string;
        salary_negotiable: boolean;
        is_remote: boolean;
        application_deadline: string | null;
        view_count: number;
        application_count: number;
        featured: boolean;
        published_at: string | null;
    };
    locations: { address?: { province_name?: string }; province_name?: string | null }[];
    onApply: () => void;
}

export const JobDetailHeader = ({ job, locations, onApply }: JobDetailHeaderProps) => {
    const { isAuthenticated, user } = useUserStore();
    const queryClient = useQueryClient();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isAdminViewer = user?.role === 'admin';
    const isCompanyViewer = user?.role === 'company';
    const companyHref = job.company?.id ? `/companies/${job.company.id}` : undefined;

    const invalidateSavedJobQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
        queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
        queryClient.invalidateQueries({ queryKey: ['candidate', 'saved-jobs'] });
    };

    useEffect(() => {
        if (isAuthenticated && !isAdminViewer && !isCompanyViewer) {
            savedJobService.isSaved(job.id).then(res => setIsSaved(res.data.is_saved));
        }
    }, [job.id, isAuthenticated, isAdminViewer, isCompanyViewer]);

    const handleShare = (platform: 'link' | 'facebook' | 'linkedin') => {
        const url = window.location.href;
        if (platform === 'link') {
            navigator.clipboard.writeText(url);
            toast.success('Đã sao chép liên kết');
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'linkedin') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        }
    };

    const toggleSave = async () => {
        if (isCompanyViewer) {
            showCandidateOnlyFeatureWarning('Lưu việc làm');
            return;
        }
        if (isAdminViewer) {
            toast.info('Admin chỉ xem nội dung, không thể lưu việc làm');
            return;
        }
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để lưu việc làm');
            return;
        }
        setIsSaving(true);
        try {
            if (isSaved) {
                await savedJobService.unsaveByJob(job.id);
                setIsSaved(false);
                invalidateSavedJobQueries();
                toast.success('Đã bỏ lưu việc làm');
            } else {
                await savedJobService.save(job.id);
                setIsSaved(true);
                invalidateSavedJobQueries();
                toast.success('Đã lưu việc làm');
            }
        } catch (error) {
            toast.error('Thao tác thất bại');
        } finally {
            setIsSaving(false);
        }
    };

    const formatSalary = () => {
        if (job.salary_negotiable) return 'Thỏa thuận';
        if (!job.salary_min && !job.salary_max) return 'Lương thỏa thuận';
        return `${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()} ${job.salary_currency}`;
    };

    const diffDays = job.application_deadline
        ? Math.ceil((new Date(job.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const isUrgent = diffDays > 0 && diffDays <= 3;
    const bannerUrl = job.banner_url ?? job.company?.banner_url ?? null;
    const locationText = locations
        .map(location => location.address?.province_name || location.province_name)
        .filter(Boolean)
        .join(', ') || 'Toàn quốc';
    const publishedDate = job.published_at ? new Date(job.published_at).toLocaleDateString('vi-VN') : 'Mới';

    return (
        <section className="w-full space-y-4">
            <div className="relative group">
                <div className="h-40 md:h-52 w-full rounded-2xl overflow-hidden border border-border bg-muted">
                    {bannerUrl ? (
                        <img
                            src={bannerUrl}
                            alt={`${job.company?.company_name} banner`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted" />
                    )}
                </div>

                <div className="absolute -bottom-8 left-6 p-1.5 bg-card rounded-2xl shadow-lg border border-border/60 hidden md:block">
                    <div className="w-18 h-18 rounded-xl overflow-hidden flex items-center justify-center bg-muted">
                        {companyHref ? (
                            <Link to={companyHref} className="w-full h-full flex items-center justify-center p-1" aria-label={`Xem công ty ${job.company?.company_name}`}>
                                {job.company?.logo_url ? (
                                    <img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain" loading="eager" fetchPriority="high" />
                                ) : (
                                    <Building2 className="w-8 h-8 text-muted-foreground/40" />
                                )}
                            </Link>
                        ) : job.company?.logo_url ? (
                            <img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain p-1" loading="eager" fetchPriority="high" />
                        ) : (
                            <Building2 className="w-8 h-8 text-muted-foreground/40" />
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="space-y-5">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                <Badge variant="outline" className="bg-card text-xs text-foreground/80 border-border font-medium px-2 py-0.5">
                                    {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                                </Badge>
                                <Badge variant="outline" className="bg-card text-xs text-foreground/80 border-border font-medium px-2 py-0.5">
                                    {LEVEL_LABELS[job.level] ?? job.level}
                                </Badge>
                                {job.is_remote && (
                                    <Badge variant="outline" className="bg-card text-xs text-foreground/80 border-border font-medium px-2 py-0.5">
                                        Remote
                                    </Badge>
                                )}
                                {job.featured && (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs font-semibold px-2 py-0.5 flex items-center">
                                        <Zap className="w-3 h-3 mr-1 fill-current" />
                                        Nổi bật
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-1.5">
                                {job.title}
                            </h1>
                            <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                                {companyHref ? (
                                    <Link
                                        to={companyHref}
                                        className="hover:text-teal-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        {job.company?.company_name}
                                        {job.company?.verification_status === 'verified' && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 fill-teal-50" />
                                        )}
                                    </Link>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        {job.company?.company_name}
                                        {job.company?.verification_status === 'verified' && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 fill-teal-50" />
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5 w-full xl:w-[280px] shrink-0">
                            <Button
                                onClick={onApply}
                                disabled={isAdminViewer}
                                title={isAdminViewer ? 'Admin chỉ xem nội dung, không thể ứng tuyển' : undefined}
                                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all active:scale-[0.98]"
                            >
                                Ứng tuyển ngay
                            </Button>
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                                <Button
                                    onClick={toggleSave}
                                    disabled={isSaving || isAdminViewer}
                                    title={isAdminViewer ? 'Admin chỉ xem nội dung, không thể lưu việc làm' : undefined}
                                    variant="outline"
                                    className={cn(
                                        'h-10 rounded-xl font-bold text-xs transition-all border-border text-foreground/80 px-3',
                                        isSaved ? 'bg-teal-500/10 text-teal-700 border-teal-500/20' : 'hover:bg-muted'
                                    )}
                                >
                                    <Bookmark className={cn('w-4 h-4 mr-1.5', isSaved && 'fill-current')} />
                                    {isSaved ? 'Đã lưu' : 'Lưu tin'}
                                </Button>
                                <Button onClick={() => handleShare('facebook')} variant="outline" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground border-border hover:bg-muted">
                                    <Facebook className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => handleShare('linkedin')} variant="outline" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground border-border hover:bg-muted">
                                    <Linkedin className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => handleShare('link')} variant="outline" size="icon" className="w-10 h-10 rounded-xl text-muted-foreground border-border hover:bg-muted">
                                    <LinkIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-4 pt-4 border-t border-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Mức lương" value={formatSalary()} />
                            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Địa điểm" value={locationText} />
                            <InfoItem
                                icon={<Clock className="w-4 h-4" />}
                                label="Hạn nộp"
                                value={diffDays > 0 ? `Còn ${diffDays} ngày` : 'Hết hạn'}
                                urgent={isUrgent}
                            />
                            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Ngày đăng" value={publishedDate} />
                        </div>

                        <div className="rounded-xl bg-muted/60 border border-border/70 p-3.5 flex flex-col justify-center gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                                    Lượt ứng tuyển
                                </span>
                                <span className="text-sm font-bold text-foreground">{job.application_count}</span>
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                    <Zap className="w-3.5 h-3.5 text-muted-foreground/60" />
                                    Lượt xem
                                </span>
                                <span className="text-sm font-bold text-foreground">{job.view_count}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

function InfoItem({
    icon,
    label,
    value,
    urgent,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    urgent?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 border border-border/70 p-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={cn('text-sm font-bold text-foreground break-words', urgent && 'text-rose-600')}>
                    {value}
                </p>
            </div>
        </div>
    );
}
