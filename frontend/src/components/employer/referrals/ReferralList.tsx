import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Search,
    MoreHorizontal,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    Briefcase,
    ChevronDown,
    Filter,
    Gift
} from 'lucide-react';
import { referralService } from '@/services/referralService';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ReferralDetailModal } from './ReferralDetailModal';

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: "Chờ liên hệ", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
    contacted: { label: "Đã liên hệ", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Mail },
    applied: { label: "Đã ứng tuyển", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Briefcase },
    hired: { label: "Đã tuyển", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
    interviewed: { label: "Đã phỏng vấn", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Clock },
    rejected: { label: "Từ chối", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

export function ReferralList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedReferral, setSelectedReferral] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleSendReminder = (ref: any) => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 800)),
            {
                loading: 'Đang gửi email nhắc nhở...',
                success: () => `Đã gửi email nhắc nhở đến ${ref.referred_email}`,
                error: 'Không thể gửi email lúc này',
            }
        );
    };

    const { data: referrals, isLoading } = useQuery({
        queryKey: ['referrals'],
        queryFn: referralService.listReferrals,
    });

    const filteredReferrals = referrals?.results?.filter((ref: any) => {
        const matchesSearch =
            (ref.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ref.job_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ref.candidate_email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || ref.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />)}
            </div>
        );
    }

    if (!referrals?.results || referrals.results.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Chưa có giới thiệu nào</h3>
                <p className="text-sm text-muted-foreground mt-1">Hãy giới thiệu ứng viên tiềm năng để nhận thưởng.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative z-0">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên, email, công việc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 focus-visible:ring-cyan-500/50 rounded-xl"
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white/5 border-white/10 rounded-xl gap-2">
                                <Filter className="w-4 h-4" />
                                {statusFilter === 'all' ? 'Tất cả trạng thái' : statusConfig[statusFilter]?.label}
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>Tất cả</DropdownMenuItem>
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                                    {config.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredReferrals?.map((ref: any) => {
                    const StatusIcon = statusConfig[ref.status]?.icon || Clock;
                    return (
                        <div
                            key={ref.id}
                            className="p-4 sm:p-5 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-4 flex-1 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-cyan-400">
                                        {(ref.candidate_name || '?').charAt(0)}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-foreground truncate">{ref.candidate_name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <span className="truncate">{ref.job_title}</span>
                                        <span>•</span>
                                        <span className="truncate">{ref.candidate_email}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(ref.created_at), 'dd/MM/yyyy', { locale: vi })}
                                        </span>
                                        {ref.notes && (
                                            <span className="truncate max-w-[200px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
                                                Ghi chú: {ref.notes}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                <Badge variant="outline" className={`${statusConfig[ref.status]?.color} gap-1.5 whitespace-nowrap`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig[ref.status]?.label}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border w-40 shadow-xl">
                                        <DropdownMenuItem onClick={() => { setSelectedReferral(ref); setIsDetailModalOpen(true); }}>
                                            Xem chi tiết
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendReminder(ref)}>
                                            Gửi email nhắc nhở
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    );
                })}
                {filteredReferrals?.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                        Không tìm thấy kết quả nào phù hợp.
                    </div>
                )}
            </div>

            <ReferralDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                referral={selectedReferral}
            />
        </div>
    );
}
