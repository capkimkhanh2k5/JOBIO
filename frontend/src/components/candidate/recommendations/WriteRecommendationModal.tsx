import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService } from '@/services/candidateService';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
    relationship: z.string().min(1, 'Vui lòng chọn mối quan hệ'),
    content: z.string().min(20, 'Nội dung đánh giá cần ít nhất 20 ký tự').max(1000, 'Nội dung tối đa 1000 ký tự'),
});

type FormData = z.infer<typeof schema>;

interface WriteRecommendationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidateId: number;
    candidateName: string;
}

export const WriteRecommendationModal = ({ open, onOpenChange, candidateId, candidateName }: WriteRecommendationModalProps) => {
    const queryClient = useQueryClient();

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            relationship: '',
            content: '',
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => recommendationService.writeRecommendation(candidateId, data),
        onSuccess: () => {
            toast.success(`Đã gửi lời giới thiệu cho ${candidateName}`);
            queryClient.invalidateQueries({ queryKey: ['recommendations', candidateId] });
            onOpenChange(false);
            form.reset();
        },
        onError: () => {
            toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
        }
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) form.reset();
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Viết lời giới thiệu</DialogTitle>
                    <DialogDescription>
                        Viết lời giới thiệu chuyên môn dành cho <strong className="text-foreground">{candidateName}</strong>. Lời giới thiệu này sẽ hiển thị trên hồ sơ của họ (nếu họ đồng ý).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="relationship"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mối quan hệ đối với {candidateName}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò của bạn..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Quản lý trực tiếp">Quản lý trực tiếp</SelectItem>
                                            <SelectItem value="Quản lý cấp cao hơn">Quản lý cấp cao hơn</SelectItem>
                                            <SelectItem value="Đồng nghiệp cùng nhóm">Đồng nghiệp cùng nhóm</SelectItem>
                                            <SelectItem value="Đồng nghiệp khác bộ phận">Đồng nghiệp khác bộ phận</SelectItem>
                                            <SelectItem value="Khách hàng / Đối tác">Khách hàng / Đối tác</SelectItem>
                                            <SelectItem value="Mentor / Người hướng dẫn">Mentor / Người hướng dẫn</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nội dung giới thiệu</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi nhận những điểm mạnh, kỹ năng hoặc các thành tựu nổi bật..."
                                            className="min-h-[140px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-xs text-muted-foreground text-right mt-1">
                                        {field.value.length}/1000
                                    </p>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Đang gửi...' : 'Gửi lời giới thiệu'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
