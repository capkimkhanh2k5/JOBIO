import { Controller, type Control, useWatch } from 'react-hook-form';
import { Eye, MapPin, Briefcase, DollarSign, Globe, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PostJobFormData, LocationRow } from '@/types/postJob';

const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl text-sm',
    'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
    'focus:outline-none focus:border-cyan-500/40',
    'transition-all duration-200'
);

const textareaClass = cn(inputClass, 'resize-none');

interface Step4SeoReviewProps {
    control: Control<PostJobFormData>;
}

function JobPreview({ data }: { data: PostJobFormData }) {
    const formatSalary = () => {
        if (!data.is_salary_visible) return 'Thương lượng';
        if (data.salary_min && data.salary_max) {
            const fmt = (v: number) =>
                data.salary_currency === 'USD' ? `$${v.toLocaleString()}` : `${(v / 1_000_000).toFixed(1)}M`;
            return `${fmt(data.salary_min)} – ${fmt(data.salary_max)}`;
        }
        return 'Thương lượng';
    };

    const JOB_TYPE_LABELS: Record<string, string> = {
        full_time: 'Toàn thời gian', part_time: 'Bán thời gian',
        contract: 'Hợp đồng', internship: 'Thực tập', freelance: 'Freelance',
    };

    const LEVEL_LABELS: Record<string, string> = {
        intern: 'Intern', fresher: 'Fresher', junior: 'Junior', middle: 'Middle',
        senior: 'Senior', lead: 'Lead', manager: 'Manager', director: 'Director',
    };

    const primaryLocation = data.locations?.find((l: LocationRow) => l.is_primary) ?? data.locations?.[0];

    return (
        <div className="rounded-2xl border border-white/15 bg-white/5 overflow-hidden">
            {/* Header stripe */}
            <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-lime-400" />

            <div className="p-5">
                {/* Company logo + name */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-lg flex-shrink-0">
                        🏢
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base leading-tight">
                            {data.title || 'Tên vị trí...'}
                        </h3>
                        <p className="text-sm text-white/50 mt-0.5">JOBIO NextGen</p>
                    </div>
                    {data.is_remote && (
                        <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-400 text-xs flex-shrink-0">
                            <Globe size={10} className="mr-1" /> Remote
                        </Badge>
                    )}
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50 mb-4">
                    {data.job_type && (
                        <span className="flex items-center gap-1">
                            <Briefcase size={11} /> {JOB_TYPE_LABELS[data.job_type] ?? data.job_type}
                        </span>
                    )}
                    {data.level && (
                        <span className="flex items-center gap-1">
                            <Users size={11} /> {LEVEL_LABELS[data.level] ?? data.level}
                        </span>
                    )}
                    {primaryLocation?.province_name && (
                        <span className="flex items-center gap-1">
                            <MapPin size={11} /> {primaryLocation.province_name}
                        </span>
                    )}
                    {data.deadline && (
                        <span className="flex items-center gap-1">
                            <Clock size={11} /> HSD: {data.deadline}
                        </span>
                    )}
                </div>

                {/* Salary */}
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={13} className="text-lime-400 flex-shrink-0" />
                    <span className="font-semibold text-lime-400 text-sm">{formatSalary()}</span>
                </div>

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {data.skills.slice(0, 6).map((s: { skill_id: string; skill_name: string }) => (
                            <Badge key={s.skill_id} variant="outline" className="text-xs border-white/15 text-white/60">
                                {s.skill_name}
                            </Badge>
                        ))}
                        {data.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs border-white/10 text-white/40">
                                +{data.skills.length - 6}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Tag input for SEO keywords
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const input = e.currentTarget;
            const tag = input.value.trim().replace(/,$/, '');
            if (tag && !value.includes(tag)) {
                onChange([...value, tag]);
            }
            input.value = '';
        }
        if (e.key === 'Backspace' && !e.currentTarget.value) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className={cn(
            'flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-white/10 bg-white/5 min-h-[42px]',
            'focus-within:border-cyan-500/40 transition-all'
        )}>
            {value.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-violet-500/15 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-md">
                    {tag}
                    <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-red-400 transition-colors">×</button>
                </span>
            ))}
            <input
                type="text"
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : 'Thêm từ khóa...'}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
        </div>
    );
}

export function Step4SeoReview({ control }: Step4SeoReviewProps) {
    const formData = useWatch({ control }) as PostJobFormData;

    return (
        <div className="space-y-6">
            {/* SEO section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-lime-500/15 flex items-center justify-center">
                        <Eye size={14} className="text-lime-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/90">SEO & Tìm kiếm</h3>
                    <span className="text-xs text-white/30">(Tối ưu hiển thị trên Google)</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-white/50 mb-1.5 block">SEO Title</label>
                        <Controller
                            name="seo_title"
                            control={control}
                            render={({ field }) => (
                                <div className="relative">
                                    <input {...field} type="text" maxLength={70} placeholder="VD: Senior Frontend Engineer (React) | JOBIO NextGen" className={inputClass} />
                                    <span className={cn(
                                        'absolute right-3 top-1/2 -translate-y-1/2 text-xs',
                                        (field.value?.length ?? 0) > 60 ? 'text-amber-400' : 'text-white/30'
                                    )}>
                                        {field.value?.length ?? 0}/70
                                    </span>
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/50 mb-1.5 block">SEO Description</label>
                        <Controller
                            name="seo_description"
                            control={control}
                            render={({ field }) => (
                                <div className="relative">
                                    <textarea {...field} rows={3} maxLength={160} placeholder="Tóm tắt ngắn về vị trí này (160 ký tự, tối ưu cho Google)" className={cn(textareaClass, 'pr-16')} />
                                    <span className={cn(
                                        'absolute right-3 top-3 text-xs',
                                        (field.value?.length ?? 0) > 140 ? 'text-amber-400' : 'text-white/30'
                                    )}>
                                        {field.value?.length ?? 0}/160
                                    </span>
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/50 mb-1.5 block">SEO Keywords <span className="text-white/30">(Enter hoặc phẩy để thêm)</span></label>
                        <Controller
                            name="seo_keywords"
                            control={control}
                            render={({ field }) => (
                                <TagInput
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                    placeholder="VD: senior frontend, react developer, typescript..."
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Preview section */}
            <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                        <Eye size={14} className="text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/90">Xem trước tin tuyển dụng</h3>
                </div>
                <JobPreview data={formData} />
            </div>
        </div>
    );
}
