import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
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
        'unverified': { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Chưa xác minh' },
    };

    const statusStyle = statusMap[(company?.verification_status as keyof typeof statusMap) || 'unverified'];
    const StatusIcon = statusStyle.icon;

    const verifyMutation = useMutation({
        mutationFn: () => apiClient.requestCompanyVerification(company.id),
        onSuccess: () => {
            toast.success('Đã gửi yêu cầu xác minh. Đội ngũ JOBIO sẽ liên hệ sớm nhất.');
            queryClient.invalidateQueries({ queryKey: ['employerCompany'] });
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
        <Card className="border-cyan-500/10 bg-white/5 backdrop-blur-md overflow-hidden relative">
            {/* Background gradient hint */}
            {company?.verification_status === 'verified' && (
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-green-500/20 blur-3xl rounded-full pointer-events-none" />
            )}

            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    Xác minh Doanh nghiệp
                </CardTitle>
                <CardDescription>Hồ sơ đã xác minh giúp tăng độ uy tín và thu hút nhiều ứng viên chất lượng hơn.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${statusStyle.bg} ${statusStyle.border} border`}>
                            <StatusIcon className={`w-6 h-6 ${statusStyle.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Trạng thái hiện tại</p>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold ${statusStyle.color}`}>
                                    {statusStyle.label}
                                </span>
                                {company?.verification_status === 'verified' && (
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">
                                        Trust+
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="max-w-sm text-sm text-muted-foreground">
                        {company?.verification_status === 'verified' && (
                            "Tài khoản của bạn đã được xác minh đầy đủ giấy phép kinh doanh. Huy hiệu xác minh sẽ hiển thị trên tất cả tin tuyển dụng."
                        )}
                        {company?.verification_status === 'pending' && (
                            "Hồ sơ của bạn đang được duyệt. Quá trình này thường mất 1-2 ngày làm việc. Nếu cần gấp báo cáo qua email hỗ trợ."
                        )}
                        {(company?.verification_status === 'unverified' || !company?.verification_status) && (
                            "Bạn chưa gửi yêu cầu xác minh. Hãy chuẩn bị bản scan Giấy phép Đăng ký kinh doanh (PDF/JPG) để bắt đầu xác minh."
                        )}
                    </div>
                </div>

                {/* Benefits of verification */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Hiển thị huy hiệu xác minh xanh</span>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Ưu tiên hiển thị trên kết quả tìm kiếm</span>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Tăng 300% tỷ lệ nộp hồ sơ</span>
                    </div>
                </div>
            </CardContent>

            {(company?.verification_status === 'unverified' || !company?.verification_status) && (
                <CardFooter className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 justify-end">
                    <Button
                        onClick={handleRequest}
                        disabled={isRequesting}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-none shadow-md shadow-cyan-500/20"
                    >
                        {isRequesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                        Gửi yêu cầu xác minh ngay
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
