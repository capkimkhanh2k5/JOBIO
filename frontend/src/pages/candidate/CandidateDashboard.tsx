import { useQuery } from '@tanstack/react-query';
import { motion, Variants } from 'framer-motion';
import {
    Briefcase, CalendarClock, Eye, Star, CheckCircle2,
    ChevronRight, ExternalLink, FileText, ArrowUpRight, Bookmark, LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { candidateService } from '@/services/candidateService';
import { applicationService } from '@/services/applicationService';
import { savedJobService } from '@/services/savedJobService';
import { jobService } from '@/services/jobService';
import { useUserStore } from '@/store/userStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CandidateDashboard() {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const recruiterId = user?.recruiter_id;

    // Data fetching
    const { data: profileCompleteness, isLoading: loadingCompleteness } = useQuery({
        queryKey: ['candidate', 'profile-completeness', recruiterId],
        queryFn: () => candidateService.getProfileCompleteness(recruiterId!).then(r => r.data),
        enabled: !!recruiterId,
    });

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['candidate', 'stats'],
        queryFn: () => candidateService.getMyStats().then(r => r.data),
        enabled: !!recruiterId,
    });

    // AI Recommended Jobs
    const { data: recommendedJobs, isLoading: loadingRecommended } = useQuery({
        queryKey: ['candidate', 'jobs', 'recommended'],
        queryFn: () => jobService.recommendations({ page_size: 5 }).then(r => r.data),
    });

    const { data: applications, isLoading: loadingApps } = useQuery({
        queryKey: ['candidate', 'applications', 'recent'],
        queryFn: () => applicationService.list({ ordering: '-applied_at', page_size: 5 }).then(r => r.data.results),
    });

    const { data: allApplications } = useQuery({
        queryKey: ['candidate', 'applications', 'all'],
        queryFn: () => applicationService.list({ page_size: 100 }).then(r => r.data.results),
    });

    // Thống kê dựa trên danh sách lớn nhất
    const appStats = {
        total: stats?.applied_jobs_count || 1,
        reviewing: allApplications?.filter((a: any) => ['reviewing', 'shortlisted'].includes(a.status)).length || 0,
        interview: allApplications?.filter((a: any) => a.status === 'interview').length || 0,
        offered: allApplications?.filter((a: any) => ['offered', 'hired'].includes(a.status)).length || 0,
    };

    const { data: savedJobs, isLoading: loadingSaved } = useQuery({
        queryKey: ['candidate', 'saved-jobs', 'preview'],
        queryFn: () => savedJobService.list({ page_size: 5 }).then(r => r.data.results),
    });

    const { data: interviews, isLoading: loadingInterviews } = useQuery({
        queryKey: ['candidate', 'interviews', 'upcoming'],
        queryFn: () => candidateService.listInterviews({ status: 'scheduled', page_size: 3 }).then(r => r.data.results),
    });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1, y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    return (
        <div className="relative pb-12 w-full flex-1">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-[400px] overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-violet-400/8 blur-[120px]" />
                <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-400/8 blur-[140px]" />
            </div>

            <div className="p-6 lg:p-8 space-y-8 w-full flex-1 relative z-10">
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            Tổng quan nghề nghiệp
                        </h1>
                    </div>
                    <p className="text-muted-foreground">Chào mừng bạn trở lại! Hãy xem những cơ hội mới nhất dành cho bạn.</p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                    {/* LEFT COLUMN: Main content */}
                    <div className="md:col-span-8 space-y-6">

                        {/* KPI Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { title: "Việc đã ứng tuyển", value: stats?.applied_jobs_count, icon: <Briefcase className="w-5 h-5 text-violet-500" />, loading: loadingStats },
                                { title: "Phỏng vấn sắp tới", value: stats?.upcoming_interviews_count, icon: <CalendarClock className="w-5 h-5 text-amber-500" />, loading: loadingStats },
                                { title: "Lượt xem hồ sơ", value: stats?.profile_views_count, icon: <Eye className="w-5 h-5 text-cyan-500" />, loading: loadingStats },
                            ].map((stat, i) => (
                                <motion.div key={i} variants={itemVariants}>
                                    <Card className="p-4 bg-white border border-slate-200 shadow-sm hover:-translate-y-1 transition-transform duration-300 rounded-2xl">
                                        <div className="flex flex-col gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                {stat.icon}
                                            </div>
                                            <div>
                                                {stat.loading ? (
                                                    <Skeleton className="h-8 w-16 mb-1 rounded-md" />
                                                ) : (
                                                    <p className="text-3xl font-black text-foreground">{stat.value}</p>
                                                )}
                                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Profile Completion */}
                        <motion.div variants={itemVariants}>
                            <Card className="p-6 bg-white border border-cyan-200 shadow-md shadow-cyan-100/50 relative overflow-hidden rounded-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/60 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2" />

                                <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                                    <div className="relative w-28 h-28 flex-shrink-0">
                                        {loadingCompleteness ? (
                                            <Skeleton className="w-full h-full rounded-full" />
                                        ) : (
                                            <>
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle className="text-slate-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                                    <circle
                                                        className="text-cyan-500 stroke-current drop-shadow-md"
                                                        strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent"
                                                        strokeDasharray={`${(profileCompleteness?.score ?? 0) * 2.51} 251`}
                                                    ></circle>
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                    <span className="text-2xl font-black text-foreground">{profileCompleteness?.score}%</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">Hồ sơ gần hoàn thiện!</h3>
                                            <p className="text-sm text-cyan-500 font-medium">Hoàn thiện hồ sơ để tăng 2x lượt nhà tuyển dụng xem.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {loadingCompleteness ? (
                                                <>
                                                    <Skeleton className="h-6 w-full" />
                                                    <Skeleton className="h-6 w-full" />
                                                </>
                                            ) : (
                                                profileCompleteness?.checklist.slice(0, 4).map((item: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        {item.completed ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                                                        )}
                                                        <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                                            {item.task}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 transition-all">
                                            Cập nhật ngay
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Applications Summary */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-violet-400" />
                                        <h3 className="font-bold">Tiến trình ứng tuyển</h3>
                                    </div>
                                    <Link to="/candidate/applications" className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
                                        Xem tất cả <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="p-5 p-0">
                                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-x-auto p-4 border-b border-slate-100">
                                        {[
                                            { label: `Đã gửi (${stats?.applied_jobs_count || 0})`, value: stats?.applied_jobs_count || 0, col: 'bg-slate-500' },
                                            { label: `Đang xem xét (${appStats.reviewing})`, value: appStats.reviewing, col: 'bg-blue-500' },
                                            { label: `Phỏng vấn (${appStats.interview})`, value: appStats.interview, col: 'bg-amber-500' },
                                            { label: `Trúng tuyển (${appStats.offered})`, value: appStats.offered, col: 'bg-emerald-500' },
                                        ].map(s => (
                                            <div key={s.label} className="flex-1 px-4 py-2 flex flex-col items-center">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-2 h-2 rounded-full ${s.col}`} />
                                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{s.label}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className={`h-full ${s.col}`} style={{ width: `${(s.value / Math.max(stats?.applied_jobs_count || 1, 1)) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {loadingApps ? (
                                            [...Array(3)].map((_, i) => (
                                                <div key={i} className="p-4 flex gap-4"><Skeleton className="w-12 h-12 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div></div>
                                            ))
                                        ) : (
                                            applications?.map((app: any) => (
                                                <div key={app.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/candidate/applications/${app.id}`)}>
                                                    <img src={app.logo_url} alt={app.company} className="w-12 h-12 rounded-xl border border-white/10" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-foreground truncate">{app.job_title}</h4>
                                                        <p className="text-sm text-muted-foreground truncate">{app.company}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <Badge variant="outline" className={
                                                            app.status === 'Reviewing' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                                                app.status === 'Interview' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                                                    app.status === 'Offered' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                                                        app.status === 'Rejected' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                                                            'border-slate-500/30 text-slate-400 bg-slate-500/10'
                                                        }>
                                                            {app.status}
                                                        </Badge>
                                                        <p className="text-[11px] text-muted-foreground mt-1 text-right">{app.applied_at ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true, locale: vi }) : ''}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                    </div>

                    {/* RIGHT COLUMN: Secondary content */}
                    <div className="md:col-span-4 space-y-6">

                        {/* AI Recommended Jobs */}
                        <motion.div variants={itemVariants}>
                            <Card className="p-5 bg-white border border-cyan-200 shadow-md shadow-cyan-100/50 relative overflow-hidden h-full rounded-2xl">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-100/80 blur-[40px] rounded-full pointer-events-none" />

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500">
                                            <Star className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-bold text-lg">AI Đề xuất</h3>
                                    </div>
                                    <Link to="/jobs" className="p-1 text-muted-foreground hover:text-cyan-400 transition-colors">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    {loadingRecommended ? (
                                        [...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                                        ))
                                    ) : (
                                        recommendedJobs?.slice(0, 3).map((job: any) => (
                                            <div key={job.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all cursor-pointer group" onClick={() => navigate(`/jobs/${job.id}`)}>
                                                <div className="flex items-start gap-3">
                                                    <img src={job.logo_url || '/company-placeholder.png'} alt={job.company_name} className="w-10 h-10 rounded-lg shadow-sm border border-slate-200 object-cover" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-cyan-400 transition-colors">{job.title}</h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{job.company_name}</p>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 bg-cyan-100 text-cyan-700">
                                                                Match {job.match_score || 95}%
                                                            </Badge>
                                                            <span className="text-xs font-medium text-emerald-600">{job.salary}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Button variant="ghost" className="w-full mt-3 text-sm text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50" onClick={() => navigate('/jobs')}>
                                    Xem thêm việc làm
                                </Button>
                            </Card>
                        </motion.div>

                        {/* Upcoming Interviews */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
                                <div className="p-4 border-b border-slate-100 bg-slate-50">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <CalendarClock className="w-4 h-4 text-amber-500" /> Phỏng vấn sắp tới
                                    </h3>
                                </div>
                                <div className="p-4">
                                    {loadingInterviews ? (
                                        <div className="space-y-3"><Skeleton className="h-16 w-full" /></div>
                                    ) : interviews && interviews.length > 0 ? (
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-inner">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-amber-600 text-sm">
                                                        {interviews[0].scheduled_at ? format(new Date(interviews[0].scheduled_at), 'dd/MM, HH:mm', { locale: vi }) : ''}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {interviews[0].interview_type?.name || (interviews[0].type === 'video' ? 'Online Interview' : 'Onsite Interview')}
                                                    </p>
                                                </div>
                                                <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/20 border-amber-500/30">Sắp diễn ra</Badge>
                                            </div>
                                            <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                <p className="font-medium text-sm">{interviews[0].application?.job_title || interviews[0].job_title || 'Phỏng vấn'}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Với {interviews[0].application?.recruiter_name || 'Nhà tuyển dụng'}</p>
                                            </div>
                                            {interviews[0].meeting_link && (
                                                <Button size="sm" className="w-full mt-3 bg-violet-600 hover:bg-violet-700 text-white font-medium" onClick={() => window.open(interviews[0].meeting_link as string, '_blank')}>
                                                    Tham gia <ExternalLink className="w-3 h-3 ml-2" />
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                                <CalendarClock className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">Không có lịch phỏng vấn nào sắp tới.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Saved Jobs Preview */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-2xl">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold flex items-center gap-2 text-sm">
                                        <Bookmark className="w-4 h-4 text-rose-400" /> Việc làm đã lưu
                                    </h3>
                                    <Link to="/candidate/saved" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        Xem tất cả
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {loadingSaved ? (
                                        [...Array(2)].map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>)
                                    ) : (
                                        savedJobs?.slice(0, 3).map((job: any) => (
                                            <div key={job.id} className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                                                <img src={job.logo_url} alt={job.company} className="w-10 h-10 rounded border border-white/10" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm truncate">{job.title}</h4>
                                                    <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
