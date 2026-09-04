import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export function VerificationSection({ company }: { company: any }) {
    const queryClient = useQueryClient();
    const [isRequesting, setIsRequesting] = useState(false);

    const statusMap = {
        'verified': { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Đã xác minh' },
        'pending': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Đang chờ xác minh' },
        'unverified': { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted0/10', border: 'border-border/20', label: 'Chưa xác minh' },
    };

    const statusStyle = statusMap[(company?.verification_status as keyof typeof statusMap) || 'unverified'];
    const StatusIcon = statusStyle.icon;

    const verifyMutation = useMutation({
        mutationFn: () => companyService.requestVerification(Number(company.id)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã gửi yêu cầu xác minh. Đội ngũ JOBIO sẽ liên hệ sớm nhất.');
            queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
            setIsRequesting(false);
        },
        onError: () => {
            toast.error('Có lỗi xảy ra.');
            setIsRequesting(false);
        },
    });

    const handleRequest = () => {
        setIsRequesting(true);
        verifyMutation.mutate();
    };

    return (
        <Card className="border-border/60 bg-card/90 shadow-sm rounded-3xl overflow-hidden relative transition-all hover:shadow-md">
            <div className="absolute right-0 top-0 w-72 h-72 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start md:items-center gap-4">
                    <div className={`p-3.5 rounded-2xl ${statusStyle.bg} ${statusStyle.border} border shadow-xs shrink-0`}>
                        <StatusIcon className={`w-6 h-6 ${statusStyle.color}`} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-foreground">Xác minh Doanh nghiệp</h3>
                            <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} rounded-lg px-2.5 py-0.5 font-bold text-xs`}>
                                {statusStyle.label}
                            </Badge>
                            {company?.verification_status === 'verified' && (
                                <Badge className="bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-md px-2 py-0.5">
                                    Trust+ Verified
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl">
                            {company?.verification_status === 'verified' && (
                                "Doanh nghiệp của bạn đã được xác minh chính danh. Huy hiệu uy tín được hiển thị trên tất cả các tin tuyển dụng."
                            )}
                            {company?.verification_status === 'pending' && (
                                "Hồ sơ xác minh đang được hệ thống kiểm duyệt kỹ thuật trong vòng 24-48h."
                            )}
                            {(company?.verification_status === 'unverified' || !company?.verification_status) && (
                                "Xác minh doanh nghiệp để nhận Huy hiệu Trust+, tăng 300% lượt nộp hồ sơ và ưu tiên vị trí tin tuyển dụng TOP."
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <div className="flex items-center gap-3 bg-muted/50 border border-border/50 px-3 py-2 rounded-xl text-[11px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Trust+ Badge</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Top Position</span>
                    </div>

                    {(company?.verification_status === 'unverified' || !company?.verification_status) && (
                        <Button
                            onClick={handleRequest}
                            disabled={isRequesting}
                            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/15 h-10 px-5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0"
                        >
                            {isRequesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Yêu cầu xác minh
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
