import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { companyService } from '@/services/companyService';
import api from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    ChevronLeft, Globe, ExternalLink, CheckCircle2, Clock,
    XCircle, Users, Briefcase, Star, Play,
    Building2, MapPin, Hash, BarChart3, MessageSquare
} from 'lucide-react';
import { CompanyJobsTab } from '@/components/companies/CompanyJobsTab';
import { CompanyBenefitsTab } from '@/components/companies/CompanyBenefitsTab';
import { CompanyMediaTab } from '@/components/companies/CompanyMediaTab';
import { CompanyStatsSidebar } from '@/components/companies/CompanyStatsSidebar';

/* ── Verification badge ─────────────────────────────────────── */
function VerificationBadge({ status }: { status: string }) {
    if (status === 'verified')
        return (
            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1 text-xs font-semibold">
                <CheckCircle2 size={11} /> Đã xác minh
            </Badge>
        );
    if (status === 'pending')
        return (
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1 text-xs font-semibold">
                <Clock size={11} /> Đang xác minh
            </Badge>
        );
    return (
        <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 gap-1 text-xs font-semibold">
            <XCircle size={11} /> Chưa xác minh
        </Badge>
    );
}

/* ── Page skeleton ──────────────────────────────────────────── */
function CompanyPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
            <Skeleton className="h-64 w-full rounded-3xl bg-gray-100" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <Skeleton className="h-48 w-full rounded-2xl bg-gray-100" />
                    <Skeleton className="h-10 w-full rounded-2xl bg-gray-100" />
                    <Skeleton className="h-80 w-full rounded-2xl bg-gray-100" />
                </div>
                <div className="lg:col-span-4">
                    <Skeleton className="h-[400px] w-full rounded-2xl bg-gray-100" />
                </div>
            </div>
        </div>
    );
}

