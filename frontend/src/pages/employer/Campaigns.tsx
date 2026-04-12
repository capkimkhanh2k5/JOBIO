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
import { employerService } from '@/services/employerService';
import { PageHeader } from '@/components/shared/PageHeader';

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
        queryFn: () => employerService.listCampaigns({ status: activeTab !== 'all' ? activeTab : undefined }).then(r => r.data),
    });

    const campaigns = campaignsData?.results || [];

    // Filter local if mock endpoint doesn't handle all filters yet
    const filteredCampaigns = (campaigns as any[]).filter(c => {
        const matchTab = activeTab === 'all' || c.status === activeTab;
        const name = c.title || c.campaign_name || '';
        const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => employerService.createCampaign(data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Đã tạo chiến dịch thành công');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => employerService.updateCampaign(Number(id), data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Cập nhật chiến dịch thành công');
            setEditingCampaignId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => employerService.deleteCampaign(Number(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            toast.success('Đã xóa chiến dịch');
        }
    });

    // Handlers
    const handleCreateSubmit = async (data: any) => {
        // Transform data for backend (title and slug)
        const transformedData = {
            ...data,
            title: data.campaign_name,
            slug: data.campaign_name.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim() + '-' + Math.random().toString(36).substring(2, 7)
        };

        if (editingCampaignId) {
            await updateMutation.mutateAsync({ id: editingCampaignId, data: transformedData });
        } else {
            await createMutation.mutateAsync(transformedData);
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
        <div className="min-h-screen overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-[-20%] w-[60%] h-[500px] bg-gradient-to-l from-violet-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Chiến Dịch Tuyển Dụng"
                    description="Quản lý các chiến dịch quy mô lớn, theo dõi ngân sách và hiệu quả tuyển dụng."
                    icon={Target}
                    action={
                        <Button
                            onClick={handleCreateClick}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 px-8 h-11 shrink-0 group relative overflow-hidden rounded-xl font-bold"
                        >
                            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                            <div className="relative flex items-center text-sm">
                                <Plus className="w-5 h-5 mr-2" />
                                <span>Chiến dịch mới</span>
                            </div>
                        </Button>
                    }
                />
            </div>

            <div className="w-full mx-auto space-y-6 relative z-10 px-6 lg:px-8 pb-6 lg:pb-8 pt-6 animate-in fade-in duration-700">

                {/* Filters & Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <TabsList className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm p-1 w-fit rounded-xl gap-1 h-auto hidden-scrollbar overflow-x-auto">
                                <TabsTrigger value="all" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">Tất cả</TabsTrigger>
                                <TabsTrigger value="active" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">Đang chạy</TabsTrigger>
                                <TabsTrigger value="draft" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">Bản nháp</TabsTrigger>
                                <TabsTrigger value="paused" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">Tạm dừng</TabsTrigger>
                                <TabsTrigger value="completed" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">Hoàn thành</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <div className="relative min-w-[200px] flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm tên chiến dịch..."
                                        className="pl-9 bg-white border-slate-200 rounded-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" className="bg-white border-slate-200 rounded-xl whitespace-nowrap">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Bộ lọc
                                </Button>
                            </div>
                        </div>
                    </Tabs>
                </motion.div>

                {/* Table Data Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 overflow-hidden shadow-sm"
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
