import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Search, Filter, MoreHorizontal, Ban, CheckCircle2,
    Trash2, Download, Mail, Eye, ChevronLeft, ChevronRight, UserCog
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

/* ── Mock Data ── */
const MOCK_USERS = [
    { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@email.com', role: 'recruiter', status: 'active', verified: true, registered: '01/01/2026', lastLogin: '10/03/2026', avatar: null },
    { id: 2, name: 'Trần Thị Bình', email: 'binh.tran@company.vn', role: 'company', status: 'active', verified: true, registered: '15/01/2026', lastLogin: '09/03/2026', avatar: null },
    { id: 3, name: 'Lê Minh Cường', email: 'cuong.le@gmail.com', role: 'recruiter', status: 'inactive', verified: false, registered: '20/02/2026', lastLogin: '28/02/2026', avatar: null },
    { id: 4, name: 'Phạm Đức Dũng', email: 'dung.pham@techvn.com', role: 'company', status: 'active', verified: true, registered: '10/02/2026', lastLogin: '10/03/2026', avatar: null },
    { id: 5, name: 'Hoàng Thị Em', email: 'em.hoang@yahoo.com', role: 'recruiter', status: 'banned', verified: true, registered: '05/12/2025', lastLogin: '25/02/2026', avatar: null },
    { id: 6, name: 'Vũ Quang Phúc', email: 'phuc.vu@startup.io', role: 'company', status: 'active', verified: false, registered: '28/02/2026', lastLogin: '08/03/2026', avatar: null },
    { id: 7, name: 'Đặng Thị Giang', email: 'giang.dang@edu.vn', role: 'admin', status: 'active', verified: true, registered: '01/06/2025', lastLogin: '10/03/2026', avatar: null },
    { id: 8, name: 'Bùi Hải Nam', email: 'nam.bui@gmail.com', role: 'recruiter', status: 'active', verified: true, registered: '12/01/2026', lastLogin: '07/03/2026', avatar: null },
];

const roleColors: Record<string, string> = {
    recruiter: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    company: 'bg-violet-50 text-violet-700 border-violet-200',
    admin: 'bg-amber-50 text-amber-700 border-amber-200',
};

const roleLabels: Record<string, string> = {
    recruiter: 'Ứng viên',
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

    const filteredUsers = MOCK_USERS.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        const matchStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    const toggleSelect = (id: number) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    const stats = [
        { label: 'Tổng Users', value: MOCK_USERS.length, color: 'text-slate-900' },
        { label: 'Ứng viên', value: MOCK_USERS.filter(u => u.role === 'recruiter').length, color: 'text-cyan-600' },
        { label: 'Nhà tuyển dụng', value: MOCK_USERS.filter(u => u.role === 'company').length, color: 'text-violet-600' },
        { label: 'Bị khóa', value: MOCK_USERS.filter(u => u.status === 'banned').length, color: 'text-red-600' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-blue-600" />
                        Quản lý Users
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý tất cả tài khoản trong hệ thống</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Xuất CSV
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div {...fadeUp(0.05)}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.div {...fadeUp(0.1)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="all">Tất cả Role</option>
                            <option value="recruiter">Ứng viên</option>
                            <option value="company">Nhà tuyển dụng</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-800">Đã chọn {selectedUsers.length} user(s)</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-100">
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                                                    {user.name.split(' ').pop()?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${roleColors[user.role]} border text-[10px] font-bold`}>
                                                {roleLabels[user.role]}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${statusColors[user.status]} border text-[10px] font-bold`}>
                                                {statusLabels[user.status]}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.verified ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <span className="text-xs text-slate-400">Chưa</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">{user.registered}</td>
                                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">{user.lastLogin}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer" title="Xem">
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
                            Hiển thị {filteredUsers.length} / {MOCK_USERS.length} users
                        </p>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg" disabled>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="w-8 h-8 p-0 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold">
                                1
                            </Button>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg text-slate-500 text-xs font-semibold">
                                2
                            </Button>
                            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
