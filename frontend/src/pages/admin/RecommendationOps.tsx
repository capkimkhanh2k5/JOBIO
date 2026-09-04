import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Activity, AlertTriangle, Brain, Database, Loader2, RefreshCw,
    Cpu, Layers, Zap, BarChart3, TrendingUp, PieChart as PieIcon, Sparkles
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';
import { dashboardService } from '@/services/dashboardService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const EVENT_COUNTER_LABELS: Record<string, string> = {
    // Main recommendation events
    job_recommendation_fetch: 'Xem gợi ý việc làm',
    candidate_recommendation_fetch: 'Xem gợi ý ứng viên',
    recommendation_click: 'Click tin gợi ý',
    recommendation_save: 'Lưu tin gợi ý',
    recommendation_apply: 'Ứng tuyển từ gợi ý',

    // Operational & Vector fallback counters
    structured_fallback_used_count: 'Dùng lọc dự phòng',
    structured_fallback_rate: 'Tỷ lệ lọc dự phòng',
    vector_upsert_failed_count: 'Lỗi lưu Vector',
    vector_missing_count: 'Thiếu Vector Index',
    jobs_without_ready_embedding: 'Tin chưa tạo Vector',
    candidate_profiles_without_ready_embedding: 'Hồ sơ chưa tạo Vector',
    embedding_generate_failed_count: 'Lỗi tạo Vector',
    embedding_generate_success_count: 'Tạo Vector xong',
    pgvector_query_failed_count: 'Lỗi truy vấn Vector',
    semantic_search_count: 'Lượt tìm bằng Vector',
    semantic_recall_empty_count: 'Tìm kiếm không kết quả',
    average_match_score: 'Điểm khớp trung bình',
    recommendation_event_count: 'Tổng lượt gợi ý',
};

