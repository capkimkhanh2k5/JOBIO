import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Globe,
    ExternalLink,
    CheckCircle2,
    Users,
    Building,
    ArrowRight
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
        industry?: { name: string } | null;
        logo_url: string | null;
        company_size: string;
        founded_year: number | null;
        website: string | null;
        verification_status: string;
        follower_count: number;
        job_count: number;
        slug: string;
    };
}

export const CompanySidebar = ({ company }: CompanySidebarProps) => {
    const { isAuthenticated } = useUserStore();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            companyService.isFollowing(company.id).then(res => setIsFollowing(res.data.is_following));
        }
    }, [company.id, isAuthenticated]);

    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để theo dõi công ty");
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
            toast.error("Thao tác thất bại");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <aside className="w-full">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm shadow-indigo-500/5 sticky top-24"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-xl bg-gray-50 p-2 border border-gray-100 flex items-center justify-center shrink-0">
                        {company.logo_url ? (
                            <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                        ) : (
                            <Building className="w-8 h-8 text-gray-300" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span className="truncate">{company.company_name}</span>
                            {company.verification_status === 'verified' && (
                                <CheckCircle2 size={16} className="text-blue-500 fill-blue-50 shrink-0" />
                            )}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{company.industry?.name || 'Ngành nghề chưa cập nhật'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all group/stat">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Quy mô</p>
                        <p className="text-sm font-black text-gray-900 group-hover/stat:text-indigo-600 transition-colors uppercase">{company.company_size}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-indigo-100 transition-all group/stat">
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Thành lập</p>
                        <p className="text-sm font-black text-gray-900 group-hover/stat:text-indigo-600 transition-colors">{company.founded_year || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                            <Users size={16} className="text-gray-400" />
                            Người theo dõi
                        </span>
                        <span className="font-bold text-gray-900">{(company.follower_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                            <Building size={16} className="text-gray-400" />
                            Tin đang tuyển
                        </span>
                        <span className="font-bold text-gray-900">{company.job_count || 0}</span>
                    </div>
                    {company.website && (
                        <div className="pt-2 border-t border-gray-50">
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-sm text-indigo-600 hover:text-indigo-700 font-bold group/link"
                            >
                                <span className="flex items-center gap-2">
                                    <Globe size={16} />
                                    Website công ty
                                </span>
                                <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </a>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={handleFollowToggle}
                        disabled={isActionLoading}
                        variant={isFollowing ? "outline" : "default"}
                        className={cn(
                            "w-full h-11 rounded-xl font-bold transition-all",
                            isFollowing
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                        )}
                    >
                        {isFollowing ? "Đang theo dõi" : "Theo dõi công ty"}
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="w-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl group/jobs"
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

