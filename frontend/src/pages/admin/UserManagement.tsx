import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Ban,
    Download, Eye, ChevronLeft, ChevronRight, UserCog, Loader2,
    Users, ShieldAlert, UserCheck, Mail, Phone,
    History, Zap, ShieldCheck, Building2, Edit3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardService } from '@/services/dashboardService';
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useUrlSearchParam } from '@/hooks/useUrlSearchParam';
import { downloadBlob } from '@/lib/download';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const PAGE_SIZE = 10;

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
    created_at?: string;
    application_count?: number;
    cv_count?: number;
    job_count?: number;
    trust_score?: number;
    subscription_plan?: string;
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
    banned: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
    active: 'Hoạt động',
    banned: 'Bị khóa',
};

export default function UserManagement() {
    const [searchQuery, setSearchQuery] = useUrlSearchParam();
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<{
        full_name: string;
        phone: string;
        role: string;
        email_verified: boolean;
    }>({ full_name: '', phone: '', role: 'candidate', email_verified: false });
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        userId: number;
        status: string;
    }>({ open: false, userId: 0, status: '' });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [roleFilter, statusFilter]);

    const { data: usersData, isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-users', debouncedSearch, roleFilter, statusFilter, page],
        queryFn: () => dashboardService.listUsers({
            search: debouncedSearch || undefined,
            role: roleFilter === 'all' ? undefined : roleFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
            page,
            page_size: PAGE_SIZE,
        }).then(r => r.data),
    });

    const { data: userStats } = useQuery({
        queryKey: ['admin-user-stats'],
        queryFn: () => dashboardService.getUserStats().then(r => r.data),
    });

    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: number, status: string }) =>
            dashboardService.updateUserStatus(userId, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
            toast.success('Cập nhật trạng thái thành công');
            if (viewUser) {
                // Update local viewUser state if drawer is open
                setViewUser(prev => prev ? { ...prev, status: variables.status ?? prev.status } : null);
            }
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async (payload: {
            userId: number;
            full_name: string;
            phone: string;
            role: string;
            email_verified: boolean;
            currentRole: string;
            currentEmailVerified: boolean;
        }) => {
            const {
                userId,
                full_name,
                phone,
                role,
                email_verified,
                currentRole,
                currentEmailVerified,
            } = payload;

            await dashboardService.updateUser(userId, {
                full_name: full_name.trim(),
                phone: phone.trim() || null,
            });

            if (role !== currentRole) {
                await dashboardService.updateUserRole(userId, role);
            }

            if (email_verified !== currentEmailVerified) {
                await dashboardService.updateUserEmailVerified(userId, email_verified);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
            toast.success('Đã cập nhật thông tin người dùng');
            setEditUser(null);
        },
        onError: () => {
            toast.error('Không thể cập nhật thông tin người dùng');
        }
    });

    const verifyEmailMutation = useMutation({
        mutationFn: (userId: number) => dashboardService.updateUserEmailVerified(userId, true),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
            toast.success('Đã xác thực email thủ công');
            if (viewUser) {
                setViewUser(prev => prev ? { ...prev, email_verified: true } : null);
            }
        },
        onError: () => {
            toast.error('Không thể xác thực email');
        }
    });

    const handleUpdateStatus = (userId: number, status: string) => {
        setConfirmDialog({
            open: true,
            userId,
            status,
        });
    };

    const handleOpenEdit = (user: User) => {
        setEditUser(user);
        setEditForm({
            full_name: user.full_name ?? '',
            phone: user.phone ?? '',
            role: user.role ?? 'candidate',
            email_verified: !!user.email_verified,
        });
    };

    const handleExport = async () => {
        try {
            const response = await dashboardService.exportUsers({
                search: debouncedSearch || undefined,
                role: roleFilter === 'all' ? undefined : roleFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
            });
            downloadBlob(response.data, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Xuất Excel thành công');
        } catch (error) {
            toast.error('Không thể xuất dữ liệu');
        }
    };

    const handleSendEmail = (email: string) => {
        const subject = encodeURIComponent("[JOBIO] Thông báo từ Quản trị viên hệ thống");
        const body = encodeURIComponent("Chào bạn,\n\nChúng tôi liên hệ từ ban quản trị JOBIO...\n\nTrân trọng.");
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
    };

    const users = usersData?.results ?? [];
    const totalCount = usersData?.count ?? 0;
    const totalPages = Math.max(1, usersData?.total_pages ?? Math.ceil(totalCount / PAGE_SIZE));


    const stats = [
        { label: 'Tổng Users', value: userStats?.total_users ?? totalCount, color: 'text-slate-900', icon: Users, bg: 'bg-slate-50', iconColor: 'text-slate-600' },
        { label: 'Ứng viên', value: userStats?.by_role?.candidate ?? '-', color: 'text-cyan-600', icon: UserCog, bg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
        { label: 'Nhà tuyển dụng', value: userStats?.by_role?.company ?? '-', color: 'text-violet-600', icon: Building2, bg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { label: 'Bị khóa', value: userStats?.by_status?.banned ?? '-', color: 'text-red-600', icon: Ban, bg: 'bg-red-50', iconColor: 'text-red-600' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <UserCog className="w-6 h-6 text-violet-600" />
                        Quản lý Khách hàng
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và giám sát tất cả tài khoản trong hệ thống</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-10 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all hover:border-violet-200"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4 mr-2" /> Xuất Excel
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} {...fadeUp(0.05 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
                            <div className="relative">
                                <div className="mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.iconColor} shadow-inner`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                <h3 className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* User Detail Drawer */}
            <Sheet open={!!viewUser} onOpenChange={() => setViewUser(null)}>
                <SheetContent className="sm:max-w-md border-l border-slate-200 p-0 overflow-y-auto">
                    <div className="h-32 bg-gradient-to-br from-violet-600 to-indigo-700 relative">
                        <div className="absolute -bottom-10 left-6">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                                <AvatarImage src={viewUser?.avatar_url ?? undefined} />
                                <AvatarFallback className="bg-slate-100 text-slate-900 text-xl font-black">
                                    {viewUser?.full_name?.split(' ').pop()?.charAt(0) ?? '?'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>

                    <div className="pt-14 px-6 pb-8 space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900">{viewUser?.full_name}</h2>
                                <Badge className={`${statusColors[viewUser?.status ?? 'active']} border-0`}>
                                    {statusLabels[viewUser?.status ?? 'active']}
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-violet-600 uppercase tracking-tight">
                                {roleLabels[viewUser?.role ?? 'candidate']}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Email</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewUser?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Số điện thoại</p>
                                    <p className="text-xs font-bold text-slate-700">{viewUser?.phone ?? 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                    <History className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Ngày tham gia</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {viewUser?.created_at ? new Date(viewUser.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* Verification & Trust */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Xác thực & Tin cậy
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</p>
                                    {viewUser?.email_verified ? (
                                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px]">ĐÃ XÁC THỰC</Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50 text-[10px]">CHƯA XÁC THỰC</Badge>
                                    )}
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Độ tin cậy</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${viewUser?.trust_score ?? 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600">{viewUser?.trust_score ?? 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role Specific Stats */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-violet-600" />
                                Hoạt động gần đây
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {viewUser?.role === 'candidate' ? (
                                    <>
                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Đơn ứng tuyển</p>
                                            <p className="text-lg font-black text-slate-900">{viewUser?.application_count ?? 0}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">CV đã tải lên</p>
                                            <p className="text-lg font-black text-slate-900">{viewUser?.cv_count ?? 0}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tin đã đăng</p>
                                            <p className="text-xl font-black text-slate-900">{viewUser?.job_count ?? 0}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Gói dịch vụ</p>
                                            <Badge variant="outline" className="mt-1 border-violet-200 text-violet-700 font-bold">{viewUser?.subscription_plan ?? 'FREE'}</Badge>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                Lịch sử hệ thống
                            </h3>
                            <div className="space-y-3 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Ngày tham gia</span>
                                    <span className="font-bold text-slate-700">
                                        {viewUser?.created_at ? new Date(viewUser.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Lần cuối hoạt động</span>
                                    <span className="font-bold text-slate-700">
                                        {viewUser?.last_login ? new Date(viewUser.last_login).toLocaleString('vi-VN') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {viewUser && (
                            <div className="pt-4 flex flex-col gap-2 pb-10">
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                        onClick={() => handleUpdateStatus(viewUser.id, 'active')}
                                        disabled={viewUser.status === 'active' || updateStatusMutation.isPending}
                                    >
                                        <ShieldCheck className="w-4 h-4 mr-2" /> Kích hoạt
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-6 shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                        onClick={() => handleUpdateStatus(viewUser.id, 'banned')}
                                        disabled={viewUser.status === 'banned' || updateStatusMutation.isPending}
                                    >
                                        <Ban className="w-4 h-4 mr-2" /> Khóa tài khoản
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl border-slate-200 text-slate-600 font-bold py-6 hover:bg-slate-50 transition-all"
                                    onClick={() => handleSendEmail(viewUser.email)}
                                >
                                    <Mail className="w-4 h-4 mr-2" /> Gửi Email trực tiếp
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl border-slate-200 text-slate-700 font-bold py-6 hover:bg-slate-50 transition-all"
                                    onClick={() => handleOpenEdit(viewUser)}
                                >
                                    <Edit3 className="w-4 h-4 mr-2" /> Chỉnh sửa thông tin
                                </Button>
                                {!viewUser.email_verified && (
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl border-emerald-200 text-emerald-700 font-bold py-6 hover:bg-emerald-50 transition-all"
                                        onClick={() => verifyEmailMutation.mutate(viewUser.id)}
                                        disabled={verifyEmailMutation.isPending}
                                    >
                                        <UserCheck className="w-4 h-4 mr-2" /> Xác thực Email thủ công
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Edit User Modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Chỉnh sửa người dùng</h3>
                            <button
                                onClick={() => setEditUser(null)}
                                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                            >
                                X
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Họ và tên</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Vai trò</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 text-sm font-medium"
                                >
                                    <option value="candidate">Ứng viên</option>
                                    <option value="company">Nhà tuyển dụng</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={editForm.email_verified}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email_verified: e.target.checked }))}
                                    className="w-4 h-4 accent-violet-600"
                                />
                                <span className="text-sm font-bold text-slate-700">Email đã xác thực</span>
                            </label>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                            <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl">Hủy</Button>
                            <Button
                                onClick={() => updateUserMutation.mutate({
                                    userId: editUser.id,
                                    full_name: editForm.full_name,
                                    phone: editForm.phone,
                                    role: editForm.role,
                                    email_verified: editForm.email_verified,
                                    currentRole: editUser.role,
                                    currentEmailVerified: editUser.email_verified,
                                })}
                                disabled={updateUserMutation.isPending || !editForm.full_name.trim()}
                                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
                            >
                                {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filters */}
            <motion.div {...fadeUp(0.1)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all bg-slate-50/50"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 cursor-pointer min-w-[140px]"
                        >
                            <option value="all">Tất cả Vai trò</option>
                            <option value="candidate">Ứng viên</option>
                            <option value="company">Nhà tuyển dụng</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 cursor-pointer min-w-[140px]"
                        >
                            <option value="all">Tất cả Trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="banned">Đã khóa</option>
                        </select>
                    </div>
                </div>
            </motion.div>


            {/* Users Table */}
            <motion.div {...fadeUp(0.15)}>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Thông tin Khách hàng</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Vai trò</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Trạng thái</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Xác thực</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Hoạt động cuối</th>
                                    <th className="text-left py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">Ngày tham gia</th>
                                    <th className="text-right py-4 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500 w-24">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingUsers ? (
                                    <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" /></td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-medium">Không tìm thấy người dùng nào</td></tr>
                                ) : users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-xs shadow-sm shrink-0 overflow-hidden relative group-hover:border-violet-200 transition-colors">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.full_name?.split(' ').pop()?.charAt(0) ?? '?'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{user.full_name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge className={`${roleColors[user.role] ?? ''} border-0 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md shadow-none`}>
                                                {roleLabels[user.role] ?? user.role}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Badge className={`${statusColors[user.status] ?? ''} border-0 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md shadow-none`}>
                                                {statusLabels[user.status] ?? user.status}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-6">
                                            {user.email_verified ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase">
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    <span>Verified</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    <span>Unverified</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 text-xs font-bold">{user.last_login ? new Date(user.last_login).toLocaleDateString('vi-VN') : '-'}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black">Truy cập</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 text-xs font-bold">{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black">Tham gia</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-all cursor-pointer"
                                                    title="Sửa thông tin"
                                                    onClick={() => handleOpenEdit(user)}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-all cursor-pointer"
                                                    title="Xem chi tiết"
                                                    onClick={() => setViewUser(user)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer disabled:opacity-30"
                                                    title={user.status === 'banned' ? "Đã bị khóa" : "Khóa tài khoản"}
                                                    onClick={() => handleUpdateStatus(user.id, 'banned')}
                                                    disabled={user.status === 'banned' || updateStatusMutation.isPending}
                                                >
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
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-6 px-6 py-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">
                            Hiển thị <span className="font-bold text-slate-900">{users.length}</span> / <span className="font-bold text-slate-900">{totalCount}</span> người dùng
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

            {/* Reusable Confirmation Dialog */}
            <ConfirmModal
                isOpen={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={() => {
                    updateStatusMutation.mutate({ userId: confirmDialog.userId, status: confirmDialog.status });
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                }}
                title={confirmDialog.status === 'banned' ? 'Xác nhận khóa tài khoản' : 'Xác nhận kích hoạt'}
                description={confirmDialog.status === 'banned'
                    ? "Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống."
                    : "Xác nhận kích hoạt lại tài khoản cho người dùng này?"
                }
                type={confirmDialog.status === 'banned' ? 'danger' : 'success'}
                confirmText={confirmDialog.status === 'banned' ? "Khóa tài khoản" : "Kích hoạt ngay"}
                isLoading={updateStatusMutation.isPending}
            />
        </div>
    );
}
