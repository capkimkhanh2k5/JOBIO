import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, MapPin, DollarSign, Calendar, Edit3, Trash2, ArrowRight, Save, X, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { savedJobService } from '@/services/savedJobService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

export default function SavedJobs() {
    const queryClient = useQueryClient();
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingNoteText, setEditingNoteText] = useState('');

    const { data: savedJobs, isLoading } = useQuery({
        queryKey: ['savedJobs'],
        queryFn: () => savedJobService.list().then(r => r.data.results),
    });

    const displaySavedJobs = (savedJobs || []).map((job: any) => ({
        ...job,
        id: job.id,
        job_id: job.job_id ?? job.job?.id,
        title: job.job_title ?? job.title ?? job.job?.title ?? '',
        company_name: job.company_name ?? job.job?.company_name ?? '',
        company_slug: job.company_slug ?? job.job?.company_slug,
        logo_url: job.logo_url ?? job.company_logo ?? job.job?.logo_url ?? '',
        locations: job.locations ?? job.location ?? 'Toan quoc',
        saved_at: job.saved_at ?? job.created_at,
        deadline: job.deadline ?? job.application_deadline,
        salary_negotiable: job.salary_negotiable ?? job.is_salary_negotiable ?? false,
    }));

    const formatDate = (value?: string | null) => {
        if (!value) return 'Chua cap nhat';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Chua cap nhat';
        return date.toLocaleDateString('vi-VN');
    };

    const formatSalary = (job: any) => {
        if (!job.is_salary_visible || job.salary_negotiable) return 'Thoa thuan';
        const min = job.salary_min ? Number(job.salary_min).toLocaleString('vi-VN') : '';
        const max = job.salary_max ? Number(job.salary_max).toLocaleString('vi-VN') : '';
        const range = [min, max].filter(Boolean).join(' - ');
        return range ? `${range} ${job.salary_currency || ''}`.trim() : 'Thoa thuan';
    };

    const removeMutation = useMutation({
        mutationFn: (id: string) => savedJobService.unsave(Number(id)),
        onSuccess: (_, id) => {
            toast.success("Đã bỏ lưu công việc");
            queryClient.setQueryData(['savedJobs'], (old: any) => old?.filter((j: any) => String(j.id) !== String(id)));
            queryClient.invalidateQueries({ queryKey: ['candidate', 'saved-jobs'] });
        }
    });

    const updateNoteMutation = useMutation({
        mutationFn: ({ id, note }: { id: string, note: string }) => savedJobService.update(Number(id), { notes: note } as any).then(r => r.data),
        onSuccess: (_, { id, note }) => {
            toast.success("Đã cập nhật ghi chú");
            queryClient.setQueryData(['savedJobs'], (old: any) => old?.map((j: any) => String(j.id) === String(id) ? { ...j, notes: note } : j));
            setEditingNoteId(null);
        }
    });

    const handleEditNote = (id: string, currentNote: string) => {
        setEditingNoteId(id);
        setEditingNoteText(currentNote || '');
    };

    const handleSaveNote = (id: string) => {
        updateNoteMutation.mutate({ id, note: editingNoteText });
    };

    if (isLoading) {
        return (
            <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
                <div className="sticky top-0 z-20">
                    <PageHeader
                        title="Việc làm đã lưu"
                        description="Đang tải danh sách việc làm đã lưu..."
                        icon={Bookmark}
                    />
                </div>
                <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Việc làm đã lưu"
                    description={`Quản lý và theo dõi các vị trí bạn quan tâm (${displaySavedJobs.length})`}
                    icon={Bookmark}
                />
            </div>

            <div className="p-6 lg:p-8 space-y-6 w-full flex-1 relative z-10">
                {displaySavedJobs.length === 0 ? (
                    <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-violet-500/20">
                            <Bookmark className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có công việc nào được lưu</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Hãy khám phá hàng ngàn cơ hội việc làm hấp dẫn trên JOBIO và lưu lại những vị trí phù hợp với bạn.
                        </p>
                        <Link to="/jobs">
                            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all">
                                Tìm việc ngay
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {displaySavedJobs.map((job: any) => (
                                <motion.div
                                    key={job.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="overflow-hidden bg-white/60 backdrop-blur-xl border-white/40 hover:border-violet-300 hover:shadow-md transition-all rounded-3xl group shadow-sm">
                                        <div className="p-6 flex flex-col md:flex-row gap-6">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {job.logo_url ? (
                                                    <img src={job.logo_url} alt={job.company_name} className="w-10 h-10 object-contain" />
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-500">{(job.company_name || 'CO').slice(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                                    <div>
                                                        <Link to={`/jobs/${job.job_id}`} className="hover:text-violet-600 transition-colors">
                                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                                                        </Link>
                                                        <Link to={job.company_slug ? `/companies/${job.company_slug}` : '#'} className="text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium">
                                                            {job.company_name}
                                                        </Link>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 w-fit shrink-0">
                                                        {job.status}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mb-4">
                                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                                        {job.locations}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" />
                                                        {formatSalary(job)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="w-4 h-4" />
                                                        Lưu {formatDate(job.saved_at)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-orange-500 font-medium">
                                                        <Calendar className="w-4 h-4" />
                                                        Hạn chót: {formatDate(job.deadline)}
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                                                    {editingNoteId === String(job.id) ? (
                                                        <div className="space-y-3">
                                                            <textarea
                                                                value={editingNoteText}
                                                                onChange={e => setEditingNoteText(e.target.value)}
                                                                className="w-full bg-white border border-violet-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none resize-none"
                                                                rows={2}
                                                                placeholder="Thêm ghi chú của bạn cho công việc này..."
                                                                autoFocus
                                                            />
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-slate-500 hover:text-slate-700"
                                                                    onClick={() => setEditingNoteId(null)}
                                                                >
                                                                    <X className="w-4 h-4 mr-1" />
                                                                    Hủy
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
                                                                    onClick={() => handleSaveNote(String(job.id))}
                                                                    disabled={updateNoteMutation.isPending}
                                                                >
                                                                    <Save className="w-4 h-4 mr-1" />
                                                                    Lưu ghi chú
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="group/note flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Ghi chú cá nhân</span>
                                                                <p className={`text-sm ${job.notes ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                                                    {job.notes || 'Chưa có ghi chú...'}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-violet-400 opacity-40 group-hover/note:opacity-100 hover:text-violet-600 hover:bg-violet-50 transition-all rounded-full shrink-0"
                                                                onClick={() => handleEditNote(String(job.id), job.notes)}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col items-center gap-3 shrink-0 pt-1">
                                                <Link to={`/jobs/${job.job_id}`} className="w-full md:w-auto flex-1">
                                                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all">
                                                        Ứng tuyển <ExternalLink className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    className="w-full md:w-auto flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl"
                                                    onClick={() => removeMutation.mutate(String(job.id))}
                                                    disabled={removeMutation.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Bỏ lưu
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
