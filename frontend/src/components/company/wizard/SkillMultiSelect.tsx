import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { taxonomyService } from '@/services/taxonomyService';
import { SkillIcon } from '@/components/ui/SkillIcon';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SelectedSkill {
    skill_id: string;
    skill_name: string;
    is_required: boolean;
    proficiency_level: ProficiencyLevel;
    is_verified?: boolean;
    domain?: string;
    is_publishable?: boolean;
}

interface SkillMultiSelectProps {
    value: SelectedSkill[];
    onChange: (skills: SelectedSkill[]) => void;
}

export function SkillMultiSelect({ value, onChange }: SkillMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const { data: searchResults = [] } = useQuery({
        queryKey: ['job-skills-search', query],
        queryFn: () => taxonomyService.listSkills({ q: query }),
        enabled: query.length > 1,
        staleTime: 10_000,
    });

    const { data: popularSkills = [] } = useQuery({
        queryKey: ['skills-popular'],
        queryFn: () => taxonomyService.listPopularSkills(),
        staleTime: 60_000,
    });

    const suggestions = (query.length > 1 ? searchResults : popularSkills)
        .filter(skill => !value.some(selected => selected.skill_id === String(skill.id)));

    const addSkill = useCallback((skill: { id: string | number | null; name: string; is_verified?: boolean; domain?: string; is_publishable?: boolean }) => {
        const name = skill.name.trim();
        if (!name) return;
        const skillId = skill.id == null ? `custom_${name.toLowerCase().replace(/\s+/g, '_')}` : String(skill.id);
        if (value.some(item => item.skill_id === skillId || item.skill_name.toLowerCase() === name.toLowerCase())) return;
        const isCustom = skill.id == null;
        onChange([...value, {
            skill_id: skillId,
            skill_name: name,
            is_required: true,
            proficiency_level: 'intermediate',
            is_verified: isCustom ? false : skill.is_verified,
            domain: isCustom ? 'pending' : skill.domain,
            is_publishable: isCustom ? false : skill.is_publishable,
        }]);
        setQuery('');
        setOpen(false);
    }, [onChange, value]);

    const removeSkill = useCallback((skillId: string) => {
        onChange(value.filter(skill => skill.skill_id !== skillId));
    }, [onChange, value]);

    return (
        <div className="flex flex-wrap gap-2">
            {value.map(skill => {
                const isPending = skill.skill_id.startsWith('custom_') || skill.is_verified === false || skill.is_publishable === false || skill.domain === 'other';
                return (
                <div
                    key={skill.skill_id}
                    className="bg-card border border-border shadow-sm px-3 py-2 rounded-xl flex items-center gap-2"
                >
                    <SkillIcon skillName={skill.skill_name} size={22} />
                    <span className="font-semibold text-sm text-foreground">{skill.skill_name}</span>
                    {isPending && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
                            chờ duyệt
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => removeSkill(skill.skill_id)}
                        className="p-1 text-muted-foreground/60 hover:text-red-500 transition-colors"
                        aria-label={`Xóa kỹ năng ${skill.skill_name}`}
                    >
                        <X size={14} />
                    </button>
                </div>
                );
            })}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-2 px-4 rounded-xl border-dashed border-2 hover:border-teal-600 hover:text-teal-600"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Thêm kỹ năng
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-2xl overflow-hidden bg-card border border-border shadow-lg" align="start">
                    <Command className="bg-transparent" shouldFilter={false}>
                        <CommandInput placeholder="Tìm kỹ năng (React, Python...)" onValueChange={setQuery} />
                        <CommandList>
                            <CommandEmpty className="py-5 text-center px-4">
                                <p className="text-sm text-muted-foreground mb-3">Không tìm thấy kỹ năng phù hợp.</p>
                                {query.trim() && (
                                    <Button type="button" variant="outline" size="sm" onClick={() => addSkill({ id: null, name: query })}>
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Thêm "{query.trim()}"
                                    </Button>
                                )}
                            </CommandEmpty>
                            <CommandGroup heading={query.length > 1 ? 'Kết quả tìm kiếm' : 'Kỹ năng phổ biến'}>
                                {suggestions.map(skill => (
                                    <CommandItem key={skill.id} onSelect={() => addSkill(skill)} className="cursor-pointer">
                                        <SkillIcon skillName={skill.name} size={20} className="mr-2" />
                                        <span className="flex-1">{skill.name}</span>
                                        {skill.is_verified === false && (
                                            <span className="text-[10px] font-bold text-amber-600">chờ duyệt</span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
