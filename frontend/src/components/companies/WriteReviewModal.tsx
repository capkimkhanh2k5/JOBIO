import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockReviewService } from '@/services/mockApi';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
    rating: z.number().min(1, 'Vui lòng chọn đánh giá tổng quan').max(5),
    work_environment_rating: z.number().min(1, 'Vui lòng đánh giá').max(5),
    salary_benefits_rating: z.number().min(1, 'Vui lòng đánh giá').max(5),
    management_rating: z.number().min(1, 'Vui lòng đánh giá').max(5),
    career_development_rating: z.number().min(1, 'Vui lòng đánh giá').max(5),
    title: z.string().min(10, 'Tiêu đề ít nhất 10 ký tự').max(100, 'Tối đa 100 ký tự'),
    content: z.string().min(20, 'Nội dung ít nhất 20 ký tự').max(1000, 'Tối đa 1000 ký tự'),
    pros: z.string().max(500).optional(),
    cons: z.string().max(500).optional(),
    employment_status: z.enum(['current', 'former', 'intern']),
    position: z.string().optional(),
    employment_duration: z.string().optional(),
    is_anonymous: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
    companyId: number;
    isOpen: boolean;
    onClose: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full p-0.5 transition-transform hover:scale-110"
                >
                    <Star
                        size={24}
                        className={`transition-colors duration-200 ${star <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

function MiniStarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    className="focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                >
                    <Star
                        size={16}
                        className={`transition-colors duration-200 ${star <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

export function WriteReviewModal({ companyId, isOpen, onClose }: Props) {
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rating: 0,
            work_environment_rating: 0,
            salary_benefits_rating: 0,
            management_rating: 0,
            career_development_rating: 0,
            title: '',
            content: '',
            pros: '',
            cons: '',
            employment_status: 'current',
            position: '',
            employment_duration: '',
            is_anonymous: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: FormValues) => mockReviewService.createReview(companyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-reviews', companyId] });
            toast.success('Đã gửi đánh giá thành công. Đánh giá của bạn sẽ được hiển thị ngay lập tức (Mock).');
            form.reset();
            onClose();
        },
        onError: () => {
            toast.error('Có lỗi xảy ra, vui lòng thử lại.');
        },
    });

    function onSubmit(data: FormValues) {
        createMutation.mutate(data);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white/60 backdrop-blur-xl border-white/50 shadow-2xl rounded-3xl p-0">
                <div className="p-6 pb-2 border-b border-gray-100/50">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">Viết đánh giá công ty</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Chia sẻ trải nghiệm làm việc của bạn để giúp ứng viên khác.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Overall Rating Section */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-100/50">
                                <FormField
                                    control={form.control}
                                    name="rating"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col items-center justify-center space-y-3">
                                            <FormLabel className="text-sm font-bold text-amber-900 block text-center">
                                                Đánh giá tổng quan *
                                            </FormLabel>
                                            <FormControl>
                                                <StarRating value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage className="text-center" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Detailed Ratings */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="work_environment_rating" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                        <FormLabel className="mb-0 text-sm text-gray-700">Môi trường</FormLabel>
                                        <FormControl>
                                            <div className="flex-shrink-0"><MiniStarRating value={field.value} onChange={field.onChange} /></div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="salary_benefits_rating" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                        <FormLabel className="mb-0 text-sm text-gray-700">Lương & Phúc lợi</FormLabel>
                                        <FormControl>
                                            <div className="flex-shrink-0"><MiniStarRating value={field.value} onChange={field.onChange} /></div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="management_rating" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                        <FormLabel className="mb-0 text-sm text-gray-700">Quản lý</FormLabel>
                                        <FormControl>
                                            <div className="flex-shrink-0"><MiniStarRating value={field.value} onChange={field.onChange} /></div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="career_development_rating" render={({ field }) => (
                                    <FormItem className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                        <FormLabel className="mb-0 text-sm text-gray-700">Đào tạo</FormLabel>
                                        <FormControl>
                                            <div className="flex-shrink-0"><MiniStarRating value={field.value} onChange={field.onChange} /></div>
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            {(form.formState.errors.work_environment_rating ||
                                form.formState.errors.salary_benefits_rating ||
                                form.formState.errors.management_rating ||
                                form.formState.errors.career_development_rating) && (
                                    <p className="text-[0.8rem] font-medium text-destructive mt-1">Vui lòng cung cấp đầy đủ các đánh giá chi tiết.</p>
                                )}

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-gray-700">Tiêu đề đánh giá *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tóm tắt ngắn gọn trải nghiệm..." className="bg-white/70" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-gray-700">Nội dung chi tiết *</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Chia sẻ chi tiết về công việc, văn hóa, sếp, đồng nghiệp..."
                                                    className="resize-none h-28 bg-white/70"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="pros"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-emerald-700">Ưu điểm</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Điều bạn thích..." className="resize-none h-20 bg-emerald-50/30 border-emerald-100" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="cons"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-rose-700">Nhược điểm</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Điều cần cải thiện..." className="resize-none h-20 bg-rose-50/30 border-rose-100" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                                <h4 className="text-sm font-semibold text-slate-800">Thông tin cá nhân (Tùy chọn)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="employment_status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-slate-600">Trạng thái</FormLabel>
                                                <FormControl>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        {...field}
                                                    >
                                                        <option value="current">Đang làm việc</option>
                                                        <option value="former">Đã nghỉ làm</option>
                                                        <option value="intern">Thực tập sinh</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-slate-600">Vị trí/Chức vụ</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="VD: Frontend Dev" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="employment_duration"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-slate-600">Thời gian làm (Năm)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="VD: 2 năm" className="bg-white" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="is_anonymous"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm mt-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-semibold text-slate-800">Đánh giá ẩn danh</FormLabel>
                                                <p className="text-[11px] text-slate-500">Tên và avatar của bạn sẽ không hiển thị công khai</p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl px-6">
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="bg-primary hover:bg-primary/90 rounded-xl px-8 shadow-md shadow-primary/20"
                                >
                                    {createMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
