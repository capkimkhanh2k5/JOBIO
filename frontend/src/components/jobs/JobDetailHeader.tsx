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
        <section className="w-full space-y-6">
            <div className="relative group">
                <div className="h-52 md:h-72 w-full rounded-2xl overflow-hidden border border-gray-200 bg-slate-100">
                    {bannerUrl ? (
                        <img
                            src={bannerUrl}
                            alt={`${job.company?.company_name} banner`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100" />
                    )}
                </div>

                <div className="absolute -bottom-10 left-8 p-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                        {companyHref ? (
                            <Link to={companyHref} className="w-full h-full flex items-center justify-center" aria-label={`Xem công ty ${job.company?.company_name}`}>
                                {job.company?.logo_url ? (
                                    <img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="w-10 h-10 text-gray-300" />
                                )}
                            </Link>
                        ) : job.company?.logo_url ? (
                            <img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="w-10 h-10 text-gray-300" />
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="space-y-7">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-semibold">
                                    {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                                </Badge>
                                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-semibold">
                                    {LEVEL_LABELS[job.level] ?? job.level}
                                </Badge>
                                {job.is_remote && (
                                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-semibold">
                                        Remote
                                    </Badge>
                                )}
                                {job.featured && (
                                    <Badge variant="outline" className="bg-slate-50 text-slate-900 border-slate-200 font-semibold flex items-center">
                                        <Zap className="w-3 h-3 mr-1 text-amber-500 fill-amber-500" />
                                        Nổi bật
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight mb-3">
                                {job.title}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-600 font-semibold text-base">
                                {companyHref ? (
                                    <Link
                                        to={companyHref}
                                        className="hover:text-sky-700 flex items-center gap-1.5 transition-colors"
                                    >
                                        {job.company?.company_name}
                                        {job.company?.verification_status === 'verified' && (
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50/50" />
                                        )}
                                    </Link>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        {job.company?.company_name}
                                        {job.company?.verification_status === 'verified' && (
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50/50" />
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full xl:w-[320px] shrink-0">
                            <Button
                                onClick={onApply}
                                disabled={isAdminViewer}
                                title={isAdminViewer ? 'Admin chỉ xem nội dung, không thể ứng tuyển' : undefined}
                                className="w-full h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg shadow-md shadow-violet-600/20 transition-all active:scale-[0.98]"
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
                                        'h-12 rounded-xl font-bold transition-all border-slate-200 text-slate-700',
                                        isSaved ? 'bg-slate-50 text-sky-700 border-sky-200' : 'hover:bg-slate-50'
                                    )}
                                >
                                    <Bookmark className={cn('w-5 h-5 mr-2', isSaved && 'fill-current')} />
                                    {isSaved ? 'Đã lưu' : 'Lưu tin'}
                                </Button>
                                <Button onClick={() => handleShare('facebook')} variant="outline" size="icon" className="w-12 h-12 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
                                    <Facebook className="w-5 h-5" />
                                </Button>
                                <Button onClick={() => handleShare('linkedin')} variant="outline" size="icon" className="w-12 h-12 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
                                    <Linkedin className="w-5 h-5" />
                                </Button>
                                <Button onClick={() => handleShare('link')} variant="outline" size="icon" className="w-12 h-12 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
                                    <LinkIcon className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoItem icon={<DollarSign className="w-5 h-5" />} label="Mức lương" value={formatSalary()} />
                            <InfoItem icon={<MapPin className="w-5 h-5" />} label="Địa điểm" value={locationText} />
                            <InfoItem
                                icon={<Clock className="w-5 h-5" />}
                                label="Hạn nộp"
                                value={diffDays > 0 ? `Còn ${diffDays} ngày` : 'Hết hạn'}
                                urgent={isUrgent}
                            />
                            <InfoItem icon={<Calendar className="w-5 h-5" />} label="Ngày đăng" value={publishedDate} />
                        </div>

                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-center gap-3">
                            <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    Lượt ứng tuyển
                                </span>
                                <span className="text-base font-black text-slate-900">{job.application_count}</span>
                            </div>
                            <div className="h-px bg-slate-200" />
                            <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                    <Zap className="w-4 h-4 text-slate-400" />
                                    Lượt xem
                                </span>
                                <span className="text-base font-black text-slate-900">{job.view_count}</span>
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
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={cn('text-base font-black text-slate-900 break-words', urgent && 'text-red-600')}>
                    {value}
                </p>
            </div>
        </div>
    );
}
