import { useState, useEffect } from 'react';
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

interface JobDetailHeaderProps {
    job: {
        id: number;
        title: string;
        company: {
            id: number;
            company_name: string;
            logo_url: string | null;
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
    locations: { address: { province_name?: string } }[];
    onApply: () => void;
}

export const JobDetailHeader = ({ job, locations, onApply }: JobDetailHeaderProps) => {
    const { isAuthenticated } = useUserStore();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            savedJobService.isSaved(job.id).then(res => setIsSaved(res.data.is_saved));
        }
    }, [job.id, isAuthenticated]);

    const handleShare = (platform: 'link' | 'facebook' | 'linkedin') => {
        const url = window.location.href;
        if (platform === 'link') {
            navigator.clipboard.writeText(url);
            toast.success("Đã sao chép liên kết");
        } else if (platform === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        } else if (platform === 'linkedin') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        }
    };

    const toggleSave = async () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để lưu việc làm");
            return;
        }
        setIsSaving(true);
        try {
            if (isSaved) {
                await savedJobService.unsaveByJob(job.id);
                setIsSaved(false);
                toast.success("Đã bỏ lưu việc làm");
            } else {
                await savedJobService.save(job.id);
                setIsSaved(true);
                toast.success("Đã lưu việc làm");
            }
        } catch (error) {
            toast.error("Thao tác thất bại");
        } finally {
            setIsSaving(false);
        }
    };

    const formatSalary = () => {
        if (job.salary_negotiable) return "Thỏa thuận";
        if (!job.salary_min && !job.salary_max) return "Lương thỏa thuận";
        return `${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()} ${job.salary_currency}`;
    };

    // Calculate days remaining
    const diffDays = job.application_deadline ? Math.ceil((new Date(job.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isUrgent = diffDays > 0 && diffDays <= 3;

    return (
        <section className="w-full space-y-6">
            {/* Banner & Logo Area */}
            <div className="relative group">
                <div className="h-48 md:h-64 w-full rounded-2xl overflow-hidden border border-gray-200">
                    {job.banner_url ? (
                        <img src={job.banner_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-slate-100" />
                    )}
                </div>

                {/* Logo Floating */}
                <div className="absolute -bottom-10 left-8 p-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50">
                        {job.company?.logo_url ? (
                            <img src={job.company?.logo_url} alt={job.company?.company_name} className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="w-10 h-10 text-gray-300" />
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1 space-y-4">
                        {/* Title & Company */}
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-semibold">
                                    {job.job_type === 'full_time' ? 'Toàn thời gian' : job.job_type}
                                </Badge>
                                <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 font-semibold">
                                    {job.level}
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2">
                                {job.title}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-600 font-medium">
                                <span className="hover:text-sky-700 cursor-pointer flex items-center gap-1.5 transition-colors">
                                    {job.company?.company_name}
                                    {job.company?.verification_status === 'verified' && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50/50" />
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 py-6 border-y border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mức lương</p>
                                    <p className="text-sm font-bold text-slate-900">{formatSalary()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Địa điểm</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                        {locations.map(l => l.address.province_name).filter(Boolean).join(", ") || "Toàn quốc"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hạn nộp</p>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        isUrgent ? "text-red-600" : "text-slate-900"
                                    )}>
                                        {diffDays > 0 ? `Còn ${diffDays} ngày` : "Hết hạn"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sky-700">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày đăng</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {job.published_at ? new Date(job.published_at).toLocaleDateString('vi-VN') : 'Mới'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Column */}
                    <div className="flex flex-col gap-3 min-w-[280px]">
                        <Button
                            onClick={onApply}
                            className="w-full h-14 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-lg shadow-sm transition-all active:scale-[0.98]"
                        >
                            Ứng tuyển ngay
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                onClick={toggleSave}
                                disabled={isSaving}
                                variant="outline"
                                className={cn(
                                    "flex-1 h-12 rounded-xl font-bold transition-all border-slate-200 text-slate-700",
                                    isSaved ? "bg-slate-50 text-sky-700 border-sky-200" : "hover:bg-slate-50"
                                )}
                            >
                                <Bookmark className={cn("w-5 h-5 mr-2", isSaved && "fill-current")} />
                                {isSaved ? "Đã lưu" : "Lưu tin"}
                            </Button>

                            <div className="flex gap-1">
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
                        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium pt-2">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {job.application_count} lượt ứng tuyển</span>
                            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {job.view_count} lượt xem</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