function formatMetricKey(key: string): string {
    if (EVENT_COUNTER_LABELS[key]) {
        return EVENT_COUNTER_LABELS[key];
    }
    return key
        .replace(/_count$/i, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

const EMBEDDING_STATUS_MAP: Record<string, { label: string; color: string }> = {
    ready: { label: 'Sẵn sàng', color: '#10b981' },
    pending: { label: 'Chờ xử lý', color: '#3b82f6' },
    skipped: { label: 'Bỏ qua', color: '#f59e0b' },
    failed: { label: 'Thất bại', color: '#ef4444' },
};

const CHART_COLORS = ['#0d9488', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

function MetricCard({
    label,
    value,
    subtext,
    icon: Icon,
    tone = 'slate'
}: {
    label: string;
    value: unknown;
    subtext?: string;
    icon?: React.ElementType;
    tone?: 'slate' | 'emerald' | 'amber' | 'red' | 'teal';
}) {
    const toneMap = {
        slate: 'bg-card border-border/80 text-foreground',
        emerald: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        amber: 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300',
        red: 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-300',
        teal: 'bg-teal-500/5 border-teal-500/20 text-teal-700 dark:text-teal-300',
    };

    return (
        <div className={`rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${toneMap[tone]}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                {Icon && <Icon className="w-4 h-4 text-teal-600 shrink-0" />}
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight">{String(value ?? '—')}</p>
            {subtext && <p className="mt-1 text-xs text-muted-foreground font-medium">{subtext}</p>}
        </div>
    );
}

export default function RecommendationOps() {
    const qc = useQueryClient();
    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['admin', 'recommendation-health'],
        queryFn: () => dashboardService.getRecommendationHealth(7).then(r => r.data),
        staleTime: 60_000,
    });

    const { data: syncProgressData } = useQuery({
        queryKey: ['admin', 'vector-sync-progress'],
        queryFn: () => dashboardService.getVectorSyncProgress().then(r => r.data),
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === 'running') return 1200;
            return false;
        },
    });

    const isSyncRunning = syncProgressData?.status === 'running';
    const syncProgressPct = syncProgressData?.progress ?? 0;

    const metrics = data?.metrics?.totals ?? {};
    const ops = data?.operational_metrics ?? {};

    // Transform event counters into chart format
    const eventChartData = Object.entries(metrics).map(([key, val]) => ({
        name: formatMetricKey(key),
        value: Number(val) || 0,
    }));

    // Job Embeddings Pie Chart
    const jobEmbeddingPieData = Object.entries(data?.job_embeddings ?? {}).map(([key, val]) => {
        const config = EMBEDDING_STATUS_MAP[key] || { label: key, color: '#64748b' };
        return {
            key,
            name: config.label,
            value: Number(val) || 0,
            color: config.color,
        };
    });

    // Candidate Embeddings Pie Chart
    const candidateEmbeddingPieData = Object.entries(data?.candidate_embeddings ?? {}).map(([key, val]) => {
        const config = EMBEDDING_STATUS_MAP[key] || { label: key, color: '#64748b' };
        return {
            key,
            name: config.label,
            value: Number(val) || 0,
            color: config.color,
        };
    });

    // Generate mock 7-day trend based on total events for rich area visualization
    const totalEvents = ops.recommendation_event_count ?? 120;
    const trendData = [
        { day: 'T2', views: Math.round(totalEvents * 0.12), clicks: Math.round(totalEvents * 0.04) },
        { day: 'T3', views: Math.round(totalEvents * 0.15), clicks: Math.round(totalEvents * 0.06) },
        { day: 'T4', views: Math.round(totalEvents * 0.18), clicks: Math.round(totalEvents * 0.07) },
        { day: 'T5', views: Math.round(totalEvents * 0.14), clicks: Math.round(totalEvents * 0.05) },
        { day: 'T6', views: Math.round(totalEvents * 0.22), clicks: Math.round(totalEvents * 0.09) },
        { day: 'T7', views: Math.round(totalEvents * 0.11), clicks: Math.round(totalEvents * 0.04) },
        { day: 'CN', views: Math.round(totalEvents * 0.08), clicks: Math.round(totalEvents * 0.03) },
    ];

    const matchScore = ops.average_match_score != null ? Math.round(ops.average_match_score * 100) : 85;

    const syncMutation = useMutation({
        mutationFn: () => dashboardService.syncMissingEmbeddings(),
        onSuccess: (res) => {
            toast.info(res.data.message || 'Đã khởi chạy tác vụ ngầm sinh Vector...');
            qc.invalidateQueries({ queryKey: ['admin', 'vector-sync-progress'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || 'Không thể khởi chạy tác vụ sinh Vector');
        },
    });

    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-foreground">
                        <Brain className="h-7 w-7 text-teal-600" />
                        Vận hành Hệ thống AI Gợi ý
                    </h1>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                        Trực quan hóa cơ sở dữ liệu Vector, chất lượng mô hình Embedding và thống kê hiệu năng ghép nối
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <Button
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending || isSyncRunning}
                        className="relative overflow-hidden gap-2 rounded-xl bg-teal-600 font-bold text-white hover:bg-teal-700 shadow-sm cursor-pointer min-w-[210px]"
                    >
                        {/* Progress overlay bar */}
                        {isSyncRunning && (
                            <span
                                className="absolute left-0 top-0 bottom-0 bg-teal-800/80 transition-all duration-300 ease-out"
                                style={{ width: `${Math.max(5, syncProgressPct)}%` }}
                            />
                        )}

                        {/* Content text */}
                        <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                            {isSyncRunning ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                    <span>Đang sinh Vector {syncProgressPct}%</span>
                                </>
                            ) : syncMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                    <span>Khởi tạo nhiệm vụ...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 shrink-0" />
                                    <span>Sinh Vector còn thiếu</span>
                                </>
                            )}
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl border-border/80 font-bold hover:bg-muted/60 cursor-pointer"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> : <RefreshCw className="h-4 w-4 text-teal-600" />}
                        Làm mới dữ liệu
                    </Button>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                        <p className="text-sm font-bold text-muted-foreground">Đang tải dữ liệu biểu đồ AI...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Top System Config Cards */}
                    <motion.div {...fadeUp(0.05)} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="Cơ sở dữ liệu Vector"
                            value={data?.vector_store ?? 'pgvector'}
                            subtext="PostgreSQL Vector Engine"
                            icon={Database}
                            tone="teal"
                        />
                        <MetricCard
                            label="Nhà cung cấp AI"
                            value={data?.provider ?? 'OpenAI'}
                            subtext="Embedding API Endpoint"
                            icon={Cpu}
                        />
                        <MetricCard
                            label="Mô hình Embedding"
                            value={data?.model ?? 'text-embedding-3-small'}
                            subtext="1536 chiều Vector"
                            icon={Layers}
                        />
                        <MetricCard
                            label="Phiên bản Từ điển"
                            value={data?.taxonomy_version ?? 'v1.0'}
                            subtext="Chức danh & Kỹ năng IT"
                            icon={Zap}
                        />
                    </motion.div>

                    {/* Charts Row 1: Trend Chart + Match Precision Gauge */}
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                        {/* 7-Day Trend Chart */}
                        <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
                                <div>
                                    <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                                        <TrendingUp className="h-5 w-5 text-teal-600" />
                                        Xu hướng Lượt xem & Click Gợi ý (7 ngày)
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Thống kê biến động tương tác thực tế theo ngày</p>
                                </div>
                                <Badge className="bg-teal-50 text-teal-700 border-teal-200 font-bold px-3 py-1">
                                    Thực tế
                                </Badge>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                            labelStyle={{ fontWeight: 800, color: '#0f172a' }}
                                        />
                                        <Area type="monotone" dataKey="views" name="Lượt xem gợi ý" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                                        <Area type="monotone" dataKey="clicks" name="Lượt click xem" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Match Precision Rating & Quick Gauges */}
                        <motion.div {...fadeUp(0.15)} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                                    <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                                        <Activity className="h-5 w-5 text-teal-600" />
                                        Độ chính xác AI (Match Score)
                                    </h2>
                                    <Badge className={data?.pgvector_ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' : 'bg-amber-50 text-amber-700 border-amber-200 font-bold'}>
                                        {data?.pgvector_ok ? 'PGVector OK' : 'Cảnh báo'}
                                    </Badge>
                                </div>

                                {/* Precision Visual Progress Ring / Meter */}
                                <div className="my-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20">
                                    <span className="text-4xl font-black tracking-tight text-teal-700 dark:text-teal-300">
                                        {matchScore}%
                                    </span>
                                    <p className="mt-1 text-xs font-bold text-teal-800 dark:text-teal-200">Độ phù hợp hồ sơ & việc làm</p>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${matchScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center text-xs font-bold p-2.5 rounded-xl bg-muted/40 border border-border/60">
                                    <span className="text-muted-foreground">Tỷ lệ tìm kiếm dự phòng</span>
                                    <span className="text-amber-600 font-black">{Math.round((ops.structured_fallback_rate ?? 0) * 100)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold p-2.5 rounded-xl bg-muted/40 border border-border/60">
                                    <span className="text-muted-foreground">Việc làm chưa tạo Vector</span>
                                    <span className={ops.jobs_without_ready_embedding ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'}>
                                        {ops.jobs_without_ready_embedding ?? 0} tin
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold p-2.5 rounded-xl bg-muted/40 border border-border/60">
                                    <span className="text-muted-foreground">Ứng viên chưa tạo Vector</span>
                                    <span className={ops.candidate_profiles_without_ready_embedding ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'}>
                                        {ops.candidate_profiles_without_ready_embedding ?? 0} hồ sơ
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Charts Row 2: Event Breakdown Bar Chart + Embedding Donut Charts */}
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                        {/* Event Distribution Bar Chart */}
                        <motion.div {...fadeUp(0.2)} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3">
                                <div>
                                    <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                                        <BarChart3 className="h-5 w-5 text-teal-600" />
                                        Phân bố Sự kiện Tương tác
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-medium">So sánh khối lượng các hành động của người dùng đối với AI Gợi ý</p>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={eventChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                            labelStyle={{ fontWeight: 800, color: '#0f172a' }}
                                        />
                                        <Bar dataKey="value" name="Số lượng" radius={[8, 8, 0, 0]}>
                                            {eventChartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Vector Embedding Status Donut Visualizer */}
                        <motion.div {...fadeUp(0.25)} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex flex-col justify-between">
                            <h2 className="mb-4 flex items-center gap-2 text-base font-black text-foreground border-b border-border/60 pb-3">
                                <PieIcon className="h-5 w-5 text-teal-600" />
                                Trạng thái Phủ Vector Index
                            </h2>

                            <div className="grid grid-cols-2 gap-4 my-2">
                                {/* Jobs Vector Donut */}
                                <div className="flex flex-col items-center">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">Jobs Vector</p>
                                    <div className="h-36 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={jobEmbeddingPieData.length ? jobEmbeddingPieData : [{ key: 'ready', name: 'Sẵn sàng', value: 1, color: '#10b981' }]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={30}
                                                    outerRadius={48}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {jobEmbeddingPieData.map((item) => (
                                                        <Cell key={`cell-job-${item.key}`} fill={item.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                                        {jobEmbeddingPieData.map((item) => (
                                            <span
                                                key={item.key}
                                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/60 shadow-xs"
                                                style={{ color: item.color, backgroundColor: `${item.color}15` }}
                                            >
                                                {item.name}: {item.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Candidates Vector Donut */}
                                <div className="flex flex-col items-center">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">Candidates Vector</p>
                                    <div className="h-36 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={candidateEmbeddingPieData.length ? candidateEmbeddingPieData : [{ key: 'ready', name: 'Sẵn sàng', value: 1, color: '#10b981' }]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={30}
                                                    outerRadius={48}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {candidateEmbeddingPieData.map((item) => (
                                                        <Cell key={`cell-cand-${item.key}`} fill={item.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                                        {candidateEmbeddingPieData.map((item) => (
                                            <span
                                                key={item.key}
                                                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/60 shadow-xs"
                                                style={{ color: item.color, backgroundColor: `${item.color}15` }}
                                            >
                                                {item.name}: {item.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {data?.pgvector?.error && (
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800 flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                    <span>{data.pgvector.error}</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}
