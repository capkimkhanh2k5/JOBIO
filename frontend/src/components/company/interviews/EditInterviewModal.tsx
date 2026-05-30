import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Clock, Link as LinkIcon, MapPin, Loader2, Briefcase } from 'lucide-react';
import { companyService } from '@/services/companyService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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

const getLocalDateInputValue = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const interviewSchema = z.object({
    type: z.string().min(1, 'Vui lòng chọn hình thức phỏng vấn'),
    scheduled_date: z.string()
        .min(1, 'Vui lòng chọn ngày')
        .refine((value) => !value || value >= getLocalDateInputValue(), 'Ngày phỏng vấn không thể ở trong quá khứ'),
    scheduled_time: z.string().min(1, 'Vui lòng chọn giờ'),
    duration_minutes: z.number().min(15, 'Tối thiểu 15 phút'),
    location: z.string().optional(),
    meeting_link: z.string().optional(),
    notes: z.string().optional(),
});

type InterviewFormValues = z.infer<typeof interviewSchema>;

interface EditInterviewModalProps {
    interviewId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const toArray = <T,>(value: T[] | { results?: T[] } | undefined | null): T[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray((value as { results?: T[] } | undefined)?.results)) {
        return (value as { results: T[] }).results;
    }
    return [];
};

const inferInterviewMode = (interviewType: any) => {
    const typeName = String(interviewType?.name || '').toLowerCase();
    if (typeName.includes('trực tiếp') || typeName.includes('onsite') || typeName.includes('tại công ty')) {
        return 'onsite';
    }
    if (typeName.includes('điện thoại') || typeName.includes('phone') || typeName.includes('gọi')) {
        return 'phone';
    }
    return 'video';
};

const getApiErrorMessage = (error: unknown) => {
    if (error instanceof AxiosError) {
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string' && detail.trim()) return detail;

        const firstError = Object.values(error.response?.data || {}).find((value) => {
            if (typeof value === 'string') return value.trim().length > 0;
            return Array.isArray(value) && value.length > 0;
        });

        if (Array.isArray(firstError) && typeof firstError[0] === 'string') return firstError[0];
        if (typeof firstError === 'string') return firstError;
    }

    return 'Có lỗi xảy ra khi cập nhật lịch.';
};

const splitOnsiteNotes = (notes?: string | null) => {
    const content = notes || '';
    const match = content.match(/^Địa điểm phỏng vấn:\s*(.+?)(?:\n\n([\s\S]*))?$/);
    if (!match) {
        return { location: '', notes: content };
    }

    return {
        location: match[1] || '',
        notes: match[2] || '',
    };
};

