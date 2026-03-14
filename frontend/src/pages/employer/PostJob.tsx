import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { jobService } from '@/services/jobService';
import { WizardProgress } from '@/components/employer/wizard/WizardProgress';
import { Step1BasicInfo } from '@/components/employer/wizard/Step1BasicInfo';
import { Step2Description } from '@/components/employer/wizard/Step2Description';
import { Step3Location } from '@/components/employer/wizard/Step3Location';
import { Step4SeoReview } from '@/components/employer/wizard/Step4SeoReview';
import type { PostJobFormData } from '@/types/postJob';
import {
    Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, SendHorizonal, X, Clock } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────
const step1Schema = z.object({
    title: z.string().min(5, 'Tối thiểu 5 ký tự').max(255, 'Tối đa 255 ký tự'),
    category_id: z.string().min(1, 'Vui lòng chọn lĩnh vực'),
    job_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const),
    level: z.enum(['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'] as const),
    quantity: z.number().min(1, 'Tối thiểu 1').max(999),
    salary_min: z.number().nullable().optional(),
    salary_max: z.number().nullable().optional(),
    salary_currency: z.enum(['VND', 'USD'] as const),
    is_salary_visible: z.boolean(),
    experience_min: z.number().nullable().optional(),
    experience_max: z.number().nullable().optional(),
    deadline: z.string().min(1, 'Vui lòng chọn hạn nộp hồ sơ'),
    is_remote: z.boolean(),
});

const step2Schema = z.object({
    description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự'),
    requirements: z.string().min(10, 'Yêu cầu cần ít nhất 10 ký tự'),
    benefits: z.string().optional(),
    skills: z.array(z.object({
        skill_id: z.string(),
        skill_name: z.string(),
        is_required: z.boolean(),
        proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'] as const),
    })),
});

const fullSchema = step1Schema.merge(step2Schema).merge(
    z.object({
        locations: z.array(z.object({
            id: z.string(),
            province_id: z.string(),
            province_name: z.string(),
            commune_id: z.string(),
            commune_name: z.string(),
            address_line: z.string(),
            is_primary: z.boolean(),
        })).min(1, 'Cần ít nhất 1 địa điểm'),
        seo_title: z.string().optional(),
        seo_description: z.string().optional(),
        seo_keywords: z.array(z.string()).optional(),
    })
);

// Re-export so step components can import from here if needed
export type { PostJobFormData };

// ─── Step validators (partial validation) ─────────────────────────────────────
const STEP_FIELDS: Record<number, (keyof PostJobFormData)[]> = {
    1: ['title', 'category_id', 'job_type', 'level', 'quantity', 'deadline'],
    2: ['description', 'requirements'],
    3: ['locations'],
    4: [],
};

