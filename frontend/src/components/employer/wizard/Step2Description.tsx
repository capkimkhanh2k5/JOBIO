import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { RichTextEditor } from './RichTextEditor';
import { SkillMultiSelect } from './SkillMultiSelect';
import { cn } from '@/lib/utils';
import type { PostJobFormData } from '@/types/postJob';

interface Step2DescriptionProps {
    control: Control<PostJobFormData>;
    errors: FieldErrors<PostJobFormData>;
}

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
            {children}
            {required && <span className="text-red-400">*</span>}
        </label>
    );
}

function SectionCard({ title, required, hint, children, error }: {
    title: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div className={cn(
            'rounded-xl p-4 border border-white/10 bg-white/3 space-y-2',
            error && 'border-red-500/20'
        )}>
            <div className="flex items-start justify-between">
                <SectionLabel required={required}>{title}</SectionLabel>
                {hint && <span className="text-[11px] text-white/30 italic">{hint}</span>}
            </div>
            {children}
            {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
    );
}

export function Step2Description({ control, errors }: Step2DescriptionProps) {
    return (
        <div className="space-y-5">
            {/* Job description */}
            <SectionCard
                title="Mô tả công việc"
                required
                hint="Mô tả rõ trách nhiệm, môi trường làm việc"
                error={errors.description?.message}
            >
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Mô tả chi tiết về vị trí này: trách nhiệm chính, ngày làm việc điển hình, môi trường team..."
                            minHeight="160px"
                            error={!!errors.description}
                        />
                    )}
                />
            </SectionCard>

            {/* Requirements */}
            <SectionCard
                title="Yêu cầu ứng viên"
                required
                hint="Kỹ năng, kinh nghiệm, bằng cấp..."
                error={errors.requirements?.message}
            >
                <Controller
                    name="requirements"
                    control={control}
                    render={({ field }) => (
                        <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Yêu cầu về trình độ, kinh nghiệm, kỹ năng kỹ thuật và mềm..."
                            minHeight="140px"
                            error={!!errors.requirements}
                        />
                    )}
                />
            </SectionCard>

            {/* Benefits */}
            <SectionCard
                title="Phúc lợi"
                hint="Lương, thưởng, chế độ, văn hóa công ty"
            >
                <Controller
                    name="benefits"
                    control={control}
                    render={({ field }) => (
                        <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Mô tả phúc lợi hấp dẫn để thu hút ứng viên: thưởng, bảo hiểm, remote, máy tính xịn..."
                            minHeight="120px"
                        />
                    )}
                />
            </SectionCard>

            {/* Skills */}
            <SectionCard
                title="Kỹ năng yêu cầu"
                hint="Thêm kỹ năng → tùy chỉnh mức độ"
            >
                <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => (
                        <SkillMultiSelect value={field.value} onChange={field.onChange} />
                    )}
                />
            </SectionCard>
        </div>
    );
}
