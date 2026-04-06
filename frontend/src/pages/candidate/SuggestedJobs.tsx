import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Sparkles, Briefcase, MapPin, DollarSign, Clock, Calendar,
    FileText, ChevronRight, ExternalLink, Star, Building2
} from 'lucide-react';
import { cvService } from '@/services/cvService';
import { jobService } from '@/services/jobService';
import { applicationService } from '@/services/applicationService';
import { useUserStore } from '@/store/userStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
            <Card className="p-5 bg-white/70 backdrop-blur-sm border border-white/60 hover:border-violet-200 hover:shadow-md transition-all duration-200 flex flex-col gap-4 group rounded-2xl h-full">
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
                            <span key={i} className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
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
                        className="flex-1 h-8 text-xs border-slate-200 hover:border-violet-300 hover:text-violet-700"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                        <ExternalLink className="w-3 h-3 mr-1" /> Xem chi tiết
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
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
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
                <p className="text-[13px] font-black uppercase tracking-wider text-slate-800">
                    Chọn CV để gợi ý
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                    Gợi ý việc làm phù hợp với CV được chọn
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
                                    ? 'border-violet-300 bg-violet-50 shadow-sm'
                                    : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/40'
                            }`}
                        >
                            {String(selectedId) === String(cv.id) && (
                                <motion.div
                                    layoutId="cv-selector-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-violet-600 rounded-full"
                                />
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-11 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 border border-violet-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {cv.thumbnail_url ? (
                                        <img src={cv.thumbnail_url} alt="" className="w-full h-full object-cover opacity-70" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-violet-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{cv.cv_name}</p>
                                        {cv.is_default && <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate">{cv.template_name}</p>
                                </div>
                                {String(selectedId) === String(cv.id) && (
                                    <ChevronRight className="w-4 h-4 text-violet-500 shrink-0" />
                                )}
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
    const recruiterId = user?.recruiter_id;
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
        queryKey: ['candidate', 'cvs', recruiterId],
        queryFn: () => cvService.list(recruiterId!).then((r: any) => r.data),
        enabled: !!recruiterId,
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
        <div className="flex h-[calc(100vh-112px)] relative">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-400/5 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-400/5 blur-[100px]" />
            </div>

            {/* LEFT: CV selector */}
            <CVSelector
                cvList={cvList as any[]}
                selectedId={selectedCvId}
                onSelect={setSelectedCvId}
                loading={loadingCVs}
            />

            {/* RIGHT: Job suggestions */}
            <div className="flex-1 overflow-y-auto relative z-10">
                {/* Page header */}
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 rounded-lg bg-violet-600">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <h1 className="font-black text-xl text-slate-900">Việc làm gợi ý</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {selectedCV
                                ? <>Gợi ý dựa trên CV <span className="font-semibold text-violet-600">"{selectedCV.cv_name}"</span></>
                                : 'Chọn một CV để xem việc làm phù hợp'
                            }
                        </p>
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-violet-600 text-white hover:bg-violet-700 transition-all duration-300 h-10 px-4 rounded-xl shadow-md shadow-violet-200/50"
                        onClick={() => navigate('/candidate/cv')}
                    >
                        <FileText className="w-4 h-4" /> Quản lý CV
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!selectedCvId ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                                <Sparkles className="w-7 h-7 text-violet-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-2">Chọn CV để xem gợi ý</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Chọn một CV từ danh sách bên trái để xem những việc làm phù hợp nhất với bạn.
                            </p>
                        </div>
                    ) : loadingSuggestions ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-52 rounded-2xl" />
                            ))}
                        </div>
                    ) : (suggestions as any[]).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Briefcase className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-700 mb-1">Chưa tìm thấy việc làm phù hợp</h3>
                            <p className="text-sm text-muted-foreground">Hãy cập nhật CV với thêm kỹ năng và vị trí mong muốn!</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Tìm thấy <span className="font-semibold text-slate-700">{(suggestions as any[]).length}</span> việc làm phù hợp
                            </p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {(suggestions as any[]).map((job: any) => (
                                    <JobCard key={job.id} job={job} onApply={handleApply} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
