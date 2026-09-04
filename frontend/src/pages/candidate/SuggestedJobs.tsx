import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Sparkles, Briefcase, MapPin, DollarSign, Clock, Calendar,
    FileText, ExternalLink, Star, Building2, X, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { cvService } from '@/services/cvService';
import { jobService } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { candidateService } from '@/services/candidateService';
import { useUserStore } from '@/store/userStore';
import { getCandidateId } from '@/lib/candidateIdentity';
import { PROFILE_RECOMMENDATION_MIN_SCORE } from '@/lib/jobRecommendationPolicy';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

// ─── Match Score Badge ─────────────────────────────────────────────────────────
function MatchBadge({ score }: { score: number }) {
    const color =
        score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
            score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                score >= 40 ? 'bg-primary/12 text-primary border-primary/20' :
                    'bg-muted text-muted-foreground border-border';
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
            <Sparkles className="w-2.5 h-2.5" />
            Match {score}%
        </span>
    );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function ScoreBreakdown({ breakdown }: { breakdown?: Record<string, number> }) {
    if (!breakdown) return null;
    const items = [
        ['Semantic', breakdown.semantic],
        ['Skills', breakdown.skill],
        ['Title', breakdown.title],
        ['Exp', breakdown.experience],
        ['Salary', breakdown.salary],
        ['Location', breakdown.location],
        ['Fresh', breakdown.freshness],
    ].filter(([, value]) => Number(value) > 0);
    if (items.length === 0) return null;
    return (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {items.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-muted border border-border/60 px-1.5 py-1 text-center min-w-0">
                    <p className="text-[9px] font-bold text-muted-foreground/60 truncate">{label}</p>
                    <p className="text-[11px] font-black text-foreground/80">{value}</p>
                </div>
            ))}
        </div>
    );
}

