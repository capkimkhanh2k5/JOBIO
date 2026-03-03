import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CalendarIcon, Clock, Link as LinkIcon, MapPin, Loader2 } from 'lucide-react';
import { employerService } from '@/services/employerService';
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

export function CreateInterviewModal({ open, onOpenChange }: CreateInterviewModalProps) {
    const queryClient = useQueryClient();

    const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
        queryKey: ['interviewCandidates'],
        queryFn: () => applicationService.list({ page_size: 100 }).then(r => r.data.results),
        enabled: open
    });

    const { data: types, isLoading: isLoadingTypes } = useQuery({
        queryKey: ['interviewTypes'],
        queryFn: () => employerService.listInterviewTypes().then(r => r.data),
        enabled: open
    });

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

    const mutation = useMutation({
        mutationFn: (data: any) => employerService.createInterview(data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employerInterviews'] });
            toast.success('Đã tạo lịch phỏng vấn thành công!');
            form.reset();
            onOpenChange(false);
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi tạo lịch.');
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

        // Find selected candidate to get job info
        const candidate = candidates?.find((c: any) => c.id === values.candidate_id);

        const payload = {
            ...values,
            scheduled_at,
            candidate_name: candidate?.name || 'Unknown',
            job_title: candidate?.job_title || 'Unknown Position',
            job_id: candidate?.job_id || '',
        };

        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl">Xếp lịch phỏng vấn</DialogTitle>
                    <DialogDescription>
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
                                <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Chọn ứng viên..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    {isLoadingCandidates ? (
                                        <div className="p-2 text-sm text-center text-slate-500">Đang tải...</div>
                                    ) : (
                                        candidates?.map((cand: any) => (
                                            <SelectItem key={cand.id} value={cand.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-white">{cand.name}</span>
                                                    <span className="text-xs text-slate-500">{cand.job_title}</span>
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
                                <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Chọn hình thức..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    {isLoadingTypes ? (
                                        <div className="p-2 text-sm text-center text-slate-500">Đang tải...</div>
                                    ) : (
                                        types?.map((type: any) => (
                                            <SelectItem key={type.id} value={type.id}>
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
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    {...form.register('scheduled_time')}
                                />
                            </div>
                            {form.formState.errors.scheduled_time && (
                                <p className="text-red-500 text-xs">{form.formState.errors.scheduled_time.message}</p>
                            )}
                        </div>

                        {watchType === 'onsite' && (
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="location">Địa điểm phỏng vấn <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <Textarea
                                        id="location"
                                        placeholder="Nhập địa chỉ chi tiết hoặc phòng họp..."
                                        className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[60px]"
                                        {...form.register('location')}
                                    />
                                </div>
                            </div>
                        )}

                        {(watchType === 'video' || watchType === 'phone') && (
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="meeting_link">Link meeting / Số điện thoại <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        id="meeting_link"
                                        placeholder={watchType === 'video' ? "https://meet.google.com/..." : "Nhập số điện thoại..."}
                                        className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[80px]"
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
