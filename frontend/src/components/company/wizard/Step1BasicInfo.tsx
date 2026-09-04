import { useQuery } from '@tanstack/react-query';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { taxonomyService } from '@/services/taxonomyService';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Layers, Briefcase, User, Users, Trash2, Building2, Laptop } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PostJobFormData, JobPositionItem, JobLevel, JobType, SalaryCurrency } from '@/types/postJob';

const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl text-sm',
    'bg-card border border-border text-foreground placeholder:text-muted-foreground/60',
    'focus:outline-none focus:border-teal-500/40 focus:ring-4 focus:ring-teal-500/5',
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

const WORKPLACE_OPTIONS = [
    { value: false, label: 'Tại văn phòng', icon: Building2 },
    { value: true, label: 'Làm từ xa', icon: Laptop },
] as const;

function RadioGroup<T extends string | boolean>({
    options,
    value,
    onChange,
}: {
    options: readonly { value: T; label: string; icon?: any }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const Icon = opt.icon;
                return (
                    <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer flex items-center gap-1.5',
                            value === opt.value
                                ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20'
                                : 'bg-card border-border text-muted-foreground hover:border-border hover:text-foreground shadow-xs'
                        )}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                        {opt.label}
                    </button>
                );
            })}
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
            <label className="text-sm font-bold text-foreground/80">
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
            {/* Hiring Mode Switcher: Single Position vs Multi-Position Campaign */}
            <Controller
                name="is_multi_position"
                control={control}
                render={({ field: multiField }) => (
                    <div className="p-4.5 rounded-2xl border border-teal-500/20 bg-teal-500/5 space-y-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-teal-600" /> Hình thức mở đợt tuyển dụng
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                    {multiField.value
                                        ? 'Tuyển nhiều vị trí trong 1 đợt (Mỗi vị trí có Lĩnh vực, Cấp bậc, Hình thức & Mức lương riêng)'
                                        : 'Tuyển dụng cho 1 vị trí công việc cụ thể'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border shadow-xs shrink-0">
                                <button
                                    type="button"
                                    onClick={() => multiField.onChange(false)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                                        !multiField.value
                                            ? 'bg-teal-600 text-white shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <User className="w-3.5 h-3.5" /> 1 Vị trí
                                </button>
                                <button
                                    type="button"
                                    onClick={() => multiField.onChange(true)}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                                        multiField.value
                                            ? 'bg-teal-600 text-white shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <Users className="w-3.5 h-3.5" /> Nhiều vị trí
                                </button>
                            </div>
                        </div>

                        {/* Title Field */}
                        <div className="pt-1">
                            <Field
                                label={multiField.value ? 'Tiêu đề đợt tuyển dụng (Combo)' : 'Tên vị trí tuyển dụng chính'}
                                required
                                error={errors.title?.message}
                            >
                                <Controller
                                    name="title"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="text"
                                            placeholder={
                                                multiField.value
                                                    ? 'VD: Đợt Tuyển Dụng Khối Phần Mềm & Kiểm Thử Quý 3/2026'
                                                    : 'VD: Senior Frontend Engineer (React + TypeScript)'
                                            }
                                            className={cn(inputClass, errors.title && 'border-red-500/50')}
                                        />
                                    )}
                                />
                            </Field>
                        </div>

                        {/* Multi-position Detailed Breakdown Manager */}
                        {multiField.value && (
                            <Controller
                                name="positions"
                                control={control}
                                render={({ field: posField }) => {
                                    const positions: JobPositionItem[] = posField.value || [];
                                    const totalQty = positions.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);

                                    const addPosition = () => {
                                        const newPos: JobPositionItem = {
                                            id: String(Date.now()),
                                            title: '',
                                            level: 'middle',
                                            job_type: 'full_time',
                                            is_remote: false,
                                            quantity: 1,
                                            salary_min: null,
                                            salary_max: null,
                                            salary_currency: 'VND',
                                            is_salary_visible: true,
                                        };
                                        posField.onChange([...positions, newPos]);
                                    };

                                    const updatePos = (index: number, key: keyof JobPositionItem, val: any) => {
                                        const next = [...positions];
                                        next[index] = { ...next[index], [key]: val };
                                        posField.onChange(next);
                                    };

                                    const removePos = (index: number) => {
                                        posField.onChange(positions.filter((_, i) => i !== index));
                                    };

                                    return (
                                        <div className="space-y-4 pt-3 border-t border-teal-500/15">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-foreground">
                                                        Danh sách các vị trí tuyển dụng chi tiết ({positions.length})
                                                    </span>
                                                    {totalQty > 0 && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white">
                                                            Tổng chỉ tiêu: {totalQty} người
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addPosition}
                                                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Thêm vị trí mới
                                                </button>
                                            </div>

                                            {errors.positions && (
                                                <p className="text-xs font-medium text-red-500">{errors.positions.message}</p>
                                            )}

                                            {positions.length === 0 ? (
                                                <div className="p-6 border-2 border-dashed border-teal-500/30 rounded-xl text-center bg-card/60">
                                                    <Briefcase className="w-8 h-8 text-teal-500/50 mx-auto mb-2" />
                                                    <p className="text-xs font-bold text-foreground mb-1">Chưa có vị trí nào trong đợt tuyển dụng</p>
                                                    <p className="text-[11px] text-muted-foreground mb-3">Bấm nút bên dưới để thêm từng vị trí cụ thể (Frontend, Backend, Tester...)</p>
                                                    <button
                                                        type="button"
                                                        onClick={addPosition}
                                                        className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Thêm vị trí tuyển dụng đầu tiên
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {positions.map((pos, idx) => (
                                                        <div
                                                            key={pos.id || idx}
                                                            className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3.5 relative group"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 text-xs font-black flex items-center justify-center shrink-0">
                                                                    #{idx + 1}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={pos.title}
                                                                    onChange={(e) => updatePos(idx, 'title', e.target.value)}
                                                                    placeholder="Tên vị trí (VD: Junior Tester / QA Automation)"
                                                                    className={cn(inputClass, 'flex-1 text-xs font-bold')}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePos(idx)}
                                                                    className="p-2 text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Lĩnh vực / Domain *</label>
                                                                    <Select
                                                                        value={pos.category_id || ''}
                                                                        onValueChange={(v) => updatePos(idx, 'category_id', v)}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs bg-card">
                                                                            <SelectValue placeholder="Chọn lĩnh vực" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-card border-border">
                                                                            {flatCats.map((cat: any) => (
                                                                                <SelectItem key={cat.id} value={cat.id.toString()} className="text-xs">
                                                                                    {cat.depth > 0 ? `  - ${cat.name}` : cat.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Loại hình công việc</label>
                                                                    <Select
                                                                        value={pos.job_type || 'full_time'}
                                                                        onValueChange={(v) => updatePos(idx, 'job_type', v as JobType)}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs bg-card">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-card border-border">
                                                                            {JOB_TYPES.map((jt) => (
                                                                                <SelectItem key={jt.value} value={jt.value} className="text-xs">
                                                                                    {jt.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Cấp bậc</label>
                                                                    <Select
                                                                        value={pos.level}
                                                                        onValueChange={(v) => updatePos(idx, 'level', v as JobLevel)}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs bg-card">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-card border-border">
                                                                            {LEVELS.map((lvl) => (
                                                                                <SelectItem key={lvl.value} value={lvl.value} className="text-xs">
                                                                                    {lvl.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Chỉ tiêu (số người)</label>
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={pos.quantity}
                                                                        onChange={(e) => updatePos(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                                                                        className="w-full h-9 px-3 rounded-xl border border-border text-xs font-bold bg-card"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Salary, Currency & Workplace mode in 1 single row */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1 border-t border-border/40 items-end">
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Đơn vị tiền tệ</label>
                                                                    <Select
                                                                        value={pos.salary_currency || 'VND'}
                                                                        onValueChange={(v) => updatePos(idx, 'salary_currency', v as SalaryCurrency)}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs font-bold bg-card">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="bg-card border-border">
                                                                            <SelectItem value="VND" className="text-xs font-bold">VND (VNĐ)</SelectItem>
                                                                            <SelectItem value="USD" className="text-xs font-bold">USD ($)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Lương tối thiểu</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            placeholder="Thương lượng"
                                                                            value={pos.salary_min ?? ''}
                                                                            onChange={(e) => updatePos(idx, 'salary_min', e.target.value ? Number(e.target.value) : null)}
                                                                            className="w-full h-9 px-3 pr-11 rounded-xl border border-border text-xs bg-card"
                                                                        />
                                                                        <span className="absolute right-2 top-2 text-[10px] font-extrabold text-teal-600 bg-teal-50 px-1 rounded border border-teal-200 pointer-events-none">
                                                                            {pos.salary_currency || 'VND'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Lương tối đa</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            placeholder="Thương lượng"
                                                                            value={pos.salary_max ?? ''}
                                                                            onChange={(e) => updatePos(idx, 'salary_max', e.target.value ? Number(e.target.value) : null)}
                                                                            className="w-full h-9 px-3 pr-11 rounded-xl border border-border text-xs bg-card"
                                                                        />
                                                                        <span className="absolute right-2 top-2 text-[10px] font-extrabold text-teal-600 bg-teal-50 px-1 rounded border border-teal-200 pointer-events-none">
                                                                            {pos.salary_currency || 'VND'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Chế độ làm việc</label>
                                                                    <div className="flex gap-1.5 h-9 items-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePos(idx, 'is_remote', false)}
                                                                            className={cn(
                                                                                'flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border',
                                                                                !pos.is_remote
                                                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                                                                                    : 'bg-card text-muted-foreground hover:text-foreground border-border'
                                                                            )}
                                                                        >
                                                                            <Building2 className="w-3.5 h-3.5" /> On-site
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePos(idx, 'is_remote', true)}
                                                                            className={cn(
                                                                                'flex-1 h-9 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border',
                                                                                pos.is_remote
                                                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                                                                                    : 'bg-card text-muted-foreground hover:text-foreground border-border'
                                                                            )}
                                                                        >
                                                                            <Laptop className="w-3.5 h-3.5" /> Remote
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Deadline inline for multi-position */}
                                            <div className="pt-3 border-t border-teal-500/15">
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
                                                                    'cursor-pointer [color-scheme:light] max-w-xs',
                                                                    errors.deadline && 'border-red-500'
                                                                )}
                                                            />
                                                        )}
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        )}
                    </div>
                )}
            />

            {/* Single Position Only Fields (Hidden in Multi-Position Mode) */}
            <Controller
                name="is_multi_position"
                control={control}
                render={({ field: isMultiField }) => {
                    if (isMultiField.value) return null;
                    return (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                                    <SelectContent className="bg-card border-border">
                                                        {flatCats.map((cat: any) => (
                                                            <SelectItem
                                                                key={cat.id}
                                                                value={cat.id.toString()}
                                                                className="text-[#0f172a] focus:bg-muted focus:text-[#0f172a] bg-card"
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
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Field label="Loại hình công việc" required error={errors.job_type?.message}>
                                    <Controller
                                        name="job_type"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup options={JOB_TYPES} value={field.value} onChange={field.onChange} />
                                        )}
                                    />
                                </Field>

                                <Field label="Chế độ làm việc">
                                    <Controller
                                        name="is_remote"
                                        control={control}
                                        render={({ field }) => (
                                            <RadioGroup
                                                options={WORKPLACE_OPTIONS}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </Field>
                            </div>

                            <Field label="Cấp bậc" required error={errors.level?.message}>
                                <Controller
                                    name="level"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup options={LEVELS} value={field.value} onChange={field.onChange} />
                                    )}
                                />
                            </Field>

                            {/* Salary Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-foreground/80">Mức lương</label>
                                    <Controller
                                        name="is_salary_visible"
                                        control={control}
                                        render={({ field }) => (
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(!field.value)}
                                                className="flex items-center gap-2 cursor-pointer group select-none"
                                            >
                                                <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                                    Hiển thị lương công khai
                                                </span>
                                                <div
                                                    className={cn(
                                                        'w-8 h-5 rounded-full border-2 relative transition-all duration-200 flex-shrink-0',
                                                        field.value ? 'bg-teal-600 border-teal-600' : 'bg-muted border-border'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'absolute top-0.5 w-3 h-3 rounded-full bg-card shadow transition-all duration-200',
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
                                                <SelectContent className="bg-card border-border">
                                                    <SelectItem value="VND" className="text-[#0f172a] bg-card" style={{ color: '#0f172a' }}>
                                                        VND
                                                    </SelectItem>
                                                    <SelectItem value="USD" className="text-[#0f172a] bg-card" style={{ color: '#0f172a' }}>
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
                        </div>
                    );
                }}
            />


        </div>
    );
}
