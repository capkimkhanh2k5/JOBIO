import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Sparkles, Briefcase, MapPin, DollarSign, Clock, Calendar,
    FileText, ExternalLink, Star, Building2
} from 'lucide-react';
import { cvService } from '@/services/cvService';
import { jobService } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { useUserStore } from '@/store/userStore';
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
        score >= 40 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                     'bg-slate-100 text-slate-500 border-slate-200';
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
            <Sparkles className="w-2.5 h-2.5" />
            Match {score}%
        </span>
    );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onApply }: { job: any; onApply: (id: number) => void }) {
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
            <Card className="p-5 bg-white/70 backdrop-blur-sm border border-white/60 hover:border-violet-200 hover:shadow-md transition-all duration-200 flex flex-col gap-4 group rounded-3xl h-full shadow-sm">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shrink-0 bg-white flex items-center justify-center shadow-sm">
                        {job.logo_url ? (
                            <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3
                                className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug cursor-pointer group-hover:text-violet-700 transition-colors"
                                onClick={() => navigate(`/jobs/${job.id}`)}
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
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
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
                            <span key={i} className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
                                ✓ {reason}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 text-xs border-slate-200 hover:border-violet-300 hover:text-violet-700 rounded-xl font-bold"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                        <ExternalLink className="w-3 h-3 mr-1" /> Chi tiết
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-sm rounded-xl font-bold"
                        onClick={() => onApply(job.id)}
                    >
                        <Briefcase className="w-3 h-3 mr-1" /> Ứng tuyển
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}

// ─── CV Selector Sidebar ───────────────────────────────────────────────────────
function CVSelector({ cvList, selectedId, onSelect, loading }: {
    cvList: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    loading: boolean;
}) {
    return (
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-white/50 backdrop-blur-xl overflow-y-auto">
            <div className="px-5 py-5 border-b border-slate-100 shrink-0">
                <p className="text-[12px] font-black uppercase tracking-wider text-slate-800">
                    Chọn CV để gợi ý
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                    Hệ thống sẽ gợi ý việc làm dựa trên CV được chọn
                </p>
            </div>

            <div className="flex-1 p-3 space-y-2">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))
                ) : cvList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Chưa có CV nào</p>
                        <p className="text-xs text-muted-foreground mt-1">Hãy tạo CV để nhận gợi ý việc làm!</p>
                    </div>
                ) : (
                    cvList.map((cv) => (
                        <div
                            key={cv.id}
                            onClick={() => onSelect(String(cv.id))}
                            className={`relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
                                String(selectedId) === String(cv.id)
                                    ? 'border-violet-300 bg-white shadow-sm ring-1 ring-violet-200'
                                    : 'border-transparent hover:border-slate-200 hover:bg-white/60'
                            }`}
                        >
                            {String(selectedId) === String(cv.id) && (
                                <motion.div
                                    layoutId="cv-selector-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-600 rounded-full"
                                />
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-11 rounded-lg bg-gradient-to-br from-violet-100 to-slate-50 border border-violet-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    {cv.thumbnail_url ? (
                                        <img src={cv.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-violet-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <p className="text-sm font-bold text-slate-800 truncate">{cv.cv_name}</p>
                                        {cv.is_default && <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate font-medium">{cv.template_name}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SuggestedJobs() {
    const { user } = useUserStore();
    const candidateId = user?.candidate_id;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCvId, setSelectedCvId] = useState<string | null>(searchParams.get('cv_id'));

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

    // Load suggestions for selected CV
    const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
        queryKey: ['candidate', 'job-suggestions', selectedCvId],
        queryFn: () => jobService.recommendations({ cv_id: selectedCvId } as any).then(r => r.data),
        enabled: !!selectedCvId,
        staleTime: 60_000,
    });

    // Quick apply
    const handleApply = async (jobId: number) => {
        if (!selectedCvId) {
            toast.error('Vui lòng chọn CV trước khi ứng tuyển');
            return;
        }
        try {
            await applicationService.create({ job_id: jobId, cv_id: Number(selectedCvId) });
            toast.success('Đã nộp đơn ứng tuyển thành công!');
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Không thể nộp đơn. Vui lòng thử lại.';
            toast.error(msg);
        }
    };

    const selectedCV = (cvList as any[]).find((c: any) => String(c.id) === String(selectedCvId));

    return (
        <div className="flex h-full w-full relative overflow-hidden bg-transparent">
            {/* LEFT: CV selector */}
            <CVSelector
                cvList={cvList as any[]}
                selectedId={selectedCvId}
                onSelect={setSelectedCvId}
                loading={loadingCVs}
            />

            {/* RIGHT: Job suggestions */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent">
                {/* Page header */}
                <div className="sticky top-0 z-20">
                    <PageHeader
                        title="Việc làm gợi ý"
                        description={selectedCV 
                            ? `Dựa trên CV "${selectedCV.cv_name}" của bạn`
                            : "Chọn một CV để xem những việc làm phù hợp nhất"
                        }
                        icon={Sparkles}
                        action={
                            <Button
                                variant="outline"
                                className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 h-10 px-4 rounded-xl font-bold shadow-sm"
                                onClick={() => navigate('/candidate/cv-manager')}
                            >
                                <FileText className="w-4 h-4" /> Quản lý CV
                            </Button>
                        }
                    />
                </div>

                {/* Content area */}
                <div className="p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto relative z-10">
                    {!selectedCvId ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-violet-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Sẵn sàng để kết nối?</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                Chọn một CV từ danh sách bên trái để khám phá những cơ hội nghề nghiệp được AI gợi ý riêng cho bạn.
                            </p>
                        </div>
                    ) : loadingSuggestions ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-48 rounded-3xl" />
                            ))}
                        </div>
                    ) : (suggestions as any[]).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                <Briefcase className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Chưa tìm thấy việc làm phù hợp</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                Hãy thử cập nhật thêm kỹ năng hoặc kinh nghiệm vào CV của bạn để AI có thể đưa ra những gợi ý chính xác hơn nhé!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                    Tìm thấy <span className="text-violet-600">{(suggestions as any[]).length}</span> việc làm phù hợp
                                </p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                                {(suggestions as any[]).map((job: any) => (
                                    <JobCard key={job.id} job={job} onApply={handleApply} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
