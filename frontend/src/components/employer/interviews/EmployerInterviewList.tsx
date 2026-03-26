import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MapPin, Video, Phone, MoreHorizontal, Eye, Edit, XCircle } from 'lucide-react';
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
import { Interview } from './EmployerCalendar';

interface EmployerInterviewListProps {
    interviews: Interview[];
    isLoading: boolean;
    onInterviewClick: (id: string) => void;
}

export function EmployerInterviewList({ interviews, isLoading, onInterviewClick }: EmployerInterviewListProps) {
    const getStatusTextAndColor = (status: Interview['status']) => {
        switch (status) {
            case 'scheduled': return { text: 'Sắp tới', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'confirmed': return { text: 'Đã xác nhận', color: 'bg-green-100 text-green-700 border-green-200' };
            case 'completed': return { text: 'Hoàn thành', color: 'bg-slate-100 text-slate-700 border-slate-200' };
            case 'cancelled': return { text: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'no_show': return { text: 'Vắng mặt', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'in_progress': return { text: 'Đang diễn ra', color: 'bg-amber-100 text-amber-700 border-amber-200' };
            default: return { text: 'Không rõ', color: 'bg-slate-100 text-slate-700' };
        }
    };

    const getTypeIconAndText = (type: Interview['type']) => {
        switch (type) {
            case 'video': return { icon: Video, text: 'Online' };
            case 'phone': return { icon: Phone, text: 'Điện thoại' };
            case 'onsite': return { icon: MapPin, text: 'Trực tiếp' };
            default: return { icon: Video, text: 'Online' };
        }
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 min-h-[50px] border-b border-slate-200"></div>
                    {Array(5).fill(null).map((_, i) => (
                        <div key={i} className="flex p-4 border-b border-slate-200 gap-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!interviews || interviews.length === 0) {
        return (
            <div className="p-12 text-center text-slate-500 border border-slate-200 rounded-xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Không có lịch phỏng vấn nào</h3>
                <p className="text-sm">Chưa có lịch phỏng vấn nào trong thời gian này hoặc không khớp với bộ lọc.</p>
            </div>
        );
    }

    return (
        <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto min-h-[600px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
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
                            const typeInfo = getTypeIconAndText(interview.type);
                            const TypeIcon = typeInfo.icon;

                            return (
                                <tr key={interview.id} className="hover:bg-slate-50:bg-slate-800/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-slate-200">
                                                <AvatarImage src={interview.candidate_avatar || (interview as any).applicant_avatar} alt={(interview as any).applicant_name || interview.candidate_name} />
                                                <AvatarFallback>{((interview as any).applicant_name || interview.candidate_name || '??').substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-slate-900">{(interview as any).applicant_name || interview.candidate_name}</p>
                                                <p className="text-xs text-slate-500">#{interview.candidate_id || (interview as any).applicant_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {interview.job_title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <TypeIcon className="w-4 h-4 text-slate-400" />
                                            <span>{typeInfo.text}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {format(parseISO(interview.scheduled_at), 'HH:mm')} - {format(new Date(parseISO(interview.scheduled_at).getTime() + interview.duration_minutes * 60000), 'HH:mm')}
                                            </span>
                                            <span className="text-sm text-slate-500">
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px] bg-white border-slate-200">
                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onInterviewClick(interview.id)} className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa lịch
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                                                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
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
                <div className="py-4 px-6 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <div>Hiển thị <span className="font-medium text-slate-900">1</span> đến <span className="font-medium text-slate-900">{interviews.length}</span> trong <span className="font-medium text-slate-900">{interviews.length}</span> kết quả</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>Trước</Button>
                        <Button variant="outline" size="sm" disabled>Sau</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
