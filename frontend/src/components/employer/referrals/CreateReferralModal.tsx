import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const referralSchema = z.object({
    job_id: z.string().min(1, 'Vui lòng chọn công việc'),
    referred_name: z.string().min(2, 'Tên người được giới thiệu quá ngắn'),
    referred_email: z.string().email('Email không hợp lệ'),
    notes: z.string().optional(),
});

type ReferralFormValues = z.infer<typeof referralSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateReferralModal({ isOpen, onClose }: Props) {
    const queryClient = useQueryClient();

    // Lấy danh sách jobs của employer để chọn
    const { data: jobsResponse, isLoading: isLoadingJobs } = useQuery({
        queryKey: ['employer-jobs'],
        queryFn: () => apiClient.getJobs({}),
    });

    const jobs = jobsResponse?.items || [];

    const form = useForm<ReferralFormValues>({
        resolver: zodResolver(referralSchema),
        defaultValues: {
            job_id: '',
            referred_name: '',
            referred_email: '',
            notes: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: apiClient.createReferral,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referrals'] });
            toast.success('Giới thiệu ứng viên thành công!');
            form.reset();
            onClose();
        },
        onError: () => {
            toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
        },
    });

    const onSubmit = (data: ReferralFormValues) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Giới thiệu ứng viên</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Điền thông tin ứng viên bạn muốn giới thiệu cho các vị trí đang mở.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="job_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vị trí công việc</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Chọn vị trí công việc" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-popover/95 backdrop-blur-xl border-border max-h-60">
                                            {isLoadingJobs ? (
                                                <div className="p-2 text-sm text-center text-muted-foreground">Đang tải...</div>
                                            ) : (
                                                jobs.map((job: any) => (
                                                    <SelectItem key={job.id} value={job.id}>
                                                        {job.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="referred_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ và tên ứng viên</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập họ tên" className="bg-white/5 border-white/10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="referred_email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email liên hệ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="email@example.com" className="bg-white/5 border-white/10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú (Tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Thêm thông tin vì sao ứng viên này phù hợp..."
                                            className="bg-white/5 border-white/10 resize-none h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/5">
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                            >
                                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Gửi giới thiệu
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
