import { useState, useEffect } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Trash2, Calendar, GraduationCap, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { SectionWrapper } from './SectionWrapper';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const DEGREES = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Certificate', 'Other'];

interface EducationEntry {
    id: string;
    school_name: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    gpa?: string;
    description?: string;
}

interface EducationFormProps {
    open: boolean;
    onClose: () => void;
    entry?: EducationEntry | null;
    userId: number;
}

const EducationForm = ({ open, onClose, entry, userId }: EducationFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [formData, setFormData] = useState({
        school_name: '',
        degree: 'Bachelor',
        field_of_study: '',
        start_date: '',
        end_date: '',
        is_current: false,
        gpa: '',
        description: '',
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                school_name: entry.school_name || '',
                degree: entry.degree || 'Bachelor',
                field_of_study: entry.field_of_study || '',
                start_date: entry.start_date || '',
                end_date: entry.end_date || '',
                is_current: entry.is_current || false,
                gpa: entry.gpa || '',
                description: entry.description || '',
            });
        } else {
            setFormData({ school_name: '', degree: 'Bachelor', field_of_study: '', start_date: '', end_date: '', is_current: false, gpa: '', description: '' });
        }
    }, [entry, open]);

    const mutation = useMutation({
        mutationFn: (data: typeof formData) => {
            const { start_date, end_date, gpa, is_current, ...rest } = data;
            const payload = { 
                ...rest, 
                is_current,
                start_date: start_date || null,
                end_date: is_current ? null : (end_date || null),
                gpa: gpa ? Number(gpa) : null 
            };
            return isEdit
                ? candidateService.updateEducation(Number(userId), Number(entry!.id), payload as any).then(r => r.data)
                : candidateService.addEducation(Number(userId), payload as any).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['education', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật học vấn!' : 'Đã thêm học vấn!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu. Hãy thử lại.')
    });

    const handleChange = (key: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.school_name || !formData.field_of_study || !formData.start_date) {
            toast.error('Vui lòng điền đủ thông tin bắt buộc.');
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-card max-w-2xl rounded-[28px] border border-teal-500/20 dark:border-teal-500/30 shadow-2xl overflow-hidden p-0">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-xs">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-foreground">
                                    {isEdit ? 'Chỉnh sửa học vấn' : 'Thêm quá trình học vấn'}
                                </h3>
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isEdit ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-teal-500/10 text-teal-600 border-teal-500/20'}`}>
                                    {isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Thông tin học vấn giúp làm nổi bật trình độ chuyên môn của bạn
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs font-semibold">
                            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                            Tên trường đào tạo <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                            className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                            placeholder="Ví dụ: Đại học Bách Khoa TP.HCM"
                            value={formData.school_name} 
                            onChange={e => handleChange('school_name', e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Bằng cấp</Label>
                            <Select value={formData.degree} onValueChange={v => handleChange('degree', v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{DEGREES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Chuyên ngành đào tạo <span className="text-destructive">*</span></Label>
                            <Input 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                                placeholder="Ví dụ: Khoa học máy tính, Công nghệ thông tin..."
                                value={formData.field_of_study} 
                                onChange={e => handleChange('field_of_study', e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                Từ tháng <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                                type="month" 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                                value={formData.start_date?.slice(0, 7)}
                                onChange={e => handleChange('start_date', e.target.value + '-01')} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                Đến tháng
                            </Label>
                            <Input 
                                type="month" 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                                disabled={formData.is_current}
                                value={formData.end_date?.slice(0, 7)}
                                onChange={e => handleChange('end_date', e.target.value + '-01')} 
                            />
                        </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${formData.is_current ? 'bg-teal-500/10 border-teal-500/30' : 'bg-muted/30 border-border/60'}`}>
                        <div className="flex items-center gap-3">
                            <Switch 
                                id="edu-current" 
                                checked={formData.is_current}
                                onCheckedChange={v => { handleChange('is_current', v); if (v) handleChange('end_date', ''); }} 
                            />
                            <Label htmlFor="edu-current" className="cursor-pointer text-sm font-medium text-foreground">
                                Đang học tại trường này
                            </Label>
                        </div>
                        {formData.is_current && (
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                Đang theo học
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Điểm GPA (tùy chọn)</Label>
                        <Input 
                            className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                            placeholder="Ví dụ: 3.6/4.0 hoặc 8.5/10"
                            value={formData.gpa} 
                            onChange={e => handleChange('gpa', e.target.value)} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Mô tả & Thành tích ngoại khóa</Label>
                        <Textarea 
                            className="min-h-[85px] rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                            placeholder="Các học bổng, hoạt động CLB hoặc dự án nghiên cứu..."
                            value={formData.description} 
                            onChange={e => handleChange('description', e.target.value)} 
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-6">
                            Hủy
                        </Button>
                        <Button 
                            type="submit" 
                            className="rounded-full px-8 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm học vấn')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const EducationSection = ({ userId }: { userId: number }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<EducationEntry | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: educations = [], isLoading } = useQuery({
        queryKey: ['education', userId],
        queryFn: () => candidateService.listEducation(Number(userId)).then(r => r.data),
        enabled: !!userId && !isNaN(Number(userId)),
    });

    const [items, setItems] = useState<any[]>(educations as any[]);

    useEffect(() => {
        if (educations && educations.length > 0) setItems(educations as any[]);
    }, [educations]);

    const deleteMutation = useMutation({
        mutationFn: (entryId: string) => candidateService.deleteEducation(Number(userId), Number(entryId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['education', userId] });
            toast.success('Đã xoá mục học vấn.');
        }
    });

    const reorderMutation = useMutation({
        mutationFn: (_newOrder: EducationEntry[]) => Promise.resolve(),
    });

    const handleReorder = (newOrder: EducationEntry[]) => {
        setItems(newOrder);
        reorderMutation.mutate(newOrder);
    };

    const handleEdit = (edu: EducationEntry) => {
        setEditEntry(edu);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setEditEntry(null);
        setDialogOpen(true);
    };

    if (isLoading) return (
        <SectionWrapper title="Học vấn" id="education">
            <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 bg-background/40 animate-pulse rounded-2xl" />)}
            </div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Học vấn" id="education">
            <div className="space-y-6">
                <AnimatePresence>
                    {items.length > 0 ? (
                        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
                            {items.map((edu) => (
                                <Reorder.Item
                                    key={edu.id}
                                    value={edu}
                                    className="bg-card border border-border shadow-sm p-5 rounded-2xl flex gap-4 items-start select-none cursor-default"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, height: 0 }}
                                    onMouseEnter={() => setHoveredId(String(edu.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <div className="mt-1.5 text-muted-foreground cursor-grab active:cursor-grabbing transition-opacity" style={{ opacity: hoveredId === String(edu.id) ? 1 : 0 }}>
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                                        <GraduationCap className="w-5 h-5 text-teal-600" />
                                    </div>

                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold transition-colors truncate" style={{ color: hoveredId === String(edu.id) ? 'rgb(124 58 237)' : undefined }}>{edu.school_name}</h3>
                                                <p className="text-sm text-teal-500 font-medium">{edu.degree} — {edu.field_of_study}</p>
                                            </div>
                                            <div className="flex gap-1 shrink-0 transition-opacity" style={{ opacity: hoveredId === String(edu.id) ? 1 : 0, pointerEvents: hoveredId === String(edu.id) ? 'auto' : 'none' }}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-100 hover:text-teal-600"
                                                    onClick={() => handleEdit(edu)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => deleteMutation.mutate(edu.id)}
                                                    disabled={deleteMutation.isPending}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(edu.start_date)} — {edu.is_current ? <span className="text-emerald-500 font-semibold">Hiện tại</span> : formatDate(edu.end_date || '')}
                                            {edu.gpa && <span className="ml-3 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-semibold">GPA {edu.gpa}</span>}
                                        </div>

                                        {edu.description && (
                                            <p className="text-xs text-muted-foreground/70 italic leading-relaxed mt-1 line-clamp-2">
                                                "{edu.description}"
                                            </p>
                                        )}
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-10 text-muted-foreground">
                            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Chưa có thông tin học vấn</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button variant="outline" onClick={handleAdd}
                    className="w-full h-12 border-2 border-dashed rounded-2xl hover:bg-teal-50 hover:border-teal-600 hover:text-teal-600 transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm học vấn
                </Button>
            </div>

            <EducationForm
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setEditEntry(null); }}
                entry={editEntry}
                userId={userId}
            />
        </SectionWrapper>
    );
};
