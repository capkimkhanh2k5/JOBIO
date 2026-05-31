import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCandidateStore } from '@/store/candidateStore';
import { applicationService } from '@/services/applicationService';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Calendar, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Application {
    id: string;
    job_id: string;
    candidate_id: string;
    candidate_name: string;
    candidate_avatar: string;
    job_title: string;
    status: string;
    ai_score: number;
    match_score?: number;
    applied_at: string;
    skills: string[];
}

const COLUMNS = ['pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'withdrawn'];

const STATUS_LABELS: Record<string, string> = {
    pending: 'Submitted',
    reviewing: 'Reviewing',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offered: 'Offered',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['reviewing', 'shortlisted', 'rejected'],
    reviewing: ['shortlisted', 'rejected'],
    shortlisted: ['interview', 'rejected'],
    interview: ['offered', 'rejected'],
    offered: ['accepted', 'rejected'],
    accepted: [],
    rejected: [],
    withdrawn: [],
};

export function CandidateBoard({
    applications,
    isLoading,
    onStatusChange,
}: {
    applications: Application[];
    isLoading: boolean;
    onStatusChange: () => void;
}) {
    const { draggedCandidateId, setDraggedCandidateId, setSelectedCandidateId } = useCandidateStore();
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);
    const autoScrollFrameRef = useRef<number | null>(null);
    const autoScrollDirectionRef = useRef<-1 | 0 | 1>(0);

    useEffect(() => {
        if (!draggedCandidateId) {
            autoScrollDirectionRef.current = 0;
            if (autoScrollFrameRef.current !== null) {
                cancelAnimationFrame(autoScrollFrameRef.current);
                autoScrollFrameRef.current = null;
            }
            return;
        }

        const tick = () => {
            const viewport = scrollViewportRef.current;
            const direction = autoScrollDirectionRef.current;

            if (viewport && direction !== 0) {
                viewport.scrollLeft += direction * 14;
            }

            autoScrollFrameRef.current = requestAnimationFrame(tick);
        };

        autoScrollFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (autoScrollFrameRef.current !== null) {
                cancelAnimationFrame(autoScrollFrameRef.current);
                autoScrollFrameRef.current = null;
            }
        };
    }, [draggedCandidateId]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedCandidateId(id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            const el = document.getElementById(`card-${id}`);
            if (el) el.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (_e: React.DragEvent, id: string) => {
        setDraggedCandidateId(null);
        autoScrollDirectionRef.current = 0;
        const el = document.getElementById(`card-${id}`);
        if (el) el.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        const rect = viewport.getBoundingClientRect();
        const edgeThreshold = 96;

        if (e.clientX >= rect.right - edgeThreshold) {
            autoScrollDirectionRef.current = 1;
        } else if (e.clientX <= rect.left + edgeThreshold) {
            autoScrollDirectionRef.current = -1;
        } else {
            autoScrollDirectionRef.current = 0;
        }
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (!draggedCandidateId) return;

        const app = applications.find((candidate) => candidate.id === draggedCandidateId);
        if (app && app.status !== newStatus) {
            const allowedTransitions = VALID_STATUS_TRANSITIONS[app.status] || [];
            if (!allowedTransitions.includes(newStatus)) {
                toast.error(
                    allowedTransitions.length > 0
                        ? `Từ trạng thái ${STATUS_LABELS[app.status] || app.status} chỉ có thể chuyển sang: ${allowedTransitions.map((status) => STATUS_LABELS[status] || status).join(', ')}`
                        : `Trạng thái ${STATUS_LABELS[app.status] || app.status} không thể chuyển đổi thêm`
                );
                return;
            }

            try {
                await applicationService.updateStatus(Number(draggedCandidateId), newStatus);
                toast.success(`Đã chuyển ứng viên sang trạng thái ${newStatus}`);
                onStatusChange();
            } catch (_err) {
                toast.error('Lỗi khi cập nhật trạng thái');
            }
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

        if (isLoading) {
        return (
            <div className="h-full overflow-hidden">
                <div ref={scrollViewportRef} className="h-full overflow-x-auto overflow-y-hidden">
                    <div className="flex min-w-max gap-4 pb-4 h-full items-start">
                        {COLUMNS.map((column) => (
                            <div
                                key={column}
                                className="w-[300px] flex-shrink-0 bg-slate-100 rounded-xl p-3 border border-slate-200 animate-pulse h-full"
                            >
                                <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
                                <div className="space-y-3">
                                    {[1, 2].map((item) => (
                                        <div key={item} className="h-32 bg-slate-200 rounded-lg"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden">
            <div ref={scrollViewportRef} className="h-full overflow-x-auto overflow-y-hidden">
                <div className="flex min-w-max gap-4 pb-6 h-full items-start">
                    {COLUMNS.map((status) => {
                        const columnApps = applications.filter((candidate) => candidate.status === status);

                        return (
                            <div
                                key={status}
                                className="w-[320px] h-full flex-shrink-0 flex flex-col bg-slate-50 rounded-xl p-3 border border-slate-200"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        {STATUS_LABELS[status] || status}
                                        <Badge
                                            variant="secondary"
                                            className="px-1.5 py-0 min-w-5 justify-center rounded-full text-xs bg-white text-slate-700 border border-slate-200"
                                        >
                                            {columnApps.length}
                                        </Badge>
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                                    <AnimatePresence>
                                        {columnApps.map((app) => {
                                            const matchScore = app.match_score ?? app.ai_score ?? 0;

                                            return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                key={app.id}
                                                id={`card-${app.id}`}
                                                draggable
                                                onDragStart={(e: any) => handleDragStart(e, app.id)}
                                                onDragEnd={(e: any) => handleDragEnd(e, app.id)}
                                                onClick={() => setSelectedCandidateId(app.id)}
                                                className={cn(
                                                    'bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-grab active:cursor-grabbing group',
                                                    draggedCandidateId === app.id ? 'opacity-50 scale-95' : ''
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex gap-3">
                                                        <Avatar className="h-10 w-10 border border-background">
                                                            <AvatarImage src={app.candidate_avatar} />
                                                            <AvatarFallback>
                                                                <User className="w-4 h-4" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h4 className="font-medium text-sm leading-tight group-hover:text-violet-600 transition-colors">
                                                                {app.candidate_name}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">
                                                                {app.job_title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <GripVertical className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>

                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {(app.skills || []).slice(0, 3).map((skill) => (
                                                        <Badge
                                                            key={skill}
                                                            variant="outline"
                                                            className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-slate-200 text-slate-600"
                                                        >
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {(app.skills || []).length > 3 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 border-slate-200 text-slate-600"
                                                        >
                                                            +{(app.skills || []).length - 3}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {new Date(app.applied_at).toLocaleDateString('vi-VN', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'flex items-center gap-1 px-1.5 rounded-md border text-[10px] font-medium',
                                                            getScoreColor(matchScore)
                                                        )}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        Match {matchScore}%
                                                    </div>
                                                </div>
                                            </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {columnApps.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 bg-slate-50/50">
                                            Kéo thả vào đây
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
