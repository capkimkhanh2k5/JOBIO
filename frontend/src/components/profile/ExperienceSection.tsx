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
import { taxonomyService } from '@/services/taxonomyService';
import { Combobox } from '@/components/ui/combobox';

interface ExperienceEntry {
    id: string;
    company_name: string;
    job_title: string;
    industry_id?: number;
    industry_name?: string;
    industry?: number | string; 
    start_date: string;
    end_date?: string;
    is_current: boolean;
    description?: string;
    achievements?: string;
    location?: string;
    province_id?: number;
    province_name?: string;
}

interface ExperienceFormProps {
    open: boolean;
    onClose: () => void;
    entry?: ExperienceEntry | null;
    userId: number;
}

const ExperienceForm = ({ open, onClose, entry, userId }: ExperienceFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [formData, setFormData] = useState({
        company_name: '',
        job_title: '',
        industry: '',
        industry_id: 0 as number | string,
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
        achievements: '',
        location: '',
        province_id: 0 as number | string,
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                company_name: entry.company_name || '',
                job_title: entry.job_title || '',
                industry: entry.industry_name || '',
                industry_id: (entry.industry_id || entry.industry) ? Number(entry.industry_id || entry.industry) : '',
                start_date: entry.start_date || '',
                end_date: entry.end_date || '',
                is_current: entry.is_current || false,
                description: entry.description || '',
                achievements: entry.achievements || '',
                location: entry.location || '',
                province_id: entry.province_id ? Number(entry.province_id) : '',
            });
        } else {
            setFormData({ company_name: '', job_title: '', industry: '', industry_id: '', start_date: '', end_date: '', is_current: false, description: '', achievements: '', location: '', province_id: '' });
        }
    }, [entry, open]);

    const mutation = useMutation({
        mutationFn: (data: typeof formData) => {
            const { industry, industry_id, location, start_date, end_date, is_current, province_id, ...rest } = data;
            
            const payload = {
                ...rest,
                is_current,
                industry_id: industry_id ? Number(industry_id) : null,
                province_id: province_id ? Number(province_id) : null,
                start_date: start_date || null,
                end_date: is_current ? null : (end_date || null)
            };
            
            return isEdit 
                ? candidateService.updateExperience(Number(userId), Number(entry!.id), payload as any).then(r => r.data) 
                : candidateService.addExperience(Number(userId), payload as any).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['experience', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật kinh nghiệm!' : 'Đã thêm kinh nghiệm!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu. Hãy thử lại.')
    });

    const handleChange = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company_name || !formData.job_title || !formData.start_date) {
            toast.error('Vui lòng điền đủ thông tin bắt buộc.');
            return;
        }
        mutation.mutate(formData);
    };

    const { data: industriesFull = { results: [] } } = useQuery({
        queryKey: ['industries'],
        queryFn: () => taxonomyService.listIndustries(),
    });

    const industries = Array.isArray(industriesFull) ? industriesFull : (industriesFull as any).results || [];

    const industryOptions = industries.map((i: any) => ({
        value: i.id,
        label: i.name
    }));

    const { data: provinces = [] } = useQuery({
        queryKey: ['provinces'],
        queryFn: () => taxonomyService.listProvinces(),
        staleTime: 24 * 60 * 60 * 1000,
    });

    const provinceOptions = provinces.map((p: any) => ({
        value: Number(p.id),
        label: p.province_name
    })).filter((p: any) => p.value && p.label);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-card max-w-2xl rounded-[28px] border border-teal-500/20 dark:border-teal-500/30 shadow-2xl overflow-hidden p-0">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-xs">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-foreground">
                                    {isEdit ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm làm việc'}
                                </h3>
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isEdit ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-teal-500/10 text-teal-600 border-teal-500/20'}`}>
                                    {isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Cập nhật quá trình công tác giúp hồ sơ thu hút nhà tuyển dụng hơn
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                                Tên công ty <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                                placeholder="Ví dụ: Google Vietnam"
                                value={formData.company_name} 
                                onChange={e => handleChange('company_name', e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                                Chức danh công việc <span className="text-destructive">*</span>
                            </Label>
                            <Input 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                                placeholder="Ví dụ: Senior Frontend Engineer"
                                value={formData.job_title} 
                                onChange={e => handleChange('job_title', e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold">Lĩnh vực hoạt động</Label>
                            <Combobox 
                                options={industryOptions}
                                value={formData.industry_id}
                                onChange={(val) => handleChange('industry_id', val)}
                                placeholder="Chọn lĩnh vực"
                                searchPlaceholder="Tìm kiếm lĩnh vực..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                Tỉnh / Thành phố
                            </Label>
                            <Combobox 
                                options={provinceOptions}
                                value={formData.province_id}
                                onChange={(val) => handleChange('province_id', val)}
                                placeholder="Chọn Thành phố"
                                searchPlaceholder="Tìm kiếm thành phố..."
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
                                id="exp-current" 
                                checked={formData.is_current}
                                onCheckedChange={v => { handleChange('is_current', v); if (v) handleChange('end_date', ''); }} 
                            />
                            <Label htmlFor="exp-current" className="cursor-pointer text-sm font-medium text-foreground">
                                Đang làm việc tại đây
                            </Label>
                        </div>
                        {formData.is_current && (
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                Công việc hiện tại
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Mô tả công việc & trách nhiệm chính</Label>
                        <Textarea 
                            className="min-h-[85px] rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                            placeholder="Mô tả công nghệ, quy trình và trách nhiệm hàng ngày của bạn..."
                            value={formData.description} 
                            onChange={e => handleChange('description', e.target.value)} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Thành tích & Dự án nổi bật</Label>
                        <Textarea 
                            className="min-h-[80px] rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                            placeholder="Các giải thưởng, kPIs vượt chỉ tiêu hoặc dấu ấn tiêu biểu..."
                            value={formData.achievements} 
                            onChange={e => handleChange('achievements', e.target.value)} 
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
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm kinh nghiệm')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export const ExperienceSection = ({ userId }: { userId: number }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<ExperienceEntry | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: experiences = [], isLoading } = useQuery({
        queryKey: ['experience', userId],
        queryFn: () => candidateService.listExperience(Number(userId)).then(r => r.data),
        enabled: !!userId && !isNaN(Number(userId)),
    });

    const [items, setItems] = useState<any[]>(experiences as any[]);

    useEffect(() => {
        if (experiences && experiences.length > 0) setItems(experiences as any[]);
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
                                    className="bg-card border border-border shadow-sm p-5 rounded-2xl flex gap-4 items-start select-none cursor-default"
                                    onMouseEnter={() => setHoveredId(String(exp.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <div className="mt-1.5 text-muted-foreground cursor-grab active:cursor-grabbing transition-opacity" style={{ opacity: hoveredId === String(exp.id) ? 1 : 0 }}>
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Briefcase className="w-5 h-5 text-teal-600" />
                                    </div>

                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-bold transition-colors" style={{ color: hoveredId === String(exp.id) ? 'rgb(124 58 237)' : undefined }}>{exp.job_title}</h3>
                                                <p className="text-sm text-teal-500 font-medium flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5" /> {exp.company_name}
                                                    {exp.industry_name && <span className="text-muted-foreground">· {exp.industry_name}</span>}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0 transition-opacity" style={{ opacity: hoveredId === String(exp.id) ? 1 : 0, pointerEvents: hoveredId === String(exp.id) ? 'auto' : 'none' }}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-100 hover:text-teal-600"
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
                                            {(exp.province_name || exp.location) && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {exp.province_name || exp.location}
                                                </span>
                                            )}
                                        </div>

                                        {exp.description && (
                                            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mt-1">{exp.description}</p>
                                        )}

                                        {exp.achievements && (
                                            <div className="mt-2 pl-3 border-l-2 border-teal-200">
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
                    className="w-full h-12 border-2 border-dashed rounded-2xl hover:bg-teal-50 hover:border-teal-600 hover:text-teal-600 transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm kinh nghiệm
                </Button>
            </div>

            <ExperienceForm open={dialogOpen} onClose={() => { setDialogOpen(false); setEditEntry(null); }} entry={editEntry} userId={userId} />
        </SectionWrapper>
    );
};
