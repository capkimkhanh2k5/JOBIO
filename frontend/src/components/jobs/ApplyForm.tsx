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
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, FileText, Send, CheckCircle2 } from 'lucide-react';
import { mockApi } from '@/services/mockApi';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const formSchema = z.object({
    cv_id: z.string().min(1, "Vui lòng chọn CV của bạn"),
    cover_letter: z.string().max(1000, "Thư giới thiệu tối đa 1000 ký tự").optional(),
});

interface ApplyFormProps {
    jobId: string;
    jobTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ApplyForm = ({ jobId, jobTitle, isOpen, onClose }: ApplyFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Fetch user CVs
    const { data: cvs, isLoading: isLoadingCvs } = useQuery({
        queryKey: ['recruiter-cvs'],
        queryFn: () => mockApi.getRecruiterCvs('user1'),
        enabled: isOpen
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cv_id: "",
            cover_letter: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            await mockApi.applyForJob({
                jobId,
                cvId: values.cv_id,
                coverLetter: values.cover_letter
            });
            setIsSuccess(true);
            toast.success("Nộp đơn ứng tuyển thành công!");
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                form.reset();
            }, 3000);
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] glass border-white/20 p-0 overflow-hidden rounded-2xl">
                {isSuccess ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-20 w-20 rounded-full bg-aurora-lime/20 flex items-center justify-center text-aurora-lime mb-6 shadow-glow"
                        >
                            <CheckCircle2 size={40} />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-2">Ứng tuyển thành công!</h3>
                        <p className="text-muted-foreground mb-8">
                            Hồ sơ của bạn đã được gửi tới <strong>{jobTitle}</strong>. Nhà tuyển dụng sẽ phản hồi sớm nhất có thể.
                        </p>
                        <Button className="w-full bg-primary" onClick={onClose}>Đóng</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="text-2xl font-bold">Ứng tuyển công việc</DialogTitle>
                            <DialogDescription>
                                Bạn đang ứng tuyển cho vị trí <span className="text-primary font-bold">{jobTitle}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
                                <FormField
                                    control={form.control}
                                    name="cv_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-bold flex items-center gap-2">
                                                <FileText size={16} />
                                                Chọn hồ sơ (CV)
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="glass border-white/20 h-12">
                                                        <SelectValue placeholder={isLoadingCvs ? "Đang tải danh sách CV..." : "Chọn CV trong hồ sơ của bạn"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="glass border-white/20">
                                                    {cvs?.map((cv) => (
                                                        <SelectItem key={cv.id} value={cv.id} className="focus:bg-primary/10">
                                                            {cv.name} (Tải lên {cv.uploaded_at})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cover_letter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground font-bold">Thư giới thiệu (Tùy chọn)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Hãy tóm tắt ngắn gọn lý do bạn phù hợp với vị trí này..."
                                                    className="glass border-white/20 min-h-[150px] resize-none focus-visible:ring-primary"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex justify-end mt-1">
                                                <span className="text-[10px] text-muted-foreground">{(field.value?.length || 0)}/1000 ký tự</span>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter className="pt-4 mt-4 border-t border-white/10">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                        className="h-11 rounded-xl"
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-primary h-11 rounded-xl min-w-[120px] font-bold"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Gửi hồ sơ
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
