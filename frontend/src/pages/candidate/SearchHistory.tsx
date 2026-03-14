import { motion } from 'framer-motion';
import {
    Search, Clock, Trash2, RotateCcw, Zap, TrendingUp,
    ArrowRight, X, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { PageHeader } from '@/components/shared/PageHeader';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

interface SearchHistoryItem {
    id: number;
    search_query: string;
    filters: Record<string, unknown>;
    results_count: number;
    searched_at: string;
}

const POPULAR_SKILLS = [
    { name: 'React', count: 450 },
    { name: 'Python', count: 380 },
    { name: 'Java', count: 320 },
    { name: 'TypeScript', count: 290 },
    { name: 'AWS', count: 245 },
    { name: 'Docker', count: 210 },
    { name: 'Node.js', count: 195 },
    { name: 'SQL', count: 180 },
];

const SUGGESTED_SEARCHES = [
    { query: 'Frontend Developer Remote', reason: 'Dựa trên lịch sử tìm kiếm React' },
    { query: 'Full Stack Developer Hà Nội', reason: 'Phổ biến trong khu vực của bạn' },
    { query: 'AI Engineer', reason: 'Xu hướng tuyển dụng mới' },
    { query: 'Product Manager IT', reason: 'Liên quan đến kỹ năng của bạn' },
];

export default function SearchHistory() {
    const queryClient = useQueryClient();
    const { data: historyRaw, isLoading } = useQuery({
        queryKey: ['search-history'],
        queryFn: () => dashboardService.listSearchHistory().then(r => r.data),
    });
    const history: SearchHistoryItem[] = Array.isArray(historyRaw) ? historyRaw : historyRaw?.results ?? [];

    const deleteMutation = useMutation({
        mutationFn: (id: number) => dashboardService.deleteSearchHistoryItem(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search-history'] }),
    });

    const clearMutation = useMutation({
        mutationFn: () => dashboardService.clearSearchHistory(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search-history'] }),
    });

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id);
    };

    const handleClearAll = () => {
        clearMutation.mutate();
    };

    const formatFilters = (filters: Record<string, unknown>) => {
        return Object.entries(filters).map(([key, value]) => {
            if (key === 'salary_min') return `Lương ≥ ${(value as number / 1000000).toFixed(0)}M`;
            if (key === 'remote' && value) return 'Remote';
            if (key === 'location') return `📍 ${value}`;
            if (key === 'type') return value === 'full_time' ? 'Full-time' : String(value);
            if (key === 'level') return `Level: ${value}`;
            return `${key}: ${value}`;
        });
    };

    return (
        <>
            <PageHeader
                title="Lịch sử tìm kiếm"
                description="Quản lý lịch sử và khám phá gợi ý thông minh"
                icon={Clock}
                action={
                    history.length > 0 && (
                        <Button variant="outline" onClick={handleClearAll} className="rounded-xl font-semibold text-sm text-red-600 border-rose-200 hover:bg-rose-50 transition-all">
                            <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả
                        </Button>
                    )
                }
            />

            <div className="p-6 lg:p-8 space-y-6 w-full flex-1 min-h-screen">

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main: History List */}
                <motion.div {...fadeUp(0.08)} className="xl:col-span-2 space-y-3">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400" />
                        Tìm kiếm gần đây
                    </h2>
                    {isLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-lg font-bold text-slate-900">Chưa có lịch sử tìm kiếm</p>
                            <p className="text-sm text-slate-500 mt-1">Bắt đầu tìm kiếm việc làm để lưu lịch sử tại đây.</p>
                             <Link to="/jobs">
                                 <Button className="mt-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-md transition-all">
                                     Tìm việc ngay <ArrowRight className="w-4 h-4 ml-2" />
                                 </Button>
                             </Link>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                         <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                             <Search className="w-5 h-5 text-violet-600" />
                                         </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900">{item.search_query}</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {item.filters && formatFilters(item.filters).map((f, i) => (
                                                    <Badge key={i} className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] font-medium">{f}</Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {item.results_count} kết quả • {new Date(item.searched_at).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Link to={`/jobs?search=${encodeURIComponent(item.search_query)}`}>
                                             <Button size="sm" variant="ghost" className="rounded-lg text-xs font-semibold text-violet-600 hover:bg-violet-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <RotateCcw className="w-3.5 h-3.5 mr-1" /> Tìm lại
                                             </Button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </motion.div>

                {/* Sidebar: Suggestions */}
                <motion.div {...fadeUp(0.16)} className="space-y-6">
                    {/* Smart Suggestions */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-amber-500" />
                            Gợi ý cho bạn
                        </h3>
                        <div className="space-y-2.5">
                            {SUGGESTED_SEARCHES.map((s, i) => (
                                <Link key={i} to={`/jobs?search=${encodeURIComponent(s.query)}`}
                                    className="block p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer group"
                                >
                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{s.query}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{s.reason}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Popular Skills */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Kỹ năng hot
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_SKILLS.map((skill) => (
                                <Link key={skill.name} to={`/jobs?search=${encodeURIComponent(skill.name)}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer group"
                                >
                                     <span className="text-xs font-semibold text-slate-700 group-hover:text-violet-700 transition-colors">{skill.name}</span>
                                    <span className="text-[10px] text-slate-400">{skill.count}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
        </>
    );
}
