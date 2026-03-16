import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, Briefcase, CheckCircle2, XCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: "Chờ liên hệ", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
    contacted: { label: "Đã liên hệ", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Mail },
    applied: { label: "Đã ứng tuyển", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Briefcase },
    interviewing: { label: "Đang phỏng vấn", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Clock },
    hired: { label: "Đã tuyển", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
    rejected: { label: "Từ chối", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

interface ReferralDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    referral: any;
}

export function ReferralDetailModal({ isOpen, onClose, referral }: ReferralDetailModalProps) {
    if (!referral) return null;

    const StatusIcon = statusConfig[referral.status]?.icon || Clock;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Chi tiết Giới thiệu</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Thông tin chi tiết về ứng viên được giới thiệu.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border border-white/10">
                            <span className="text-2xl font-black text-cyan-400">
                                {referral.candidate_name?.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">{referral.candidate_name}</h3>
                            <p className="text-sm text-muted-foreground">{referral.candidate_email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-muted-foreground">Vị trí ứng tuyển</p>
                            <p className="text-sm font-semibold">{referral.job_title}</p>
                        </div>
                        <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-muted-foreground">Trạng thái hiện tại</p>
                            <Badge variant="outline" className={`${statusConfig[referral.status]?.color} gap-1.5 whitespace-nowrap`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[referral.status]?.label}
                            </Badge>
                        </div>
                        <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-muted-foreground">Ngày giới thiệu</p>
                            <p className="text-sm font-semibold">
                                {format(new Date(referral.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </p>
                        </div>
                        <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-muted-foreground">Thưởng dự kiến</p>
                            <p className="text-sm text-emerald-400 font-black">
                                {referral.bonus_amount ? `${referral.bonus_amount} ${referral.bonus_currency}` : 'Chưa cập nhật'}
                            </p>
                        </div>
                        {referral.notes && (
                            <div className="space-y-1.5 p-3 bg-white/5 rounded-xl border border-white/5 col-span-2">
                                <p className="text-xs text-muted-foreground">Ghi chú</p>
                                <p className="text-sm text-foreground leading-relaxed">{referral.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
