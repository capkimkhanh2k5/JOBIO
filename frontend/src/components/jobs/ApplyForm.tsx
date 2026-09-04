import { useEffect, useState } from 'react';
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
import { candidateService } from '@/services/candidateService';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

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
    const { user, isAuthenticated, updateUser } = useUserStore();
    const currentJobPath = `/jobs/${jobId}`;

    const { data: candidateProfile } = useQuery({
        queryKey: ['candidate-profile-me', user?.id],
        queryFn: () => candidateService.getMyProfile().then((r) => r.data),
        enabled: isOpen && isAuthenticated && user?.role === 'candidate' && !user?.candidate_id,
        staleTime: 60_000,
    });

    const candidateId = user?.candidate_id ?? candidateProfile?.id;

    useEffect(() => {
        if (candidateProfile?.id && user?.candidate_id !== candidateProfile.id) {
            updateUser({ candidate_id: candidateProfile.id });
        }
    }, [candidateProfile?.id, updateUser, user?.candidate_id]);

    // Fetch user CVs
    const { data: cvs, isLoading: isLoadingCvs } = useQuery({
        queryKey: ['candidate-cvs', candidateId],
        queryFn: () => cvService.list(candidateId!).then(r => r.data),
        enabled: isOpen && isAuthenticated && !!user && !!candidateId
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cv_id: "",
            cover_letter: "",
        },
    });

    useEffect(() => {
        if (!isOpen || form.getValues('cv_id') || !cvs?.length) return;
        const defaultCv = cvs.find((cv: any) => cv.is_default) ?? cvs[0];
        if (defaultCv?.id) {
            form.setValue('cv_id', String(defaultCv.id), { shouldValidate: true });
        }
    }, [cvs, form, isOpen]);

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
        } catch (error: any) {
            console.error("Apply error:", error.response?.data);
            const data = error.response?.data;
            let errMsg = "Gửi hồ sơ thất bại, vui lòng thử lại.";
            if (data) {
                if (data.detail) errMsg = data.detail;
                else if (typeof data === 'object') {
                    const firstKey = Object.keys(data)[0];
                    if (Array.isArray(data[firstKey])) {
                        errMsg = data[firstKey][0];
                    }
                }
            }
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] bg-card border border-border/60 p-0 overflow-hidden rounded-[24px] shadow-2xl">
                <AnimatePresence mode="wait">
                    {!isAuthenticated ? (
                        <motion.div
                            key="guest-state"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-10 flex flex-col items-center text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-primary/8 flex items-center justify-center text-primary mb-6">
                                <UserPlus size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-2">Đăng nhập để ứng tuyển</h3>
                            <p className="text-muted-foreground mb-8 max-w-[320px]">
                                Bạn cần có tài khoản ứng viên để nộp hồ sơ trực tiếp cho công việc này.
                            </p>
                            <div className="flex flex-col w-full gap-3">
                                <Button
                                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary font-bold text-white shadow-lg shadow-primary/12"
                                    asChild
                                >
                                    <Link to={`/auth?redirect=${encodeURIComponent(currentJobPath)}`} state={{ from: currentJobPath }}>
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Đăng nhập ngay
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl border-border text-muted-foreground font-bold"
                                    asChild
                                >
                                    <Link to={`/auth?mode=register&redirect=${encodeURIComponent(currentJobPath)}`} state={{ from: currentJobPath }}>
                                        Chưa có tài khoản? Đăng ký
                                    </Link>
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
                            <h3 className="text-2xl font-black text-foreground mb-2">Đã gửi hồ sơ!</h3>
                            <p className="text-muted-foreground mb-8">
                                Tuyệt vời! Bạn vừa ứng tuyển vào vị trí <br /><strong className="text-primary">{jobTitle}</strong>.
                            </p>
                            <div className="w-full p-4 rounded-xl bg-muted border border-border/60 mb-8 flex items-center gap-3 text-left">
                                <div className="p-2 rounded-lg bg-card shadow-sm">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <p className="text-xs text-muted-foreground">Mẹo: Bạn có thể theo dõi trạng thái ứng tuyển trong mục <strong>Hồ sơ của tôi</strong>.</p>
                            </div>
                            <Button className="w-full h-12 rounded-xl bg-foreground/90 hover:bg-foreground/80" onClick={onClose}>Đóng</Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <DialogHeader className="p-8 pb-0">
                                <DialogTitle className="text-2xl font-black text-foreground">Ứng tuyển ngay</DialogTitle>
                                <DialogDescription className="text-muted-foreground mt-1">
                                    Vị trí: <span className="font-bold text-primary">{jobTitle}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-8">
                                    <FormField
                                        control={form.control}
                                        name="cv_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground font-bold flex items-center gap-2 mb-2">
                                                    <FileText size={16} className="text-primary" />
                                                    Chọn CV của bạn
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-muted border-border h-12 rounded-xl focus:ring-primary">
                                                            <SelectValue placeholder={isLoadingCvs ? "Đang tải hồ sơ..." : "Chọn CV tải lên"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-card border-border/60 rounded-xl shadow-xl">
                                                        {cvs?.map((cv: any) => (
                                                            <SelectItem key={cv.id} value={cv.id.toString()} className="focus:bg-primary/8 focus:text-primary rounded-lg m-1">
                                                                <div className="flex flex-col items-start">
                                                                    <span className="font-bold">{cv.cv_name || cv.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground">Cập nhật: {new Date(cv.updated_at).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        {cvs?.length === 0 && (
                                                            <div className="p-4 text-center">
                                                                <p className="text-sm text-muted-foreground mb-2">Bạn chưa có CV nào</p>
                                                                <Button variant="link" className="text-primary p-0 h-auto font-bold" asChild>
                                                                    <Link to="/candidate/cv">Tải CV ngay</Link>
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
                                                    <FormLabel className="text-foreground font-bold">Thư giới thiệu (tùy chọn)</FormLabel>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{(field.value?.length || 0)}/1000</span>
                                                </div>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Nêu bật những điểm mạnh của bản thân phù hợp với công việc..."
                                                        className="bg-muted border-border rounded-xl min-h-[140px] resize-none focus-visible:ring-primary"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter className="pt-4 border-t border-border/30">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="h-12 rounded-xl text-muted-foreground font-bold px-6"
                                        >
                                            Để sau
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-primary hover:bg-primary h-12 rounded-xl min-w-[160px] font-black shadow-lg shadow-primary/12 flex-1 md:flex-none"
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