function cvParseBadge(cv: any) {
    if (cv.template_id) return null;
    const status = cv.parse_status || (cv.cv_url ? 'queued' : '');
    if (status === 'parsed') {
        return { label: 'Parsed', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
    if (status === 'failed') {
        return { label: 'Lỗi parse', icon: AlertCircle, className: 'bg-rose-50 text-rose-700 border-rose-100' };
    }
    if (status) {
        return { label: 'Đang xử lý', icon: Loader2, className: 'bg-sky-50 text-sky-700 border-sky-100' };
    }
    return null;
}

function scoringModeLabel(job: any) {
    if (job.scoring_mode === 'hybrid') return 'Hybrid semantic + tiêu chí';
    if (job.scoring_mode === 'structured') return 'Theo tiêu chí hồ sơ';
    return null;
}

function JobCard({
    job,
    onApply,
    onView,
    onDismiss,
}: {
    job: any;
    onApply: (id: number) => void;
    onView: (job: any) => void;
    onDismiss: (job: any) => void;
}) {
    const navigate = useNavigate();
    const formatSalary = () => {
        if (job.is_salary_negotiable) return 'Thỏa thuận';
        if (job.salary_min && job.salary_max) {
            const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${n}`;
            return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} ${job.salary_currency || 'VND'}`;
        }
        if (job.salary_min) return `Từ ${job.salary_min.toLocaleString()} ${job.salary_currency || 'VND'}`;
        return 'Thỏa thuận';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                role="article"
                aria-label={`Gợi ý việc làm ${job.title}`}
                className="p-5 bg-card border border-border hover:border-teal-200 hover:shadow-md transition-all duration-200 flex flex-col gap-4 group rounded-2xl h-full shadow-sm"
            >
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl border border-border/60 overflow-hidden shrink-0 bg-card flex items-center justify-center shadow-sm">
                        {job.logo_url ? (
                            <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-5 h-5 text-muted-foreground/60" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3
                                className="font-bold text-foreground text-sm line-clamp-2 leading-snug cursor-pointer group-hover:text-teal-700 transition-colors"
                                onClick={() => {
                                    onView(job);
                                    navigate(`/jobs/${job.id}`);
                                }}
                            >
                                {job.title}
                            </h3>
                            {job.match_score !== undefined && (
                                <MatchBadge score={job.match_score} />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium truncate">{job.company_name}</p>
                    </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {job.locations && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.locations}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">{formatSalary()}</span>
                    </span>
                    {job.job_type && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.job_type === 'full-time' ? 'Toàn thời gian' :
                                job.job_type === 'part-time' ? 'Bán thời gian' :
                                    job.job_type === 'internship' ? 'Thực tập' : job.job_type}
                        </span>
                    )}
                    {job.application_deadline && (
                        <span className="flex items-center gap-1 text-rose-500">
                            <Calendar className="w-3 h-3" />
                            HSD: {new Date(job.application_deadline).toLocaleDateString('vi-VN')}
                        </span>
                    )}
                </div>

                {/* Match reasons */}
                {job.match_reasons?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {job.match_reasons.map((reason: string, i: number) => (
                            <span key={i} className="text-[10px] bg-teal-50 text-teal-600 border border-teal-100 px-2 py-0.5 rounded-full font-medium">
                                ✓ {reason}
                            </span>
                        ))}
                    </div>
                )}

                <ScoreBreakdown breakdown={job.score_breakdown} />

                {(job.scoring_mode || job.structured_confidence !== undefined) && (
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        {scoringModeLabel(job) && <span>{scoringModeLabel(job)}</span>}
                        {job.structured_confidence !== undefined && (
                            <span>Độ tin cậy tiêu chí {Math.round(Number(job.structured_confidence) * 100)}%</span>
                        )}
                    </div>
                )}

                {job.missing_required_skills?.length > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                        Còn thiếu: {job.missing_required_skills.slice(0, 3).join(', ')}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 text-xs border-border hover:border-teal-300 hover:text-teal-700 rounded-xl font-bold"
                        onClick={() => {
                            onView(job);
                            navigate(`/jobs/${job.id}`);
                        }}
                    >
                        <ExternalLink className="w-3 h-3 mr-1" /> Chi tiết
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl font-bold"
                        onClick={() => onApply(job.id)}
                    >
                        <Briefcase className="w-3 h-3 mr-1" /> Ứng tuyển
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => onDismiss(job)}
                        aria-label="Ẩn gợi ý"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}

// ─── CV Selector Sidebar ───────────────────────────────────────────────────────
function CVSelector({
    cvList,
    selectedId,
    onSelect,
    loading,
    profileScore,
    canUseProfileRecommendations,
}: {
    cvList: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    loading: boolean;
    profileScore: number;
    canUseProfileRecommendations: boolean;
}) {
    return (
        <aside className="w-72 shrink-0 flex flex-col border-r border-border bg-card overflow-y-auto">
            <div className="px-5 py-5 border-b border-border/60 shrink-0">
                <p className="text-[12px] font-black uppercase tracking-wider text-foreground">
                    Nguồn gợi ý
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium leading-relaxed">
                    Chọn CV để tăng độ chính xác, hoặc dùng hồ sơ khi đã đủ dữ liệu
                </p>
            </div>

            <div className="flex-1 p-3 space-y-2">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))
                ) : cvList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Chưa có CV nào</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {canUseProfileRecommendations
                                ? `Đang gợi ý theo hồ sơ ${profileScore}%`
                                : `Hoàn thiện hồ sơ tối thiểu ${PROFILE_RECOMMENDATION_MIN_SCORE}% để nhận gợi ý`}
                        </p>
                    </div>
                ) : (
                    cvList.map((cv) => {
                        const parseBadge = cvParseBadge(cv);
                        return (
                            <div
                                key={cv.id}
                                onClick={() => onSelect(String(cv.id))}
                                className={`relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${String(selectedId) === String(cv.id)
                                    ? 'border-teal-300 bg-card shadow-sm ring-1 ring-teal-200'
                                    : 'border-transparent hover:border-border hover:bg-muted'
                                    }`}
                            >
                                {String(selectedId) === String(cv.id) && (
                                    <motion.div
                                        layoutId="cv-selector-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-600 rounded-full"
                                    />
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-11 rounded-lg bg-gradient-to-br from-teal-100 to-slate-50 border border-teal-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                        {cv.thumbnail_url ? (
                                            <img src={cv.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <FileText className="w-4 h-4 text-teal-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <p className="text-sm font-bold text-foreground truncate">{cv.cv_name}</p>
                                            {cv.is_default && <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                                            {cv.template_id ? cv.template_name : (
                                                <span className="text-primary font-semibold">PDF Upload</span>
                                            )}
                                        </p>
                                        {parseBadge && (
                                            <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${parseBadge.className}`}>
                                                <parseBadge.icon className={`h-2.5 w-2.5 ${cv.parse_status && cv.parse_status !== 'parsed' && cv.parse_status !== 'failed' ? 'animate-spin' : ''}`} />
                                                {parseBadge.label}
                                            </span>
                                        )}
                                        {cv.parse_status === 'failed' && cv.parse_error_message && (
                                            <p className="mt-1 line-clamp-2 text-[10px] font-medium text-rose-600">
                                                {cv.parse_error_message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SuggestedJobs() {
    const { user } = useUserStore();
    const candidateId = getCandidateId(user);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCvId, setSelectedCvId] = useState<string | null>(searchParams.get('cv_id'));
    const [dismissedJobIds, setDismissedJobIds] = useState<Set<number>>(new Set());
    const loggedImpressionsRef = useRef<Set<string>>(new Set());

    const { data: profile } = useQuery({
        queryKey: ['candidate', 'my-profile', user?.id],
        queryFn: () => candidateService.getMyProfile().then(r => r.data),
        enabled: !!candidateId,
        staleTime: 60_000,
    });
    const profileScore = Number(profile?.score ?? profile?.profile_completeness_score ?? 0);
    const canUseProfileRecommendations = profileScore >= PROFILE_RECOMMENDATION_MIN_SCORE;

    // Sync URL param when CV selection changes
    useEffect(() => {
        if (selectedCvId) {
            setSearchParams({ cv_id: selectedCvId }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    }, [selectedCvId]);

    // Load CV list
    const { data: cvList = [], isLoading: loadingCVs } = useQuery({
        queryKey: ['candidate', 'cvs', candidateId],
        queryFn: () => cvService.list(candidateId!).then((r: any) => r.data),
        enabled: !!candidateId,
        staleTime: 30_000,
    });

    // Auto-select first CV if none selected
    useEffect(() => {
        if (!selectedCvId && cvList.length > 0) {
            const defaultCV = (cvList as any[]).find((c: any) => c.is_default) ?? (cvList as any[])[0];
            setSelectedCvId(String(defaultCV.id));
        }
    }, [cvList, selectedCvId]);

    // Load suggestions by selected CV first; otherwise use profile once it is reasonably complete.
    const { data: recommendationResponse, isLoading: loadingSuggestions } = useQuery({
        queryKey: ['candidate', 'job-suggestions', selectedCvId ?? 'profile', profileScore],
        queryFn: () => jobService.recommendations(
            selectedCvId ? { cv_id: selectedCvId, page_size: 20 } : { page_size: 20 }
        ).then(r => r.data),
        enabled: !!selectedCvId || canUseProfileRecommendations,
        staleTime: 60_000,
    });
    const suggestions = recommendationResponse?.results ?? [];
    const activeSuggestions = useMemo(
        () => (suggestions as any[]).filter((job: any) => !isJobExpired(job) && !dismissedJobIds.has(job.id)),
        [suggestions, dismissedJobIds]
    );
    const sourceType = recommendationResponse?.source ?? (selectedCvId ? 'cv' : 'profile');
    const sourceId = recommendationResponse?.source_id ?? (selectedCvId ? Number(selectedCvId) : candidateId);
    const algorithmVersion = recommendationResponse?.model_version ?? 'hybrid-v2-1024';
    const recommendationSurface = selectedCvId ? 'candidate_suggested_jobs_cv' : 'candidate_suggested_jobs_profile';
    const requestId = useMemo(
        () => `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        [selectedCvId, candidateId]
    );

    useEffect(() => {
        if (!recommendationResponse || activeSuggestions.length === 0) return;
        const unseen = activeSuggestions
            .map((job: any, index: number) => ({ job, rank: index + 1 }))
            .filter(({ job }: any) => {
                const key = `${requestId}:${job.id}`;
                if (loggedImpressionsRef.current.has(key)) return false;
                loggedImpressionsRef.current.add(key);
                return true;
            });
        if (unseen.length === 0) return;
        void jobService.recommendationEvents(unseen.map(({ job, rank }: any) => ({
            job_id: job.id,
            event_type: 'impression',
            rank,
            rank_position: rank,
            score: job.match_score,
            match_score_at_time: job.match_score,
            score_breakdown: job.score_breakdown,
            surface: recommendationSurface,
            algorithm_version: algorithmVersion,
            source_type: sourceType,
            source_id: sourceId,
            request_id: requestId,
        }))).catch(() => undefined);
    }, [recommendationResponse, activeSuggestions, sourceType, sourceId, requestId, recommendationSurface, algorithmVersion]);

    // Quick apply
    const handleApply = async (jobId: number) => {
        if (!selectedCvId) {
            toast.error('Vui lòng chọn hoặc tạo CV trước khi ứng tuyển');
            return;
        }
        try {
            await applicationService.create({ job_id: jobId, cv_id: Number(selectedCvId) });
            const job = activeSuggestions.find((item: any) => item.id === jobId);
            void logRecommendationEvent(job, 'apply');
            toast.success('Đã nộp đơn ứng tuyển thành công!');
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Không thể nộp đơn. Vui lòng thử lại.';
            toast.error(msg);
        }
    };

    const selectedCV = (cvList as any[]).find((c: any) => String(c.id) === String(selectedCvId));
    const usingProfileRecommendations = !selectedCvId && canUseProfileRecommendations;
    const semanticStatus = recommendationResponse?.semantic_status;
    const sourceParseStatus = recommendationResponse?.source_parse_status;
    const personalizationNotice = recommendationResponse?.personalization_notice;
    const selectedCvSourceCopy = selectedCV
        ? sourceParseStatus === 'processing'
            ? `CV "${selectedCV.cv_name}" đang được xử lý; tạm dùng hồ sơ/CV đã trích xuất`
            : sourceParseStatus === 'parsed'
                ? `Dựa trên CV "${selectedCV.cv_name}" đã xử lý`
                : `Dựa trên CV "${selectedCV.cv_name}"`
        : usingProfileRecommendations
            ? `Dựa trên hồ sơ đã hoàn thiện ${profileScore}% của bạn`
            : `Hoàn thiện hồ sơ tối thiểu ${PROFILE_RECOMMENDATION_MIN_SCORE}% để nhận gợi ý`;

    const logRecommendationEvent = (job: any, eventType: 'click' | 'apply' | 'dismiss') => {
        if (!job) return;
        const rank = activeSuggestions.findIndex((item: any) => item.id === job.id) + 1;
        void jobService.recommendationEvents([{
            job_id: job.id,
            event_type: eventType,
            rank: rank || undefined,
            rank_position: rank || undefined,
            score: job.match_score,
            match_score_at_time: job.match_score,
            score_breakdown: job.score_breakdown,
            surface: recommendationSurface,
            algorithm_version: algorithmVersion,
            not_relevant_reason: eventType === 'dismiss' ? '' : undefined,
            source_type: sourceType,
            source_id: sourceId,
            request_id: requestId,
        }]).catch(() => undefined);
    };

    const handleView = (job: any) => {
        logRecommendationEvent(job, 'click');
    };

    const handleDismiss = (job: any) => {
        logRecommendationEvent(job, 'dismiss');
        setDismissedJobIds((current) => new Set([...current, job.id]));
    };

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            {/* Page header */}
            <PageHeader
                title="Việc làm gợi ý"
                description={selectedCvSourceCopy}
                icon={Sparkles}
                action={
                    <Button
                        variant="outline"
                        className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 h-10 px-4 rounded-xl font-bold shadow-sm"
                        onClick={() => navigate('/candidate/cv')}
                    >
                        <FileText className="w-4 h-4" /> Quản lý CV
                    </Button>
                }
            />

            {/* Main content — padded, single rounded white container like CVManager */}
            <div className="flex-1 min-h-0 p-6 lg:p-8">
                <div className="flex h-[calc(100vh-140px)] w-full bg-card border border-border shadow-sm rounded-2xl overflow-hidden">

                    {/* LEFT: CV selector sidebar */}
                    <CVSelector
                        cvList={cvList as any[]}
                        selectedId={selectedCvId}
                        onSelect={setSelectedCvId}
                        loading={loadingCVs}
                        profileScore={profileScore}
                        canUseProfileRecommendations={canUseProfileRecommendations}
                    />

                    {/* RIGHT: Job suggestions */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        {/* Content area — scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                            {!selectedCvId && !canUseProfileRecommendations ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6">
                                        <Sparkles className="w-10 h-10 text-teal-400" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-2">Hoàn thiện hồ sơ để nhận gợi ý</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                        Hồ sơ của bạn đang ở mức {profileScore}%. Khi đạt tối thiểu {PROFILE_RECOMMENDATION_MIN_SCORE}%, hệ thống có thể gợi ý việc làm dựa trên kỹ năng, kinh nghiệm và địa điểm ngay cả khi bạn chưa có CV.
                                    </p>
                                    <Button className="mt-5 rounded-xl bg-teal-600 hover:bg-teal-700" onClick={() => navigate('/candidate/profile')}>
                                        Hoàn thiện hồ sơ
                                    </Button>
                                </div>
                            ) : loadingSuggestions ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-48 rounded-2xl" />
                                    ))}
                                </div>
                            ) : activeSuggestions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                        <Briefcase className="w-10 h-10 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-xl font-black text-foreground mb-2">Chưa tìm thấy việc làm phù hợp</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                        Hãy thử cập nhật thêm kỹ năng hoặc kinh nghiệm vào {selectedCvId ? 'CV' : 'hồ sơ'} của bạn để AI có thể đưa ra những gợi ý chính xác hơn nhé!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                                Tìm thấy <span className="text-teal-600">{activeSuggestions.length}</span> việc làm phù hợp
                                                {usingProfileRecommendations && <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">theo hồ sơ</span>}
                                            </p>
                                            {selectedCV && (
                                                <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                    Đang dùng: <span className="font-bold text-foreground">{selectedCV.cv_name}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {semanticStatus && (
                                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${semanticStatus === 'ready'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    Semantic: {semanticStatus === 'ready' ? 'sẵn sàng' : semanticStatus}
                                                </span>
                                            )}
                                            {sourceParseStatus && selectedCvId && (
                                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sourceParseStatus === 'parsed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : sourceParseStatus === 'failed'
                                                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                        : 'bg-sky-50 text-sky-700 border-sky-100'
                                                    }`}>
                                                    CV: {sourceParseStatus === 'parsed' ? 'đã xử lý' : sourceParseStatus === 'processing' ? 'đang xử lý' : sourceParseStatus}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {personalizationNotice && (
                                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                            {personalizationNotice}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
                                        {activeSuggestions.map((job: any) => (
                                            <JobCard
                                                key={job.id}
                                                job={job}
                                                onApply={handleApply}
                                                onView={handleView}
                                                onDismiss={handleDismiss}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function isJobExpired(job: any) {
    if (job?.is_expired || job?.status === 'expired') return true;
    const deadline = job?.application_deadline ?? job?.deadline;
    if (!deadline) return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(deadline));
    const target = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Number.isFinite(target.getTime()) && target.getTime() < today.getTime();
}
