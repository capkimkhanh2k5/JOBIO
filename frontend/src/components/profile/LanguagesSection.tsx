import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Languages as LangIcon, Pencil, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SectionWrapper } from './SectionWrapper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { taxonomyService } from '@/services/taxonomyService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { RecruiterLanguage, LanguageRef, LanguageProficiency } from '@/types/api';

const PROFICIENCY_LEVELS = [
    { value: 'basic', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Giao tiếp' },
    { value: 'advanced', label: 'Thành thạo' },
    { value: 'fluent', label: 'Lưu loát' },
    { value: 'native', label: 'Ngôn ngữ mẹ đẻ' },
];

const LEVEL_COLORS: Record<string, string> = {
    basic: 'bg-slate-500/10 text-slate-500',
    intermediate: 'bg-blue-500/10 text-blue-500',
    advanced: 'bg-violet-500/10 text-violet-500',
    fluent: 'bg-cyan-500/10 text-cyan-600',
    native: 'bg-emerald-500/10 text-emerald-600',
};


interface LangFormProps {
    open: boolean;
    onClose: () => void;
    entry?: RecruiterLanguage | null;
    userId: number;
    availableLanguages: LanguageRef[];
}

const LangForm = ({ open, onClose, entry, userId, availableLanguages }: LangFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [selectedLangId, setSelectedLangId] = useState(entry?.language_id?.toString() || '');
    const [proficiency, setProficiency] = useState<LanguageProficiency>((entry?.proficiency_level as LanguageProficiency) || 'intermediate');
    const [isNative, setIsNative] = useState(entry?.is_native || false);

    const mutation = useMutation({
        mutationFn: () => {
            const data = {
                language_id: Number(selectedLangId),
                proficiency_level: isNative ? ('native' as LanguageProficiency) : proficiency,
                is_native: isNative,
            };
            return isEdit
                ? candidateService.updateLanguage(Number(userId), Number(entry!.id), data as any).then(r => r.data)
                : candidateService.addLanguage(Number(userId), data as any).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-languages', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật ngôn ngữ!' : 'Đã thêm ngôn ngữ!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu. Hãy thử lại.')
    });

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="bg-white max-w-sm rounded-[24px] border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa ngôn ngữ' : 'Thêm ngôn ngữ'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label>Ngôn ngữ</Label>
                        <Select value={selectedLangId} onValueChange={setSelectedLangId} disabled={isEdit}>
                            <SelectTrigger className=""><SelectValue placeholder="Chọn ngôn ngữ" /></SelectTrigger>
                            <SelectContent>
                                {availableLanguages.map(l => (
                                    <SelectItem key={l.id} value={l.id.toString()}>{l.language_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Mức độ</Label>
                        <Select value={proficiency} onValueChange={(v) => setProficiency(v as LanguageProficiency)} disabled={isNative}>
                            <SelectTrigger className=""><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PROFICIENCY_LEVELS.filter(p => p.value !== 'native').map(p =>
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch id="is-native" checked={isNative}
                            onCheckedChange={v => { setIsNative(v); if (v) setProficiency('native'); else setProficiency('fluent'); }} />
                        <Label htmlFor="is-native" className="cursor-pointer">Đây là ngôn ngữ mẹ đẻ</Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Huỷ</Button>
                        <Button onClick={() => mutation.mutate()} className="rounded-full px-8"
                            disabled={mutation.isPending || !selectedLangId}>
                            {mutation.isPending ? 'Lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const LanguagesSection = ({ userId }: { userId: number }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<RecruiterLanguage | null>(null);

    const { data: userLangs = [], isLoading: langsLoading } = useQuery({
        queryKey: ['user-languages', userId],
        queryFn: () => candidateService.listLanguages(Number(userId)).then(r => r.data),
    });

    const { data: availableLanguages = [] } = useQuery({
        queryKey: ['languages'],
        queryFn: () => taxonomyService.listLanguages().then(r => r.data),
        staleTime: Infinity,
    });

    const deleteMutation = useMutation({
        mutationFn: (langId: number) => candidateService.deleteLanguage(Number(userId), Number(langId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-languages', userId] });
            toast.success('Đã xoá ngôn ngữ.');
        }
    });

    if (langsLoading) return (
        <SectionWrapper title="Ngoại ngữ" id="languages">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-background/40 animate-pulse rounded-2xl" />)}
            </div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Ngoại ngữ" id="languages">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {(userLangs as RecruiterLanguage[]).map((lang) => {
                            const levelInfo = PROFICIENCY_LEVELS.find(p => p.value === lang.proficiency_level) || PROFICIENCY_LEVELS[1];
                            const levelColor = LEVEL_COLORS[lang.proficiency_level] || LEVEL_COLORS.intermediate;

                            return (
                                <motion.div
                                    key={lang.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                                            <LangIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm">{lang.language_name}</h4>
                                                {lang.is_native && (
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={`text-[10px] h-[18px] px-2 font-medium ${levelColor}`}>
                                                    {levelInfo.label}
                                                </Badge>
                                                {lang.is_native && (
                                                    <span className="text-[10px] text-emerald-500 font-semibold">Bản ngữ</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-100 hover:text-violet-600"
                                            onClick={() => { setEditEntry(lang); setDialogOpen(true); }}>
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => deleteMutation.mutate(lang.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Add card */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        onClick={() => { setEditEntry(null); setDialogOpen(true); }}
                        className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-violet-50 hover:border-violet-400 hover:text-violet-600 transition-all min-h-[80px]"
                    >
                        <Plus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground">Thêm ngôn ngữ</span>
                    </motion.button>
                </div>
            </div>

            <LangForm
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setEditEntry(null); }}
                entry={editEntry}
                userId={userId}
                availableLanguages={availableLanguages}
            />
        </SectionWrapper>
    );
};
