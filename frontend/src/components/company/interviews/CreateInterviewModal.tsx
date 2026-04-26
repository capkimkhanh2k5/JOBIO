import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CalendarIcon, Clock, Link as LinkIcon, MapPin, Loader2 } from 'lucide-react';
import { companyService } from '@/services/companyService';
import { applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const interviewSchema = z.object({
    candidate_id: z.string().min(1, 'Vui lòng chọn ứng viên'),
    type: z.string().min(1, 'Vui lòng chọn hình thức phỏng vấn'),
    scheduled_date: z.string().min(1, 'Vui lòng chọn ngày'),
    scheduled_time: z.string().min(1, 'Vui lòng chọn giờ'),
    duration_minutes: z.number().min(15, 'Tối thiểu 15 phút'),
    location: z.string().optional(),
    meeting_link: z.string().optional(),
    notes: z.string().optional(),
});

type InterviewFormValues = z.infer<typeof interviewSchema>;

interface CreateInterviewModalProps {
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

const getApplicationCandidateName = (application: any) => {
    return (
        application?.candidate_name ||
        application?.recruiter_name ||
        application?.candidate?.full_name ||
        application?.recruiter?.user?.full_name ||
        'Ứng viên'
    );
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

    return 'Có lỗi xảy ra khi tạo lịch.';
};

export function CreateInterviewModal({ open, onOpenChange }: CreateInterviewModalProps) {
    const queryClient = useQueryClient();

    const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
        queryKey: ['interviewCandidates'],
        queryFn: () => applicationService.list({ page_size: 100 }).then(r => r.data.results),
        enabled: open
    });

    const { data: types, isLoading: isLoadingTypes } = useQuery({
        queryKey: ['interviewTypes'],
        queryFn: () => companyService.listInterviewTypes().then(r => r.data),
        enabled: open
    });

    const candidateOptions = toArray<any>(candidates);
    const interviewTypeOptions = toArray<any>(types);

    const form = useForm<InterviewFormValues>({
        resolver: zodResolver(interviewSchema),
        defaultValues: {
            candidate_id: '',
            type: '',
            scheduled_date: '',
            scheduled_time: '09:00',
            duration_minutes: 60,
            location: '',
            meeting_link: '',
            notes: '',
        },
    });

    const watchType = form.watch('type');
    const selectedInterviewType = interviewTypeOptions.find((type: any) => String(type.id) === watchType);
    const interviewMode = inferInterviewMode(selectedInterviewType);

    const mutation = useMutation({
        mutationFn: (data: any) => companyService.createInterview(data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyInterviews'] });
            toast.success('Đã tạo lịch phỏng vấn thành công!');
            form.reset();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error));
        }
    });

    const onSubmit = (values: InterviewFormValues) => {
        // Format date and time to ISO
        let scheduled_at;
        try {
            scheduled_at = new Date(`${values.scheduled_date}T${values.scheduled_time}`).toISOString();
        } catch (e) {
            toast.error('Ngày giờ không hợp lệ');
            return;
        }

        const normalizedNotes = [
            interviewMode === 'onsite' && values.location ? `Địa điểm phỏng vấn: ${values.location}` : null,
            values.notes?.trim() || null,
        ]
            .filter(Boolean)
            .join('\n\n');

        const payload = {
            scheduled_at,
            application_id: Number(values.candidate_id),
            interview_type_id: Number(values.type),
            duration_minutes: values.duration_minutes,
            notes: normalizedNotes || undefined,
            meeting_link: values.meeting_link || undefined,
        };

        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 shadow-2xl shadow-slate-200/70">
                <DialogHeader>
                    <DialogTitle className="text-xl text-slate-900">Xếp lịch phỏng vấn</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Lên lịch phỏng vấn mới với ứng viên. Thông báo sẽ được gửi tự động.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="candidate_id">Ứng viên <span className="text-red-500">*</span></Label>
                            <Select
                                onValueChange={(value) => form.setValue('candidate_id', value)}
                                value={form.watch('candidate_id')}
                            >
                                <SelectTrigger className="w-full min-h-[56px] h-auto items-start bg-slate-50 border-slate-200 text-slate-900 py-2">
                                    <SelectValue placeholder="Chọn ứng viên..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                    {isLoadingCandidates ? (
                                        <div className="p-2 text-sm text-center text-slate-500">Đang tải...</div>
                                    ) : (
                                        candidateOptions.map((cand: any) => (
                                            <SelectItem key={cand.id} value={String(cand.id)}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">
                                                        {getApplicationCandidateName(cand)}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {cand.job_title || cand.job?.title || 'Chưa có vị trí'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.candidate_id && (
                                <p className="text-red-500 text-xs">{form.formState.errors.candidate_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Hình thức <span className="text-red-500">*</span></Label>
                            <Select
                                onValueChange={(value) => form.setValue('type', value)}
                                value={form.watch('type')}
                            >
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
                            {form.formState.errors.type && (
                                <p className="text-red-500 text-xs">{form.formState.errors.type.message}</p>
                            )}
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
                                    className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
                                    {...form.register('scheduled_date')}
                                />
                            </div>
                            {form.formState.errors.scheduled_date && (
                                <p className="text-red-500 text-xs">{form.formState.errors.scheduled_date.message}</p>
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
                                <p className="text-red-500 text-xs">{form.formState.errors.scheduled_time.message}</p>
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
                                        placeholder={interviewMode === 'video' ? "https://meet.google.com/..." : "Nhập số điện thoại..."}
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
                            Tạo lịch phỏng vấn
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
