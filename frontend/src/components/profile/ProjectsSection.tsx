import { useState, useEffect } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FolderGit2, ExternalLink, Pencil, GripVertical, CalendarDays, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SectionWrapper } from './SectionWrapper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { CandidateProjectRequest } from '@/types/api';

interface ProjectEntry {
    id: string | number;
    project_name: string;
    description?: string | null;
    project_url?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_ongoing: boolean;
    technologies_used: string;
}

interface ProjectFormProps {
    open: boolean;
    onClose: () => void;
    entry?: ProjectEntry | null;
    userId: number;
}

const ProjectForm = ({ open, onClose, entry, userId }: ProjectFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [formData, setFormData] = useState({
        project_name: '',
        description: '',
        project_url: '',
        start_date: '',
        end_date: '',
        is_ongoing: false,
        technologies_raw: '', // comma-separated string for input
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                project_name: entry.project_name || '',
                description: entry.description || '',
                project_url: entry.project_url || '',
                start_date: entry.start_date || '',
                end_date: entry.end_date || '',
                is_ongoing: entry.is_ongoing || false,
                technologies_raw: Array.isArray(entry.technologies_used) ? entry.technologies_used.join(', ') : (typeof entry.technologies_used === 'string' ? entry.technologies_used : ''),
            });
        } else {
            setFormData({ project_name: '', description: '', project_url: '', start_date: '', end_date: '', is_ongoing: false, technologies_raw: '' });
        }
    }, [entry, open]);

    const mutation = useMutation({
        mutationFn: () => {
            const { start_date, end_date, is_ongoing, technologies_raw, ...rest } = formData;
            const data: CandidateProjectRequest = {
                ...rest,
                is_ongoing,
                start_date: start_date || null,
                end_date: is_ongoing ? null : (end_date || null),
                technologies_used: technologies_raw.split(',').map(t => t.trim()).filter(Boolean).join(', '),
            };
            return isEdit ? candidateService.updateProject(Number(userId), Number(entry!.id), data).then(r => r.data) : candidateService.addProject(Number(userId), data).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật dự án!' : 'Đã thêm dự án!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu. Hãy thử lại.')
    });

    const handleChange = (key: string, value: string | boolean) => setFormData(prev => ({ ...prev, [key]: value }));

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="bg-white max-w-2xl rounded-[24px] border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa dự án' : 'Thêm dự án cá nhân'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label>Tên dự án <span className="text-destructive">*</span></Label>
                        <Input className="" placeholder="Ví dụ: JOBIO Platform, E-Shop..."
                            value={formData.project_name} onChange={e => handleChange('project_name', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea className="min-h-[90px]"
                            placeholder="Mô tả mục tiêu, tính năng chính và vai trò của bạn trong dự án..."
                            value={formData.description} onChange={e => handleChange('description', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Link dự án</Label>
                        <Input className="" placeholder="https://myproject.com"
                            value={formData.project_url} onChange={e => handleChange('project_url', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bắt đầu</Label>
                            <Input type="month" className=""
                                value={formData.start_date?.slice(0, 7)}
                                onChange={e => handleChange('start_date', e.target.value + '-01')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Kết thúc</Label>
                            <Input type="month" className="" disabled={formData.is_ongoing}
                                value={formData.end_date?.slice(0, 7)}
                                onChange={e => handleChange('end_date', e.target.value + '-01')} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch id="proj-ongoing" checked={formData.is_ongoing}
                            onCheckedChange={v => { handleChange('is_ongoing', v); if (v) handleChange('end_date', ''); }} />
                        <Label htmlFor="proj-ongoing" className="cursor-pointer">Dự án đang tiến hành</Label>
                    </div>

                    <div className="space-y-2">
                        <Label>Công nghệ sử dụng</Label>
                        <Input className="" placeholder="React, TypeScript, Node.js (phân cách bằng dấu phẩy)"
                            value={formData.technologies_raw} onChange={e => handleChange('technologies_raw', e.target.value)} />
                        <p className="text-xs text-muted-foreground">Nhập các công nghệ và phân cách bằng dấu phẩy</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Huỷ</Button>
                        <Button onClick={() => mutation.mutate()} className="rounded-full px-8"
                            disabled={mutation.isPending || !formData.project_name}>
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm dự án')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const ProjectsSection = ({ userId }: { userId: number }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<ProjectEntry | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects', userId],
        queryFn: () => candidateService.listProjects(Number(userId)).then(r => r.data),
    });

    const [items, setItems] = useState<ProjectEntry[]>(projects as ProjectEntry[]);

    useEffect(() => {
        if (projects.length > 0) setItems(projects as ProjectEntry[]);
    }, [projects]);

    const deleteMutation = useMutation({
        mutationFn: (projectId: string | number) => candidateService.deleteProject(Number(userId), Number(projectId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', userId] });
            toast.success('Đã xoá dự án.');
        }
    });

    const reorderMutation = useMutation({
        mutationFn: (_newOrder: ProjectEntry[]) => Promise.resolve(),
    });

    const handleReorder = (newOrder: ProjectEntry[]) => {
        setItems(newOrder);
        reorderMutation.mutate(newOrder);
    };

    if (isLoading) return (
        <SectionWrapper title="Dự án cá nhân" id="projects">
            <div className="space-y-6">{[1, 2].map(i => <div key={i} className="h-32 bg-background/40 animate-pulse rounded-2xl" />)}</div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Dự án cá nhân" id="projects">
            <div className="space-y-6">
                <AnimatePresence>
                    {items.length > 0 ? (
                        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-5">
                            {items.map((project) => (
                                <Reorder.Item
                                    key={project.id}
                                    value={project}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex gap-4 items-start select-none cursor-default relative overflow-hidden"
                                    onMouseEnter={() => setHoveredId(String(project.id))}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    {/* Subtle gradient accent */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-transparent transition-opacity pointer-events-none" style={{ opacity: hoveredId === String(project.id) ? 1 : 0 }} />

                                    <div className="mt-1 text-muted-foreground cursor-grab active:cursor-grabbing transition-opacity" style={{ opacity: hoveredId === String(project.id) ? 1 : 0 }}>
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                                        <FolderGit2 className="w-6 h-6 text-violet-600" />
                                    </div>

                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base font-bold transition-colors" style={{ color: hoveredId === String(project.id) ? 'rgb(124 58 237)' : undefined }}>{project.project_name}</h3>
                                                    {project.is_ongoing && (
                                                        <Badge variant="outline" className="text-[10px] h-[18px] px-2 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                                                            <Zap className="w-2.5 h-2.5" /> Đang thực hiện
                                                        </Badge>
                                                    )}
                                                </div>
                                                {(project.start_date || project.end_date) && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {project.start_date && formatDate(project.start_date)}
                                                        {project.start_date && ' — '}
                                                        {project.is_ongoing ? <span className="text-emerald-500 font-semibold">Hiện tại</span> : (project.end_date ? formatDate(project.end_date) : '')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-1 shrink-0 transition-opacity" style={{ opacity: hoveredId === String(project.id) ? 1 : 0, pointerEvents: hoveredId === String(project.id) ? 'auto' : 'none' }}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-100 hover:text-violet-600"
                                                    onClick={() => { setEditEntry(project); setDialogOpen(true); }}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => deleteMutation.mutate(project.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {project.description && (
                                            <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2">{project.description}</p>
                                        )}

                                        {(() => {
                                            const techs = Array.isArray(project.technologies_used)
                                                ? project.technologies_used
                                                : (typeof project.technologies_used === 'string'
                                                    ? project.technologies_used.split(',').map(t => t.trim()).filter(Boolean)
                                                    : []);
                                            
                                            return techs.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {techs.map((tech, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-[10px] h-[18px] px-2 bg-background/50">{tech}</Badge>
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        <div className="flex gap-4 pt-1">
                                            {project.project_url && (
                                                <a href={project.project_url} target="_blank" rel="noreferrer"
                                                    className="text-xs flex items-center gap-1 font-semibold text-violet-600 hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> Live Demo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-10 text-muted-foreground">
                            <FolderGit2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Chưa có dự án nào</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button variant="outline" onClick={() => { setEditEntry(null); setDialogOpen(true); }}
                    className="w-full h-12 border-dashed border-2 rounded-2xl hover:bg-violet-50 hover:border-violet-600 hover:text-violet-600 transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm dự án mới
                </Button>
            </div>

            <ProjectForm open={dialogOpen} onClose={() => { setDialogOpen(false); setEditEntry(null); }} entry={editEntry} userId={userId} />
        </SectionWrapper>
    );
};
