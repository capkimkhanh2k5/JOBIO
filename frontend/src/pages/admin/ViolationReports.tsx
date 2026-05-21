import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertTriangle, CheckCircle, Clock,
    Search, Loader2, Download, X, Building2, User,
    ChevronLeft, ChevronRight, Flag, ExternalLink
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useUrlSearchParam } from '@/hooks/useUrlSearchParam';
import { downloadBlob } from '@/lib/download';

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

const getEntityUrl = (entityType: string, entityId: number) => {
    if (!entityType || !entityId) return '#';
    const type = entityType.toLowerCase();
    switch (type) {
        case 'user':
        case 'candidate':
        case 'recruiter':
            return `/profile/${entityId}`;
        case 'company':
            return `/companies/${entityId}`;
        case 'job':
            return `/jobs/${entityId}`;
        case 'blog':
            return `/blog/${entityId}`;
        default:
            return '#';
    }
};

export default function ViolationReports() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useUrlSearchParam();
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
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
            page_size: 10,
            search: debouncedSearch || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }).then(r => r.data),
    });

    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [actionType, setActionType] = useState<'ban' | 'hide_content' | 'warn' | 'reject'>('warn');
    const [reporterNote, setReporterNote] = useState('');
    const [violatorNote, setViolatorNote] = useState('');

    const resolveMutation = useMutation({
        mutationFn: ({ id, action, reporter_note, violator_note }: { id: number, action: 'ban' | 'hide_content' | 'warn' | 'reject', reporter_note: string, violator_note: string }) =>
            dashboardService.resolveReport(id, { action, reporter_note, violator_note }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-report-stats'] });
            toast.success('Đã xử lý báo cáo thành công.');
            setSelectedReport(null);
            setReporterNote('');
            setViolatorNote('');
        },
        onError: () => toast.error('Có lỗi xảy ra khi xử lý báo cáo.')
    });

    const handleResolveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport) return;
        resolveMutation.mutate({
            id: selectedReport.id,
            action: actionType,
            reporter_note: reporterNote,
            violator_note: violatorNote
        });
    };

    const handleExportExcel = async () => {
        try {
            const toastId = toast.loading('Đang xuất dữ liệu Excel...');
            const response = await dashboardService.exportAdminReports({
                search: debouncedSearch,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });
            downloadBlob(response.data, `bao_cao_vi_pham_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.dismiss(toastId);
            toast.success('Xuất Excel thành công!');
        } catch (error) {
            toast.error('Không thể xuất Excel.');
        }
    };

    const reports = reportsData?.results ?? [];
    const totalCount = reportsData?.count ?? 0;
    const totalPages = reportsData?.total_pages ?? 1;

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
                    onClick={handleExportExcel}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm h-11 px-6"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Excel
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
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-slate-700">ID: #{report.entity_id}</span>
                                                {report.entity_id && (
                                                    <a 
                                                        href={getEntityUrl(report.entity_type, report.entity_id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-violet-600 hover:text-violet-700 flex items-center gap-1 text-[10px] font-bold bg-violet-50 px-2 py-0.5 rounded transition-colors"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        Xem
                                                    </a>
                                                )}
                                            </div>
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
                                        {(report.status === 'pending' || report.status === 'reviewing') ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="h-8 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold"
                                                >
                                                    Xử lý
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
            {/* Resolution Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    Xử lý báo cáo #{selectedReport.id}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Vi phạm: {selectedReport.report_type_name}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleResolveSubmit} className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hành động xử lý</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'ban', label: 'Khóa tài khoản vĩnh viễn', desc: 'Sử dụng cho vi phạm nghiêm trọng (Lừa đảo, Safety).', color: 'text-red-600' },
                                        { value: 'hide_content', label: 'Ẩn nội dung & Cảnh báo', desc: 'Sử dụng cho vi phạm tiêu chuẩn (Trùng lặp, Phản cảm).', color: 'text-orange-600' },
                                        { value: 'warn', label: 'Chỉ gửi email cảnh báo', desc: 'Nhắc nhở đối tượng vi phạm.', color: 'text-blue-600' },
                                        { value: 'reject', label: 'Bác bỏ báo cáo', desc: 'Báo cáo sai sự thật, không phát hiện vi phạm.', color: 'text-slate-600' },
                                    ].map((action) => (
                                        <label key={action.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${actionType === action.value ? 'border-violet-500 bg-violet-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="radio"
                                                    name="actionType"
                                                    value={action.value}
                                                    checked={actionType === action.value}
                                                    onChange={(e) => setActionType(e.target.value as any)}
                                                    className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${action.color}`}>{action.label}</p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{action.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Phản hồi cho Người báo cáo (Gửi Email)</label>
                                    <Textarea
                                        value={reporterNote}
                                        onChange={(e) => setReporterNote(e.target.value)}
                                        placeholder="Ví dụ: Cảm ơn bạn đã báo cáo. Chúng tôi đã tiến hành khóa tài khoản này để bảo vệ cộng đồng."
                                        className="resize-none h-20 text-sm font-medium border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${actionType === 'reject' ? 'text-slate-400' : 'text-slate-900'}`}>
                                        Cảnh báo Đối tượng vi phạm (Gửi Email & Thông báo)
                                    </label>
                                    <Textarea
                                        value={violatorNote}
                                        onChange={(e) => setViolatorNote(e.target.value)}
                                        placeholder={actionType === 'reject' ? "Báo cáo bị bác bỏ, không cần gửi cảnh báo." : "Ví dụ: Tài khoản của bạn có dấu hiệu lừa đảo. Căn cứ điều khoản 3.2, chúng tôi quyết định khóa vĩnh viễn."}
                                        className="resize-none h-20 text-sm font-medium border-slate-200 focus:border-violet-500 focus:ring-violet-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                        required={actionType !== 'reject'}
                                        disabled={actionType === 'reject'}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="outline" onClick={() => setSelectedReport(null)} className="font-bold">
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={resolveMutation.isPending} className="bg-violet-600 hover:bg-violet-700 font-bold">
                                    {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Xác nhận xử lý
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
