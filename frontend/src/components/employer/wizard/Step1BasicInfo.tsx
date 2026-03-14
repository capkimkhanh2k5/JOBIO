import { useQuery } from '@tanstack/react-query';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { taxonomyService } from '@/services/taxonomyService';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import type { PostJobFormData } from '@/types/postJob';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl text-sm',
    'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/5',
    'transition-all duration-200 shadow-sm'
);

const selectClass = cn(inputClass, 'appearance-none cursor-pointer');

const fieldErr = (msg?: string) =>
    msg ? <p className="text-red-500 text-xs mt-1 font-medium">{msg}</p> : null;

const JOB_TYPES = [
    { value: 'full_time', label: 'Toàn thời gian' },
    { value: 'part_time', label: 'Bán thời gian' },
    { value: 'contract', label: 'Hợp đồng' },
    { value: 'internship', label: 'Thực tập' },
    { value: 'freelance', label: 'Freelance' },
];

const LEVELS = [
    { value: 'intern', label: 'Intern' },
    { value: 'fresher', label: 'Fresher' },
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
];

// ─── Radio Group ───────────────────────────────────────────────────────────────
function RadioGroup<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150',
                        value === opt.value
                            ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, children, error }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {fieldErr(error)}
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
interface Step1BasicInfoProps {
    control: Control<PostJobFormData>;
    errors: FieldErrors<PostJobFormData>;
}

export function Step1BasicInfo({ control, errors }: Step1BasicInfoProps) {
    // Flatten categories for select
    const { data: categories = [], isLoading: catLoading } = useQuery({
        queryKey: ['job-categories'],
        queryFn: () => taxonomyService.listJobCategories().then(r => r.data.results ?? []),
        staleTime: 5 * 60_000,
    });

    const flatCats = categories.flatMap(cat => [
        { id: cat.id, name: cat.name, depth: 0 },
        ...(cat.children ?? []).map(c => ({ id: c.id, name: c.name, depth: 1 })),
    ]);

    return (
        <div className="space-y-6">
            {/* Job title */}
            <Field label="Tên vị trí tuyển dụng" required error={errors.title?.message}>
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                        <input
                            {...field}
                            type="text"
                            placeholder="VD: Senior Frontend Engineer (React + TypeScript)"
                            className={cn(inputClass, errors.title && 'border-red-500/50')}
                        />
                    )}
                />
            </Field>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category */}
                <Field label="Ngành nghề / Lĩnh vực" required error={errors.category_id?.message}>
                    <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) => (
                            catLoading ? (
                                <Skeleton className="h-10 w-full rounded-xl" />
                            ) : (
                                <select
                                    {...field}
                                    className={cn(selectClass, errors.category_id && 'border-red-500')}
                                >
                                    <option value="" className="text-slate-400">-- Chọn lĩnh vực --</option>
                                    {flatCats.map(cat => (
                                        <option
                                            key={cat.id}
                                            value={cat.id}
                                            className="text-slate-900"
                                        >
                                            {cat.depth > 0 ? `　└ ${cat.name}` : cat.name}
                                        </option>
                                    ))}
                                </select>
                            )
                        )}
                    />
                </Field>

                {/* Quantity */}
                <Field label="Số lượng cần tuyển" required error={errors.quantity?.message}>
                    <Controller
                        name="quantity"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                min={1}
                                max={999}
                                onChange={e => field.onChange(Number(e.target.value))}
                                className={cn(inputClass, errors.quantity && 'border-red-500/50')}
                            />
                        )}
                    />
                </Field>
            </div>

            {/* Job Type */}
            <Field label="Loại hình công việc" required error={errors.job_type?.message}>
                <Controller
                    name="job_type"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup options={JOB_TYPES} value={field.value} onChange={field.onChange} />
                    )}
                />
            </Field>

            {/* Level */}
            <Field label="Cấp bậc" required error={errors.level?.message}>
                <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup options={LEVELS} value={field.value} onChange={field.onChange} />
                    )}
                />
            </Field>

            {/* Salary range */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700">Mức lương</label>
                    <Controller
                        name="is_salary_visible"
                        control={control}
                        render={({ field }) => (
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">Hiển thị lương</span>
                                <div
                                    className={cn(
                                        'w-8 h-5 rounded-full border-2 relative transition-all duration-200 flex-shrink-0',
                                        field.value ? 'bg-violet-600 border-violet-600' : 'bg-slate-100 border-slate-200'
                                    )}
                                    onClick={() => field.onChange(!field.value)}
                                >
                                    <div className={cn(
                                        'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200',
                                        field.value ? 'left-[calc(100%-14px)]' : 'left-0.5'
                                    )} />
                                </div>
                            </label>
                        )}
                    />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Controller
                        name="salary_currency"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className={selectClass}>
                                <option value="VND">VND</option>
                                <option value="USD">USD</option>
                            </select>
                        )}
                    />
                    <Controller
                        name="salary_min"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                placeholder="Tối thiểu"
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={inputClass}
                            />
                        )}
                    />
                    <Controller
                        name="salary_max"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                placeholder="Tối đa"
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={inputClass}
                            />
                        )}
                    />
                </div>
            </div>

            {/* Experience range */}
            <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Kinh nghiệm (năm)</label>
                <div className="grid grid-cols-2 gap-3">
                    <Controller
                        name="experience_min"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                min={0}
                                placeholder="Tối thiểu"
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={inputClass}
                            />
                        )}
                    />
                    <Controller
                        name="experience_max"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                min={0}
                                placeholder="Tối đa"
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={inputClass}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deadline */}
                <Field label="Hạn nộp hồ sơ" required error={errors.deadline?.message}>
                    <Controller
                        name="deadline"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                className={cn(inputClass, 'cursor-pointer', errors.deadline && 'border-red-500',
                                    '[color-scheme:light]'
                                )}
                            />
                        )}
                    />
                </Field>

                {/* Is remote */}
                <Field label="Hình thức làm việc">
                    <Controller
                        name="is_remote"
                        control={control}
                        render={({ field }) => (
                            <label className="flex items-center gap-3 h-10 cursor-pointer group select-none">
                                {/* Custom toggle */}
                                <div
                                    className={cn(
                                        'w-10 h-6 rounded-full border-2 relative transition-all duration-200 flex-shrink-0',
                                        field.value
                                            ? 'bg-violet-600 border-violet-600 shadow-sm'
                                            : 'bg-slate-100 border-slate-200'
                                    )}
                                    onClick={() => field.onChange(!field.value)}
                                >
                                    <div className={cn(
                                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                                        field.value ? 'left-[calc(100%-18px)]' : 'left-0.5'
                                    )} />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                    {field.value ? '🌐 Hỗ trợ làm việc từ xa (Remote)' : '🏢 Làm việc tại văn phòng'}
                                </span>
                            </label>
                        )}
                    />
                </Field>
            </div>
        </div>
    );
}
