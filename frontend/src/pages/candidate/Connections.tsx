import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Sparkles, Send } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import api from '@/services/api';
import { useUserStore } from '@/store/userStore';

import { ConnectionCard } from '@/components/candidate/connections/ConnectionCard';
import { PendingRequestCard } from '@/components/candidate/connections/PendingRequestCard';
import { SuggestionCard } from '@/components/candidate/connections/SuggestionCard';

export default function Connections() {
    const [activeTab, setActiveTab] = useState('connections');
    const { user } = useUserStore();

    // Fetch My Connections (Accepted)
    const { data: connectionsData, isLoading: isConnectionsLoading } = useQuery({
        queryKey: ['connections', 'accepted', user?.recruiter_id],
        queryFn: () => api.get(`/api/recruiters/${user?.recruiter_id}/connections/`).then(r => r.data),
        enabled: !!user?.recruiter_id,
    });

    // Fetch Pending Requests
    const { data: pendingData, isLoading: isPendingLoading } = useQuery({
        queryKey: ['pendingConnections'],
        queryFn: () => api.get('/api/connections/pending/').then(r => ({
            results: r.data.pending_requests,
            count: r.data.total,
        })),
    });

    // Fetch Suggestions
    const { data: suggestionsData, isLoading: isSuggestionsLoading } = useQuery({
        queryKey: ['connectionSuggestions'],
        queryFn: () => api.get('/api/connections/suggestions/', { params: { limit: 12 } }).then(r => r.data.suggestions),
    });

    const connectionsCount = connectionsData?.counts?.total || 0;
    const pendingCount = pendingData?.count || 0;

    return (
        <div className="relative min-h-screen flex flex-col w-full">
            <PageHeader
                title="Mạng lưới kết nối"
                description="Mở rộng mạng lưới quan hệ, tìm kiếm cơ hội nghề nghiệp mới và kết nối với các Recruiter."
                icon={Users}
            />

            <div className="p-6 lg:p-8 w-full flex-1 relative z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/60 backdrop-blur-md border border-slate-200/50 p-1 mb-8">
                        <TabsTrigger value="connections" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-md px-6 font-semibold">
                            Kết nối của tôi <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{connectionsCount}</span>
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-md px-6 font-semibold">
                            Lời mời chờ duyệt {pendingCount > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-black">{pendingCount}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="suggestions" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-md px-6 font-semibold">
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
                                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
                                    </div>
                                ) : connectionsData?.connections?.length === 0 ? (
                                    <EmptyState
                                        icon={<Users className="w-12 h-12 text-slate-300" />}
                                        title="Chưa có kết nối nào"
                                        description="Bắt đầu kết nối với các Recruiter và ứng viên khác để mở rộng mạng lưới của bạn."
                                        action={{ label: "Khám phá gợi ý", onClick: () => setActiveTab('suggestions') }}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {connectionsData?.connections?.map((connection: any) => (
                                            <ConnectionCard
                                                key={connection.id}
                                                connection={connection}
                                                currentUserId={user?.recruiter_id ?? 0}
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
                                        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                                    </div>
                                ) : pendingData?.results?.length === 0 ? (
                                    <EmptyState
                                        icon={<UserPlus className="w-12 h-12 text-slate-300" />}
                                        title="Không có lời mời nào"
                                        description="Bạn không có lời mời kết nối nào đang chờ xử lý."
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {pendingData?.results.map((request: any) => (
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

                                {isSuggestionsLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
                                    </div>
                                ) : suggestionsData?.length === 0 ? (
                                    <EmptyState
                                        icon={<Users className="w-12 h-12 text-slate-300" />}
                                        title="Không tìm thấy gợi ý"
                                        description="Hiện tại không có gợi ý kết nối nào mới. Hãy quay lại sau."
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {suggestionsData?.map((suggestion: any, idx: number) => (
                                            <SuggestionCard key={idx} suggestion={suggestion} />
                                        ))}
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
