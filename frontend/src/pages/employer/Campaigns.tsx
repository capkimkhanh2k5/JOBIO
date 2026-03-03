import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { CampaignList } from '@/components/employer/campaigns/CampaignList';
import { CreateCampaignModal } from '@/components/employer/campaigns/CreateCampaignModal';
import { CampaignDetailSheet } from '@/components/employer/campaigns/CampaignDetailSheet';
import { apiClient } from '@/services/apiClient';

export default function EmployerCampaigns() {
    const queryClient = useQueryClient();

    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);

    // Queries
    const { data: campaignsData, isLoading } = useQuery({
        queryKey: ['campaigns', activeTab, searchQuery],
        queryFn: () => apiClient.getCampaigns({ status: activeTab !== 'all' ? activeTab : undefined, search: searchQuery }),
    });

    const campaigns = campaignsData?.items || [];

    // Filter local if mock endpoint doesn't handle all filters yet
    const filteredCampaigns = (campaigns as any[]).filter(c => {
        const matchTab = activeTab === 'all' || c.status === activeTab;
        const matchSearch = c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiClient.createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Đã tạo chiến dịch thành công');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => apiClient.updateCampaign(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Cập nhật chiến dịch thành công');
            setEditingCampaignId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: apiClient.deleteCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Đã xóa chiến dịch');
        }
    });

    // Handlers
    const handleCreateSubmit = async (data: any) => {
        if (editingCampaignId) {
            await updateMutation.mutateAsync({ id: editingCampaignId, data });
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    const handleEditClick = (id: string) => {
        setEditingCampaignId(id);
        setIsCreateModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingCampaignId(null);
        setIsCreateModalOpen(true);
    };

    const handleViewDetail = (id: string) => {
        setViewingCampaignId(id);
        setIsDetailSheetOpen(true);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        // In real app we might only update the status
        await updateMutation.mutateAsync({ id, data: { status: newStatus } });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa chiến dịch này không? Hành động này không thể hoàn tác.")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const editingCampaign = editingCampaignId
        ? (campaigns as any[]).find(c => c.id === editingCampaignId)
        : undefined;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 overflow-hidden relative pb-12">
            {/* Background elements */}
            <div className="absolute top-0 right-[-20%] w-[60%] h-[500px] bg-gradient-to-l from-violet-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

            <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 pt-8 space-y-8 relative z-10 w-full max-w-full">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                >
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-violet-600 dark:from-cyan-400 dark:to-violet-400 flex items-center gap-2">
                            <Target className="w-8 h-8 text-cyan-500" />
                            Chiến Dịch Tuyển Dụng
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Quản lý các chiến dịch quy mô lớn, theo dõi ngân sách và hiệu quả tuyển dụng.
                        </p>
                    </div>

                    <Button
                        onClick={handleCreateClick}
                        className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-700 hover:to-violet-700 text-white shadow-lg shadow-cyan-500/20 px-6 h-11 shrink-0 group relative overflow-hidden"
                    >
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                        <div className="relative flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="font-semibold">Chiến dịch mới</span>
                        </div>
                    </Button>
                </motion.div>

                {/* Filters & Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/60 dark:bg-slate-900/60 p-2 border border-slate-200 dark:border-slate-800/60 rounded-xl backdrop-blur-md sticky top-4 z-20 shadow-sm"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto overflow-x-auto hidden-scrollbar">
                        <TabsList className="bg-transparent border-none p-0 h-10 w-full justify-start md:justify-center">
                            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg">Tất cả</TabsTrigger>
                            <TabsTrigger value="active" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg">Đang chạy</TabsTrigger>
                            <TabsTrigger value="draft" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg">Bản nháp</TabsTrigger>
                            <TabsTrigger value="paused" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg">Tạm dừng</TabsTrigger>
                            <TabsTrigger value="completed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm rounded-lg">Hoàn thành</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex w-full md:w-auto gap-2">
                        <div className="relative w-full md:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm tên chiến dịch..."
                                className="pl-9 bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 h-10 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
                            <Filter className="w-4 h-4 text-slate-500" />
                        </Button>
                    </div>
                </motion.div>

                {/* Table Data Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <CampaignList
                        campaigns={filteredCampaigns}
                        isLoading={isLoading}
                        onViewDetail={handleViewDetail}
                        onEdit={handleEditClick}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                    />
                </motion.div>

            </div>

            {/* Modals & Sheets */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateCampaignModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        initialData={editingCampaign}
                    />
                )}
            </AnimatePresence>

            <CampaignDetailSheet
                isOpen={isDetailSheetOpen}
                onClose={() => setIsDetailSheetOpen(false)}
                campaignId={viewingCampaignId}
            />

        </div>
    );
}
