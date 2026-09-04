import { useState, useEffect } from 'react';
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
import { CandidateLanguage, LanguageRef, LanguageProficiency } from '@/types/api';

const PROFICIENCY_LEVELS = [
    { value: 'basic', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Giao tiếp' },
    { value: 'advanced', label: 'Thành thạo' },
    { value: 'fluent', label: 'Lưu loát' },
    { value: 'native', label: 'Ngôn ngữ chính' },
];

const LEVEL_COLORS: Record<string, string> = {
    basic: 'bg-muted0/10 text-muted-foreground',
    intermediate: 'bg-primary/80/10 text-primary',
    advanced: 'bg-teal-500/10 text-teal-500',
    fluent: 'bg-teal-500/10 text-teal-600',
    native: 'bg-emerald-500/10 text-emerald-600',
};


interface LangFormProps {
    open: boolean;
    onClose: () => void;
    entry?: CandidateLanguage | null;
    userId: number;
    availableLanguages: LanguageRef[];
}

const LangForm = ({ open, onClose, entry, userId, availableLanguages }: LangFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [selectedLangId, setSelectedLangId] = useState('');
    const [proficiency, setProficiency] = useState<LanguageProficiency>('intermediate');
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        if (open) {
            setSelectedLangId(entry?.language_id?.toString() || '');
            setProficiency((entry?.proficiency_level as LanguageProficiency) || 'intermediate');
            setIsNative(entry?.is_native || false);
        }
    }, [entry, open]);

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
            <DialogContent className="bg-card max-w-md rounded-[28px] border border-teal-500/20 dark:border-teal-500/30 shadow-2xl overflow-hidden p-0">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-5 border-b border-border/50">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-xs">
                            <LangIcon className="w-5.5 h-5.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-foreground">
                                    {isEdit ? 'Chỉnh sửa ngôn ngữ' : 'Thêm ngoại ngữ mới'}
                                </h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isEdit ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-teal-500/10 text-teal-600 border-teal-500/20'}`}>
                                    {isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Cập nhật các ngoại ngữ bạn tự tin giao tiếp và làm việc
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Chọn ngôn ngữ <span className="text-destructive">*</span></Label>
                        <Select value={selectedLangId} onValueChange={setSelectedLangId} disabled={isEdit}>
                            <SelectTrigger className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30">
                                <SelectValue placeholder="Chọn ngôn ngữ..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                                {availableLanguages.map(l => (
                                    <SelectItem key={l.id} value={l.id.toString()}>{l.language_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Trình độ thành thạo</Label>
                        <Select value={proficiency} onValueChange={(v) => setProficiency(v as LanguageProficiency)} disabled={isNative}>
                            <SelectTrigger className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PROFICIENCY_LEVELS.filter(p => p.value !== 'native').map(p =>
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${isNative ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/30 border-border/60'}`}>
                        <div className="flex items-center gap-3">
                            <Switch 
                                id="is-native" 
                                checked={isNative}
                                onCheckedChange={v => { setIsNative(v); if (v) setProficiency('native'); else setProficiency('fluent'); }} 
                            />
                            <Label htmlFor="is-native" className="cursor-pointer text-sm font-medium text-foreground">
                                Tiếng mẹ đẻ (Ngôn ngữ chính)
                            </Label>
                        </div>
                        {isNative && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-5">
                            Hủy
                        </Button>
                        <Button 
                            onClick={() => mutation.mutate()} 
                            className="rounded-full px-7 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={mutation.isPending || !selectedLangId}
                        >
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm ngôn ngữ')}
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
    const [editEntry, setEditEntry] = useState<CandidateLanguage | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: userLangs = [], isLoading: langsLoading } = useQuery({
        queryKey: ['user-languages', userId],
        queryFn: () => candidateService.listLanguages(Number(userId)).then(r => r.data),
    });

    const { data: availableLanguages = [] } = useQuery({
        queryKey: ['languages'],
        queryFn: () => taxonomyService.listLanguages(),
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
                        {(userLangs as CandidateLanguage[]).map((lang) => {
                            const levelInfo = PROFICIENCY_LEVELS.find(p => p.value === lang.proficiency_level) || PROFICIENCY_LEVELS[1];
                            const levelColor = LEVEL_COLORS[lang.proficiency_level] || LEVEL_COLORS.intermediate;

                            return (
                                <motion.div
                                    key={lang.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-muted border border-border p-5 rounded-2xl flex justify-between items-center"
                                    onMouseEnter={() => setHoveredId(String(lang.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
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

                                    <div className="flex gap-1 transition-opacity" style={{ opacity: hoveredId === String(lang.id) ? 1 : 0, pointerEvents: hoveredId === String(lang.id) ? 'auto' : 'none' }}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-100 hover:text-teal-600"
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
                        className="border-dashed border-2 border-border bg-muted/50 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-teal-50 hover:border-teal-400 hover:text-teal-600 transition-all min-h-[80px]"
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
