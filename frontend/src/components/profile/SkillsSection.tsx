import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Award, TrendingUp, Pencil, Users, Sparkles } from 'lucide-react';
import { SkillIcon } from '@/components/ui/SkillIcon';
import { Button } from '@/components/ui/button';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { taxonomyService } from '@/services/taxonomyService';
import { SectionWrapper } from './SectionWrapper';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';



interface SkillEntry {
    id: string;
    name?: string;
    skill_name?: string;
    proficiency_level: string;
    years_of_experience: number;
    endorsement_count: number;
    is_verified: boolean;
}

interface SkillEditDialogProps {
    open: boolean;
    onClose: () => void;
    skill: SkillEntry | null;
    userId: number;
    selectedSkillInfo?: { id: number | null; name: string } | null;
}


const SkillEditDialog = ({ open, onClose, skill, userId, selectedSkillInfo }: SkillEditDialogProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!skill;

    const [name, setName] = useState(skill?.name || selectedSkillInfo?.name || '');
    const [skillId, setSkillId] = useState<number | null>(selectedSkillInfo?.id || null);

    useEffect(() => {
        if (open) {
            setName(skill?.skill_name || skill?.name || selectedSkillInfo?.name || '');
            setSkillId(selectedSkillInfo?.id || null);
        }
    }, [open, skill, selectedSkillInfo]);

    const mutation = useMutation({
        mutationFn: () => {
            const skillName = name.trim();
            const payload: any = {};
            if (!isEdit) {
                if (skillId) {
                    payload.skill_id = Number(skillId);
                } else {
                    payload.skill_name = skillName;
                }
            }
            return isEdit
                ? candidateService.updateSkill(Number(userId), Number(skill!.id), payload).then(r => r.data)
                : candidateService.addSkill(Number(userId), payload).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật kỹ năng!' : 'Đã thêm kỹ năng!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu kỹ năng.')
    });

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="bg-card max-w-md rounded-[28px] border border-teal-500/20 dark:border-teal-500/30 shadow-2xl overflow-hidden p-0">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-5 border-b border-border/50">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-xs">
                            <Sparkles className="w-5.5 h-5.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">
                                    {isEdit ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng chuyên môn'}
                                </h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isEdit ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-teal-500/10 text-teal-600 border-teal-500/20'}`}>
                                    {isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Điền tên kỹ năng chuyên môn của bạn
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Tên kỹ năng <span className="text-destructive">*</span></Label>
                        <Input
                            className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ví dụ: ReactJS, Python, Figma..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-5">
                            Hủy
                        </Button>
                        <Button
                            onClick={() => mutation.mutate()}
                            className="rounded-full px-7 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={mutation.isPending || !name.trim()}
                        >
                            {mutation.isPending ? 'Đang lưu...' : 'Lưu kỹ năng'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const SkillsSection = ({ userId }: { userId: number }) => {
    const queryClient = useQueryClient();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editSkill, setEditSkill] = useState<SkillEntry | null>(null);
    // Track which skill chip is currently hovered (by id)
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: skills = [], isLoading } = useQuery({
        queryKey: ['skills', userId],
        queryFn: () => candidateService.listSkills(Number(userId)).then(r => r.data),
        enabled: !!userId && !isNaN(Number(userId)),
    });

    const { data: searchResults = [] } = useQuery({
        queryKey: ['skills-search', searchValue],
        queryFn: () => taxonomyService.listSkills({ q: searchValue }),
        enabled: searchValue.length > 1,
        staleTime: 10_000,
    });

    const { data: popularSkills = [] } = useQuery({
        queryKey: ['skills-popular'],
        queryFn: () => taxonomyService.listPopularSkills(),
        staleTime: 60_000,
    });

    const displaySuggestions = searchValue.length > 1 ? searchResults : popularSkills;

    const deleteMutation = useMutation({
        mutationFn: (skillId: string) => candidateService.deleteSkill(Number(userId), Number(skillId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills', userId] });
            toast.success('Đã xoá kỹ năng.');
        }
    });

    // Direct-add mutation — skips the confirmation dialog
    const addMutation = useMutation({
        mutationFn: (info: { id: number | null; name: string }) => {
            const payload: any = {
                proficiency_level: 'intermediate',
                years_of_experience: 0,
            };
            if (info.id) {
                payload.skill_id = Number(info.id);
            } else {
                payload.skill_name = info.name;
            }
            return candidateService.addSkill(Number(userId), payload).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success('Đã thêm kỹ năng!');
        },
        onError: () => toast.error('Không thể thêm kỹ năng.')
    });

    const handleSelectSearchResult = (skill: any) => {
        const skillName = (skill.name || '').trim();
        if (!skillName) return;
        setSearchOpen(false);
        setSearchValue('');
        // Add skill directly — no confirmation dialog
        addMutation.mutate({ id: skill.id, name: skillName });
    };


    if (isLoading) return (
        <SectionWrapper title="Kỹ năng" id="skills">
            <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-36 bg-background/40 animate-pulse rounded-2xl" />)}
            </div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Kỹ năng" id="skills">
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                        {(skills as any[]).map((skill) => {
                            const isHovered = hoveredId === String(skill.id);
                            return (
                                <motion.div
                                    key={skill.id}
                                    layout
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.85, opacity: 0 }}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    onMouseEnter={() => setHoveredId(String(skill.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                    className="bg-card border border-border shadow-sm px-3 py-2 rounded-xl flex items-center gap-2 relative overflow-hidden cursor-default select-none"
                                >
                                    {/* Verified badge */}
                                    {skill.is_verified && (
                                        <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 rounded-bl-lg" title="Đã xác thực">
                                            <Award className="w-3 h-3 text-emerald-500" />
                                        </div>
                                    )}

                                    {/* Skill icon */}
                                    <SkillIcon skillName={skill.skill_name || skill.name || ''} size={22} />

                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-sm truncate text-foreground">{skill.skill_name || skill.name}</h4>
                                        {skill.endorsement_count > 0 && (
                                            <div className="mt-1">
                                                <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md flex items-center gap-1 w-fit font-medium">
                                                    <Users className="w-3 h-3" />
                                                    {skill.endorsement_count} lượt xác thực
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="flex gap-1 ml-1 transition-opacity duration-150"
                                        style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
                                    >
                                        <button className="p-1 hover:text-teal-600 transition-colors rounded"
                                            onClick={() => { setEditSkill(skill); setEditDialogOpen(true); }}
                                            aria-label="Chỉnh sửa kỹ năng">
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button className="p-1 hover:text-destructive transition-colors rounded"
                                            onClick={() => deleteMutation.mutate(skill.id)}
                                            aria-label="Xoá kỹ năng">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Add skill popover */}
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline"
                                className="h-auto py-2 px-4 rounded-xl border-dashed border-2 hover:border-teal-600 hover:text-teal-600 transition-all">
                                <Plus className="w-5 h-5 mr-2" />
                                Thêm kỹ năng
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-2xl overflow-hidden bg-card border border-border shadow-lg" align="start">
                            <Command className="bg-transparent" shouldFilter={false}>
                                <CommandInput
                                    placeholder="Tìm kỹ năng (React, Python...)"
                                    onValueChange={setSearchValue}
                                />
                                <CommandList>
                                    <CommandEmpty className="py-5 text-center px-4">
                                        <p className="text-sm text-muted-foreground mb-3">Không tìm thấy kỹ năng phù hợp.</p>
                                        {searchValue.trim() && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                                onClick={() => handleSelectSearchResult({ id: null, name: searchValue })}
                                            >
                                                <Plus className="w-4 h-4 mr-1.5" />
                                                Thêm "{searchValue.trim()}"
                                            </Button>
                                        )}
                                    </CommandEmpty>
                                    <CommandGroup heading={searchValue.length > 1 ? "Kết quả tìm kiếm" : "Kỹ năng phổ biến"}>
                                        {(displaySuggestions as any[]).map((s) => (
                                            <CommandItem
                                                key={s.id}
                                                onSelect={() => handleSelectSearchResult(s)}
                                                className="cursor-pointer hover:bg-teal-100"
                                            >
                                                <SkillIcon skillName={s.name || ''} size={20} className="mr-2" />
                                                {s.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Tip */}
                <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 flex gap-4 items-start">
                    <TrendingUp className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                        <h5 className="font-bold text-sm text-teal-600">Mẹo cho bạn</h5>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Thêm nhiều kỹ năng thực tế sẽ có nhiều <strong>cơ hội</strong> với nhà tuyển dụng.
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit skill dialog (only for editing existing skills) */}
            <SkillEditDialog
                open={editDialogOpen}
                onClose={() => { setEditDialogOpen(false); setEditSkill(null); }}
                skill={editSkill}
                userId={userId}
            />
        </SectionWrapper>
    );
};
