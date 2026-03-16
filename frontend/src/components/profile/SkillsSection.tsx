import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Award, TrendingUp, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { taxonomyService } from '@/services/taxonomyService';
import { SectionWrapper } from './SectionWrapper';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const PROFICIENCY_LEVELS = [
    { value: 'basic', label: 'Cơ bản', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
    { value: 'intermediate', label: 'Trung cấp', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'advanced', label: 'Nâng cao', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
    { value: 'expert', label: 'Chuyên gia', color: 'bg-primary/10 text-primary border-primary/20' },
];

interface SkillEntry {
    id: string;
    name: string;
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
    selectedSkillInfo?: { id: number; name: string } | null;
}

const SkillEditDialog = ({ open, onClose, skill, userId, selectedSkillInfo }: SkillEditDialogProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!skill;

    const [name, setName] = useState(skill?.name || selectedSkillInfo?.name || '');
    const [skillId, setSkillId] = useState<number | null>(selectedSkillInfo?.id || null);
    const [level, setLevel] = useState(skill?.proficiency_level || 'intermediate');
    const [yearsExp, setYearsExp] = useState(skill?.years_of_experience?.toString() || '1');

    useEffect(() => {
        if (open) {
            setName(skill?.name || selectedSkillInfo?.name || '');
            setSkillId(selectedSkillInfo?.id || null);
            setLevel(skill?.proficiency_level || 'intermediate');
            setYearsExp(skill?.years_of_experience?.toString() || '1');
        }
    }, [open, skill, selectedSkillInfo]);

    const mutation = useMutation({
        mutationFn: () => {
            const payload: any = { 
                proficiency_level: level, 
                years_of_experience: Number(yearsExp) || 0,
            };
            if (!isEdit) {
                payload.skill_id = Number(skillId);
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
            <DialogContent className="bg-white max-w-sm rounded-[24px] border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label>Tên kỹ năng</Label>
                        <Input className="" value={name} onChange={e => setName(e.target.value)} placeholder="ReactJS, Python, Figma..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Mức độ thành thạo</Label>
                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger className=""><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PROFICIENCY_LEVELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Số năm sử dụng</Label>
                        <Input type="number" min={0} max={30} className="" value={yearsExp} onChange={e => setYearsExp(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} className="rounded-full">Huỷ</Button>
                        <Button onClick={() => mutation.mutate()} className="rounded-full px-8" disabled={mutation.isPending || !name}>
                            {mutation.isPending ? 'Lưu...' : 'Lưu kỹ năng'}
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
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addSkillInfo, setAddSkillInfo] = useState<{ id: number; name: string } | null>(null);

    const { data: skills = [], isLoading } = useQuery({
        queryKey: ['skills', userId],
        queryFn: () => candidateService.listSkills(Number(userId)).then(r => r.data),
    });

    const { data: searchResults = [] } = useQuery({
        queryKey: ['skills-search', searchValue],
        queryFn: () => taxonomyService.listSkills({ search: searchValue }).then(r => r.data.results),
        enabled: searchValue.length > 1,
        staleTime: 10_000,
    });

    const deleteMutation = useMutation({
        mutationFn: (skillId: string) => candidateService.deleteSkill(Number(userId), Number(skillId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills', userId] });
            toast.success('Đã xoá kỹ năng.');
        }
    });

    const handleSelectSearchResult = (skill: any) => {
        setSearchOpen(false);
        setSearchValue('');
        setAddSkillInfo({ id: skill.id, name: skill.name });
        setAddDialogOpen(true);
    };

    const getProficiencyInfo = (level: string) => PROFICIENCY_LEVELS.find(p => p.value === level) || PROFICIENCY_LEVELS[1];

    if (isLoading) return (
        <SectionWrapper title="Kỹ năng" id="skills">
            <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-36 bg-background/40 animate-pulse rounded-2xl" />)}
            </div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Kỹ năng" id="skills">
            <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                    <AnimatePresence>
                        {(skills as any[]).map((skill) => {
                            const profInfo = getProficiencyInfo(skill.proficiency_level);
                            return (
                                <motion.div
                                    key={skill.id}
                                    layout
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.85, opacity: 0 }}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex items-center gap-3 group relative overflow-hidden cursor-default select-none"
                                >
                                    {/* Verified badge */}
                                    {skill.is_verified && (
                                        <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 rounded-bl-lg" title="Đã xác thực">
                                            <Award className="w-3 h-3 text-emerald-500" />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm">{skill.name}</h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="outline" className={`text-[9px] px-2 py-0 h-[18px] font-semibold ${profInfo.color}`}>
                                                {profInfo.label}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">{skill.years_of_experience} năm</span>
                                            {skill.endorsement_count > 0 && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                    <Users className="w-2.5 h-2.5" />
                                                    {skill.endorsement_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1 hover:text-primary transition-colors rounded"
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
                                className="h-[64px] px-5 rounded-2xl border-dashed border-2 hover:border-primary hover:text-primary transition-all">
                                <Plus className="w-5 h-5 mr-2" />
                                Thêm kỹ năng
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-lg" align="start">
                            <Command className="bg-transparent">
                                <CommandInput
                                    placeholder="Tìm kỹ năng (React, Python...)"
                                    onValueChange={setSearchValue}
                                />
                                <CommandList>
                                    <CommandEmpty>Không tìm thấy kỹ năng phù hợp.</CommandEmpty>
                                    <CommandGroup heading="Gợi ý">
                                        {(searchResults as any[]).map((s) => (
                                            <CommandItem
                                                key={s.id}
                                                onSelect={() => handleSelectSearchResult(s)}
                                                className="cursor-pointer hover:bg-primary/10"
                                            >
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
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 items-start">
                    <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h5 className="font-bold text-sm text-primary">Mẹo cho bạn</h5>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Kỹ năng có mức <strong>Chuyên gia</strong> được xác thực sẽ giúp hồ sơ nổi bật hơn <strong>40%</strong> trong mắt nhà tuyển dụng.
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit skill dialog */}
            <SkillEditDialog
                open={editDialogOpen}
                onClose={() => { setEditDialogOpen(false); setEditSkill(null); }}
                skill={editSkill}
                userId={userId}
            />
            {/* Add new skill dialog */}
            <SkillEditDialog
                open={addDialogOpen}
                onClose={() => { setAddDialogOpen(false); setAddSkillInfo(null); }}
                skill={null}
                userId={userId}
                selectedSkillInfo={addSkillInfo}
            />
        </SectionWrapper>
    );
};
