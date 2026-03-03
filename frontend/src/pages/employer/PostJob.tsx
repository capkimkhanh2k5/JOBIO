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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, SendHorizonal, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="min-h-screen py-8 px-4">
            {/* Width constraint */}
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">
                            Đăng tin tuyển dụng
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Bước {step}/4 · {draftId ? `Nháp: ${draftId}` : 'Chưa lưu'}
                            {lastSavedRef.current && (
                                <span className="ml-2 text-emerald-400 flex-inline items-center gap-1">
                                    <Clock size={10} className="inline mb-0.5" /> {lastSavedRef.current.toLocaleTimeString('vi-VN')}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => isDirty ? setDiscardOpen(true) : navigate('/employer/jobs')}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Glass card */}
                <div className="dark rounded-2xl p-6 md:p-8 space-y-8 border border-white/10 bg-[#1a2236] shadow-2xl">

                    {/* Progress */}
                    <WizardProgress current={step} />

                    <div className="border-t border-white/10" />

                    {/* Step body */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            {step === 1 && <Step1BasicInfo control={control} errors={errors} />}
                            {step === 2 && <Step2Description control={control} errors={errors} />}
                            {step === 3 && <Step3Location control={control} />}
                            {step === 4 && <Step4SeoReview control={control} />}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3 flex-wrap">
                        {/* Left: back */}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={goPrev}
                            disabled={step === 1}
                            className="gap-1.5 text-white/60 hover:text-white disabled:opacity-30"
                        >
                            <ChevronLeft size={16} /> Quay lại
                        </Button>

                        {/* Right: save draft + next/publish */}
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                            {/* Save draft - always available */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onSaveDraft}
                                disabled={saveDraftMutation.isPending}
                                className={cn(
                                    'border-white/15 text-white/60 hover:text-white hover:border-white/30 gap-1.5',
                                    saveDraftMutation.isPending && 'opacity-50'
                                )}
                            >
                                <Save size={14} />
                                {saveDraftMutation.isPending ? 'Đang lưu...' : 'Lưu nháp'}
                            </Button>

                            {/* Next or Publish */}
                            {step < 4 ? (
                                <Button
                                    type="button"
                                    onClick={goNext}
                                    className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white gap-1.5 shadow-lg shadow-violet-500/20"
                                >
                                    Tiếp theo <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={onPublish}
                                    disabled={publishMutation.isPending}
                                    className={cn(
                                        'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500',
                                        'text-white gap-1.5 shadow-lg shadow-violet-500/25 min-w-[120px]',
                                        publishMutation.isPending && 'opacity-70'
                                    )}
                                >
                                    <SendHorizonal size={14} />
                                    {publishMutation.isPending ? 'Đang đăng...' : 'Đăng tin'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tips card */}
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">💡 Mẹo tối ưu tin tuyển dụng</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                        <li>Tiêu đề rõ ràng → tăng 40% lượt click</li>
                        <li>Mô tả lương cụ thể → tăng 35% đơn ứng tuyển</li>
                        <li>Điền đầy đủ kỹ năng → AI match chính xác hơn</li>
                    </ul>
                </div>
            </div>

            {/* Discard dialog */}
            <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
                <DialogContent className="glass-card border-white/15 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white">Hủy tạo tin?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-white/60 pb-2">
                        Bạn có chắc muốn thoát? Các thay đổi chưa lưu sẽ bị mất.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDiscardOpen(false)} className="text-white/60">
                            Tiếp tục chỉnh sửa
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => navigate('/employer/jobs')}
                            className="bg-red-500/80 hover:bg-red-500"
                        >
                            Hủy & thoát
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
