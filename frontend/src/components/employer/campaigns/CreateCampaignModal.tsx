import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const campaignSchema = z.object({
    campaign_name: z.string().min(5, 'Tên chiến dịch phải có ít nhất 5 ký tự'),
    description: z.string().optional(),
    campaign_type: z.string().min(1, 'Vui lòng chọn loại chiến dịch'),
    start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    end_date: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
    budget: z.number().min(0, 'Ngân sách phải lớn hơn hoặc bằng 0'),
    target_positions: z.number().min(1, 'Số lượng tuyển phải lớn hơn 0'),
    target_audience: z.string().optional(),
}).refine(data => new Date(data.end_date) >= new Date(data.start_date), {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["end_date"]
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CampaignFormValues) => Promise<void>;
    initialData?: Partial<CampaignFormValues>;
}

export function CreateCampaignModal({ isOpen, onClose, onSubmit, initialData }: CreateCampaignModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CampaignFormValues>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            campaign_name: '',
            description: '',
            campaign_type: '',
            start_date: '',
            end_date: '',
            budget: 0,
            target_positions: 1,
            target_audience: '',
            ...initialData
        }
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                campaign_name: '',
                description: '',
                campaign_type: '',
                start_date: '',
                end_date: '',
                budget: 0,
                target_positions: 1,
                target_audience: '',
                ...initialData
            });
        }
    }, [isOpen, initialData, form]);

    const handleSubmit = async (values: CampaignFormValues) => {
        try {
            setIsSubmitting(true);
            await onSubmit(values);
            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to submit campaign", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-violet-600 dark:from-cyan-400 dark:to-violet-400">
                        {initialData?.campaign_name ? 'Chỉnh sửa chiến dịch' : 'Tạo chiến dịch mới'}
                    </DialogTitle>
                    <DialogDescription>
                        Điền thông tin chi tiết về chiến dịch tuyển dụng để tiếp cận ứng viên mục tiêu.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="campaign_name"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Tên chiến dịch</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Tuyển dụng lập trình viên Q1/2024" {...field} className="bg-white/50 dark:bg-slate-950/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="campaign_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại chiến dịch</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/50 dark:bg-slate-950/50">
                                                    <SelectValue placeholder="Chọn loại chiến dịch" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-slate-900">
                                                <SelectItem value="mass_hiring">Mass Hiring (Tuyển hàng loạt)</SelectItem>
                                                <SelectItem value="campus">Campus Tour (Sinh viên mới)</SelectItem>
                                                <SelectItem value="referral">Referral Bonus (Nội bộ giới thiệu)</SelectItem>
                                                <SelectItem value="social_media">Social Media (Qua MXH)</SelectItem>
                                                <SelectItem value="job_fair">Job Fair (Hội chợ việc làm)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="budget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tổng ngân sách (USD)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} className="bg-white/50 dark:bg-slate-950/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày bắt đầu</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-white/50 dark:bg-slate-950/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày kết thúc</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-white/50 dark:bg-slate-950/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="target_positions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mục tiêu tuyển (Số lượng)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} className="bg-white/50 dark:bg-slate-950/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="target_audience"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Đối tượng mục tiêu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Frontend Engineers, Fresher React..." {...field} className="bg-white/50 dark:bg-slate-950/50" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Mô tả chiến dịch</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Mô tả nội dung và cách thức thực hiện..."
                                                className="resize-none h-24 bg-white/50 dark:bg-slate-950/50"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Hủy bỏ
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-700 hover:to-violet-700 text-white shadow-lg">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {initialData?.campaign_name ? 'Cập nhật' : 'Tạo chiến dịch'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
