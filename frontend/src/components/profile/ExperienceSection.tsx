import { useState, useEffect } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Trash2, Calendar, MapPin, Briefcase, Pencil, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { SectionWrapper } from './SectionWrapper';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ExperienceEntry {
    id: string;
    company_name: string;
    job_title: string;
    industry?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description?: string;
    achievements?: string;
    location?: string;
}

interface ExperienceFormProps {
    open: boolean;
    onClose: () => void;
    entry?: ExperienceEntry | null;
    userId: string;
}

const ExperienceForm = ({ open, onClose, entry, userId }: ExperienceFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [formData, setFormData] = useState({
        company_name: '',
        job_title: '',
        industry: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        achievements: '',
        location: '',
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                company_name: entry.company_name || '',
                job_title: entry.job_title || '',
                industry: entry.industry || '',
                start_date: entry.start_date || '',
                end_date: entry.end_date || '',
                is_current: entry.is_current || false,
                description: entry.description || '',
                achievements: entry.achievements || '',
                location: entry.location || '',
            });
        } else {
            setFormData({ company_name: '', job_title: '', industry: '', start_date: '', end_date: '', is_current: false, description: '', achievements: '', location: '' });
        }
    }, [entry, open]);

    const mutation = useMutation({
        mutationFn: (data: typeof formData) =>
            isEdit ? candidateService.updateExperience(Number(userId), Number(entry!.id), data).then(r => r.data) : candidateService.addExperience(Number(userId), data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['experience', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật kinh nghiệm!' : 'Đã thêm kinh nghiệm!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu. Hãy thử lại.')
    });

    const handleChange = (key: string, value: string | boolean) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company_name || !formData.job_title || !formData.start_date) {
            toast.error('Vui lòng điền đủ thông tin bắt buộc.');
            return;
        }
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-white max-w-2xl rounded-[24px] border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tên công ty <span className="text-destructive">*</span></Label>
                            <Input className="" placeholder="Google Vietnam"
                                value={formData.company_name} onChange={e => handleChange('company_name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Chức danh <span className="text-destructive">*</span></Label>
                            <Input className="" placeholder="Senior Frontend Engineer"
                                value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ngành nghề</Label>
                            <Input className="" placeholder="Công nghệ thông tin"
                                value={formData.industry} onChange={e => handleChange('industry', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Địa điểm</Label>
                            <Input className="" placeholder="Hồ Chí Minh"
                                value={formData.location} onChange={e => handleChange('location', e.target.value)} />
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
                        <Switch id="exp-current" checked={formData.is_current}
                            onCheckedChange={v => { handleChange('is_current', v); if (v) handleChange('end_date', ''); }} />
                        <Label htmlFor="exp-current" className="cursor-pointer">Đang làm việc tại đây</Label>
                    </div>

                    <div className="space-y-2">
                        <Label>Mô tả công việc</Label>
                        <Textarea className="min-h-[80px]"
                            placeholder="Mô tả trách nhiệm và công việc chính..."
                            value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Thành tích nổi bật</Label>
                        <Textarea className="min-h-[80px]"
                            placeholder="Các thành tích, dự án tiêu biểu đã đạt được..."
                            value={formData.achievements} onChange={e => handleChange('achievements', e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Huỷ</Button>
                        <Button type="submit" className="rounded-full px-8" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm kinh nghiệm')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const ExperienceSection = ({ userId }: { userId: string }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<ExperienceEntry | null>(null);

    const { data: experiences = [], isLoading } = useQuery({
        queryKey: ['experience', userId],
        queryFn: () => candidateService.listExperience(Number(userId)).then(r => r.data),
    });

    const [items, setItems] = useState<ExperienceEntry[]>(experiences as ExperienceEntry[]);

    useEffect(() => {
        if (experiences.length > 0) setItems(experiences as ExperienceEntry[]);
    }, [experiences]);

    const deleteMutation = useMutation({
        mutationFn: (entryId: string) => candidateService.deleteExperience(Number(userId), Number(entryId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['experience', userId] });
            toast.success('Đã xoá mục kinh nghiệm.');
        }
    });

    const reorderMutation = useMutation({
        mutationFn: (_newOrder: ExperienceEntry[]) => Promise.resolve(),
    });

    const handleReorder = (newOrder: ExperienceEntry[]) => {
        setItems(newOrder);
        reorderMutation.mutate(newOrder);
    };

    if (isLoading) return (
        <SectionWrapper title="Kinh nghiệm làm việc" id="experience">
            <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-28 bg-background/40 animate-pulse rounded-2xl" />)}</div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Kinh nghiệm làm việc" id="experience">
            <div className="space-y-6">
                <AnimatePresence>
                    {items.length > 0 ? (
                        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
                            {items.map((exp) => (
                                <Reorder.Item
                                    key={exp.id}
                                    value={exp}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex gap-4 items-start group select-none cursor-default"
                                >
                                    <div className="mt-1.5 text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                    </div>

                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold group-hover:text-primary transition-colors">{exp.job_title}</h3>
                                                <p className="text-sm text-primary/80 font-medium flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5" /> {exp.company_name}
                                                    {exp.industry && <span className="text-muted-foreground">· {exp.industry}</span>}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => { setEditEntry(exp); setDialogOpen(true); }}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => deleteMutation.mutate(exp.id)}
                                                    disabled={deleteMutation.isPending}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(exp.start_date)} — {exp.is_current ? <span className="text-emerald-500 font-semibold">Hiện tại</span> : formatDate(exp.end_date || '')}
                                            </span>
                                            {exp.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {exp.location}
                                                </span>
                                            )}
                                        </div>

                                        {exp.description && (
                                            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mt-1">{exp.description}</p>
                                        )}

                                        {exp.achievements && (
                                            <div className="mt-2 pl-3 border-l-2 border-primary/30">
                                                <p className="text-xs text-muted-foreground/70 italic line-clamp-2">{exp.achievements}</p>
                                            </div>
                                        )}
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-10 text-muted-foreground">
                            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Chưa có thông tin kinh nghiệm</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button variant="outline" onClick={() => { setEditEntry(null); setDialogOpen(true); }}
                    className="w-full h-12 border-2 border-dashed rounded-2xl hover:bg-primary/5 hover:border-primary hover:text-primary transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm kinh nghiệm
                </Button>
            </div>

            <ExperienceForm open={dialogOpen} onClose={() => { setDialogOpen(false); setEditEntry(null); }} entry={editEntry} userId={userId} />
        </SectionWrapper>
    );
};
