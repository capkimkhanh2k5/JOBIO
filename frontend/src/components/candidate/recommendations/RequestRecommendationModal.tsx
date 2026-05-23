import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
    FormDescription,
} from '@/components/ui/form';
import { toast } from 'sonner';

// Assuming we had a connection picker, we might use a Command or Select. 
// For simplicity, we'll assume the user selects from a list or we pass a specific connection in.
// If it's a general request modal from the profile, they might need to select who to ask.
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginatedResponse } from '@/types/api';

const schema = z.object({
    connectionId: z.string().min(1, 'Vui lòng chọn người bạn muốn xin lời giới thiệu'),
    message: z.string().min(10, 'Tin nhắn quá ngắn').max(500, 'Tin nhắn tối đa 500 ký tự'),
});

type FormData = z.infer<typeof schema>;

interface ConnectionPerson {
    id: number;
    full_name: string;
    current_company?: string | null;
}

interface ConnectionItem {
    id: number;
    requester: ConnectionPerson;
    recipient: ConnectionPerson;
}

interface RequestRecommendationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidateId: number;
}

export const RequestRecommendationModal = ({ open, onOpenChange, candidateId }: RequestRecommendationModalProps) => {

    // Fetch connections to populate the dropdown
    const { data: connectionsData, isLoading } = useQuery({
        queryKey: ['connections', candidateId, 'accepted'],
        queryFn: () => api.get<PaginatedResponse<ConnectionItem>>('/api/connections/').then(r => r.data),
        enabled: open,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultMessage = "Chào bạn, tôi đang cập nhật hồ sơ cá nhân và rất mong nhận được một lời giới thiệu ngắn từ bạn về khoảng thời gian làm việc chung của chúng ta. Cảm ơn bạn rất nhiều!";

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            connectionId: '',
            message: defaultMessage,
        },
    });

    const onSubmit = async (_data: FormData) => {
        setIsSubmitting(true);
        // Simulate sending a message/request to the connection
        await new Promise(resolve => setTimeout(resolve, 800));

        toast.success('Đã gửi yêu cầu xin lời giới thiệu thành công!');
        setIsSubmitting(false);
        onOpenChange(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) form.reset();
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Xin lời giới thiệu</DialogTitle>
                    <DialogDescription>
                        Gửi tin nhắn đến các connection của bạn (những người đã từng làm việc chung) để xin một lời giới thiệu cho hồ sơ của bạn.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField
                            control={form.control}
                            name="connectionId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Người nhận</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isLoading ? "Đang tải danh sách..." : "Chọn từ danh sách kết nối..."} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {connectionsData?.results?.map((conn) => {
                                                const target = conn.requester.id === candidateId ? conn.recipient : conn.requester;
                                                return (
                                                    <SelectItem key={conn.id} value={target.id.toString()}>
                                                        {target.full_name} {target.current_company ? `(${target.current_company})` : ''}
                                                    </SelectItem>
                                                );
                                            })}
                                            {(!connectionsData?.results || connectionsData.results.length === 0) && !isLoading && (
                                                <SelectItem value="empty" disabled>Bạn chưa có connection nào</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lời nhắn (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Bạn có thể chỉnh sửa lời nhắn mặc định này để phù hợp hơn.
                                    </FormDescription>
                                    <FormMessage />
                                    <p className="text-xs text-muted-foreground text-right mt-1">
                                        {field.value.length}/500
                                    </p>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isSubmitting || isLoading || (!connectionsData?.results?.length)}>
                                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
