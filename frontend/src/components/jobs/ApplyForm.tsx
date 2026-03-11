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
import { Loader2, FileText, Send, CheckCircle2, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { cvService } from '@/services/cvService';
import { applicationService } from '@/services/applicationService';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

const formSchema = z.object({
    cv_id: z.string().min(1, "Vui lòng chọn CV của bạn"),
    cover_letter: z.string().max(1000, "Thư giới thiệu tối đa 1000 ký tự").optional(),
});

interface ApplyFormProps {
    jobId: number;
    jobTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ApplyForm = ({ jobId, jobTitle, isOpen, onClose }: ApplyFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { user, isAuthenticated } = useUserStore();

    // Fetch user CVs
    const { data: cvs, isLoading: isLoadingCvs } = useQuery({
        queryKey: ['candidate-cvs', user?.id],
        queryFn: () => cvService.list().then(r => r.data), // No need to pass ID anymore if list() handles it via token
        enabled: isOpen && isAuthenticated && !!user
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
            await applicationService.create({
                job_id: jobId,
                cv_id: Number(values.cv_id),
                cover_letter: values.cover_letter,
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
            <DialogContent className="sm:max-w-[550px] bg-white border border-gray-100 p-0 overflow-hidden rounded-[24px] shadow-2xl">
                <AnimatePresence mode="wait">
                    {!isAuthenticated ? (
                        <motion.div
                            key="guest-state"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-10 flex flex-col items-center text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                                <UserPlus size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Đăng nhập để ứng tuyển</h3>
                            <p className="text-gray-500 mb-8 max-w-[320px]">
                                Bạn cần có tài khoản ứng viên để nộp hồ sơ trực tiếp cho công việc này.
                            </p>
                            <div className="flex flex-col w-full gap-3">
                                <Button
                                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-100"
                                    asChild
                                >
                                    <a href={`/login?redirect=/jobs/detail/${jobId}`}>
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Đăng nhập ngay
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-gray-200 text-gray-600 font-bold"
                                    asChild
                                >
                                    <a href="/register">Chưa có tài khoản? Đăng ký</a>
                                </Button>
                            </div>
                        </motion.div>
                    ) : isSuccess ? (
                        <motion.div
                            key="success-state"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-10 flex flex-col items-center text-center"
                        >
                            <div className="h-20 w-20 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 shadow-lg shadow-emerald-100">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Đã gửi hồ sơ!</h3>
                            <p className="text-gray-500 mb-8">
                                Tuyệt vời! Bạn vừa ứng tuyển vào vị trí <br /><strong className="text-indigo-600">{jobTitle}</strong>.
                            </p>
                            <div className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 mb-8 flex items-center gap-3 text-left">
                                <div className="p-2 rounded-lg bg-white shadow-sm">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                </div>
                                <p className="text-xs text-gray-500">Mẹo: Bạn có thể theo dõi trạng thái ứng tuyển trong mục <strong>Hồ sơ của tôi</strong>.</p>
                            </div>
                            <Button className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800" onClick={onClose}>Đóng</Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <DialogHeader className="p-8 pb-0">
                                <DialogTitle className="text-2xl font-black text-gray-900">Ứng tuyển ngay</DialogTitle>
                                <DialogDescription className="text-gray-500 mt-1">
                                    Vị trí: <span className="font-bold text-indigo-600">{jobTitle}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-8">
                                    <FormField
                                        control={form.control}
                                        name="cv_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-900 font-bold flex items-center gap-2 mb-2">
                                                    <FileText size={16} className="text-indigo-500" />
                                                    Chọn CV của bạn
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-gray-50 border-gray-200 h-12 rounded-xl focus:ring-indigo-500">
                                                            <SelectValue placeholder={isLoadingCvs ? "Đang tải hồ sơ..." : "Chọn CV tải lên"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                                                        {cvs?.map((cv: any) => (
                                                            <SelectItem key={cv.id} value={cv.id.toString()} className="focus:bg-indigo-50 focus:text-indigo-600 rounded-lg m-1">
                                                                <div className="flex flex-col items-start">
                                                                    <span className="font-bold">{cv.cv_name || cv.name}</span>
                                                                    <span className="text-[10px] text-slate-500">Cập nhật: {new Date(cv.updated_at).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        {cvs?.length === 0 && (
                                                            <div className="p-4 text-center">
                                                                <p className="text-sm text-gray-500 mb-2">Bạn chưa có CV nào</p>
                                                                <Button variant="link" className="text-indigo-600 p-0 h-auto font-bold" asChild>
                                                                    <a href="/profile/cv">Tải CV ngay</a>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cover_letter"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex justify-between items-center mb-2">
                                                    <FormLabel className="text-gray-900 font-bold">Thư giới thiệu (tùy chọn)</FormLabel>
                                                    <span className="text-[10px] font-bold text-slate-500">{(field.value?.length || 0)}/1000</span>
                                                </div>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Nêu bật những điểm mạnh của bản thân phù hợp với công việc..."
                                                        className="bg-gray-50 border-gray-200 rounded-xl min-h-[140px] resize-none focus-visible:ring-indigo-600"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter className="pt-4 border-t border-gray-50">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="h-12 rounded-xl text-gray-500 font-bold px-6"
                                        >
                                            Để sau
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl min-w-[160px] font-black shadow-lg shadow-indigo-100 flex-1 md:flex-none"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Đang nộp...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Nộp hồ sơ ngay
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};

