import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Ban, CheckCircle2,
    Download, Eye, ChevronLeft, ChevronRight, UserCog, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    status: string;
    email_verified: boolean;
    last_login: string | null;
    phone: string | null;
    avatar_url: string | null;
}

const roleColors: Record<string, string> = {
    candidate: 'bg-slate-50 text-slate-700 border-slate-200',
    company: 'bg-violet-50 text-violet-700 border-violet-200',
    admin: 'bg-orange-50 text-orange-700 border-orange-200',
};

const roleLabels: Record<string, string> = {
    candidate: 'Ứng viên',
    company: 'Nhà tuyển dụng',
    admin: 'Admin',
};

const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    banned: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    banned: 'Bị khóa',
};

export default function UserManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [page, setPage] = useState(1);

    const { data: usersData, isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-users', searchQuery, roleFilter, statusFilter, page],
        queryFn: () => dashboardService.listUsers({
            search: searchQuery || undefined,
            role: roleFilter === 'all' ? undefined : roleFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
            page,
            page_size: 10,
        }).then(r => r.data),
    });

    const { data: userStats } = useQuery({
        queryKey: ['admin-user-stats'],
        queryFn: () => dashboardService.getUserStats().then(r => r.data),
    });

    const users: User[] = usersData?.results ?? (Array.isArray(usersData) ? usersData : []);
    const totalCount = usersData?.count ?? users.length;
    const totalPages = Math.ceil(totalCount / 10) || 1;

    const toggleSelect = (id: number) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    const stats = [
        { label: 'Tổng Users', value: userStats?.total_users ?? totalCount, color: 'text-slate-900' },
        { label: 'Ứng viên', value: userStats?.by_role?.candidate ?? '-', color: 'text-cyan-600' },
        { label: 'Nhà tuyển dụng', value: userStats?.by_role?.company ?? '-', color: 'text-violet-600' },
        { label: 'Bị khóa', value: userStats?.by_status?.banned ?? '-', color: 'text-red-600' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-violet-600" />
                        Quản lý Users
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý tất cả tài khoản trong hệ thống</p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold shadow-sm text-white">
                    <Download className="w-4 h-4 mr-2" /> Xuất CSV
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div {...fadeUp(0.05)}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm px-4 py-3 flex items-center justify-between transition-transform hover:-translate-y-0.5 duration-200">
                            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.div {...fadeUp(0.1)}>
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all bg-white/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                        >
                            <option value="all">Tất cả Role</option>
                            <option value="candidate">Ứng viên</option>
                            <option value="company">Nhà tuyển dụng</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                        >
                            <option value="all">Tất cả Status</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="banned">Bị khóa</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-violet-50/80 backdrop-blur border border-violet-200 rounded-xl p-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-violet-800">Đã chọn {selectedUsers.length} user(s)</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold border-violet-200 text-violet-700 hover:bg-violet-100">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kích hoạt
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold border-red-200 text-red-700 hover:bg-red-50">
                                <Ban className="w-3.5 h-3.5 mr-1" /> Khóa
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Users Table */}
            <motion.div {...fadeUp(0.15)}>
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Tên</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Role</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Trạng thái</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Email verified</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Đăng ký</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Đăng nhập cuối</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-500 w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers ? (
                                    <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500 mx-auto" /></td></tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                                    {user.full_name?.split(' ').pop()?.charAt(0) ?? '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{user.full_name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${roleColors[user.role] ?? ''} border text-[10px] font-bold`}>
                                                {roleLabels[user.role] ?? user.role}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${statusColors[user.status] ?? ''} border text-[10px] font-bold`}>
                                                {statusLabels[user.status] ?? user.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.email_verified ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <span className="text-xs text-slate-400">Chưa</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">-</td>
                                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">{user.last_login ? new Date(user.last_login).toLocaleDateString('vi-VN') : '-'}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100/50 text-slate-400 hover:text-violet-600 transition-colors cursor-pointer" title="Xem">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer" title="Khóa">
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">
                            Hiển thị {users.length} / {totalCount} users
                        </p>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="px-2 text-xs font-bold text-slate-700">{page} / {totalPages}</span>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
