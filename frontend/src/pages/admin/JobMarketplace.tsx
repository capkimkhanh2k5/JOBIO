import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Briefcase, Eye, FileText, CheckCircle2,
    Search, Loader2, Download,
    Building2, Mail, MapPin,
    ChevronLeft, ChevronRight, XCircle, AlertCircle
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
});

const statusColors: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    closed: 'bg-red-50 text-red-600 border-red-200',
    expired: 'bg-orange-50 text-orange-600 border-orange-200',
};

const StatusIcon = ({ status, className }: { status: string, className?: string }) => {
    switch (status) {
        case 'published': return <CheckCircle2 className={className} />;
        case 'draft': return <FileText className={className} />;
        case 'closed': return <XCircle className={className} />;
        case 'expired': return <AlertCircle className={className} />;
        default: return <Briefcase className={className} />;
    }
};

export default function JobMarketplace() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Handle status change
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    // Fetch Stats
    const { data: statsData } = useQuery({
        queryKey: ['admin-job-stats'],
        queryFn: () => dashboardService.getJobStats().then(r => r.data),
    });

    // Fetch Jobs
    const { data: jobsData, isLoading: loadingJobs } = useQuery({
        queryKey: ['admin-jobs', page, debouncedSearch, statusFilter],
        queryFn: () => dashboardService.listAdminJobs({
            page,
            search: debouncedSearch,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }).then(r => r.data),
    });

    const jobs = jobsData?.results ?? [];
    const totalCount = jobsData?.count ?? 0;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    // Handle Export CSV
    const handleExportCSV = async () => {
        try {
            const toastId = toast.loading('Đang xuất dữ liệu CSV...');
            const response = await dashboardService.exportAdminJobs({
                search: debouncedSearch,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `Viec_Lam_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Đã xuất báo cáo CSV thành công!', { id: toastId });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Có lỗi xảy ra khi xuất báo cáo.');
        }
    };

    const statCards = [
        { label: 'Tổng số việc làm', value: statsData?.total_jobs || 0, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Đang hiển thị', value: statsData?.active_jobs || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Tổng lượt xem', value: statsData?.total_views || 0, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Lượt ứng tuyển', value: statsData?.total_applications || 0, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-violet-600" />
                        Thị trường Việc làm
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Giám sát và kiểm duyệt toàn bộ tin tuyển dụng trên hệ thống.</p>
                </div>
                <Button 
                    variant="outline"
                    onClick={handleExportCSV}
                    className="h-10 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all hover:border-violet-200"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Xuất CSV
                </Button>
            </motion.div>

            {/* Job Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} {...fadeUp(0.1 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value.toLocaleString('vi-VN')}</h3>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <motion.div {...fadeUp(0.15)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề, tên công ty, email, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 bg-slate-50/50 text-sm font-medium transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select 
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="published">Đang hiển thị</option>
                            <option value="draft">Bản nháp</option>
                            <option value="closed">Đã đóng</option>
                            <option value="expired">Hết hạn</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Jobs Table */}
            <motion.div {...fadeUp(0.2)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Tin tuyển dụng</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Công ty</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thống kê</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingJobs ? (
                                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                                ) : jobs.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">Không tìm thấy việc làm nào</td></tr>
                                ) : jobs.map((job: any) => {
                                    return (
                                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm max-w-[250px] truncate" title={job.title}>
                                                        {job.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-500 font-medium">ID: {job.id}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="text-xs text-slate-500 capitalize">{job.job_type?.replace('-', ' ')}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="text-xs text-slate-500 capitalize">{job.level}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                        {job.logo_url ? (
                                                            <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Building2 className="w-4 h-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{job.company_name}</span>
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <Mail className="w-3 h-3" /> {job.user_email || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                                                        <span className="font-bold">{job.views_count?.toLocaleString('vi-VN')}</span> <span className="text-[10px] text-slate-400">lượt xem</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <FileText className="w-3.5 h-3.5 text-orange-500" />
                                                        <span className="font-bold">{job.applications_count?.toLocaleString('vi-VN')}</span> <span className="text-[10px] text-slate-400">ứng tuyển</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant="outline" className={`${statusColors[job.status] ?? statusColors.draft} flex w-fit items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md`}>
                                                    <StatusIcon status={job.status} className="w-3.5 h-3.5" />
                                                    {job.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 text-xs font-bold">{new Date(job.created_at).toLocaleDateString('vi-VN')}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(job.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">
                            Hiển thị <span className="font-bold text-slate-900">{jobs.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> việc làm
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
