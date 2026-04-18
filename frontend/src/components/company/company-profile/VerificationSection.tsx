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
        'unverified': { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Chưa xác minh' },
    };

    const statusStyle = statusMap[(company?.verification_status as keyof typeof statusMap) || 'unverified'];
    const StatusIcon = statusStyle.icon;

    const verifyMutation = useMutation({
        mutationFn: () => companyService.requestVerification(Number(company.id)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã gửi yêu cầu xác minh. Đội ngũ JOBIO sẽ liên hệ sớm nhất.');
            queryClient.invalidateQueries({ queryKey: ['companyCompany'] });
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
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
            {/* Subtle multi-layer background accents */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-600/5 blur-[100px] pointer-events-none" />

            <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-800">
                    <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    Xác minh Doanh nghiệp
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium leading-relaxed">Tăng độ tin cậy và thu hút ứng viên tài năng nhất qua quy trình xác thực chính danh.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${statusStyle.bg} ${statusStyle.border} border shadow-sm`}>
                            <StatusIcon className={`w-8 h-8 ${statusStyle.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Trạng thái hiện tại</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-black ${statusStyle.color}`}>
                                    {statusStyle.label}
                                </span>
                                {company?.verification_status === 'verified' && (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-tight">
                                        Trust+ Verified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="max-w-sm text-sm text-slate-600 leading-relaxed font-semibold">
                        {company?.verification_status === 'verified' && (
                            "Tuyệt vời! Doanh nghiệp của bạn đã được xác minh toàn diện. Huy hiệu uy tín sẽ hiển thị trên tất cả các tin tuyển dụng và trang cá nhân."
                        )}
                        {company?.verification_status === 'pending' && (
                            "Hồ sơ đang trong quá trình kiểm duyệt kỹ thuật. Chúng tôi sẽ thông báo kết quả cho bạn trong vòng 24-48 giờ làm việc."
                        )}
                        {(company?.verification_status === 'unverified' || !company?.verification_status) && (
                            "Bạn chưa xác minh. Hãy gửi Giấy phép Kinh doanh để mở khóa các đặc quyền cao cấp và tăng 300% hiệu quả tuyển dụng."
                        )}
                    </div>
                </div>

                {/* Benefits of verification with better icons */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                        "Huy hiệu xác minh Trust+",
                        "Ưu tiên vị trí hiển thị TOP",
                        "Tăng 300% tỷ lệ nộp hồ sơ",
                    ].map((benefit, i) => (
                        <div key={i} className="flex gap-3 items-center group/benefit">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover/benefit:scale-110 transition-transform shadow-sm">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-black text-slate-700">{benefit}</span>
                        </div>
                    ))}
                </div>
            </CardContent>

            {(company?.verification_status === 'unverified' || !company?.verification_status) && (
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 justify-end py-4">
                    <Button
                        onClick={handleRequest}
                        disabled={isRequesting}
                        className="bg-violet-600 hover:bg-violet-700 text-white border-none shadow-lg shadow-violet-500/20 h-11 px-8 rounded-xl font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isRequesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                        Bắt đầu xác minh ngay
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
