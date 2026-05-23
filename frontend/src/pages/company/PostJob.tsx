import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { jobService } from '@/services/jobService';
import { geographyService } from '@/services/geographyService';
import { WizardProgress } from '@/components/company/wizard/WizardProgress';
import { Step1BasicInfo } from '@/components/company/wizard/Step1BasicInfo';
import { Step2Description } from '@/components/company/wizard/Step2Description';
import { Step3Location } from '@/components/company/wizard/Step3Location';
import { Step4SeoReview } from '@/components/company/wizard/Step4SeoReview';
import type { PostJobFormData } from '@/types/postJob';
import {
    Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, SendHorizonal, X, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

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

const SEO_DRAFT_STORAGE_KEY = 'jobio-job-seo-drafts';
function normalizeDateForApi(value?: string | null) {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const dmyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmyMatch) {
        const [, day, month, year] = dmyMatch;
        return `${year}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return value;
}

function toBackendProficiency(level: string | null | undefined) {
    if (!level) return null;
    if (level === 'beginner') return 'basic';
    return level;
}

function toFrontendProficiency(level: string | null | undefined) {
    if (!level) return 'intermediate' as const;
    if (level === 'basic') return 'beginner' as const;
    if (level === 'intermediate' || level === 'advanced' || level === 'expert') return level;
    return 'intermediate' as const;
}

function readSeoDraft(jobId?: string | number | null) {
    if (!jobId) return null;

    try {
        const raw = localStorage.getItem(SEO_DRAFT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.[String(jobId)] ?? null;
    } catch {
        return null;
    }
}

function writeSeoDraft(
    jobId: string | number,
    data: Pick<PostJobFormData, 'seo_title' | 'seo_description' | 'seo_keywords'>
) {
    try {
        const raw = localStorage.getItem(SEO_DRAFT_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed[String(jobId)] = data;
        localStorage.setItem(SEO_DRAFT_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
        // ignore local storage errors
    }
}

function clearSeoDraft(jobId?: string | number | null) {
    if (!jobId) return;

    try {
        const raw = localStorage.getItem(SEO_DRAFT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        delete parsed[String(jobId)];
        localStorage.setItem(SEO_DRAFT_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
        // ignore local storage errors
    }
}


// ─── Component ────────────────────────────────────────────────────────────────
export default function PostJob() {
    const { user } = useUserStore();

    if (user?.role !== 'company') {
        return <Navigate to="/" replace />;
    }

    return <PostJobEditor />;
}

function PostJobEditor() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useUserStore();
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [isPublishingFlow, setIsPublishingFlow] = useState(false);
    const { id } = useParams<{ id: string }>();
    const [draftId, setDraftId] = useState<string | null>(id || null);
    const lastSavedRef = useRef<Date | null>(null);
    const seoDraftInitializedRef = useRef(false);

    const syncNestedData = useCallback(async (jobId: number, data: PostJobFormData) => {
        const existingSkills = await jobService.listSkills(jobId).then((res) => res.data);
        const nextSkillsById = new Map(data.skills.map((skill) => [String(skill.skill_id), skill]));

        await Promise.all(
            existingSkills
                .filter((skill) => !nextSkillsById.has(String(skill.skill_id)))
                .map((skill) => jobService.removeSkill(jobId, skill.id))
        );

        await Promise.all(
            data.skills.map(async (skill) => {
                const existingSkill = existingSkills.find((item) => String(item.skill_id) === String(skill.skill_id));
                const payload = {
                    skill_id: Number(skill.skill_id),
                    is_required: skill.is_required,
                    proficiency_level: toBackendProficiency(skill.proficiency_level),
                };

                if (existingSkill) {
                    await jobService.removeSkill(jobId, existingSkill.id);
                }

                await jobService.addSkill(jobId, {
                    ...payload,
                    proficiency_level: payload.proficiency_level || undefined
                } as any);
            })
        );

        const existingLocations = await jobService.listLocations(jobId).then((res) => res.data);

        await Promise.all(existingLocations.map((location) => jobService.removeLocation(jobId, location.id)));

        await Promise.all(
            data.locations
                .filter((location) => location.province_id)
                .map(async (location) => {
                    const address = await geographyService.createAddress({
                        address_line: location.address_line || 'Chưa cập nhật',
                        province: Number(location.province_id),
                        commune: location.commune_id ? Number(location.commune_id) : null,
                    });

                    await jobService.addLocation(jobId, {
                        address_id: address.id,
                        is_primary: location.is_primary,
                    });
                })
        );
    }, []);

    // Helper to transform frontend data to backend format
    const transformToBackend = useCallback((data: PostJobFormData) => {
        return {
            ...data,
            company_id: user?.company_id,
            job_type: data.job_type.replace('_', '-'),
            number_of_positions: data.quantity,
            application_deadline: normalizeDateForApi(data.deadline),
            experience_years_min: data.experience_min ?? 0,
            experience_years_max: data.experience_max,
            category_id: data.category_id ? Number(data.category_id) : null,
            is_salary_negotiable: !data.is_salary_visible,
        };
    }, [user?.company_id]);

    const {
        control, handleSubmit, trigger, getValues, reset, watch, formState: { errors, isDirty },
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

    const { data: existingJob } = useQuery({
        queryKey: ['job', id, 'editor'],
        queryFn: async () => {
            const jobId = Number(id);
            const [job, skills, locations] = await Promise.all([
                jobService.getById(jobId).then((res) => res.data),
                jobService.listSkills(jobId).then((res) => res.data),
                jobService.listLocations(jobId).then((res) => res.data),
            ]);

            const hydratedLocations = await Promise.all(
                locations.map(async (location) => {
                    const address = await geographyService.getAddress(location.address_id as number);
                    return {
                        id: `loc_${location.id}`,
                        province_id: address.province ? String(address.province) : '',
                        province_name: address.province_name || location.province_name || '',
                        commune_id: address.commune ? String(address.commune) : '',
                        commune_name: address.commune_name || location.commune_name || '',
                        address_line: address.address_line || '',
                        is_primary: location.is_primary,
                    };
                })
            );

            return {
                ...job,
                editor_skills: skills,
                editor_locations: hydratedLocations,
            };
        },
        enabled: !!id,
    });

    useEffect(() => {
        if (existingJob) {
            const seoDraft = readSeoDraft(existingJob.id || id);
            reset({
                title: existingJob.title || '',
                category_id: (existingJob as any).category_id ? String((existingJob as any).category_id) : (existingJob.category?.id ? String(existingJob.category.id) : ''),
                job_type: (existingJob.job_type?.replace('-', '_') as any) || 'full_time',
                level: (existingJob.level as any) || 'middle',
                quantity: (existingJob as any).number_of_positions || 1,
                salary_min: existingJob.salary_min ? Number(existingJob.salary_min) : null,
                salary_max: existingJob.salary_max ? Number(existingJob.salary_max) : null,
                salary_currency: (existingJob.salary_currency as any) || 'VND',
                is_salary_visible: !existingJob.salary_negotiable,
                experience_min: existingJob.experience_years_min || null,
                experience_max: existingJob.experience_years_max || null,
                deadline: normalizeDateForApi(existingJob.application_deadline) || '',
                is_remote: Boolean(existingJob.is_remote),
                description: existingJob.description || '',
                requirements: existingJob.requirements || '',
                benefits: existingJob.benefits || '',
                skills: (existingJob.editor_skills || []).map((skill: any) => ({
                    skill_id: String(skill.skill_id),
                    skill_name: skill.skill_name,
                    is_required: skill.is_required,
                    proficiency_level: toFrontendProficiency(skill.proficiency_level),
                })),
                locations: existingJob.editor_locations || [],
                seo_title: existingJob.seo_title || seoDraft?.seo_title || '',
                seo_description: existingJob.seo_description || seoDraft?.seo_description || '',
                seo_keywords: existingJob.seo_keywords || seoDraft?.seo_keywords || [],
            });
            seoDraftInitializedRef.current = true;
        }
    }, [existingJob, reset]);

    useEffect(() => {
        if (!id) {
            seoDraftInitializedRef.current = true;
        }
    }, [id]);

    const seoTitle = watch('seo_title');
    const seoDescription = watch('seo_description');
    const seoKeywords = watch('seo_keywords');

    useEffect(() => {
        const targetId = draftId || id;
        if (!targetId || !seoDraftInitializedRef.current) return;

        writeSeoDraft(targetId, {
            seo_title: seoTitle || '',
            seo_description: seoDescription || '',
            seo_keywords: seoKeywords || [],
        });
    }, [draftId, id, seoTitle, seoDescription, seoKeywords]);


    // ── Auto-save draft every 30s ──────────────────────────────────────────────
    const autoSaveMutation = useMutation({
        mutationFn: async (data: PostJobFormData) => {
            const payload = transformToBackend(data);
            if (draftId) {
                const updatedJob = await jobService.update(Number(draftId), { ...payload, status: 'draft' } as any).then(r => r.data);
                await syncNestedData(updatedJob.id, data);
                return updatedJob;
            }
            const createdJob = await jobService.create({ ...payload, status: 'draft' } as any).then(r => r.data);
            await syncNestedData(createdJob.id, data);
            return createdJob;
        },
        onSuccess: (res: any) => {
            if (!draftId && res?.id) setDraftId(res.id);
            writeSeoDraft(res?.id || draftId || id || 'new', {
                seo_title: getValues('seo_title') || '',
                seo_description: getValues('seo_description') || '',
                seo_keywords: getValues('seo_keywords') || [],
            });
            writeSeoDraft(res?.id || draftId || id || 'new', {
                seo_title: getValues('seo_title') || '',
                seo_description: getValues('seo_description') || '',
                seo_keywords: getValues('seo_keywords') || [],
            });
            lastSavedRef.current = new Date();
            toast.success('Đã tự động lưu nháp', {
                description: `Lúc ${new Date().toLocaleTimeString('vi-VN')}`,
                duration: 2000,
            });
        },
    });

    useEffect(() => {
        const interval = setInterval(() => {
            if (isDirty && !isPublishingFlow) {
                autoSaveMutation.mutate(getValues());
            }
        }, 30_000);
        return () => clearInterval(interval);
    }, [isDirty, getValues, autoSaveMutation, isPublishingFlow]);

    // ── Submit mutations ───────────────────────────────────────────────────────
    const saveDraftMutation = useMutation({
        mutationFn: async (data: PostJobFormData) => {
            const payload = transformToBackend(data);
            if (draftId) {
                const updatedJob = await jobService.update(Number(draftId), { ...payload, status: 'draft' } as any).then(r => r.data);
                await syncNestedData(updatedJob.id, data);
                return updatedJob;
            }
            const createdJob = await jobService.create({ ...payload, status: 'draft' } as any).then(r => r.data);
            await syncNestedData(createdJob.id, data);
            return createdJob;
        },
        onSuccess: (res: any) => {
            if (!draftId && res?.id) setDraftId(res.id);
            toast.success('Đã lưu nháp thành công!', { description: 'Bạn có thể tiếp tục chỉnh sửa sau.' });
        },
    });

    const publishMutation = useMutation({
        onMutate: () => {
            setIsPublishingFlow(true);
        },
        mutationFn: async (data: PostJobFormData) => {
            const payload = transformToBackend(data);
            if (draftId) {
                const updatedJob = await jobService.update(Number(draftId), { ...payload, status: 'published' } as any).then(r => r.data);
                await syncNestedData(updatedJob.id, data);
                return updatedJob;
            }
            const createdJob = await jobService.create({ ...payload, status: 'published' } as any).then(r => r.data);
            await syncNestedData(createdJob.id, data);
            return createdJob;
        },
        onSuccess: async () => {
            toast.success('Đăng tin thành công!', {
                description: 'Tin tuyển dụng của bạn đã được xuất bản.',
                duration: 5000,
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['company-jobs'] }),
                queryClient.invalidateQueries({ queryKey: ['company-jobs-all'] }),
                queryClient.invalidateQueries({ queryKey: ['job', id, 'editor'] }),
            ]);
            if (user?.role === 'company') {
                setTimeout(() => navigate('/company/jobs'), 1500);
            }
        },
        onError: () => {
            setIsPublishingFlow(false);
        },
    });

    useEffect(() => {
        if (!publishMutation.isSuccess) return;
        clearSeoDraft(draftId || id);
    }, [publishMutation.isSuccess, draftId, id]);

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

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Background elements to match admin/candidate sections */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-100/30 blur-[100px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-indigo-100/30 blur-[100px]" />
            </div>

            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Đăng tin tuyển dụng"
                    description={`Bước ${step} trên 4 · ${draftId ? `Draft ID: #${String(draftId).slice(-6)}` : 'Đang khởi tạo'}`}
                    icon={SendHorizonal}
                    action={
                        <Button
                            variant="outline"
                            onClick={() => isDirty ? setDiscardOpen(true) : navigate('/company/jobs')}
                            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 h-11 shadow-sm"
                        >
                            <X size={18} />
                            Hủy bỏ
                        </Button>
                    }
                />
            </div>

            <div className="w-full mx-auto relative z-10 space-y-8 p-6 lg:p-8 animate-in fade-in duration-700">

                {/* Main Content Area */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10 space-y-10">
                        {/* Progress Stepper with subtle styling */}
                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
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
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-sm">
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
                                onClick={() => navigate('/company/jobs')}
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
