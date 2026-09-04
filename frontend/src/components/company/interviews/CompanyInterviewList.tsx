import { EmptyState } from '@/components/shared/EmptyState';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MapPin, Video, Phone, MoreHorizontal, Eye, Edit, XCircle, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Interview } from './CompanyCalendar';

interface CompanyInterviewListProps {
    interviews: Interview[];
    isLoading: boolean;
    onInterviewClick: (id: string) => void;
    onEditInterview: (id: string) => void;
    onCancelInterview: (id: string) => void;
    onCreateInterview?: () => void;
}

export function CompanyInterviewList({ interviews, isLoading, onInterviewClick, onEditInterview, onCancelInterview, onCreateInterview }: CompanyInterviewListProps) {
    const getStatusTextAndColor = (status: Interview['status']) => {
        switch (status) {
            case 'scheduled': return { text: 'Sắp tới', color: 'bg-primary/12 text-primary border-primary/20' };
            case 'rescheduled': return { text: 'Đổi lịch', color: 'bg-teal-100 text-teal-700 border-teal-200' };
            case 'confirmed': return { text: 'Đã xác nhận', color: 'bg-green-100 text-green-700 border-green-200' };
            case 'completed': return { text: 'Hoàn thành', color: 'bg-muted text-foreground/80 border-border' };
            case 'cancelled': return { text: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'no_show': return { text: 'Vắng mặt', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'no-show': return { text: 'Vắng mặt', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'in_progress': return { text: 'Đang diễn ra', color: 'bg-amber-100 text-amber-700 border-amber-200' };
            default: return { text: 'Không rõ', color: 'bg-muted text-foreground/80' };
        }
    };

    const inferInterviewMode = (rawType?: string | null): 'video' | 'phone' | 'onsite' => {
        const typeName = String(rawType || '').toLowerCase();
        if (typeName.includes('trực tiếp') || typeName.includes('onsite') || typeName.includes('tại công ty')) {
            return 'onsite';
        }
        if (typeName.includes('điện thoại') || typeName.includes('phone') || typeName.includes('gọi')) {
            return 'phone';
        }
        return 'video';
    };

    const getTypeIconAndText = (type: 'video' | 'phone' | 'onsite') => {
        switch (type) {
            case 'video': return { icon: Video, text: 'Phỏng vấn Online (Video)' };
            case 'phone': return { icon: Phone, text: 'Phỏng vấn Qua Điện thoại' };
            case 'onsite': return { icon: MapPin, text: 'Phỏng vấn Trực tiếp' };
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    if (!interviews || interviews.length === 0) {
        return (
            <EmptyState
                icon={Calendar}
                title="Chưa có lịch phỏng vấn nào"
                description="Bắt đầu sắp xếp lịch phỏng vấn đầu tiên của bạn với ứng viên tiềm năng ngay hôm nay."
                action={
                    onCreateInterview
                        ? {
                              label: 'Tạo lịch ngay',
                              onClick: onCreateInterview,
                              icon: ArrowRight,
                          }
                        : undefined
                }
            />
        );
    }

    return (
        <div className="w-full border border-border/60 rounded-3xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto min-h-[600px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Ứng viên</th>
                            <th className="px-6 py-4 whitespace-nowrap">Vị trí ứng tuyển</th>
                            <th className="px-6 py-4 whitespace-nowrap">Hình thức</th>
                            <th className="px-6 py-4 whitespace-nowrap">Thời gian</th>
                            <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {interviews.map((interview) => {
                            const statusInfo = getStatusTextAndColor(interview.status);
                            const typeInfo = getTypeIconAndText(
                                inferInterviewMode(interview.type || (interview as any).interview_type_name)
                            );
                            const TypeIcon = typeInfo.icon;

                            return (
                                <tr key={interview.id} className="hover:bg-muted:bg-foreground/80/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-border">
                                                <AvatarImage src={interview.candidate_avatar || (interview as any).applicant_avatar} alt={(interview as any).applicant_name || interview.candidate_name} />
                                                <AvatarFallback>{((interview as any).applicant_name || interview.candidate_name || '??').substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-foreground">{(interview as any).applicant_name || interview.candidate_name}</p>
                                                <p className="text-xs text-muted-foreground">#{interview.candidate_id || (interview as any).applicant_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-foreground/80">
                                        {interview.job_title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <TypeIcon className="w-4 h-4 text-muted-foreground/60" />
                                            <span>{typeInfo.text}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">
                                                {format(parseISO(interview.scheduled_at), 'HH:mm')} - {format(new Date(parseISO(interview.scheduled_at).getTime() + interview.duration_minutes * 60000), 'HH:mm')}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {format(parseISO(interview.scheduled_at), 'dd/MM/yyyy', { locale: vi })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={cn("px-2.5 py-1 font-medium", statusInfo.color)}>
                                            {statusInfo.text}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground/80 focus-visible:border-border focus-visible:bg-muted"
                                                >
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px] bg-card border-border">
                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onInterviewClick(interview.id)} className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEditInterview(interview.id)} className="cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa lịch
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                                                    <DropdownMenuItem onClick={() => onCancelInterview(interview.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                        <XCircle className="mr-2 h-4 w-4" /> Hủy lịch hẹn
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination placeholder if needed */}
            {interviews.length > 0 && (
                <div className="py-4 px-6 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <div>Hiển thị <span className="font-medium text-foreground">1</span> đến <span className="font-medium text-foreground">{interviews.length}</span> trong <span className="font-medium text-foreground">{interviews.length}</span> kết quả</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Trước</Button>
                        <Button variant="outline" size="sm" disabled>Sau</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
