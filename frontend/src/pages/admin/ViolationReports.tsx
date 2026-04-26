import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertTriangle, CheckCircle, Clock,
    Search, Loader2, Download, X, Building2, User,
    ChevronLeft, ChevronRight, Flag
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
});

const statusColors: Record<string, string> = {
    pending: 'bg-orange-50 text-orange-600 border-orange-200',
    reviewing: 'bg-blue-50 text-blue-600 border-blue-200',
    resolved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rejected: 'bg-slate-50 text-slate-600 border-slate-200',
};

const statusLabels: Record<string, string> = {
    pending: 'Chờ xử lý',
    reviewing: 'Đang xem xét',
    resolved: 'Đã xử lý',
    rejected: 'Từ chối',
};

const entityTypeMeta = (entityType: string) => {
    if (entityType === 'company') {
        return { label: 'CÔNG TY', icon: Building2 };
    }
    if (entityType === 'user' || entityType === 'candidate' || entityType === 'recruiter') {
        return { label: 'NGƯỜI DÙNG', icon: User };
    }
    return { label: entityType?.toUpperCase?.() || 'ĐỐI TƯỢNG', icon: Flag };
};

export default function ViolationReports() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const { data: statsData } = useQuery({
        queryKey: ['admin-report-stats'],
        queryFn: () => dashboardService.getReportStats().then(r => r.data),
    });

    const { data: reportsData, isLoading: loadingReports } = useQuery({
        queryKey: ['admin-reports', page, debouncedSearch, statusFilter],
        queryFn: () => dashboardService.listAdminReports({
            page,
            search: debouncedSearch || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }).then(r => r.data),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) =>
            dashboardService.updateReportStatus(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-report-stats'] });
            toast.success('Đã cập nhật trạng thái báo cáo.');
        },
        onError: () => toast.error('Có lỗi xảy ra khi cập nhật trạng thái.')
    });

    const handleExportCSV = async () => {
        try {
            const toastId = toast.loading('Đang xuất dữ liệu CSV...');
            const response = await dashboardService.exportAdminReports({
                search: debouncedSearch,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `bao_cao_vi_pham_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss(toastId);
            toast.success('Xuất CSV thành công!');
        } catch (error) {
            toast.error('Không thể xuất CSV.');
        }
    };

    const reports = reportsData?.results ?? [];
    const totalCount = reportsData?.count ?? 0;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    const statCards = [
        { label: 'Tổng báo cáo', value: statsData?.total_reports || 0, icon: Flag, color: 'text-slate-600', bg: 'bg-slate-50' },
        { label: 'Chờ xử lý', value: statsData?.pending_reports || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Đã giải quyết', value: statsData?.resolved_reports || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Đã từ chối', value: statsData?.rejected_reports || 0, icon: X, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        Báo cáo Vi phạm
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Xử lý các khiếu nại và báo cáo từ cộng đồng người dùng.</p>
                </div>
                <Button
                    onClick={handleExportCSV}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm h-11 px-6"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Xuất CSV
                </Button>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} {...fadeUp(0.1 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner mb-4`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString('vi-VN')}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <motion.div {...fadeUp(0.15)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mô tả, người báo cáo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 bg-slate-50/50 text-sm font-medium transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 cursor-pointer w-full md:w-48"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="reviewing">Đang xem xét</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="rejected">Bị từ chối</option>
                </select>
            </motion.div>

            {/* Table */}
            <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Người báo cáo</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Đối tượng bị báo cáo</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Nội dung vi phạm</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thời gian</th>
                                <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loadingReports ? (
                                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" /></td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-medium">Không tìm thấy báo cáo nào</td></tr>
                            ) : reports.map((report: any) => {
                                const meta = entityTypeMeta(report.entity_type);
                                const EntityIcon = meta.icon;
                                return (
                                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{report.reporter_email}</span>
                                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">{report.reporter_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-black px-1.5 py-0 w-fit">
                                                <EntityIcon className="w-3 h-3 mr-1" />
                                                {meta.label}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-700">ID: #{report.entity_id}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="max-w-[300px]">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Badge className="bg-red-50 text-red-700 border-red-100 text-[9px] font-black px-1.5 py-0">
                                                    {report.report_type_name || 'KHÁC'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-2 italic">"{report.description}"</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <Badge className={`${statusColors[report.status] || ''} text-[10px] font-black border rounded-md px-2 py-0.5`}>
                                            {statusLabels[report.status] || report.status}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-xs font-bold text-slate-700">{new Date(report.created_at).toLocaleString('vi-VN')}</span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {report.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'resolved' })}
                                                    disabled={updateStatusMutation.isPending}
                                                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                                                >
                                                    Duyệt
                                                </Button>
                                                <Button
                                                    onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'rejected' })}
                                                    disabled={updateStatusMutation.isPending}
                                                    variant="outline"
                                                    className="h-8 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold"
                                                >
                                                    Bỏ qua
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Đã xử lý</span>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">
                            Hiển thị <span className="font-bold text-slate-900">{reports.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> báo cáo
                        </p>
                        <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center px-3 h-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <span className="text-xs font-black text-violet-600">{page}</span>
                                <span className="mx-1.5 text-slate-300 text-[10px]">/</span>
                                <span className="text-xs font-bold text-slate-500">{totalPages}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-white hover:shadow-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