/* ── Main Page Component ────────────────────────────────────── */
export default function CompanyDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const companyParam = id;
    const isNumericCompanyParam = /^\d+$/.test(companyParam);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useUserStore((s) => s.user);
    const isAdminViewer = user?.role === 'admin';

    // ── Queries ────────────────────────────────────────────────
    const { data: company, isLoading, isError } = useQuery({
        queryKey: ['company', companyParam],
        queryFn: () => (
            isNumericCompanyParam
                ? companyService.getById(Number(companyParam))
                : companyService.getBySlug(companyParam)
        ).then(r => r.data),
        staleTime: 1000 * 60 * 5,
        enabled: !!companyParam,
    });

    const companyId = company?.id;

    const { data: stats } = useQuery({
        queryKey: ['company-stats', companyId],
        queryFn: () => api.get(`/api/companies/${companyId}/stats/`).then(r => r.data),
        enabled: !!companyId,
    });

    const { data: followData } = useQuery({
        queryKey: ['company-following', companyId],
        queryFn: () => companyService.isFollowing(Number(companyId)).then(r => r.data),
        enabled: !!user && !isAdminViewer && !!companyId,
    });

    // ── Mutations ──────────────────────────────────────────────
    const [followCount, setFollowCount] = useState<number | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean | null>(null);

    const effectiveFollowing = isFollowing ?? followData?.is_following ?? false;
    const effectiveCount = followCount ?? company?.follower_count ?? 0;

    const followMutation = useMutation({
        mutationFn: () => companyService.follow(Number(companyId)),
        onSuccess: () => {
            setIsFollowing(true);
            setFollowCount(effectiveCount + 1);
            queryClient.invalidateQueries({ queryKey: ['company-following', companyId] });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: () => companyService.unfollow(Number(companyId)),
        onSuccess: () => {
            setIsFollowing(false);
            setFollowCount(Math.max(0, effectiveCount - 1));
            queryClient.invalidateQueries({ queryKey: ['company-following', companyId] });
        },
    });

    const handleFollowToggle = () => {
        if (isAdminViewer) return;
        if (!user) { navigate('/auth'); return; }
        if (!companyId) return;
        if (effectiveFollowing) unfollowMutation.mutate();
        else followMutation.mutate();
    };

    // ── Error / Loading ────────────────────────────────────────
    if (isLoading) return <CompanyPageSkeleton />;
    if (isError || !company) {
        return (
            <div className="container mx-auto py-32 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2">Không tìm thấy công ty</h2>
                <p className="text-muted-foreground mb-8">Trang này không tồn tại hoặc đã bị xóa.</p>
                <Button asChild><Link to="/jobs">Xem việc làm</Link></Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 pt-24 lg:pt-28"
        >
            {/* ── Back button ──────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 pt-2">
                <Button
                    variant="ghost"
                    className="hover:bg-primary/5 text-gray-500 hover:text-primary group mb-3 rounded-xl transition-all duration-300"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft size={18} className="mr-1 transition-transform group-hover:-translate-x-1" />
                    Quay lại
                </Button>
            </div>

            {/* ── Banner + Header Section ───────────────── */}
            <div className="max-w-7xl mx-auto px-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-white"
                >
                    {/* Banner */}
                    <div className="relative h-56 md:h-72 w-full">
                        {company.banner_url ? (
                            <img
                                src={company.banner_url}
                                alt="Company Banner"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50/50 to-white opacity-60" />
                        )}
                        {/* Gradient overlay at bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>

                    {/* Company info card overlaid on banner bottom */}
                    <div className="relative -mt-1 bg-white border-t border-gray-100 px-6 md:px-10 py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                            {/* Logo */}
                            <div className="relative -mt-16 md:-mt-20 shrink-0 h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-white border border-gray-100 p-2 shadow-lg">
                                <img
                                    src={company.logo_url || undefined}
                                    alt={company.company_name}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                                        {company.company_name}
                                    </h1>
                                    <VerificationBadge status={company.verification_status} />
                                </div>
                                <p className="text-muted-foreground mb-3">{(company as any).industry_name ?? company.industry?.name}</p>
                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Users size={14} className="text-cyan-400" />
                                        {company.company_size}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Building2 size={14} className="text-violet-400" />
                                        Thành lập {company.founded_year}
                                    </span>
                                    {(company.website ?? (company as any).website_url) && (
                                        <a
                                            href={company.website ?? (company as any).website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-primary hover:underline"
                                        >
                                            <Globe size={14} />
                                            Website
                                            <ExternalLink size={11} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Follow action */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={effectiveFollowing ? 'following' : 'follow'}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Button
                                            onClick={handleFollowToggle}
                                            disabled={followMutation.isPending || unfollowMutation.isPending || isAdminViewer}
                                            title={isAdminViewer ? 'Admin chỉ xem nội dung, không thể theo dõi công ty' : undefined}
                                            className={
                                                effectiveFollowing
                                                    ? 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-xl px-6 h-11 font-semibold transition-all duration-200 shadow-sm'
                                                    : 'bg-primary text-white rounded-xl px-6 h-11 font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md'
                                            }
                                        >
                                            {effectiveFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                        </Button>
                                    </motion.div>
                                </AnimatePresence>
                                <p className="text-xs text-muted-foreground">
                                    {effectiveCount.toLocaleString()} người theo dõi
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Main content grid ─────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: About + Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-8 flex flex-col gap-6"
                    >
                        {/* ── About Section ──────────────────── */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-primary" />
                                Giới thiệu
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-5">
                                {company.description}
                            </p>
                            <Separator className="bg-gray-100 mb-5" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {company.headquarters && (
                                    <div className="flex items-start gap-2 text-gray-500">
                                        <MapPin size={15} className="text-violet-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5 text-gray-400">Địa chỉ</p>
                                            <p className="text-gray-900">{company.headquarters}</p>
                                        </div>
                                    </div>
                                )}
                                {company.tax_code && (
                                    <div className="flex items-start gap-2 text-gray-500">
                                        <Hash size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5 text-gray-400">Mã số thuế</p>
                                            <p className="text-gray-900">{company.tax_code}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Tabs ───────────────────────────── */}
                        <Tabs defaultValue="jobs" className="w-full">
                            <TabsList className="!grid grid-cols-3 bg-white border border-gray-100 shadow-sm rounded-2xl p-1 h-auto gap-1 mb-6 w-full">
                                {[
                                    { value: 'jobs', label: 'Việc làm', icon: Briefcase },
                                    { value: 'benefits', label: 'Phúc lợi', icon: Star },
                                    { value: 'media', label: 'Media', icon: Play },
                                ].map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="min-w-0 w-full flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-medium data-[state=active]:bg-primary/5 data-[state=active]:text-primary text-gray-500 transition-all"
                                    >
                                        <Icon size={14} className="shrink-0" />
                                        <span className="whitespace-nowrap">{label}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContent value="jobs">
                                <CompanyJobsTab companyId={id} />
                            </TabsContent>

                            <TabsContent value="benefits">
                                <CompanyBenefitsTab companyId={id} />
                            </TabsContent>

                            <TabsContent value="media">
                                <CompanyMediaTab companyId={id} />
                            </TabsContent>

                        </Tabs>
                    </motion.div>

                    {/* Right: Stats sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-4"
                    >
                        <div className="sticky top-24">
                            <CompanyStatsSidebar stats={stats} followerCount={effectiveCount} />

                            {/* Quick Links */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mt-4">
                                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-primary" />
                                    Chia sẻ hồ sơ
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600 text-xs shadow-sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                        }}
                                    >
                                        Sao chép link
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
