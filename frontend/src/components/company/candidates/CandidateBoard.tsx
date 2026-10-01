
import { motion, AnimatePresence } from 'framer-motion';
import { useCandidateStore } from '@/store/candidateStore';
import { applicationService } from '@/services/applicationService';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Inbox, Video, CheckCircle2, XCircle, User, GripVertical, Calendar } from "lucide-react";

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

const COLUMNS = ['pending', 'interview', 'accepted', 'rejected'];

const COLUMN_CONFIG: Record<string, { label: string; icon: any; colorClass: string; borderTop: string; badgeStyle: string; emptyHint: string }> = {
    pending: {
        label: 'Ứng tuyển mới',
        icon: Inbox,
        colorClass: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
        borderTop: 'bg-blue-500',
        badgeStyle: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        emptyHint: 'Chưa có hồ sơ mới',
    },
    interview: {
        label: 'Phỏng vấn & Đánh giá',
        icon: Video,
        colorClass: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
        borderTop: 'bg-amber-500',
        badgeStyle: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        emptyHint: 'Kéo ứng viên cần phỏng vấn vào đây',
    },
    accepted: {
        label: 'Tuyển dụng / Offer',
        icon: CheckCircle2,
        colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
        borderTop: 'bg-emerald-500',
        badgeStyle: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        emptyHint: 'Ứng viên trúng tuyển sẽ ở đây',
    },
    rejected: {
        label: 'Đã từ chối',
        icon: XCircle,
        colorClass: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
        borderTop: 'bg-rose-500',
        badgeStyle: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        emptyHint: 'Hồ sơ chưa đạt yêu cầu',
    },
};

const getMappedColumnStatus = (appStatus: string) => {
    if (appStatus === 'pending') return 'pending';
    if (['reviewing', 'shortlisted', 'interview'].includes(appStatus)) return 'interview';
    if (['offered', 'accepted'].includes(appStatus)) return 'accepted';
    if (['rejected', 'withdrawn'].includes(appStatus)) return 'rejected';
    return 'pending';
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
        const el = document.getElementById(`card-${id}`);
        if (el) el.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (!draggedCandidateId) return;

        const app = applications.find((a) => a.id === draggedCandidateId);
        if (!app) return;

        const currentMappedStatus = getMappedColumnStatus(app.status);
        if (currentMappedStatus === newStatus) return;

        try {
            await applicationService.updateStatus(Number(draggedCandidateId), newStatus);
            const config = COLUMN_CONFIG[newStatus];
            toast.success(`Đã chuyển ứng viên sang trạng thái ${config?.label || newStatus}`);
            onStatusChange();
        } catch (_err) {
            toast.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 h-full">
                {COLUMNS.map((column) => (
                    <div
                        key={column}
                        className="bg-muted/40 rounded-3xl p-5 border border-border/50 animate-pulse h-full min-h-[480px]"
                    >
                        <div className="h-4 w-28 bg-muted rounded mb-4"></div>
                        <div className="h-40 bg-muted rounded-2xl"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-0 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-1 min-h-0">
                {COLUMNS.map((status) => {
                    const columnApps = applications.filter((candidate) => getMappedColumnStatus(candidate.status) === status);
                    const config = COLUMN_CONFIG[status] || COLUMN_CONFIG.pending;
                    const Icon = config.icon;

                    return (
                        <div
                            key={status}
                            className="h-full flex flex-col bg-muted/20 dark:bg-muted/10 border border-border/50 rounded-3xl p-4 transition-all relative overflow-hidden flex-1 min-h-[480px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                        >
                            {/* Top Accent Line */}
                            <div className={cn("absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl", config.borderTop)} />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-3.5 pt-1.5 px-1 shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center border shadow-2xs", config.colorClass)}>
                                        <Icon className="w-4 h-4 stroke-[2]" />
                                    </div>
                                    <h3 className="font-extrabold text-xs tracking-tight text-foreground">
                                        {config.label}
                                    </h3>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn('px-2.5 py-0.5 rounded-full text-xs font-black border shadow-2xs', config.badgeStyle)}
                                >
                                    {columnApps.length}
                                </Badge>
                            </div>

                            {/* Candidate Cards List or Empty Dropzone */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 scrollbar-thin flex flex-col min-h-0">
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
                                                    'bg-card border border-border/60 rounded-2xl p-3.5 shadow-2xs hover:shadow-md hover:border-teal-500/40 transition-all cursor-grab active:cursor-grabbing group shrink-0',
                                                    draggedCandidateId === app.id ? 'opacity-50 scale-95' : ''
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-2.5">
                                                    <div className="flex gap-2.5 min-w-0">
                                                        <Avatar className="h-9 w-9 border border-border/50 shrink-0">
                                                            <AvatarImage src={app.candidate_avatar} />
                                                            <AvatarFallback>
                                                                <User className="w-4 h-4" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-xs leading-tight text-foreground group-hover:text-teal-600 transition-colors truncate">
                                                                {app.candidate_name}
                                                            </h4>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                                {app.job_title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                </div>

                                                <div className="flex flex-wrap gap-1 mb-2.5">
                                                    {(app.skills || []).slice(0, 2).map((skill) => (
                                                        <Badge
                                                            key={skill}
                                                            variant="outline"
                                                            className="text-[10px] px-1.5 py-0 h-4 bg-muted/60 border-border/60 text-muted-foreground font-medium"
                                                        >
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {(app.skills || []).length > 2 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] px-1.5 py-0 h-4 bg-muted/60 border-border/60 text-muted-foreground font-medium"
                                                        >
                                                            +{(app.skills || []).length - 2}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/50">
                                                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {new Date(app.applied_at).toLocaleDateString('vi-VN', {
                                                                month: 'numeric',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold',
                                                            getScoreColor(matchScore)
                                                        )}
                                                    >
                                                        Match {matchScore}%
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {columnApps.length === 0 && (
                                    <div className="flex-1 w-full border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-card/50 hover:bg-card hover:border-teal-500/40 transition-all gap-2 group cursor-pointer">
                                        <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground/60 shadow-2xs group-hover:scale-110 group-hover:bg-teal-500/10 group-hover:text-teal-600 transition-all">
                                            <Icon className="w-5 h-5 stroke-[1.5]" />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground/80">{config.emptyHint}</span>
                                        <span className="text-[10px] text-muted-foreground/50 font-medium">Kéo thả ứng viên vào vòng này</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