// ─── Page-level slide variants ─────────────────────────────────────────────────
const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PostJob() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [draftId, setDraftId] = useState<string | null>(null);
    const lastSavedRef = useRef<Date | null>(null);

    const {
        control, handleSubmit, trigger, getValues, formState: { errors, isDirty },
    } = useForm<PostJobFormData>({
        resolver: zodResolver(fullSchema) as any,
        defaultValues: {
            title: '',
            category_id: '',
            job_type: 'full_time',
            level: 'middle',
            quantity: 1,
            salary_min: null,
            salary_max: null,
            salary_currency: 'USD',
            is_salary_visible: true,
            experience_min: null,
            experience_max: null,
            deadline: '',
            is_remote: false,
            description: '',
            requirements: '',
            benefits: '',
            skills: [],
            locations: [],
            seo_title: '',
            seo_description: '',
            seo_keywords: [],
        },
        mode: 'onChange',
    });

    // ── Auto-save draft every 30s ──────────────────────────────────────────────
    const autoSaveMutation = useMutation({
        mutationFn: async (data: PostJobFormData) => {
            if (draftId) {
                return jobService.update(Number(draftId), { ...data, status: 'draft' } as any).then(r => r.data);
            }
            const res = await jobService.create({ ...data, status: 'draft' } as any).then(r => r.data);
            return res;
        },
        onSuccess: (res: any) => {
            if (!draftId && res?.id) setDraftId(res.id);
            lastSavedRef.current = new Date();
            toast.success('Đã tự động lưu nháp', {
                description: `Lúc ${new Date().toLocaleTimeString('vi-VN')}`,
                duration: 2000,
            });
        },
    });

    useEffect(() => {
        const interval = setInterval(() => {
            if (isDirty) {
                autoSaveMutation.mutate(getValues());
            }
        }, 30_000);
        return () => clearInterval(interval);
    }, [isDirty, getValues, autoSaveMutation]);

    // ── Submit mutations ───────────────────────────────────────────────────────
    const saveDraftMutation = useMutation({
        mutationFn: async (data: PostJobFormData) => {
            if (draftId) return jobService.update(Number(draftId), { ...data, status: 'draft' } as any).then(r => r.data);
            return jobService.create({ ...data, status: 'draft' } as any).then(r => r.data);
        },
        onSuccess: (res: any) => {
            if (!draftId && res?.id) setDraftId(res.id);
            toast.success('Đã lưu nháp thành công!', { description: 'Bạn có thể tiếp tục chỉnh sửa sau.' });
        },
    });

    const publishMutation = useMutation({
        mutationFn: async (data: PostJobFormData) => {
            if (draftId) return jobService.update(Number(draftId), { ...data, status: 'pending' } as any).then(r => r.data);
            return jobService.create({ ...data, status: 'pending' } as any).then(r => r.data);
        },
        onSuccess: () => {
            toast.success('Tin tuyển dụng đã được gửi duyệt!', {
                description: 'Chúng tôi sẽ kiểm duyệt và phê duyệt trong vòng 24 giờ.',
                duration: 5000,
            });
            setTimeout(() => navigate('/employer/jobs'), 1500);
        },
    });

    // ── Navigation ─────────────────────────────────────────────────────────────
    const goNext = useCallback(async () => {
        const fields = STEP_FIELDS[step] as (keyof PostJobFormData)[];
        const valid = fields.length === 0 || await trigger(fields);
        if (!valid) return;
        setDirection(1);
        setStep(s => Math.min(s + 1, 4));
    }, [step, trigger]);

    const goPrev = useCallback(() => {
        setDirection(-1);
        setStep(s => Math.max(s - 1, 1));
    }, []);

    const onSaveDraft = handleSubmit(
        data => saveDraftMutation.mutate(data),
        () => saveDraftMutation.mutate(getValues())   // save even if invalid
    );

    const onPublish = handleSubmit(data => publishMutation.mutate(data));

    // ─ Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
            {/* Background elements to match admin/candidate sections */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-100/30 blur-[100px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-indigo-100/30 blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10 space-y-6">
                {/* Modern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-violet-600 mb-1">
                            <SendHorizonal size={18} className="animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">Nhà tuyển dụng chuyên nghiệp</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Đăng tin <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">tuyển dụng</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            Bước {step} trên 4 · {draftId ? `Draft ID: #${draftId.slice(-6)}` : 'Đang khởi tạo'}
                            {lastSavedRef.current && (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <Clock size={12} /> Đã lưu {lastSavedRef.current.toLocaleTimeString('vi-VN')}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => isDirty ? setDiscardOpen(true) : navigate('/employer/jobs')}
                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 h-11"
                        >
                            <X size={18} />
                            Hủy bỏ
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-6 md:p-10 space-y-10">
                        {/* Progress Stepper with subtle styling */}
                        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                            <WizardProgress current={step} />
                        </div>

                        {/* Step body container with min-height for stability */}
                        <div className="min-h-[400px]">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    {step === 1 && <Step1BasicInfo control={control} errors={errors} />}
                                    {step === 2 && <Step2Description control={control} errors={errors} />}
                                    {step === 3 && <Step3Location control={control} />}
                                    {step === 4 && <Step4SeoReview control={control} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Spacious Navigation footer */}
                        <div className="flex items-center justify-between pt-8 border-t border-slate-100 gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={goPrev}
                                disabled={step === 1}
                                className="h-12 px-6 rounded-xl gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 transition-all font-bold"
                            >
                                <ChevronLeft size={20} /> Quay lại
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onSaveDraft}
                                    disabled={saveDraftMutation.isPending}
                                    className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold transition-all shadow-sm"
                                >
                                    {saveDraftMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                    ) : <Save size={18} />}
                                    Lưu nháp
                                </Button>

                                {step < 4 ? (
                                    <Button
                                        type="button"
                                        onClick={goNext}
                                        className="h-12 px-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all transform hover:-translate-y-0.5"
                                    >
                                        Tiếp theo <ChevronRight size={20} />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={onPublish}
                                        disabled={publishMutation.isPending}
                                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2 font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all transform hover:-translate-y-0.5 min-w-[140px]"
                                    >
                                        {publishMutation.isPending ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : <SendHorizonal size={18} />}
                                        Đăng tin ngay
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhancement Tips with modern look */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[1.5rem] border border-violet-100 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-sm flex-shrink-0">
                            <Clock size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900">Mẹo tối ưu: Hãy dành 5 phút để hoàn thảo tốt tin này</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                <div className="text-xs text-slate-600 flex items-start gap-2">
                                    <span className="text-violet-500 font-bold">•</span>
                                    <span>Tiêu đề rõ ràng giúp tăng <strong>40%</strong> lượt click từ ứng viên.</span>
                                </div>
                                <div className="text-xs text-slate-600 flex items-start gap-2">
                                    <span className="text-violet-500 font-bold">•</span>
                                    <span>Mô tả mức lương cụ thể thu hút hơn <strong>35%</strong> lượt ứng tuyển.</span>
                                </div>
                                <div className="text-xs text-slate-600 flex items-start gap-2">
                                    <span className="text-violet-500 font-bold">•</span>
                                    <span>Gắn thẻ kỹ năng chuẩn xác giúp AI gợi ý ứng viên phù hợp nhất.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Discard Confirmation Dialog */}
            <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-white p-8 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                            <X size={32} className="text-red-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">Hủy tạo tin?</h2>
                            <p className="text-slate-500">
                                Bạn có chắc muốn rời khỏi trang này? Tất cả các thay đổi chưa được lưu sẽ bị xóa vĩnh viễn.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button 
                                variant="ghost" 
                                onClick={() => setDiscardOpen(false)} 
                                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 order-2 sm:order-1"
                            >
                                Quay lại chỉnh sửa
                            </Button>
                            <Button 
                                onClick={() => navigate('/employer/jobs')}
                                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-100 order-1 sm:order-2"
                            >
                                Hủy và thoát
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
