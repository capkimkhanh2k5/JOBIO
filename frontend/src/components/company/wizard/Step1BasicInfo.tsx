import { useQuery } from '@tanstack/react-query';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { taxonomyService } from '@/services/taxonomyService';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PostJobFormData } from '@/types/postJob';

const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl text-sm',
    'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/5',
    'transition-all duration-200 shadow-sm'
);

const selectClass = cn(inputClass, 'cursor-pointer px-3');

function getTodayLocalDate() {
    const today = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

const fieldErr = (msg?: string) =>
    msg ? <p className="text-red-500 text-xs mt-1 font-medium">{msg}</p> : null;

const JOB_TYPES = [
    { value: 'full_time', label: 'Toàn thời gian' },
    { value: 'part_time', label: 'Bán thời gian' },
    { value: 'contract', label: 'Hợp đồng' },
    { value: 'internship', label: 'Thực tập' },
    { value: 'freelance', label: 'Freelance' },
] as const;

const LEVELS = [
    { value: 'intern', label: 'Intern' },
    { value: 'fresher', label: 'Fresher' },
    { value: 'junior', label: 'Junior' },
    { value: 'middle', label: 'Middle' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
] as const;

function RadioGroup<T extends string>({
    options,
    value,
    onChange,
}: {
    options: readonly { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 cursor-pointer',
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

function Field({
    label,
    required,
    children,
    error,
}: {
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

interface Step1BasicInfoProps {
    control: Control<PostJobFormData>;
    errors: FieldErrors<PostJobFormData>;
}

export function Step1BasicInfo({ control, errors }: Step1BasicInfoProps) {
    const { data: categories = [], isLoading: catLoading } = useQuery({
        queryKey: ['job-categories'],
        queryFn: () => taxonomyService.listJobCategories(),
        staleTime: 5 * 60_000,
    });

    const flatCats = categories.flatMap((cat: any) => [
        { id: cat.id, name: cat.name, depth: 0 },
        ...(cat.children ?? []).map((child: any) => ({
            id: child.id,
            name: child.name,
            depth: 1,
        })),
    ]);

    return (
        <div className="space-y-6">
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
                <Field label="Lĩnh vực / IT Domain" required error={errors.category_id?.message}>
                    <Controller
                        name="category_id"
                        control={control}
                        render={({ field }) =>
                            catLoading ? (
                                <Skeleton className="h-10 w-full rounded-xl" />
                            ) : (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={cn(selectClass, errors.category_id && 'border-red-500')}>
                                        <SelectValue placeholder="-- Chọn lĩnh vực --" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                        {flatCats.map((cat: any) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id.toString()}
                                                className="text-[#0f172a] focus:bg-slate-50 focus:text-[#0f172a] bg-white"
                                                style={{ color: '#0f172a' }}
                                            >
                                                {cat.depth > 0 ? `  - ${cat.name}` : cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )
                        }
                    />
                </Field>

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
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className={cn(inputClass, errors.quantity && 'border-red-500/50')}
                            />
                        )}
                    />
                </Field>
            </div>

            <Field label="Loại hình công việc" required error={errors.job_type?.message}>
                <Controller
                    name="job_type"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup options={JOB_TYPES} value={field.value} onChange={field.onChange} />
                    )}
                />
            </Field>

            <Field label="Cấp bậc" required error={errors.level?.message}>
                <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup options={LEVELS} value={field.value} onChange={field.onChange} />
                    )}
                />
            </Field>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700">Mức lương</label>
                    <Controller
                        name="is_salary_visible"
                        control={control}
                        render={({ field }) => (
                            <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className="flex items-center gap-2 cursor-pointer group select-none"
                            >
                                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                                    Hiển thị lương
                                </span>
                                <div
                                    className={cn(
                                        'w-8 h-5 rounded-full border-2 relative transition-all duration-200 flex-shrink-0',
                                        field.value ? 'bg-violet-600 border-violet-600' : 'bg-slate-100 border-slate-200'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200',
                                            field.value ? 'left-[calc(100%-14px)]' : 'left-0.5'
                                        )}
                                    />
                                </div>
                            </button>
                        )}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <Controller
                        name="salary_currency"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className={selectClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="VND" className="text-[#0f172a] bg-white" style={{ color: '#0f172a' }}>
                                        VND
                                    </SelectItem>
                                    <SelectItem value="USD" className="text-[#0f172a] bg-white" style={{ color: '#0f172a' }}>
                                        USD
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />

                    <Controller
                        name="salary_min"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="number"
                                min={0}
                                placeholder="Tối thiểu"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={cn(inputClass, errors.salary_min && 'border-red-500/50')}
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
                                min={0}
                                placeholder="Tối đa"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={cn(inputClass, errors.salary_max && 'border-red-500/50')}
                            />
                        )}
                    />
                </div>
                {fieldErr(errors.salary_min?.message || errors.salary_max?.message)}
            </div>

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
                                max={50}
                                placeholder="Tối thiểu"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={cn(inputClass, errors.experience_min && 'border-red-500/50')}
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
                                max={50}
                                placeholder="Tối đa"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                value={field.value ?? ''}
                                className={cn(inputClass, errors.experience_max && 'border-red-500/50')}
                            />
                        )}
                    />
                </div>
                {fieldErr(errors.experience_min?.message || errors.experience_max?.message)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Field label="Hạn nộp hồ sơ" required error={errors.deadline?.message}>
                    <Controller
                        name="deadline"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="date"
                                min={getTodayLocalDate()}
                                className={cn(
                                    inputClass,
                                    'cursor-pointer [color-scheme:light]',
                                    errors.deadline && 'border-red-500'
                                )}
                            />
                        )}
                    />
                </Field>

                <Field label="Hình thức làm việc">
                    <Controller
                        name="is_remote"
                        control={control}
                        render={({ field }) => (
                            <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className="flex items-center gap-3 h-10 cursor-pointer group select-none"
                            >
                                <div
                                    className={cn(
                                        'w-10 h-6 rounded-full border-2 relative transition-all duration-200 flex-shrink-0',
                                        field.value
                                            ? 'bg-violet-600 border-violet-600 shadow-sm'
                                            : 'bg-slate-100 border-slate-200'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                                            field.value ? 'left-[calc(100%-18px)]' : 'left-0.5'
                                        )}
                                    />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                    {field.value ? 'Hỗ trợ làm việc từ xa (Remote)' : 'Làm việc tại văn phòng'}
                                </span>
                            </button>
                        )}
                    />
                </Field>
            </div>
        </div>
    );
}
