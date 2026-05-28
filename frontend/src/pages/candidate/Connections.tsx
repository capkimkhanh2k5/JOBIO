import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Sparkles, Send } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/services/api';
import { candidateService } from '@/services/candidateService';
import { useUserStore } from '@/store/userStore';

import { ConnectionCard } from '@/components/candidate/connections/ConnectionCard';
import { PendingRequestCard } from '@/components/candidate/connections/PendingRequestCard';
import { SuggestionCard } from '@/components/candidate/connections/SuggestionCard';

export default function Connections() {
    const [activeTab, setActiveTab] = useState('connections');
    const { user } = useUserStore();

    // Fetch My Connections (Accepted)
    const { data: connectionsData, isLoading: isConnectionsLoading, isError: isConnectionsError } = useQuery({
        queryKey: ['connections', 'accepted', user?.candidate_id],
        queryFn: () => api.get(`/api/candidates/${user?.candidate_id}/connections/`).then(r => r.data),
        enabled: !!user?.candidate_id,
        retry: false,
    });

    // Fetch Pending Requests
    const { data: pendingData, isLoading: isPendingLoading, isError: isPendingError } = useQuery({
        queryKey: ['pendingConnections'],
        queryFn: () => api.get('/api/connections/pending/').then(r => ({
            results: r.data.pending_requests,
            count: r.data.total,
        })),
        retry: false,
    });

    // Fetch Suggestions
    const { data: suggestionsData, isLoading: isSuggestionsLoading, isError: isSuggestionsError } = useQuery({
        queryKey: ['connectionSuggestions'],
        queryFn: () => api.get('/api/connections/suggestions/', { params: { limit: 12 } }).then(r => r.data.suggestions),
        retry: false,
    });

    // Fallback source when connection APIs are unavailable
    const { data: candidateFallbackData, isLoading: isFallbackLoading } = useQuery({
        queryKey: ['candidate-directory-fallback', user?.candidate_id],
        queryFn: () => candidateService.list({ page_size: 12 }).then(r => r.data.results),
        enabled: isSuggestionsError || isConnectionsError || isPendingError,
    });

    const fallbackSuggestions = useMemo(() => {
        if (!candidateFallbackData) return [];

        return candidateFallbackData
            .filter((candidate: any) => candidate.id !== user?.candidate_id)
            .slice(0, 12)
            .map((candidate: any) => ({
                candidate: {
                    id: candidate.id,
                    full_name: candidate.user?.full_name || 'Candidate',
                    avatar_url: candidate.user?.avatar_url || null,
                    headline: candidate.current_position || null,
                },
                mutual_connections: 0,
                common_skills: [],
                score: candidate.profile_completeness_score || 0,
            }));
    }, [candidateFallbackData, user?.candidate_id]);

    const effectiveSuggestions = suggestionsData?.length ? suggestionsData : fallbackSuggestions;

    const connectionsCount = connectionsData?.counts?.total || 0;
    const pendingCount = pendingData?.count || 0;

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            {/* Page header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Mạng lưới kết nối"
                    description="Mở rộng mạng lưới quan hệ, tìm kiếm cơ hội nghề nghiệp mới và kết nối với các Candidate."
                    icon={Users}
                />
            </div>

            <div className="p-6 lg:p-8 w-full flex-1 relative z-10 space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/60 backdrop-blur-md border border-slate-200/50 p-1 mb-8 rounded-xl h-auto">
                        <TabsTrigger value="connections" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all data-[state=active]:shadow-sm flex items-center justify-center">
                            Kết nối của tôi <span className="ml-2 bg-white/20 text-slate-700 data-[state=active]:text-white px-2 py-0.5 rounded-full text-xs transition-colors group-data-[state=active]:text-white group-data-[state=active]:bg-white/20">{connectionsCount}</span>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all data-[state=active]:shadow-sm flex items-center justify-center">
                            Lời mời chờ duyệt {pendingCount > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-black">{pendingCount}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="suggestions" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all data-[state=active]:shadow-sm flex items-center justify-center">
                            Gợi ý kết nối
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent value="connections" className="mt-0 outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="flex items-center justify-between mb-6 px-1">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-violet-600" />
                                        Mạng lưới của bạn
                                    </h2>
                                </div>

                                {isConnectionsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}
                                    </div>
                                ) : isConnectionsError ? (
                                    <EmptyState
                                        icon={<Users className="w-12 h-12 text-slate-300" />}
                                        title="Tính năng kết nối chưa hoạt động"
                                        description="Backend hiện chưa trả dữ liệu danh sách kết nối cho candidate. Phần UI đã có, nhưng API kết nối chưa sẵn sàng."
                                        action={{ label: "Xem gợi ý tạm thời", onClick: () => setActiveTab('suggestions') }}
                                    />
                                ) : connectionsData?.connections?.length === 0 ? (
                                    <EmptyState
                                        icon={<Users className="w-12 h-12 text-slate-300" />}
                                        title="Chưa có kết nối nào"
                                        description="Bắt đầu kết nối với các Candidate và ứng viên khác để mở rộng mạng lưới của bạn."
                                        action={{ label: "Khám phá gợi ý", onClick: () => setActiveTab('suggestions') }}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {connectionsData?.connections?.map((connection: any) => (
                                            <ConnectionCard
                                                key={connection.id}
                                                connection={connection}
                                                currentUserId={user?.candidate_id ?? 0}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="pending" className="mt-0 outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="flex items-center justify-between mb-6 px-1">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                        <Send className="w-5 h-5 mr-2 text-violet-600" />
                                        Lời mời kết nối đang chờ
                                    </h2>
                                </div>

                                {isPendingLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
                                    </div>
                                ) : isPendingError ? (
                                    <EmptyState
                                        icon={<UserPlus className="w-12 h-12 text-slate-300" />}
                                        title="Chưa tải được lời mời"
                                        description="API lời mời kết nối hiện chưa sẵn sàng hoặc đang lỗi."
                                    />
                                ) : pendingData?.results?.length === 0 ? (
                                    <EmptyState
                                        icon={<UserPlus className="w-12 h-12 text-slate-300" />}
                                        title="Không có lời mời nào"
                                        description="Bạn không có lời mời kết nối nào đang chờ xử lý."
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {pendingData?.results?.map((request: any) => (
                                            <PendingRequestCard key={request.id} request={request} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="suggestions" className="mt-0 outline-none">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="flex items-center justify-between mb-6 px-1">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                        <Sparkles className="w-5 h-5 mr-2 text-violet-600" />
                                        Có thể bạn quen biết
                                    </h2>
                                </div>

                                {isSuggestionsLoading || (isSuggestionsError && isFallbackLoading) ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-72 w-full rounded-3xl" />)}
                                    </div>
                                ) : effectiveSuggestions?.length === 0 ? (
                                    <EmptyState
                                        icon={<Users className="w-12 h-12 text-slate-300" />}
                                        title={isSuggestionsError ? "Chưa có dữ liệu gợi ý" : "Không tìm thấy gợi ý"}
                                        description={isSuggestionsError
                                            ? "API gợi ý kết nối chưa có sẵn và hệ thống cũng chưa tìm được candidate phù hợp để hiển thị tạm thời."
                                            : "Hiện tại không có gợi ý kết nối nào mới. Hãy quay lại sau."}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {isSuggestionsError && (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                                API gợi ý kết nối hiện chưa hoạt động. Danh sách bên dưới đang dùng candidate directory làm gợi ý tạm thời.
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {effectiveSuggestions?.map((suggestion: any, idx: number) => (
                                            <SuggestionCard key={idx} suggestion={suggestion} canConnect={!isSuggestionsError} />
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </div>
        </div>
    );
}
