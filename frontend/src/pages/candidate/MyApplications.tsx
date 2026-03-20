import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, CalendarClock, Building2, MapPin, Search, Filter, Clock, MoreVertical,
    FileText, CheckCircle2, XCircle, ArrowRight, ExternalLink, Activity, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { applicationService } from '@/services/applicationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const STATUS_FILTERS = [
    { id: 'Tất cả', label: 'Tất cả', count: 0 },
    { id: 'Mới gửi', label: 'Mới gửi', count: 0 },
    { id: 'Đang xét', label: 'Đang xét', count: 0 },
    { id: 'Shortlisted', label: 'Shortlisted', count: 0 },
    { id: 'Phỏng vấn', label: 'Phỏng vấn', count: 0 },
    { id: 'Đề nghị', label: 'Đề nghị', count: 0 },
    { id: 'Đã tuyển', label: 'Đã tuyển', count: 0 },
    { id: 'Từ chối', label: 'Từ chối', count: 0 },
    { id: 'Rút đơn', label: 'Rút đơn', count: 0 },
];

const statusColorMap: Record<string, string> = {
    'Mới gửi': 'bg-slate-100 text-slate-700 border-slate-200',
    'Đang xét': 'bg-blue-100 text-blue-700 border-blue-200',
    'Shortlisted': 'bg-purple-100 text-purple-700 border-purple-200',
    'Phỏng vấn': 'bg-amber-100 text-amber-700 border-amber-200',
    'Đề nghị': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Đã tuyển': 'bg-green-100 text-green-700 border-green-200',
    'Từ chối': 'bg-red-100 text-red-700 border-red-200',
    'Rút đơn': 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function MyApplications() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('Tất cả');
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

        const searchableApps = applications.filter((app: any) =>
            app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.company.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const counts = applications.reduce((acc: any, app: any) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            acc['Tất cả'] = (acc['Tất cả'] || 0) + 1;
            return acc;
        }, { 'Tất cả': 0 });

        const filtered = activeTab === 'Tất cả'
            ? searchableApps
            : searchableApps.filter((app: any) => app.status === activeTab);

        // Calculate breakdown for pie chart/progress bar equivalent
        const activeCount = counts['Mới gửi'] || 0 + counts['Đang xét'] || 0 + counts['Shortlisted'] || 0 + counts['Phỏng vấn'] || 0;
        const successCount = counts['Đề nghị'] || 0 + counts['Đã tuyển'] || 0;
        const failedCount = counts['Từ chối'] || 0 + counts['Rút đơn'] || 0;

        return {
            filteredApps: filtered,
            stats: {
                total: counts['Tất cả'],
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

    const confirmWithdraw = () => {
        if (appToWithdraw) {
            withdrawMutation.mutate(appToWithdraw);
        }
    };

    return (
        <div className="pb-12 w-full flex-1">
            <PageHeader
                title="Việc làm đã ứng tuyển"
                description="Theo dõi và quản lý quá trình ứng tuyển của bạn."
                icon={Briefcase}
            />

            <div className="p-6 lg:p-8 space-y-8 w-full flex-1 relative z-10">

                {/* Initial Loading Skeleton for Stats */}
                {isLoading && !applications && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                    </div>
                )}

                {/* Stats Summary */}
                {!isLoading && applications && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    >
                        <Card className="p-5 flex flex-col justify-center border border-white/40 shadow-sm bg-white/60 backdrop-blur-xl rounded-2xl">
                            <div className="flex items-center gap-3 text-slate-500 mb-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm"><Briefcase className="w-5 h-5" /></div>
                                <span className="font-medium text-sm">Tổng số đơn</span>
                            </div>
                            <span className="text-3xl font-black">{stats.total}</span>
                        </Card>
                        <Card className="p-5 flex flex-col justify-center border border-white/40 shadow-sm bg-white/60 backdrop-blur-xl rounded-2xl">
                            <div className="flex items-center gap-3 text-blue-600 mb-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-sm"><Activity className="w-5 h-5" /></div>
                                <span className="font-medium text-sm">Đang diễn ra</span>
                            </div>
                            <span className="text-3xl font-black text-blue-700">{stats.active}</span>
                        </Card>
                        <Card className="p-5 flex flex-col justify-center border border-white/40 shadow-sm bg-white/60 backdrop-blur-xl rounded-2xl">
                            <div className="flex items-center gap-3 text-emerald-600 mb-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
                                <span className="font-medium text-sm">Thành công</span>
                            </div>
                            <span className="text-3xl font-black text-emerald-700">{stats.success}</span>
                        </Card>
                        <Card className="p-5 flex flex-col justify-center border border-white/40 shadow-sm bg-white/60 backdrop-blur-xl rounded-2xl">
                            <div className="flex items-center gap-3 text-red-600 mb-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-red-400 to-red-500 text-white shadow-sm"><XCircle className="w-5 h-5" /></div>
                                <span className="font-medium text-sm">Chưa phù hợp</span>
                            </div>
                            <span className="text-3xl font-black text-red-700">{stats.failed}</span>
                        </Card>
                    </motion.div>
                )}

                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden mb-8">
                    {/* Filters Header */}
                    <div className="p-4 border-b border-white/20 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/40">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm theo tên công việc hoặc công ty..."
                                className="pl-9 bg-white border-slate-200 focus-visible:ring-cyan-500 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-4 pt-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
                            <TabsList className="bg-transparent h-12 w-max inline-flex p-0 gap-6">
                                {STATUS_FILTERS.map((s) => (
                                    <TabsTrigger
                                        key={s.id}
                                        value={s.id}
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:text-violet-700 px-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 shadow-none data-[state=active]:shadow-none transition-colors"
                                    >
                                        {s.label}
                                        {applications && (
                                            <span className="ml-2 py-0.5 px-2 bg-slate-100 text-slate-600 rounded-full text-xs">
                                                {stats.counts?.[s.id] || 0}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value={activeTab} className="p-0 m-0 outline-none">
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
                                    {!searchQuery && activeTab === 'Tất cả' && (
                                        <Button className="mt-6 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20" asChild>
                                            <Link to="/jobs">Tìm việc ngay</Link>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-white/30">
                                    <AnimatePresence mode="popLayout">
                                        {filteredApps.map((app: any, idx: number) => (
                                            <motion.div
                                                key={app.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                className="p-5 hover:bg-white/50 transition-colors group cursor-pointer flex flex-col sm:flex-row gap-5"
                                                onClick={() => setSelectedApp(app.id)}
                                            >
                                                {/* Left: Logo & Status */}
                                                <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                                                    <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center p-2 group-hover:border-cyan-200 transition-colors">
                                                        <img src={app.logo_url} alt={app.company} className="w-full h-full object-contain" />
                                                    </div>
                                                    <Badge className={`${statusColorMap[app.status]} font-medium border hidden sm:inline-flex`}>
                                                        {app.status}
                                                    </Badge>
                                                </div>

                                                {/* Middle: Job Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-violet-600 transition-colors">
                                                            {app.job_title}
                                                        </h3>
                                                        <Badge className={`${statusColorMap[app.status]} sm:hidden`}>
                                                            {app.status}
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
                                                                <StarIcon className="w-3 h-3 text-emerald-500" /> AI Match: {app.ai_score}%
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
                                                    {['Mới gửi', 'Đang xét'].includes(app.status) && (
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
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Application Detail Sheet */}
            {selectedApp && (
                <ApplicationDetailSheet
                    applicationId={selectedApp}
                    open={!!selectedApp}
                    onOpenChange={(open) => !open && setSelectedApp(null)}
                    onWithdraw={() => handleWithdrawRequest(selectedApp)}
                />
            )}

            <AlertDialog open={!!appToWithdraw} onOpenChange={(open) => !open && setAppToWithdraw(null)}>
                <AlertDialogContent className="rounded-2xl">
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

function StarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    )
}
