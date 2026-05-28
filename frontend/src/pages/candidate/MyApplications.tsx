import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Building2, Search, Clock, FileText, CheckCircle2, XCircle, Activity, Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApplicationDetailSheet } from '@/components/candidate/applications/ApplicationDetailSheet';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { DashboardKpiCard } from '@/components/shared/DashboardKpiCard';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Mới gửi' },
    { id: 'reviewing', label: 'Đang xét' },
    { id: 'shortlisted', label: 'Vào vòng tiếp' },
    { id: 'interview', label: 'Phỏng vấn' },
    { id: 'offered', label: 'Đề nghị' },
    { id: 'accepted', label: 'Đã nhận việc' },
    { id: 'rejected', label: 'Từ chối' },
    { id: 'withdrawn', label: 'Rút đơn' },
];

const STATUS_LABEL_MAP: Record<string, string> = {
    pending: 'Mới gửi',
    reviewing: 'Đang xét',
    shortlisted: 'Vào vòng tiếp',
    interview: 'Phỏng vấn',
    offered: 'Đề nghị',
    accepted: 'Đã nhận việc',
    rejected: 'Từ chối',
    withdrawn: 'Rút đơn',
};

const statusColorMap: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
    shortlisted: 'bg-purple-100 text-purple-700 border-purple-200',
    interview: 'bg-amber-100 text-amber-700 border-amber-200',
    offered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function MyApplications() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [appToWithdraw, setAppToWithdraw] = useState<string | null>(null);

    // Fetch applications
    const { data: applications, isLoading } = useQuery({
        queryKey: ['candidate', 'applications'],
        queryFn: () => applicationService.list().then(r => r.data.results),
    });

    // Withdraw mutation
    const withdrawMutation = useMutation({
        mutationFn: (appId: string) => applicationService.withdraw(Number(appId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'applications'] });
            toast.success("Đã rút đơn ứng tuyển thành công.");
            setSelectedApp(null);
            setAppToWithdraw(null);
        },
        onError: () => {
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    });

    // Derived state
    const { filteredApps, stats } = useMemo(() => {
        if (!applications) return { filteredApps: [], stats: { total: 0 } as any };

        const normalizedApplications = applications.map((app: any) => ({
            ...app,
            company: app.company_name || app.company || '',
            logo_url: app.company_logo || app.logo_url || '',
            statusLabel: STATUS_LABEL_MAP[app.status] || app.status,
        }));

        const searchableApps = normalizedApplications.filter((app: any) =>
            (app.job_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.company || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        const counts = normalizedApplications.reduce((acc: any, app: any) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            acc.all = (acc.all || 0) + 1;
            return acc;
        }, { all: 0 });

        const filtered = activeTab === 'all'
            ? searchableApps
            : searchableApps.filter((app: any) => app.status === activeTab);

        const activeCount =
            (counts.pending || 0) +
            (counts.reviewing || 0) +
            (counts.shortlisted || 0) +
            (counts.interview || 0);
        const successCount = (counts.offered || 0) + (counts.accepted || 0);
        const failedCount = (counts.rejected || 0) + (counts.withdrawn || 0);

        return {
            filteredApps: filtered,
            stats: {
                total: counts.all,
                counts,
                active: activeCount,
                success: successCount,
                failed: failedCount
            }
        };
    }, [applications, activeTab, searchQuery]);

    const handleWithdrawRequest = (appId: string) => {
        setAppToWithdraw(appId);
    };

    const selectedApplication = applications
        ?.map((app: any) => ({
            ...app,
            company: app.company_name || app.company || '',
            logo_url: app.company_logo || app.logo_url || '',
            statusLabel: STATUS_LABEL_MAP[app.status] || app.status,
        }))
        .find((app: any) => String(app.id) === String(selectedApp));

    const confirmWithdraw = () => {
        if (appToWithdraw) {
            withdrawMutation.mutate(appToWithdraw);
        }
    };

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Việc làm đã ứng tuyển"
                    description="Theo dõi và quản lý quá trình ứng tuyển của bạn."
                    icon={Briefcase}
                />
            </div>

            <div className="p-6 lg:p-8 space-y-6 w-full flex-1 relative z-10">

                {/* Stats Summary — DashboardKpiCard (always visible, shows 0 when no data) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <DashboardKpiCard
                        icon={<Briefcase className="w-5 h-5" />}
                        label="Tổng số đơn"
                        value={stats.total}
<<<<<<< HEAD
                        layout="inlineValue"
=======
>>>>>>> main
                        iconTone={{
                            bg: 'bg-slate-50',
                            text: 'text-slate-600',
                            border: 'border-slate-200',
                            hoverBg: 'bg-slate-50/50',
                        }}
                        isLoading={isLoading}
                    />
                    <DashboardKpiCard
                        icon={<Activity className="w-5 h-5" />}
                        label="Đang diễn ra"
                        value={stats.active}
<<<<<<< HEAD
                        layout="inlineValue"
=======
>>>>>>> main
                        iconTone={{
                            bg: 'bg-blue-50',
                            text: 'text-blue-600',
                            border: 'border-blue-200',
                            hoverBg: 'bg-blue-50/40',
                        }}
                        isLoading={isLoading}
                    />
                    <DashboardKpiCard
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        label="Thành công"
                        value={stats.success}
<<<<<<< HEAD
                        layout="inlineValue"
=======
>>>>>>> main
                        iconTone={{
                            bg: 'bg-emerald-50',
                            text: 'text-emerald-600',
                            border: 'border-emerald-200',
                            hoverBg: 'bg-emerald-50/40',
                        }}
                        isLoading={isLoading}
                    />
                    <DashboardKpiCard
                        icon={<XCircle className="w-5 h-5" />}
                        label="Chưa phù hợp"
                        value={stats.failed}
<<<<<<< HEAD
                        layout="inlineValue"
=======
>>>>>>> main
                        iconTone={{
                            bg: 'bg-red-50',
                            text: 'text-red-600',
                            border: 'border-red-200',
                            hoverBg: 'bg-red-50/40',
                        }}
                        isLoading={isLoading}
                    />
                </motion.div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Filter & Search Bar — notification style */}
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50/50">
                        {/* Pill status filters */}
                        <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full sm:w-fit">
                            {STATUS_FILTERS.map((s) => {
                                const isActive = activeTab === s.id;
                                const count = stats.counts?.[s.id] ?? 0;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveTab(s.id)}
                                        className={cn(
                                            'flex-shrink-0 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                                            isActive
                                                ? 'bg-violet-600 text-white shadow-md'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        )}
                                    >
                                        {s.label}
                                        {applications && count > 0 && (
                                            <span className={cn(
                                                'text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search input */}
                        <div className="relative w-full sm:w-72 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên công việc hoặc công ty..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 bg-white shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="w-full h-32 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Không tìm thấy hồ sơ</h3>
                            <p className="text-slate-500 text-sm max-w-sm">
                                {searchQuery ? "Không có kết quả nào phù hợp với tìm kiếm của bạn." : "Bạn chưa có đơn ứng tuyển nào ở trạng thái này."}
                            </p>
                            {!searchQuery && activeTab === 'all' && (
                                <Button className="mt-6 bg-violet-600 hover:bg-violet-700 text-white shadow-sm" asChild>
                                    <Link to="/jobs">Tìm việc ngay</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {filteredApps.map((app: any, idx: number) => (
                                    <motion.div
                                        key={app.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                                        className="p-5 hover:bg-slate-50 transition-colors group cursor-pointer flex flex-col sm:flex-row gap-5"
                                        onClick={() => setSelectedApp(app.id)}
                                    >
                                        {/* Left: Logo & Status */}
                                        <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                                            <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center p-2 group-hover:border-violet-200 transition-colors">
                                                <img src={app.logo_url} alt={app.company} className="w-full h-full object-contain" />
                                            </div>
                                            <Badge className={`${statusColorMap[app.status]} font-medium border hidden sm:inline-flex`}>
                                                {app.statusLabel}
                                            </Badge>
                                        </div>

                                        {/* Middle: Job Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-violet-600 transition-colors">
                                                    {app.job_title}
                                                </h3>
                                                <Badge className={`${statusColorMap[app.status]} sm:hidden`}>
                                                    {app.statusLabel}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 text-slate-600 mb-3 text-sm">
                                                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                                                    <Building2 className="w-4 h-4 text-slate-400" />
                                                    {app.company}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    Đã gửi: {new Date(app.applied_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {app.ai_score && (
                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-emerald-500" /> AI Match: {app.ai_score}%
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-slate-500 border-slate-200 flex items-center gap-1 font-normal bg-white">
                                                    <FileText className="w-3 h-3" /> CV: {app.cv_name}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex-shrink-0 flex items-center gap-2 sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-lg" onClick={(e) => { e.stopPropagation(); setSelectedApp(app.id); }}>
                                                Chi tiết
                                            </Button>
                                            {['pending', 'reviewing'].includes(app.status) && (
                                                <Button
                                                    variant="ghost" size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => { e.stopPropagation(); handleWithdrawRequest(app.id); }}
                                                    disabled={withdrawMutation.isPending}
                                                >
                                                    Rút đơn
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Application Detail Sheet */}
            {selectedApp && (
                <ApplicationDetailSheet
                    applicationId={selectedApp}
                    open={!!selectedApp}
                    onOpenChange={(open) => !open && setSelectedApp(null)}
                    onWithdraw={() => handleWithdrawRequest(selectedApp)}
                    applicationPreview={selectedApplication}
                />
            )}

            <AlertDialog open={!!appToWithdraw} onOpenChange={(open) => !open && setAppToWithdraw(null)}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rút đơn ứng tuyển</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn rút đơn ứng tuyển này? Hành động này không thể hoàn tác và nhà tuyển dụng sẽ nhận được thông báo về việc bạn rút đơn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                            onClick={confirmWithdraw}
                            disabled={withdrawMutation.isPending}
                        >
                            {withdrawMutation.isPending ? "Đang xử lý..." : "Xác nhận rút đơn"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
