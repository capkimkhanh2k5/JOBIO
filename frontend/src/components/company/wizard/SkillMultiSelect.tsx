import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { taxonomyService } from '@/services/taxonomyService';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SelectedSkill {
    skill_id: string;
    skill_name: string;
    is_required: boolean;
    proficiency_level: ProficiencyLevel;
}

interface SkillMultiSelectProps {
    value: SelectedSkill[];
    onChange: (skills: SelectedSkill[]) => void;
}

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
    beginner: 'Cơ bản',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
    expert: 'Chuyên gia',
};

const PROFICIENCY_COLORS: Record<ProficiencyLevel, string> = {
    beginner: 'text-slate-500 bg-slate-50 border-slate-200',
    intermediate: 'text-violet-600 bg-violet-50 border-violet-100',
    advanced: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    expert: 'text-amber-600 bg-amber-50 border-amber-100',
};

export function SkillMultiSelect({ value, onChange }: SkillMultiSelectProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: suggestions = [] } = useQuery({
        queryKey: ['job-skills-search', query],
        queryFn: () => taxonomyService.listSkills({ search: query }),
        staleTime: 30_000,
    });

    const addSkill = useCallback((skill: { id: string | number; name: string }) => {
        const stringId = String(skill.id);
        if (value.some(s => s.skill_id === stringId)) return;
        onChange([
            ...value,
            { skill_id: stringId, skill_name: skill.name, is_required: true, proficiency_level: 'intermediate' },
        ]);
        setQuery('');
        setOpen(false);
        inputRef.current?.focus();
    }, [value, onChange]);

    const removeSkill = useCallback((skillId: string) => {
        onChange(value.filter(s => s.skill_id !== skillId));
    }, [value, onChange]);

    const updateSkill = useCallback((skillId: string, patch: Partial<SelectedSkill>) => {
        onChange(value.map(s => s.skill_id === skillId ? { ...s, ...patch } : s));
    }, [value, onChange]);

    const filtered = suggestions.filter(s => !value.some(v => v.skill_id === String(s.id)));

    return (
        <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={15} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    placeholder="Tìm kỹ năng (React, Python, AWS...)"
                    className={cn(
                        'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm',
                        'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400',
                        'focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/5',
                        'transition-all duration-200 shadow-sm'
                    )}
                />

                {/* Dropdown */}
                {open && filtered.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xl py-1">
                        {filtered.map(skill => (
                            <button
                                key={skill.id}
                                type="button"
                                onMouseDown={() => addSkill(skill)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                            >
                                <span className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0" />
                                {skill.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected skills */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map(skill => (
                        <div
                            key={skill.skill_id}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex-wrap sm:flex-nowrap"
                        >
                            {/* Skill name */}
                            <span className="font-bold text-sm text-slate-900 flex-shrink-0 mr-auto">{skill.skill_name}</span>

                            {/* Is required toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={skill.is_required}
                                    onChange={e => updateSkill(skill.skill_id, { is_required: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-violet-600 cursor-pointer"
                                />
                                <span className="text-xs text-slate-500 font-medium">Bắt buộc</span>
                            </label>

                            {/* Proficiency select */}
                            <div className="flex-shrink-0">
                                <Select
                                    value={skill.proficiency_level}
                                    onValueChange={(value) => updateSkill(skill.skill_id, { proficiency_level: value as ProficiencyLevel })}
                                >
                                    <SelectTrigger
                                        className={cn(
                                            'h-8 min-w-[120px] rounded-lg border px-2.5 py-1 text-xs shadow-none',
                                            PROFICIENCY_COLORS[skill.proficiency_level]
                                        )}
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-200 bg-white">
                                        {(Object.keys(PROFICIENCY_LABELS) as ProficiencyLevel[]).map((lvl) => (
                                            <SelectItem key={lvl} value={lvl} className="text-slate-900">
                                                {PROFICIENCY_LABELS[lvl]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeSkill(skill.skill_id)}
                                className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {value.length === 0 && (
                <p className="text-xs text-slate-400 italic font-medium">Chưa có kỹ năng nào được thêm.</p>
            )}

            {/* Tags preview */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {value.map(s => (
                        <Badge key={s.skill_id} variant="outline" className={cn('text-xs border font-medium', s.is_required ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-slate-200 bg-slate-50 text-slate-500')}>
                            {s.skill_name}
                            {s.is_required && <span className="ml-1 text-[10px] text-red-400">*</span>}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
