import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { jobService } from '@/services/jobService';
import { geographyService } from '@/services/geographyService';
import { companyService } from '@/services/companyService';
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
import { AlertTriangle, ChevronLeft, ChevronRight, Save, SendHorizonal, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import type { PolicyReason } from '@/types/api';

const HISTORY_BACK_NAVIGATION = '__history_back__';

// ─── Schema ───────────────────────────────────────────────────────────────────
const positionItemSchema = z.object({
    id: z.string(),
    title: z.string().min(2, 'Tên vị trí phải có ít nhất 2 ký tự'),
    category_id: z.string().min(1, 'Vui lòng chọn lĩnh vực'),
    job_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const).optional(),
    is_remote: z.boolean().optional(),
    level: z.enum(['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'] as const),
    quantity: z.number().min(1, 'Số lượng ít nhất là 1'),
    salary_min: z.number().nullable().optional(),
    salary_max: z.number().nullable().optional(),
    salary_currency: z.enum(['VND', 'USD'] as const).default('VND'),
    is_salary_visible: z.boolean().optional(),
});

const step1Schema = z.object({
    title: z.string().min(5, 'Tối thiểu 5 ký tự').max(255, 'Tối đa 255 ký tự'),
    is_multi_position: z.boolean(),
    positions: z.array(positionItemSchema),
    category_id: z.string().optional(),
    job_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const),
    level: z.enum(['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'] as const),
    quantity: z.number().min(1, 'Tối thiểu 1').max(999),
    salary_min: z.number().min(0, 'Lương tối thiểu không thể âm').nullable().optional(),
    salary_max: z.number().min(0, 'Lương tối đa không thể âm').nullable().optional(),
    salary_currency: z.enum(['VND', 'USD'] as const).default('VND'),
    is_salary_visible: z.boolean(),
    experience_min: z.number().nullable().optional(),
    experience_max: z.number().nullable().optional(),
    deadline: z.string().min(1, 'Vui lòng chọn hạn nộp hồ sơ').refine(
        value => value >= getTodayLocalDate(),
        'Hạn nộp hồ sơ không thể ở trong quá khứ'
    ),
    is_remote: z.boolean(),
}).superRefine((data, ctx) => {
    if (!data.is_multi_position) {
        if (!data.category_id || data.category_id.trim() === '') {
            ctx.addIssue({ code: 'custom', path: ['category_id'], message: 'Vui lòng chọn lĩnh vực tuyển dụng' });
        }
    } else {
        if (data.positions.length === 0) {
            ctx.addIssue({ code: 'custom', path: ['positions'], message: 'Vui lòng thêm ít nhất 1 vị trí tuyển dụng chi tiết' });
        }
        data.positions.forEach((pos, idx) => {
            if (!pos.title || pos.title.trim().length < 2) {
                ctx.addIssue({ code: 'custom', path: ['positions', idx, 'title'], message: `Vị trí #${idx + 1}: Tên vị trí phải có ít nhất 2 ký tự` });
            }
            if (!pos.category_id || pos.category_id.trim() === '') {
                ctx.addIssue({ code: 'custom', path: ['positions', idx, 'category_id'], message: `Vị trí #${idx + 1}: Vui lòng chọn lĩnh vực` });
            }
            if (pos.salary_min != null && pos.salary_max != null && pos.salary_max < pos.salary_min) {
                ctx.addIssue({ code: 'custom', path: ['positions', idx, 'salary_max'], message: `Vị trí #${idx + 1}: Lương tối đa phải lớn hơn lương tối thiểu` });
            }
        });
    }

    if (data.salary_min != null && data.salary_max != null && data.salary_max < data.salary_min) {
        ctx.addIssue({ code: 'custom', path: ['salary_max'], message: 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu' });
    }
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
    })
);

// Re-export so step components can import from here if needed
export type { PostJobFormData };

// ─── Step validators (partial validation) ─────────────────────────────────────
const STEP_FIELDS: Record<number, (keyof PostJobFormData)[]> = {
    1: ['title', 'is_multi_position', 'positions', 'category_id', 'job_type', 'level', 'quantity', 'salary_min', 'salary_max', 'deadline'],
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

function getTodayLocalDate() {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

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

function toFrontendProficiency(level: string | null | undefined): PostJobFormData['skills'][number]['proficiency_level'] {
    if (!level) return 'intermediate' as const;
    if (level === 'basic') return 'beginner' as const;
    if (level === 'intermediate' || level === 'advanced' || level === 'expert') return level;
    return 'intermediate' as const;
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char] || char);
}

function buildCompanyBenefitsContent(benefits: Array<{ benefit_name: string; description?: string | null }>) {
    const items = benefits
        .filter(benefit => benefit.benefit_name?.trim())
        .map(benefit => {
            const name = escapeHtml(benefit.benefit_name.trim());
            const description = benefit.description?.trim();
            return `<li><strong>${name}</strong>${description ? `: ${escapeHtml(description)}` : ''}</li>`;
        });
    return items.length ? `<ul>${items.join('')}</ul>` : '';
}

function extractPolicyReasons(error: any): PolicyReason[] {
    const data = error?.response?.data;
    if (Array.isArray(data?.errors)) return data.errors;
    if (Array.isArray(data?.moderation?.reasons)) return data.moderation.reasons;
    if (data?.detail) return [{ code: data.code || 'publish_error', message: data.detail }];
    return [];
}

function policyReasonLabel(reason: PolicyReason) {
    const suffix = reason.skills?.length ? ` (${reason.skills.join(', ')})` : '';
    return `${reason.message}${suffix}`;
}

function policyFixSuggestion(reason: PolicyReason) {
    if (reason.suggestion) return reason.suggestion;
    if (reason.code?.includes('non_it')) {
        return 'Làm rõ đây là vai trò IT: chỉnh tiêu đề, chọn danh mục IT, thêm tech stack, trách nhiệm kỹ thuật và kỹ năng bắt buộc.';
    }
    if (reason.field === 'skills' || reason.skills?.length) {
        return `Bổ sung kỹ năng IT bắt buộc${reason.skills?.length ? ` như ${reason.skills.slice(0, 4).join(', ')}` : ''}.`;
    }
    if (reason.field === 'description') {
        return 'Viết rõ sản phẩm, hệ thống, API, dữ liệu, hạ tầng hoặc trách nhiệm kỹ thuật mà ứng viên sẽ làm.';
    }
    if (reason.field === 'requirements') {
        return 'Thêm yêu cầu chuyên môn cụ thể: ngôn ngữ lập trình, framework, database, cloud/devops hoặc testing.';
    }
    return 'Điều chỉnh nội dung theo lý do bên trên rồi kiểm tra lại trước khi đăng.';
}

function shouldShowPolicyState(job: any) {
    return job?.moderation_status === 'needs_review'
        || job?.moderation_status === 'rejected'
        || job?.domain_status === 'needs_review'
        || job?.domain_status === 'non_it';
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
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
    const [isPublishingFlow, setIsPublishingFlow] = useState(false);
    const [publishIssues, setPublishIssues] = useState<PolicyReason[]>([]);
    const { id } = useParams<{ id: string }>();
    const [draftId, setDraftId] = useState<string | null>(id || null);
    const lastSavedRef = useRef<Date | null>(null);
    const companyBenefitsInitializedRef = useRef(false);
    const allowNavigationRef = useRef(false);
    const historyGuardActiveRef = useRef(false);
    const savedSnapshotRef = useRef('');

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
                const isCustom = String(skill.skill_id).startsWith('custom_');
                const payload = {
                    skill_id: isCustom ? null : Number(skill.skill_id),
                    skill_name: isCustom ? skill.skill_name : undefined,
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
        const effectiveCategoryId = data.category_id
            ? Number(data.category_id)
            : (data.is_multi_position && data.positions && data.positions.length > 0 && data.positions[0].category_id
                ? Number(data.positions[0].category_id)
                : null);

        return {
            ...data,
            company_id: user?.company_id,
            job_type: data.job_type.replace('_', '-'),
            number_of_positions: data.quantity,
            application_deadline: normalizeDateForApi(data.deadline),
            experience_years_min: data.experience_min ?? 0,
            experience_years_max: data.experience_max,
            category_id: effectiveCategoryId,
            is_salary_negotiable: !data.is_salary_visible,
        };
    }, [user?.company_id]);

    const {
        control, handleSubmit, trigger, getValues, reset, setValue, formState: { errors, isDirty },
    } = useForm<PostJobFormData>({
        resolver: zodResolver(fullSchema) as any,
        defaultValues: {
            title: '',
            is_multi_position: false,
            positions: [],
            category_id: '',
            job_type: 'full_time',
            level: 'middle',
            quantity: 1,
            salary_min: null,
            salary_max: null,
            salary_currency: 'VND',
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
        },
        mode: 'onChange',
    });
    const watchedValues = useWatch({ control });

    if (!savedSnapshotRef.current) {
        savedSnapshotRef.current = JSON.stringify(getValues());
    }

    const hasUnsavedChanges = isDirty || JSON.stringify(watchedValues) !== savedSnapshotRef.current;

    const markSavedIfCurrent = useCallback((savedData: PostJobFormData) => {
        savedSnapshotRef.current = JSON.stringify(savedData);
        if (JSON.stringify(getValues()) === JSON.stringify(savedData)) {
            reset(savedData);
        }
    }, [getValues, reset]);

    const { data: company } = useQuery({
        queryKey: ['company-profile'],
        queryFn: () => companyService.getMyCompany().then(res => res.data),
    });

    const { data: companyBenefits = [] } = useQuery({
        queryKey: ['company-benefits', company?.id],
        queryFn: () => companyService.listBenefits(Number(company!.id)).then(res => res.data),
        enabled: !!company?.id,
    });

    useEffect(() => {
        if (id || companyBenefitsInitializedRef.current || companyBenefits.length === 0 || getValues('benefits')) return;
        const benefits = buildCompanyBenefitsContent(companyBenefits);
        setValue('benefits', benefits, { shouldDirty: false });
        savedSnapshotRef.current = JSON.stringify({ ...getValues(), benefits });
        companyBenefitsInitializedRef.current = true;
    }, [companyBenefits, getValues, id, setValue]);

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
    const existingPolicyIssues = shouldShowPolicyState(existingJob)
        ? ((existingJob as any)?.moderation_reasons || [])
        : [];

    useEffect(() => {
        if (existingJob) {
            const hydratedJob = {
                title: existingJob.title || '',
                is_multi_position: Array.isArray((existingJob as any).positions) && (existingJob as any).positions.length > 0,
                positions: (existingJob as any).positions || [],
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
                    is_verified: skill.skill_is_verified,
                    domain: skill.skill_domain,
                    is_publishable: skill.skill_is_publishable,
                })),
                locations: existingJob.editor_locations || [],
            };
            savedSnapshotRef.current = JSON.stringify(hydratedJob);
            reset(hydratedJob);
        }
    }, [existingJob, reset]);



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
        onSuccess: (res: any, savedData) => {
            if (!draftId && res?.id) setDraftId(res.id);
            lastSavedRef.current = new Date();
            markSavedIfCurrent(savedData);
            toast.success('Đã lưu nháp thành công!', { description: 'Bạn có thể tiếp tục chỉnh sửa sau.' });
        },
    });

    const publishMutation = useMutation({
        onMutate: () => {
            setIsPublishingFlow(true);
            setPublishIssues([]);
        },
        mutationFn: async (data: PostJobFormData) => {
            const payload = transformToBackend(data);
            let job;

            if (draftId) {
                job = await jobService.update(Number(draftId), payload as any).then(r => r.data);
            } else {
                job = await jobService.create({ ...payload, status: 'draft' } as any).then(r => r.data);
                setDraftId(String(job.id));
            }

            await syncNestedData(job.id, data);
            await jobService.validateForPublish(job.id);

            if (job.status === 'published') {
                return job;
            }

            return jobService.publish(job.id).then(r => r.data);
        },
        onSuccess: () => {
            toast.success('Đăng tin thành công!', {
                description: 'Tin tuyển dụng của bạn đã được xuất bản.',
                duration: 5000,
            });
            queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['company-jobs-all'] });
            queryClient.invalidateQueries({ queryKey: ['job', id, 'editor'] });

            allowNavigationRef.current = true;
            historyGuardActiveRef.current = false;
            navigate('/company/jobs', { replace: true });
        },
        onError: (error: any) => {
            setIsPublishingFlow(false);
            const issues = extractPolicyReasons(error);
            setPublishIssues(issues);
            toast.error(issues[0]?.message || error?.response?.data?.detail || 'Không thể đăng tin. Vui lòng thử lại.');
        },
    });

    // ── Navigation ─────────────────────────────────────────────────────────────
    const goNext = useCallback(async () => {
        const fields = STEP_FIELDS[step] as (keyof PostJobFormData)[];
        const valid = fields.length === 0 || await trigger(fields);
        if (!valid) {
            toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc trước khi chuyển bước!');
            return;
        }
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

    const requestPageNavigation = useCallback((to: string) => {
        if (hasUnsavedChanges && !allowNavigationRef.current) {
            setPendingNavigation(to);
            setDiscardOpen(true);
            return;
        }

        navigate(to);
    }, [hasUnsavedChanges, navigate]);

    const completeNavigation = useCallback((to: string) => {
        allowNavigationRef.current = true;

        if (to === HISTORY_BACK_NAVIGATION) {
            const historyDelta = historyGuardActiveRef.current ? -2 : -1;
            historyGuardActiveRef.current = false;
            window.history.go(historyDelta);
            return;
        }

        if (historyGuardActiveRef.current) {
            historyGuardActiveRef.current = false;
            window.history.back();
            window.setTimeout(() => navigate(to), 0);
            return;
        }

        navigate(to);
    }, [navigate]);

    useEffect(() => {
        if (!hasUnsavedChanges || isPublishingFlow) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, isPublishingFlow]);

    useEffect(() => {
        if (!hasUnsavedChanges || isPublishingFlow || allowNavigationRef.current) return;

        if (!historyGuardActiveRef.current) {
            window.history.pushState({ ...window.history.state, postJobDraftGuard: true }, '', window.location.href);
            historyGuardActiveRef.current = true;
        }

        const handlePopState = () => {
            if (allowNavigationRef.current) return;

            window.history.pushState({ ...window.history.state, postJobDraftGuard: true }, '', window.location.href);
            historyGuardActiveRef.current = true;
            setPendingNavigation(HISTORY_BACK_NAVIGATION);
            setDiscardOpen(true);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [hasUnsavedChanges, isPublishingFlow]);

    useEffect(() => {
        if (hasUnsavedChanges || !historyGuardActiveRef.current) return;

        historyGuardActiveRef.current = false;
        window.history.back();
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (!hasUnsavedChanges || isPublishingFlow) return;

        const handleDocumentClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            const anchor = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

            const nextUrl = new URL(anchor.href, window.location.href);
            if (nextUrl.origin !== window.location.origin) return;

            const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
            const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (nextPath === currentPath) return;

            event.preventDefault();
            event.stopPropagation();
            setPendingNavigation(nextPath);
            setDiscardOpen(true);
        };

        document.addEventListener('click', handleDocumentClick, true);
        return () => document.removeEventListener('click', handleDocumentClick, true);
    }, [hasUnsavedChanges, isPublishingFlow]);

    const handleCancelLeave = () => {
        setDiscardOpen(false);
        setPendingNavigation(null);
    };

    const handleLeaveWithoutSaving = () => {
        setDiscardOpen(false);
        completeNavigation(pendingNavigation || '/company/jobs');
        setPendingNavigation(null);
    };

    const handleSaveBeforeLeave = async () => {
        const data = getValues();
        setIsSavingBeforeLeave(true);

        try {
            await saveDraftMutation.mutateAsync(data);
            reset(data);
            setDiscardOpen(false);
            completeNavigation(pendingNavigation || '/company/jobs');
            setPendingNavigation(null);
        } catch {
            toast.error('Không thể lưu nháp. Vui lòng thử lại.');
        } finally {
            setIsSavingBeforeLeave(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Background elements to match admin/candidate sections */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-teal-100/30 blur-[100px]" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-primary/12/30 blur-[100px]" />
            </div>

            <div>
                <PageHeader
                    title="Đăng tin tuyển dụng"
                    description={`Bước ${step} trên 4 · ${draftId ? `Draft ID: #${String(draftId).slice(-6)}` : 'Đang khởi tạo'}`}
                    icon={SendHorizonal}
                    action={
                        <Button
                            variant="outline"
                            onClick={() => requestPageNavigation('/company/jobs')}
                            className="rounded-xl border-border text-muted-foreground hover:bg-muted gap-2 h-11 shadow-sm"
                        >
                            <X size={18} />
                            Hủy bỏ
                        </Button>
                    }
                />
            </div>

            <div className="w-full mx-auto relative z-10 space-y-8 p-6 lg:p-8 animate-in fade-in duration-700">

                {/* Main Content Area */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 md:p-10 space-y-10">
                        {/* Progress Stepper with subtle styling */}
                        <div className="bg-muted/50 rounded-3xl p-6 border border-border/60">
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

                        {publishIssues.length > 0 && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-amber-600 shadow-sm">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-amber-900">Tin chưa đủ điều kiện xuất bản</p>
                                        <div className="mt-2 space-y-1.5">
                                            {publishIssues.map((issue, index) => (
                                                <div key={`${issue.code}-${index}`} className="rounded-xl bg-card/70 px-3 py-2">
                                                    <p className="text-sm font-bold text-amber-900">
                                                        {policyReasonLabel(issue)}
                                                    </p>
                                                    <p className="mt-1 text-xs font-medium text-amber-800">
                                                        {policyFixSuggestion(issue)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {existingPolicyIssues.length > 0 && publishIssues.length === 0 && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-amber-600 shadow-sm">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-amber-900">Tin đang cần chỉnh sửa trước khi publish</p>
                                        <div className="mt-2 space-y-2">
                                            {existingPolicyIssues.map((issue: PolicyReason, index: number) => (
                                                <div key={`${issue.code}-${index}`} className="rounded-xl bg-card/70 px-3 py-2">
                                                    <p className="text-sm font-bold text-amber-900">
                                                        {policyReasonLabel(issue)}
                                                    </p>
                                                    <p className="mt-1 text-xs font-medium text-amber-800">
                                                        {policyFixSuggestion(issue)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Spacious Navigation footer */}
                        <div className="flex items-center justify-between pt-4 gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={goPrev}
                                disabled={step === 1}
                                className="h-12 px-6 rounded-xl gap-2 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 transition-all font-bold"
                            >
                                <ChevronLeft size={20} /> Quay lại
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onSaveDraft}
                                    disabled={saveDraftMutation.isPending}
                                    className="h-12 px-6 rounded-xl border-border text-muted-foreground hover:bg-muted gap-2 font-bold transition-all shadow-sm"
                                >
                                    {saveDraftMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-border border-t-slate-600 rounded-full animate-spin" />
                                    ) : <Save size={18} />}
                                    Lưu nháp
                                </Button>

                                {step < 4 ? (
                                    <Button
                                        type="button"
                                        onClick={goNext}
                                        className="h-12 px-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 font-bold shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all transform hover:-translate-y-0.5"
                                    >
                                        Tiếp theo <ChevronRight size={20} />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={onPublish}
                                        disabled={publishMutation.isPending}
                                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-primary text-white gap-2 font-bold shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all transform hover:-translate-y-0.5 min-w-[140px]"
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


            </div>

            {/* Unsaved draft confirmation dialog */}
            <Dialog open={discardOpen} onOpenChange={(open) => open ? setDiscardOpen(true) : handleCancelLeave()}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-card p-8 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                            <X size={32} className="text-red-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-foreground">Lưu bản nháp trước khi rời trang?</h2>
                            <p className="text-muted-foreground">
                                Tin tuyển dụng vẫn còn thay đổi chưa được lưu. Bạn có thể lưu nháp để tiếp tục chỉnh sửa sau.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            <Button 
                                variant="ghost" 
                                onClick={handleCancelLeave}
                                disabled={isSavingBeforeLeave}
                                className="h-12 rounded-xl font-bold text-muted-foreground hover:bg-muted order-3"
                            >
                                Quay lại chỉnh sửa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLeaveWithoutSaving}
                                disabled={isSavingBeforeLeave}
                                className="h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold order-2"
                            >
                                Thoát không lưu
                            </Button>
                            <Button
                                onClick={handleSaveBeforeLeave}
                                disabled={isSavingBeforeLeave}
                                className="h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-100 order-1"
                            >
                                {isSavingBeforeLeave ? 'Đang lưu nháp...' : 'Lưu nháp và thoát'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
