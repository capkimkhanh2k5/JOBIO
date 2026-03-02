import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/services/mockApi';
import { Badge } from '@/components/ui/badge';
import { X, Search, ChevronDown } from 'lucide-react';
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
    beginner: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    intermediate: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    advanced: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    expert: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

export function SkillMultiSelect({ value, onChange }: SkillMultiSelectProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: suggestions = [] } = useQuery({
        queryKey: ['job-skills-search', query],
        queryFn: () => mockApi.searchJobSkills(query),
        staleTime: 30_000,
    });

    const addSkill = useCallback((skill: { id: string; name: string }) => {
        if (value.some(s => s.skill_id === skill.id)) return;
        onChange([
            ...value,
            { skill_id: skill.id, skill_name: skill.name, is_required: true, proficiency_level: 'intermediate' },
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

    const filtered = suggestions.filter(s => !value.some(v => v.skill_id === s.id));

    return (
        <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
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
                        'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
                        'focus:outline-none focus:border-cyan-500/40 focus:bg-white/8',
                        'transition-all duration-200'
                    )}
                />

                {/* Dropdown */}
                {open && filtered.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1.5 glass-card rounded-xl overflow-hidden border border-white/15 shadow-2xl">
                        {filtered.map(skill => (
                            <button
                                key={skill.id}
                                type="button"
                                onMouseDown={() => addSkill(skill)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left"
                            >
                                <span className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex-shrink-0" />
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
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 flex-wrap sm:flex-nowrap"
                        >
                            {/* Skill name */}
                            <span className="font-medium text-sm text-white flex-shrink-0 mr-auto">{skill.skill_name}</span>

                            {/* Is required toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={skill.is_required}
                                    onChange={e => updateSkill(skill.skill_id, { is_required: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
                                />
                                <span className="text-xs text-white/50">Bắt buộc</span>
                            </label>

                            {/* Proficiency select */}
                            <div className="relative flex-shrink-0">
                                <select
                                    value={skill.proficiency_level}
                                    onChange={e => updateSkill(skill.skill_id, { proficiency_level: e.target.value as ProficiencyLevel })}
                                    className={cn(
                                        'appearance-none text-xs px-2.5 py-1 pr-6 rounded-lg border cursor-pointer',
                                        'bg-transparent transition-colors',
                                        PROFICIENCY_COLORS[skill.proficiency_level]
                                    )}
                                >
                                    {(Object.keys(PROFICIENCY_LABELS) as ProficiencyLevel[]).map(lvl => (
                                        <option key={lvl} value={lvl} className="bg-[#0f1117] text-white">
                                            {PROFICIENCY_LABELS[lvl]}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                            </div>

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeSkill(skill.skill_id)}
                                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-0.5"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {value.length === 0 && (
                <p className="text-xs text-white/30 italic">Chưa có kỹ năng nào được thêm.</p>
            )}

            {/* Tags preview */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {value.map(s => (
                        <Badge key={s.skill_id} variant="outline" className={cn('text-xs border', s.is_required ? 'border-cyan-500/40 text-cyan-400' : 'border-white/10 text-white/50')}>
                            {s.skill_name}
                            {s.is_required && <span className="ml-1 text-[10px] text-red-400">*</span>}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
