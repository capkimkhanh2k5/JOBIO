import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    CalendarIcon, Link as LinkIcon, MapPin, Video, Phone,
    User, Briefcase, FileText, CheckCircle, Loader2, Star
} from 'lucide-react';
import { employerService } from '@/services/employerService';
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
        queryFn: () => employerService.getInterview(Number(interviewId)).then(r => r.data),
        enabled: open && !!interviewId,
    });

    const statusMutation = useMutation({
        mutationFn: (newStatus: string) => employerService.updateInterview(Number(interviewId), { status: newStatus }).then(r => r.data),
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
        mutationFn: () => employerService.updateInterview(Number(interviewId), { feedback, notes: feedback }).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
            toast.success('Đã lưu đánh giá phỏng vấn');
        },
    });

    if (!open) return null;

    const getStatusBadge = (status: string) => {
        const badgeProps = { className: "ml-auto mr-8 px-3 py-1 font-bold shadow-sm" };
        switch (status) {
            case 'scheduled': return <Badge {...badgeProps} className={`${badgeProps.className} bg-blue-500 text-white hover:bg-blue-600`}>Sắp tới</Badge>;
            case 'confirmed': return <Badge {...badgeProps} className={`${badgeProps.className} bg-emerald-500 text-white hover:bg-emerald-600`}>Đã xác nhận</Badge>;
            case 'completed': return <Badge {...badgeProps} className={`${badgeProps.className} bg-slate-600 text-white hover:bg-slate-700`}>Hoàn thành</Badge>;
            case 'cancelled': return <Badge {...badgeProps} className={`${badgeProps.className} bg-rose-500 text-white hover:bg-rose-600`}>Đã hủy</Badge>;
            case 'no_show': return <Badge {...badgeProps} className={`${badgeProps.className} bg-rose-700 text-white hover:bg-rose-800`}>Vắng mặt</Badge>;
            case 'in_progress': return <Badge {...badgeProps} className={`${badgeProps.className} bg-amber-500 text-white hover:bg-amber-600`}>Đang diễn ra</Badge>;
            default: return <Badge {...badgeProps} variant="outline">Không rõ</Badge>;
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
            <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center justify-between mt-2 text-slate-900">
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
                        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                            <Avatar className="w-16 h-16 border border-slate-200">
                                <AvatarImage src={(interview.candidate_avatar || interview.applicant_avatar) ?? undefined} alt={interview.applicant_name || interview.candidate_name} />
                                <AvatarFallback>{(interview.applicant_name || interview.candidate_name || '??').substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900">
                                    {interview.applicant_name || interview.candidate_name}
                                </h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                                    <div className="flex items-center text-sm font-medium text-slate-700">
                                        <Briefcase className="w-4 h-4 mr-1.5 text-slate-400" />
                                        {interview.job_title}
                                    </div>
                                    <div className="flex items-center text-sm text-indigo-600 cursor-pointer hover:underline font-medium">
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
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Thời gian & Địa điểm</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 text-sm text-slate-600">
                                            <CalendarIcon className="w-4 h-4 mt-0.5 text-indigo-500" />
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {format(parseISO(interview.scheduled_at), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                                </p>
                                                <p className="text-slate-500 font-medium">{format(parseISO(interview.scheduled_at), 'HH:mm')} - {format(new Date(parseISO(interview.scheduled_at).getTime() + interview.duration_minutes * 60000), 'HH:mm')} ({interview.duration_minutes} phút)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-slate-600">
                                            <div className="mt-0.5">
                                                {getTypeIcon(interview.type || 'video')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 capitalize">
                                                    Phỏng vấn {interview.type}
                                                </p>
                                                {interview.meeting_link ? (
                                                    <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 font-medium">
                                                        <LinkIcon className="w-3 h-3" /> Tham gia meeting
                                                    </a>
                                                ) : interview.location ? (
                                                    <p className="mt-0.5 text-slate-500">{interview.location}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {interview.notes && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Ghi chú</h4>
                                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 whitespace-pre-line border border-slate-100 font-medium">
                                            {interview.notes}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Người phỏng vấn</h4>
                                    <div className="space-y-2">
                                        {interview.interviewers?.map((interviewer: any) => (
                                            <div key={interviewer.id} className="flex items-center gap-2">
                                                <Avatar className="w-8 h-8 border border-slate-100">
                                                    <AvatarImage src={interviewer.avatar} />
                                                    <AvatarFallback className="bg-slate-100"><User className="w-4 h-4 text-slate-500" /></AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium text-slate-700">
                                                    {interviewer.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Cập nhật trạng thái</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Select
                                            value={interview.status}
                                            onValueChange={(val) => {
                                                if (val !== interview.status) statusMutation.mutate(val);
                                            }}
                                            disabled={statusMutation.isPending}
                                        >
                                            <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-900 font-medium h-11 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
                                                <SelectItem value="scheduled">Sắp tới</SelectItem>
                                                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                                <SelectItem value="in_progress">Đang diễn ra</SelectItem>
                                                <SelectItem value="completed">Hoàn thành</SelectItem>
                                                <SelectItem value="cancelled">Hủy lịch</SelectItem>
                                                <SelectItem value="no_show">Vắng mặt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {statusMutation.isPending && <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mt-3" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        {/* End Interview Feedback */}
                        {(interview.status === 'completed' || interview.status === 'no_show') && (
                            <div className="space-y-4 pb-4">
                                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    Đánh giá sau phỏng vấn
                                </h4>

                                {interview.feedback ? (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 shadow-sm">
                                        <div className="flex items-center gap-1">
                                            {Array(5).fill(0).map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < (interview.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {interview.feedback}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-5">
                                        <div className="space-y-3">
                                            <Label className="text-slate-900 font-bold">Đánh giá chung (1-5 sao)</Label>
                                            <div className="flex gap-2">
                                                {Array(5).fill(0).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-8 h-8 cursor-pointer transition-all ${i < rating ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-slate-200 hover:text-yellow-200'}`}
                                                        onClick={() => setRating(i + 1)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-900 font-bold">Nhận xét về ứng viên</Label>
                                            <Textarea
                                                placeholder="Khả năng chuyên môn, thái độ, kỹ năng mềm..."
                                                className="bg-slate-50 border-slate-200 focus:bg-white min-h-[120px] rounded-xl text-slate-700"
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 rounded-xl px-8 h-12"
                                            onClick={() => submitFeedbackMutation.mutate()}
                                            disabled={!rating || !feedback || submitFeedbackMutation.isPending}
                                        >
                                            {submitFeedbackMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Gửi đánh giá
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
