import { useState, useEffect } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Trash2, Calendar, GraduationCap, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/services/mockApi';
import { SectionWrapper } from './SectionWrapper';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    userId: string;
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
        mutationFn: (data: typeof formData) =>
            isEdit
                ? mockApi.updateEducation(userId, entry!.id, data)
                : mockApi.addEducation(userId, data),
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
            <DialogContent className="bg-white max-w-2xl rounded-[24px] border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa học vấn' : 'Thêm học vấn'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label>Tên trường <span className="text-destructive">*</span></Label>
                        <Input className="" placeholder="Đại học Bách Khoa TP.HCM"
                            value={formData.school_name} onChange={e => handleChange('school_name', e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bằng cấp</Label>
                            <Select value={formData.degree} onValueChange={v => handleChange('degree', v)}>
                                <SelectTrigger className=""><SelectValue /></SelectTrigger>
                                <SelectContent>{DEGREES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Chuyên ngành <span className="text-destructive">*</span></Label>
                            <Input className="" placeholder="Computer Science"
                                value={formData.field_of_study} onChange={e => handleChange('field_of_study', e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Từ tháng <span className="text-destructive">*</span></Label>
                            <Input type="month" className=""
                                value={formData.start_date?.slice(0, 7)}
                                onChange={e => handleChange('start_date', e.target.value + '-01')} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Đến tháng</Label>
                            <Input type="month" className="" disabled={formData.is_current}
                                value={formData.end_date?.slice(0, 7)}
                                onChange={e => handleChange('end_date', e.target.value + '-01')} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch id="edu-current" checked={formData.is_current}
                            onCheckedChange={v => { handleChange('is_current', v); if (v) handleChange('end_date', ''); }} />
                        <Label htmlFor="edu-current" className="cursor-pointer">Đang học tại trường này</Label>
                    </div>

                    <div className="space-y-2">
                        <Label>GPA (tuỳ chọn)</Label>
                        <Input className="" placeholder="3.6/4.0"
                            value={formData.gpa} onChange={e => handleChange('gpa', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea className="min-h-[80px]" placeholder="Thành tích, hoạt động ngoại khoá..."
                            value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Huỷ</Button>
                        <Button type="submit" className="rounded-full px-8" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm học vấn')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const EducationSection = ({ userId }: { userId: string }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<EducationEntry | null>(null);

    const { data: educations = [], isLoading } = useQuery({
        queryKey: ['education', userId],
        queryFn: () => mockApi.getEducation(userId),
    });

    const [items, setItems] = useState<EducationEntry[]>(educations as EducationEntry[]);

    useEffect(() => {
        if (educations.length > 0) setItems(educations as EducationEntry[]);
    }, [educations]);

    const deleteMutation = useMutation({
        mutationFn: (entryId: string) => mockApi.deleteEducation(userId, entryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['education', userId] });
            toast.success('Đã xoá mục học vấn.');
        }
    });

    const reorderMutation = useMutation({
        mutationFn: (newOrder: EducationEntry[]) => mockApi.reorderEducation(userId, newOrder.map(e => e.id)),
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
                                    className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex gap-4 items-start group select-none cursor-default"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, height: 0 }}
                                >
                                    <div className="mt-1.5 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <GraduationCap className="w-5 h-5 text-primary" />
                                    </div>

                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold group-hover:text-primary transition-colors truncate">{edu.school_name}</h3>
                                                <p className="text-sm text-primary/80 font-medium">{edu.degree} — {edu.field_of_study}</p>
                                            </div>
                                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
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
                    className="w-full h-12 border-2 border-dashed rounded-2xl hover:bg-primary/5 hover:border-primary hover:text-primary transition-all">
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
