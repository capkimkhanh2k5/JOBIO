import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Wallet, TrendingUp, DollarSign, CreditCard,
    Search, Loader2, Download,
    Mail,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, CalendarClock
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Helper for formatting currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
});

const statusColors: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-200',
    failed: 'bg-red-50 text-red-600 border-red-200',
    refunded: 'bg-slate-50 text-slate-600 border-slate-200',
};

const statusLabels: Record<string, string> = {
    completed: 'Thành công',
    pending: 'Đang xử lý',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
};

const statusIcons: Record<string, any> = {
    completed: CheckCircle2,
    pending: Loader2,
    failed: XCircle,
    refunded: AlertCircle,
};

export default function FinancialManagement() {
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    // Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['admin-finance-stats'],
        queryFn: () => dashboardService.getFinancialStats().then(r => r.data),
    });

    // Fetch Transactions
    const { data: transactionsData, isLoading: loadingTxns } = useQuery({
        queryKey: ['admin-transactions', page, debouncedSearch, statusFilter],
        queryFn: () => dashboardService.listAdminTransactions({
            page,
            search: debouncedSearch || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }).then(r => r.data),
    });

    const transactions = transactionsData?.results ?? [];
    const totalCount = transactionsData?.count ?? 0;
    const totalPages = transactionsData?.total_pages ?? 1;

    const { data: subscriptionsData, isLoading: loadingSubscriptions } = useQuery({
        queryKey: ['admin-subscriptions', debouncedSearch, page],
        queryFn: () => dashboardService.listAdminSubscriptions({
            search: debouncedSearch || undefined,
            page,
            page_size: 10,
        }).then(r => r.data),
    });

    const subscriptions = subscriptionsData?.results ?? [];

    // Handle Export CSV
    const handleExportCSV = async () => {
        try {
            const toastId = toast.loading('Đang xuất dữ liệu CSV...');
            const response = await dashboardService.exportTransactions({
                search: debouncedSearch,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });

            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `Giao_Dich_${new Date().toISOString().split('T')[0]}.csv`);
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
        { label: 'Tổng doanh thu', value: formatCurrency(stats?.total_revenue || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Doanh thu tháng này', value: formatCurrency(stats?.monthly_revenue || 0), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Giao dịch tháng này', value: stats?.monthly_transactions || 0, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Gói dịch vụ hoạt động', value: stats?.active_subscriptions || 0, icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-violet-600" />
                        Quản lý Tài chính
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Theo dõi doanh thu, giao dịch và các gói dịch vụ toàn hệ thống.</p>
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

            {/* Financial Stats */}
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
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search & Filters */}
            <motion.div {...fadeUp(0.15)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã giao dịch, email hoặc tên công ty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all bg-slate-50/50"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer min-w-[160px]"
                        >
                            <option value="all">Tất cả Trạng thái</option>
                            <option value="completed">Thành công</option>
                            <option value="pending">Đang xử lý</option>
                            <option value="failed">Thất bại</option>
                            <option value="refunded">Đã hoàn tiền</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Transactions Table */}
            <motion.div {...fadeUp(0.2)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Mã giao dịch</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Khách hàng</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Số tiền</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Phương thức</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingTxns ? (
                                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium">Không tìm thấy giao dịch nào</td></tr>
                                ) : transactions.map((txn: any) => {
                                    const StatusIcon = statusIcons[txn.status] || CreditCard;
                                    return (
                                        <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{txn.reference_code || `TX-${txn.id}`}</span>
                                                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{txn.clean_description || txn.type}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{txn.company_name}</span>
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <Mail className="w-3 h-3" /> {txn.user_email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-black text-slate-900">{formatCurrency(txn.amount)}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700 text-xs">{txn.payment_method?.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Badge variant="outline" className={`${statusColors[txn.status] ?? statusColors.pending} flex w-fit items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md`}>
                                                    <StatusIcon className={`w-3.5 h-3.5 ${txn.status === 'pending' ? 'animate-spin' : ''}`} />
                                                    {statusLabels[txn.status] ?? txn.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 text-xs font-bold">{new Date(txn.created_at).toLocaleDateString('vi-VN')}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(txn.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
                            Hiển thị <span className="font-bold text-slate-900">{transactions.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> giao dịch
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

            {/* Active Subscriptions Table */}
            <motion.div {...fadeUp(0.25)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-violet-600" />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Theo dõi hạn gói dịch vụ</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Công ty</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Email</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Gói</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày bắt đầu</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày hết hạn</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Còn lại</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingSubscriptions ? (
                                    <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                                ) : subscriptions.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium">Không có gói dịch vụ đang hoạt động</td></tr>
                                ) : subscriptions.map((sub: any) => (
                                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900">{sub.company_name ?? '-'}</td>
                                        <td className="py-4 px-6 text-xs font-medium text-slate-600">{sub.company_email ?? '-'}</td>
                                        <td className="py-4 px-6">
                                            <Badge variant="outline" className="border-violet-200 text-violet-700 bg-violet-50 text-[10px] font-bold">
                                                {sub.plan_name ?? 'N/A'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-700">
                                            {sub.start_date ? new Date(sub.start_date).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-700">
                                            {sub.end_date ? new Date(sub.end_date).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge
                                                variant="outline"
                                                className={`${
                                                    sub.days_left < 0 
                                                        ? 'border-red-200 text-red-700 bg-red-50' 
                                                        : sub.days_left <= 7 
                                                            ? 'border-amber-200 text-amber-700 bg-amber-50' 
                                                            : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                                } text-[10px] font-black`}
                                            >
                                                {typeof sub.days_left === 'number' 
                                                    ? sub.days_left < 0 
                                                        ? 'Hết hạn' 
                                                        : `${sub.days_left} ngày` 
                                                    : '-'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
