import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    Globe,
    ExternalLink,
    CheckCircle2,
    Users,
    Building,
    ArrowRight,
    Mail,
    Phone,
    MapPin,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { companyService } from '@/services/companyService';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

interface CompanySidebarProps {
    company: {
        id: number;
        company_name: string;
        industry?: { name: string } | string | null;
        industry_name?: string | null;
        logo_url: string | null;
        company_size: string;
        founded_year: number | null;
        website: string | null;
        email?: string | null;
        phone?: string | null;
        tax_code?: string | null;
        description?: string | null;
        headquarters?: string | null;
        address?: number | {
            address_line?: string;
            commune_name?: string;
            province_name?: string;
        } | null;
        verification_status: string;
        follower_count: number;
        job_count: number;
        slug: string;
    };
}

export const CompanySidebar = ({ company }: CompanySidebarProps) => {
    const { isAuthenticated, user } = useUserStore();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const isAdminViewer = user?.role === 'admin';
    const industryLabel =
        company.industry_name ||
        (typeof company.industry === 'string' ? company.industry : company.industry?.name) ||
        'Lĩnh vực chưa cập nhật';
    const addressLabel = company.headquarters || formatAddress(company.address);
    const description = cleanDescription(company.description);

    useEffect(() => {
        if (isAuthenticated && !isAdminViewer) {
            companyService.isFollowing(company.id).then(res => setIsFollowing(res.data.is_following));
        }
    }, [company.id, isAuthenticated, isAdminViewer]);

    const handleFollowToggle = async () => {
        if (isAdminViewer) {
            toast.info('Admin chỉ xem nội dung, không thể theo dõi công ty');
            return;
        }
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để theo dõi công ty');
            return;
        }
        setIsActionLoading(true);
        try {
            if (isFollowing) {
                await companyService.unfollow(company.id);
                setIsFollowing(false);
                toast.success(`Đã bỏ theo dõi ${company.company_name}`);
            } else {
                await companyService.follow(company.id);
                setIsFollowing(true);
                toast.success(`Đã theo dõi ${company.company_name}`);
            }
        } catch (error) {
            toast.error('Thao tác thất bại');
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <aside className="w-full">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm sticky top-32"
            >
                <div className="flex items-center gap-5 mb-7">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 p-2 border border-slate-200 flex items-center justify-center shrink-0">
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                        ) : (
                            <Building className="w-9 h-9 text-slate-300" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-lg text-slate-900 flex items-center gap-1.5 leading-snug">
                            <span className="truncate">{company.company_name}</span>
                            {company.verification_status === 'verified' && (
                                <CheckCircle2 size={17} className="text-sky-600 fill-sky-50 shrink-0" />
                            )}
                        </h4>
                        <p className="text-sm text-slate-500 truncate mt-1">{industryLabel}</p>
                    </div>
                </div>

                {description && (
                    <div className="mb-7 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-[11px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Giới thiệu</p>
                        <p className="text-sm leading-6 text-slate-600 line-clamp-4">{description}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-7">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-sky-200 transition-all group/stat">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Quy mô</p>
                        <p className="text-base font-black text-slate-900 group-hover/stat:text-sky-700 transition-colors uppercase truncate" title={company.company_size}>
                            {company.company_size || 'Đang cập nhật'}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-sky-200 transition-all group/stat">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Thành lập</p>
                        <p className="text-base font-black text-slate-900 group-hover/stat:text-sky-700 transition-colors">
                            {company.founded_year || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mb-7">
                    {addressLabel && (
                        <InfoRow
                            icon={<MapPin size={18} className="text-slate-400" />}
                            label="Trụ sở"
                            value={addressLabel}
                        />
                    )}
                    {company.email && (
                        <InfoRow
                            icon={<Mail size={18} className="text-slate-400" />}
                            label="Email"
                            value={company.email}
                            href={`mailto:${company.email}`}
                        />
                    )}
                    {company.phone && (
                        <InfoRow
                            icon={<Phone size={18} className="text-slate-400" />}
                            label="Điện thoại"
                            value={company.phone}
                            href={`tel:${company.phone}`}
                        />
                    )}
                    {company.tax_code && (
                        <InfoRow
                            icon={<FileText size={18} className="text-slate-400" />}
                            label="Mã số thuế"
                            value={company.tax_code}
                        />
                    )}
                </div>

                <div className="space-y-5 mb-7 pt-5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2.5 text-base text-slate-600">
                            <Users size={18} className="text-slate-400" />
                            Người theo dõi
                        </span>
                        <span className="font-black text-lg text-slate-900">{(company.follower_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2.5 text-base text-slate-600">
                            <Building size={18} className="text-slate-400" />
                            Tin đang tuyển
                        </span>
                        <span className="font-black text-lg text-slate-900">{company.job_count || 0}</span>
                    </div>
                    {company.website && (
                        <div className="pt-3 border-t border-slate-100">
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-base text-sky-700 hover:text-sky-800 font-bold group/link"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Globe size={18} />
                                    Website công ty
                                </span>
                                <ExternalLink size={15} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </a>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={handleFollowToggle}
                        disabled={isActionLoading || isAdminViewer}
                        title={isAdminViewer ? 'Admin chỉ xem nội dung, không thể theo dõi công ty' : undefined}
                        variant={isFollowing ? 'outline' : 'default'}
                        className={cn(
                            'w-full h-12 rounded-xl font-bold text-base transition-all',
                            isFollowing
                                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                : 'bg-sky-700 hover:bg-sky-800 text-white shadow-none'
                        )}
                    >
                        {isFollowing ? 'Đang theo dõi' : 'Theo dõi công ty'}
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="w-full h-11 text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded-xl group/jobs font-bold"
                    >
                        <a href={`/jobs?company_id=${company.id}`}>
                            Xem tất cả tin tuyển dụng
                            <ArrowRight size={16} className="ml-2 transition-transform group-hover/jobs:translate-x-1" />
                        </a>
                    </Button>
                </div>
            </motion.div>
        </aside>
    );
};

function InfoRow({
    icon,
    label,
    value,
    href,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    href?: string;
}) {
    const content = (
        <>
            <span className="shrink-0 mt-0.5">{icon}</span>
            <span className="min-w-0">
                <span className="block text-[11px] uppercase font-bold text-slate-500 tracking-wider">{label}</span>
                <span className="block text-sm font-semibold text-slate-800 break-words">{value}</span>
            </span>
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 hover:border-sky-200 hover:bg-sky-50/40 transition-colors"
            >
                {content}
            </a>
        );
    }

    return (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            {content}
        </div>
    );
}

function cleanDescription(value?: string | null) {
    const text = value
        ?.replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text || '';
}

function formatAddress(address: CompanySidebarProps['company']['address']) {
    if (!address || typeof address === 'number') return '';
    return [
        address.address_line,
        address.commune_name,
        address.province_name,
    ].filter(Boolean).join(', ');
}
