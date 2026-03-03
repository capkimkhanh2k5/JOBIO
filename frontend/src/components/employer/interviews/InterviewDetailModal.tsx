import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    CalendarIcon, Link as LinkIcon, MapPin, Video, Phone,
    User, Briefcase, FileText, CheckCircle, Loader2, Star
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InterviewDetailModalProps {
    interviewId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InterviewDetailModal({ interviewId, open, onOpenChange }: InterviewDetailModalProps) {
    const queryClient = useQueryClient();
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);

    const { data: interview, isLoading } = useQuery({
        queryKey: ['interview', interviewId],
        queryFn: () => apiClient.getInterviewById(interviewId as string),
        enabled: open && !!interviewId,
    });

    const statusMutation = useMutation({
        mutationFn: (newStatus: string) => apiClient.updateInterview(interviewId as string, { status: newStatus }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employerInterviews'] });
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
            toast.success('Đã cập nhật trạng thái');
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    });

    const submitFeedbackMutation = useMutation({
        mutationFn: () => apiClient.updateInterview(interviewId as string, { feedback, rating }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
            toast.success('Đã lưu đánh giá phỏng vấn');
        },
    });

    if (!open) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled': return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">Sắp tới</Badge>;
            case 'confirmed': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200">Đã xác nhận</Badge>;
            case 'completed': return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200">Hoàn thành</Badge>;
            case 'cancelled': return <Badge variant="destructive">Đã hủy</Badge>;
            case 'no_show': return <Badge variant="destructive">Vắng mặt</Badge>;
            case 'in_progress': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200">Đang diễn ra</Badge>;
            default: return <Badge variant="outline">Không rõ</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4 text-slate-500" />;
            case 'phone': return <Phone className="w-4 h-4 text-slate-500" />;
            case 'onsite': return <MapPin className="w-4 h-4 text-slate-500" />;
            default: return <Video className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center justify-between mt-2">
                        Chi tiết phỏng vấn
                        {interview && !isLoading && getStatusBadge(interview.status)}
                    </DialogTitle>
                </DialogHeader>

                {isLoading || !interview ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-4 text-left">
                        {/* Quick View Card */}
                        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                            <Avatar className="w-16 h-16 border border-slate-200 dark:border-slate-700">
                                <AvatarImage src={interview.candidate_avatar} alt={interview.candidate_name} />
                                <AvatarFallback>{interview.candidate_name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {interview.candidate_name}
                                </h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                                    <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <Briefcase className="w-4 h-4 mr-1.5 text-slate-400" />
                                        {interview.job_title}
                                    </div>
                                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                        <FileText className="w-4 h-4 mr-1.5" />
                                        Xem hồ sơ ứng viên
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interview Info */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Thời gian & Địa điểm</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <CalendarIcon className="w-4 h-4 mt-0.5 text-slate-400" />
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {format(parseISO(interview.scheduled_at), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                                </p>
                                                <p>{format(parseISO(interview.scheduled_at), 'HH:mm')} - {format(new Date(parseISO(interview.scheduled_at).getTime() + interview.duration_minutes * 60000), 'HH:mm')} ({interview.duration_minutes} phút)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            {getTypeIcon(interview.type)}
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white capitalize">
                                                    Phỏng vấn {interview.type}
                                                </p>
                                                {interview.meeting_link ? (
                                                    <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                                        <LinkIcon className="w-3 h-3" /> Tham gia meeting
                                                    </a>
                                                ) : interview.location ? (
                                                    <p className="mt-0.5">{interview.location}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {interview.notes && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Ghi chú</h4>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line border border-slate-200 dark:border-slate-800">
                                            {interview.notes}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Người phỏng vấn</h4>
                                    <div className="space-y-2">
                                        {interview.interviewers?.map((interviewer: any) => (
                                            <div key={interviewer.id} className="flex items-center gap-2">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={interviewer.avatar} />
                                                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {interviewer.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Cập nhật trạng thái</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Select
                                            value={interview.status}
                                            onValueChange={(val) => {
                                                if (val !== interview.status) statusMutation.mutate(val);
                                            }}
                                            disabled={statusMutation.isPending}
                                        >
                                            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                <SelectItem value="scheduled">Sắp tới</SelectItem>
                                                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                                <SelectItem value="in_progress">Đang diễn ra</SelectItem>
                                                <SelectItem value="completed">Hoàn thành</SelectItem>
                                                <SelectItem value="cancelled">Hủy lịch</SelectItem>
                                                <SelectItem value="no_show">Vắng mặt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {statusMutation.isPending && <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-2" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-200 dark:bg-slate-800" />

                        {/* End Interview Feedback */}
                        {(interview.status === 'completed' || interview.status === 'no_show') && (
                            <div className="space-y-4 pb-4">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Đánh giá sau phỏng vấn
                                </h4>

                                {interview.feedback ? (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                                        <div className="flex items-center gap-1">
                                            {Array(5).fill(0).map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < (interview.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {interview.feedback}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Đánh giá chung (1-5 sao)</Label>
                                            <div className="flex gap-1">
                                                {Array(5).fill(0).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-6 h-6 cursor-pointer transition-colors ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`}
                                                        onClick={() => setRating(i + 1)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nhận xét về ứng viên</Label>
                                            <Textarea
                                                placeholder="Khả năng chuyên môn, thái độ, kỹ năng mềm..."
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[100px]"
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                                            onClick={() => submitFeedbackMutation.mutate()}
                                            disabled={!rating || !feedback || submitFeedbackMutation.isPending}
                                        >
                                            {submitFeedbackMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Lưu đánh giá
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
