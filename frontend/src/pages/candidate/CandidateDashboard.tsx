import { useQuery } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import {
    Briefcase, CalendarClock, Eye, CheckCircle2, ChevronRight,
    ExternalLink, FileText, ArrowUpRight, Bookmark, LayoutDashboard, Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { savedJobService } from '@/services/savedJobService';
import { jobService } from '@/services/jobService';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { DashboardKpiCard } from '@/components/shared/DashboardKpiCard';

const STATUS_LABEL_MAP: Record<string, string> = {
    pending: 'Mới gửi',
    reviewing: 'Đang xem xét',
    shortlisted: 'Đang xem xét',
    interview: 'Phỏng vấn',
    offered: 'Trúng tuyển',
    accepted: 'Trúng tuyển',
    rejected: 'Từ chối',
    withdrawn: 'Rút đơn',
};

const STATUS_BADGE: Record<string, string> = {
    reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
    shortlisted: 'bg-blue-50 text-blue-700 border-blue-200',
    interview: 'bg-amber-50 text-amber-700 border-amber-200',
    offered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-slate-50 text-slate-500 border-slate-200',
    withdrawn: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function CandidateDashboard() {
    const navigate = useNavigate();
    const { user, updateUser } = useUserStore();
    const isCandidate = user?.role === 'candidate';

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['candidate', 'stats'],
        queryFn: () => candidateService.getMyStats().then(r => r.data),
        enabled: isCandidate,
        retry: false,
    });

    const { data: profileData, isLoading: loadingProfile } = useQuery({
        queryKey: ['candidate', 'my-profile', user?.id],
        queryFn: async () => {
            const response = await candidateService.getMyProfile();
            if (response.data?.id && user && user.candidate_id !== response.data.id) {
                updateUser({ candidate_id: response.data.id });
            }
            return response.data;
        },
        enabled: isCandidate,
    });

    const profileCompleteness = profileData
        ? { score: profileData.score ?? profileData.profile_completeness_score ?? 0, checklist: profileData.checklist ?? [] }
        : undefined;

    const { data: recommendedJobs, isLoading: loadingRecommended } = useQuery({
        queryKey: ['candidate', 'jobs', 'featured'],
        queryFn: () => jobService.featured({ page_size: 5 }).then(r => r.data),
    });

    const { data: applications, isLoading: loadingApps } = useQuery({
        queryKey: ['candidate', 'applications', 'recent'],
        queryFn: () => applicationService.list({ ordering: '-applied_at', page_size: 5 }).then(r => r.data.results),
    });

    const { data: allApplications } = useQuery({
        queryKey: ['candidate', 'applications', 'all'],
        queryFn: () => applicationService.list({ page_size: 100 }).then(r => r.data.results),
    });

    const { data: savedJobs, isLoading: loadingSaved } = useQuery({
        queryKey: ['candidate', 'saved-jobs', 'preview'],
        queryFn: () => savedJobService.list({ page_size: 5 }).then(r => r.data.results),
    });

    const { data: interviews, isLoading: loadingInterviews } = useQuery({
        queryKey: ['candidate', 'interviews', 'upcoming'],
        queryFn: () => candidateService.listInterviews({ status: 'scheduled', page_size: 3 }).then(r => r.data.results),
    });

    const normalizedApplications = (allApplications || []).map((app: any) => ({
        ...app,
        company: app.company_name || app.company || '',
        logo_url: app.company_logo || app.logo_url || '/company-placeholder.png',
        statusLabel: STATUS_LABEL_MAP[app.status] || app.status,
    }));

    const recentApplications = (applications || []).map((app: any) => ({
        ...app,
        company: app.company_name || app.company || '',
        logo_url: app.company_logo || app.logo_url || '/company-placeholder.png',
        statusLabel: STATUS_LABEL_MAP[app.status] || app.status,
    }));

    const normalizedSavedJobs = (savedJobs || []).map((job: any) => ({
        ...job,
        jobId: job.job_id,
        title: job.job_title || job.title || '',
        company: job.company_name || '',
        logo_url: job.logo_url || '/company-placeholder.png',
    }));

    const totalApplications = normalizedApplications.length || stats?.applied_jobs_count || 0;
    const upcomingInterviewsCount = interviews?.length || stats?.upcoming_interviews_count || 0;
    const profileViewsCount = stats?.profile_views_count ?? 0;

    const appStats = {
        total: totalApplications,
        reviewing: normalizedApplications.filter((a: any) => ['reviewing', 'shortlisted'].includes(a.status)).length,
        interview: normalizedApplications.filter((a: any) => a.status === 'interview').length,
        offered: normalizedApplications.filter((a: any) => ['offered', 'accepted'].includes(a.status)).length,
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    };

    return (
        <div className="relative flex flex-col w-full h-full min-h-0">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Tổng quan nghề nghiệp"
                    description={`Chào mừng bạn trở lại, ${user?.full_name || 'Ứng viên'}! Hãy xem những cơ hội mới nhất dành cho bạn.`}
                    icon={LayoutDashboard}
                />
            </div>

            <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                    {/* LEFT COLUMN */}
                    <div className="md:col-span-8 space-y-6">

                        {/* KPI Stats */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <DashboardKpiCard
                                icon={<Briefcase className="w-5 h-5" />}
                                label="Việc đã ứng tuyển"
                                value={totalApplications}
                                iconTone={{
                                    bg: 'bg-indigo-50',
                                    text: 'text-indigo-600',
                                    border: 'border-indigo-100',
                                    hoverBg: 'bg-indigo-50/40',
                                }}
                                isLoading={loadingStats && !allApplications}
                            />
                            <DashboardKpiCard
                                icon={<CalendarClock className="w-5 h-5" />}
                                label="Phỏng vấn sắp tới"
                                value={upcomingInterviewsCount}
                                iconTone={{
                                    bg: 'bg-amber-50',
                                    text: 'text-amber-600',
                                    border: 'border-amber-100',
                                    hoverBg: 'bg-amber-50/40',
                                }}
                                isLoading={loadingStats && loadingInterviews}
                            />
                            <DashboardKpiCard
                                icon={<Eye className="w-5 h-5" />}
                                label="Lượt xem hồ sơ"
                                value={profileViewsCount}
                                iconTone={{
                                    bg: 'bg-cyan-50',
                                    text: 'text-cyan-600',
                                    border: 'border-cyan-100',
                                    hoverBg: 'bg-cyan-50/40',
                                }}
                                isLoading={loadingStats && !profileData}
                            />
                        </motion.div>

                        {/* Profile Completion */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                                <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                                    <div className="relative w-28 h-28 flex-shrink-0">
                                        {loadingProfile ? (
                                            <Skeleton className="w-full h-full rounded-full" />
                                        ) : (
                                            <>
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle className="text-slate-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                                                    <circle
                                                        className="text-cyan-500 stroke-current"
                                                        strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent"
                                                        strokeDasharray={`${(profileCompleteness?.score ?? 0) * 2.51} 251`}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                    <span className="text-2xl font-black text-slate-900">{profileCompleteness?.score}%</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Hồ sơ gần hoàn thiện!</h3>
                                            <p className="text-sm text-cyan-600 font-medium mt-0.5">Hoàn thiện hồ sơ để tăng 2x lượt nhà tuyển dụng xem.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {loadingProfile ? (
                                                <><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></>
                                            ) : (
                                                profileCompleteness?.checklist.slice(0, 4).map((item: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        {item.completed
                                                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                                        }
                                                        <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                                            {item.task}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button
                                            className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                                            onClick={() => navigate('/candidate/profile')}
                                        >
                                            Cập nhật ngay
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Applications Summary */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4 text-violet-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-slate-900">Tiến trình ứng tuyển</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Theo dõi trạng thái đơn ứng tuyển</p>
                                        </div>
                                    </div>
                                    <Link to="/candidate/applications" className="text-sm text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 transition-colors">
                                        Xem tất cả <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {/* Funnel bars */}
                                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-4 border-b border-slate-100">
                                    {[
                                        { label: `Đã gửi`, value: appStats.total, color: 'bg-slate-400' },
                                        { label: `Đang xem xét`, value: appStats.reviewing, color: 'bg-blue-500' },
                                        { label: `Phỏng vấn`, value: appStats.interview, color: 'bg-amber-500' },
                                        { label: `Trúng tuyển`, value: appStats.offered, color: 'bg-emerald-500' },
                                    ].map(s => (
                                        <div key={s.label} className="flex-1 px-4 py-2 flex flex-col items-center">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                                                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{s.label} ({s.value})</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${s.color} rounded-full`} style={{ width: `${(s.value / Math.max(appStats.total || 1, 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent applications list */}
                                <div className="divide-y divide-slate-100">
                                    {loadingApps ? (
                                        [...Array(3)].map((_, i) => (
                                            <div key={i} className="p-4 flex gap-4">
                                                <Skeleton className="w-12 h-12 rounded-xl" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-1/3" />
                                                    <Skeleton className="h-3 w-1/4" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        recentApplications.map((app: any) => (
                                            <div
                                                key={app.id}
                                                className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => navigate('/candidate/applications')}
                                            >
                                                <img src={app.logo_url} alt={app.company} className="w-12 h-12 rounded-xl border border-slate-200 object-contain p-1" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 truncate text-sm">{app.job_title}</h4>
                                                    <p className="text-xs text-slate-500 truncate">{app.company}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <Badge className={`text-[10px] font-bold border ${STATUS_BADGE[app.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                        {app.statusLabel}
                                                    </Badge>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        {app.applied_at ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true, locale: vi }) : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="md:col-span-4 space-y-6">

                        {/* AI Recommended Jobs */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-slate-900">Gợi ý việc làm</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Phù hợp với hồ sơ của bạn</p>
                                        </div>
                                    </div>
                                    <Link to="/candidate/suggested-jobs" className="text-slate-400 hover:text-violet-600 transition-colors">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {loadingRecommended ? (
                                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                                    ) : (
                                        recommendedJobs?.slice(0, 3).map((job: any) => (
                                            <div
                                                key={job.id}
                                                className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer group"
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <img src={job.logo_url || '/company-placeholder.png'} alt={job.company_name} className="w-10 h-10 rounded-lg border border-slate-200 object-contain p-1 bg-white" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 group-hover:text-violet-600 transition-colors">{job.title}</h4>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{job.company_name}</p>
                                                        <div className="mt-1.5 flex items-center justify-between">
                                                            {job.match_score != null && job.match_score > 0 ? (
                                                                <Badge className="text-[10px] px-1.5 bg-cyan-50 text-cyan-700 border-cyan-200 font-bold">
                                                                    Match {job.match_score}%
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="text-[10px] px-1.5 bg-slate-100 text-slate-500 border-slate-200 font-bold">
                                                                    Gợi ý
                                                                </Badge>
                                                            )}
                                                            <span className="text-xs font-semibold text-emerald-600">{job.salary}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Button variant="ghost" className="w-full mt-3 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-semibold" onClick={() => navigate('/candidate/suggested-jobs')}>
                                    Xem thêm việc làm
                                </Button>
                            </div>
                        </motion.div>

                        {/* Upcoming Interviews */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                        <CalendarClock className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-900">Phỏng vấn sắp tới</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Lịch phỏng vấn của bạn</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    {loadingInterviews ? (
                                        <Skeleton className="h-16 w-full rounded-xl" />
                                    ) : interviews && interviews.length > 0 ? (
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-amber-700 text-sm">
                                                        {interviews[0].scheduled_at ? format(new Date(interviews[0].scheduled_at), 'dd/MM, HH:mm', { locale: vi }) : ''}
                                                    </h4>
                                                    <p className="text-xs text-amber-600 mt-0.5">
                                                        {interviews[0].interview_type?.name || (interviews[0].type === 'video' ? 'Online Interview' : 'Onsite Interview')}
                                                    </p>
                                                </div>
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">Sắp diễn ra</Badge>
                                            </div>
                                            <div className="mt-2 bg-white rounded-lg p-3 border border-amber-100">
                                                <p className="font-semibold text-sm text-slate-900">{interviews[0].application?.job_title || interviews[0].job_title || 'Phỏng vấn'}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Với {interviews[0].application?.candidate_name || 'Nhà tuyển dụng'}</p>
                                            </div>
                                            {interviews[0].meeting_link && (
                                                <Button size="sm" className="w-full mt-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold" onClick={() => window.open(interviews[0].meeting_link as string, '_blank')}>
                                                    Tham gia <ExternalLink className="w-3 h-3 ml-2" />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                                <CalendarClock className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <p className="text-sm text-slate-500">Không có lịch phỏng vấn nào sắp tới.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Saved Jobs Preview */}
                        <motion.div variants={itemVariants}>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                            <Bookmark className="w-4 h-4 text-rose-600" />
                                        </div>
                                        <h3 className="font-bold text-sm text-slate-900">Việc làm đã lưu</h3>
                                    </div>
                                    <Link to="/candidate/saved" className="text-xs text-slate-500 hover:text-violet-600 font-semibold transition-colors">
                                        Xem tất cả
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {loadingSaved ? (
                                        [...Array(2)].map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12 w-full rounded-xl" /></div>)
                                    ) : normalizedSavedJobs.length === 0 ? (
                                        <div className="p-5 text-center text-sm text-slate-500">Chưa có việc làm đã lưu.</div>
                                    ) : (
                                        normalizedSavedJobs.slice(0, 3).map((job: any) => (
                                            <div
                                                key={job.id}
                                                className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/jobs/${job.jobId}`)}
                                            >
                                                <img src={job.logo_url} alt={job.company} className="w-10 h-10 rounded-lg border border-slate-200 object-contain p-1 bg-white" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-slate-900 truncate">{job.title}</h4>
                                                    <p className="text-xs text-slate-500 truncate">{job.company}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