export function EditInterviewModal({ interviewId, open, onOpenChange }: EditInterviewModalProps) {
    const queryClient = useQueryClient();

    const { data: interview, isLoading: isLoadingInterview } = useQuery({
        queryKey: ['interview', interviewId, 'edit'],
        queryFn: () => companyService.getInterview(Number(interviewId)).then((r) => r.data),
        enabled: open && !!interviewId,
        refetchOnMount: 'always',
    });

    const { data: types, isLoading: isLoadingTypes } = useQuery({
        queryKey: ['interviewTypes'],
        queryFn: () => companyService.listInterviewTypes().then((r) => r.data),
        enabled: open,
        refetchOnMount: 'always',
    });

    const interviewTypeOptions = toArray<any>(types);

    const form = useForm<InterviewFormValues>({
        resolver: zodResolver(interviewSchema),
        defaultValues: {
            type: '',
            scheduled_date: '',
            scheduled_time: '09:00',
            duration_minutes: 60,
            location: '',
            meeting_link: '',
            notes: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (!open) {
            form.reset({
                type: '',
                scheduled_date: '',
                scheduled_time: '09:00',
                duration_minutes: 60,
                location: '',
                meeting_link: '',
                notes: '',
            });
            return;
        }

        if (!interview || interviewTypeOptions.length === 0) return;

        const parsedDate = parseISO(interview.scheduled_at);
        const initialTypeId = String(interview.interview_type_id || '');
        const initialType =
            interviewTypeOptions.find((type: any) => String(type.id) === initialTypeId) ||
            interviewTypeOptions.find((type: any) => String(type.name || '').trim() === String(interview.interview_type_name || '').trim());
        const resolvedTypeId = initialType ? String(initialType.id) : initialTypeId;
        const mode = inferInterviewMode(initialType || interview.interview_type_name);
        const { location, notes } = splitOnsiteNotes(interview.notes);

        form.reset({
            type: resolvedTypeId,
            scheduled_date: format(parsedDate, 'yyyy-MM-dd'),
            scheduled_time: format(parsedDate, 'HH:mm'),
            duration_minutes: interview.duration_minutes || 60,
            location: mode === 'onsite' ? location : '',
            meeting_link: mode !== 'onsite' ? interview.meeting_link || '' : '',
            notes,
        });
    }, [form, interview, interviewTypeOptions, open]);

    const watchType = form.watch('type');
    const selectedInterviewType = interviewTypeOptions.find((type: any) => String(type.id) === watchType);
    const interviewMode = inferInterviewMode(selectedInterviewType);
    const isFormReady = Boolean(interview && interviewTypeOptions.length > 0 && form.getValues('type'));

    const mutation = useMutation({
        mutationFn: (data: any) => companyService.updateInterview(Number(interviewId), data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyInterviews'] });
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
            queryClient.invalidateQueries({ queryKey: ['interview', interviewId, 'edit'] });
            toast.success('Đã cập nhật lịch phỏng vấn thành công!');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        },
    });

    const onSubmit = (values: InterviewFormValues) => {
        const scheduledDate = new Date(`${values.scheduled_date}T${values.scheduled_time}`);
        if (Number.isNaN(scheduledDate.getTime())) {
            toast.error('Ngày giờ không hợp lệ');
            return;
        }
        if (scheduledDate <= new Date()) {
            form.setError('scheduled_time', {
                type: 'validate',
                message: 'Thời gian phỏng vấn phải lớn hơn thời gian hiện tại',
            });
            return;
        }
        const scheduled_at = scheduledDate.toISOString();

        const normalizedNotes = [
            interviewMode === 'onsite' && values.location ? `Địa điểm phỏng vấn: ${values.location}` : null,
            values.notes?.trim() || null,
        ]
            .filter(Boolean)
            .join('\n\n');

        mutation.mutate({
            interview_type_id: Number(values.type),
            scheduled_at,
            duration_minutes: values.duration_minutes,
            meeting_link: interviewMode === 'onsite' ? undefined : values.meeting_link || undefined,
            notes: normalizedNotes || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 shadow-none">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-900">Chỉnh sửa lịch phỏng vấn</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Cập nhật thời gian, hình thức và ghi chú cho lịch phỏng vấn hiện có.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingInterview || isLoadingTypes || !interview || !isFormReady ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-11 w-11 border border-slate-200 bg-white">
                                    <AvatarImage
                                        src={(interview?.candidate_avatar || interview?.applicant_avatar) ?? undefined}
                                        alt={interview?.applicant_name || interview?.candidate_name || 'Ứng viên'}
                                    />
                                    <AvatarFallback className="bg-white text-slate-700">
                                        {(interview?.applicant_name || interview?.candidate_name || 'UV').substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="font-semibold text-slate-900">{interview?.applicant_name || 'Ứng viên'}</div>
                                    <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                        <Briefcase className="w-4 h-4" />
                                        {interview?.job_title || 'Chưa có vị trí'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Hình thức <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(value) => form.setValue('type', value)} value={form.watch('type')}>
                                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                                        <SelectValue placeholder="Chọn hình thức..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                        {isLoadingTypes ? (
                                            <div className="p-2 text-sm text-center text-slate-500">Đang tải...</div>
                                        ) : (
                                            interviewTypeOptions.map((type: any) => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    {type.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration_minutes">Thời lượng (phút) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="duration_minutes"
                                    type="number"
                                    min="15"
                                    step="15"
                                    className="bg-slate-50 border-slate-200 text-slate-900"
                                    {...form.register('duration_minutes', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduled_date">Ngày phỏng vấn <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        id="scheduled_date"
                                        type="date"
                                        min={getLocalDateInputValue()}
                                        className={`pl-10 bg-slate-50 text-slate-900 ${form.formState.errors.scheduled_date ? 'border-red-500' : 'border-slate-200'}`}
                                        {...form.register('scheduled_date')}
                                    />
                                </div>
                                {form.formState.errors.scheduled_date && (
                                    <p className="text-xs text-red-500">{form.formState.errors.scheduled_date.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduled_time">Giờ bắt đầu <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        id="scheduled_time"
                                        type="time"
                                        className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
                                        {...form.register('scheduled_time')}
                                    />
                                </div>
                                {form.formState.errors.scheduled_time && (
                                    <p className="text-xs text-red-500">{form.formState.errors.scheduled_time.message}</p>
                                )}
                            </div>

                            {interviewMode === 'onsite' && (
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="location">Địa điểm phỏng vấn <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                        <Textarea
                                            id="location"
                                            placeholder="Nhập địa chỉ chi tiết hoặc phòng họp..."
                                            className="pl-10 bg-slate-50 border-slate-200 text-slate-900 min-h-[60px]"
                                            {...form.register('location')}
                                        />
                                    </div>
                                </div>
                            )}

                            {(interviewMode === 'video' || interviewMode === 'phone') && (
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="meeting_link">Link meeting / Số điện thoại <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            id="meeting_link"
                                            placeholder={interviewMode === 'video' ? 'https://meet.google.com/...' : 'Nhập số điện thoại...'}
                                            className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
                                            {...form.register('meeting_link')}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="notes">Ghi chú thêm (tùy chọn)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Yêu cầu ứng viên chuẩn bị, nội dung phỏng vấn..."
                                    className="bg-slate-50 border-slate-200 text-slate-900 min-h-[80px]"
                                    {...form.register('notes')}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
