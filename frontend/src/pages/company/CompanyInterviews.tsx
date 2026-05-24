import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, List, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { useCandidateStore } from '@/store/candidateStore';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { CompanyCalendar } from '@/components/company/interviews/CompanyCalendar';
import { CompanyInterviewList } from '@/components/company/interviews/CompanyInterviewList';
import { CreateInterviewModal } from '@/components/company/interviews/CreateInterviewModal';
import { EditInterviewModal } from '@/components/company/interviews/EditInterviewModal';
import { InterviewDetailModal } from '@/components/company/interviews/InterviewDetailModal';
import { CandidateDetailSheet } from '@/components/company/candidates/CandidateDetailSheet';
import { PageHeader } from '@/components/shared/PageHeader';

export default function CompanyInterviewsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [view, setView] = useState('calendar');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [prefilledApplicationId, setPrefilledApplicationId] = useState<string | null>(null);
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
    const [selectedEditInterviewId, setSelectedEditInterviewId] = useState<string | null>(null);
    const [cancelInterviewId, setCancelInterviewId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const setSelectedCandidateId = useCandidateStore((state) => state.setSelectedCandidateId);

    const { data: interviews, isLoading } = useQuery({
        queryKey: ['companyInterviews'],
        queryFn: () => companyService.listInterviews().then(r => r.data.results)
    });

    useEffect(() => {
        const state = location.state as
            | { openCreateInterview?: boolean; preselectedApplicationId?: string | null }
            | null;

        if (!state?.openCreateInterview) return;

        setIsCreateOpen(true);
        setPrefilledApplicationId(state.preselectedApplicationId ? String(state.preselectedApplicationId) : null);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const handleInterviewClick = (id: string) => {
        setSelectedInterviewId(id);
    };

    const handleCreateOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setPrefilledApplicationId(null);
        }
    };

    const cancelMutation = useMutation({
        mutationFn: (id: string) => companyService.updateInterview(Number(id), { status: 'cancelled' }).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyInterviews'] });
            if (cancelInterviewId) {
                queryClient.invalidateQueries({ queryKey: ['interview', cancelInterviewId] });
                queryClient.invalidateQueries({ queryKey: ['interview', cancelInterviewId, 'edit'] });
            }
            toast.success('Đã hủy lịch hẹn.');
            setCancelInterviewId(null);
        },
        onError: () => {
            toast.error('Hủy lịch hẹn thất bại.');
        },
    });

    const confirmCancelInterview = () => {
        if (!cancelInterviewId) return;
        cancelMutation.mutate(cancelInterviewId);
    };

    return (
        <div className="w-full mx-auto min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Lịch Phỏng Vấn"
                    description="Quản lý và sắp xếp lịch phỏng vấn với ứng viên."
                    icon={Calendar}
                    action={
                        <Button
                            onClick={() => {
                                setPrefilledApplicationId(null);
                                setIsCreateOpen(true);
                            }}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-600/20 w-full md:w-auto px-6 h-11 rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo lịch phỏng vấn
                        </Button>
                    }
                />
            </div>

            {/* Main Content */}
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6">
                <Tabs defaultValue="calendar" value={view} onValueChange={setView} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <TabsList className="bg-white border border-slate-200 shadow-sm p-1 w-fit rounded-xl gap-1 h-auto">
                            <TabsTrigger value="calendar" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Lịch (Calendar)
                            </TabsTrigger>
                            <TabsTrigger value="list" className="rounded-lg px-6 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-all data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center justify-center">
                                <List className="w-4 h-4 mr-2" />
                                Danh sách (List)
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="relative min-w-[200px] flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Tìm kiếm ứng viên hoặc vị trí..." className="pl-9 bg-white border-slate-200 rounded-xl" />
                            </div>
                            <Button variant="outline" className="bg-white border-slate-200 rounded-xl whitespace-nowrap">
                                <Filter className="w-4 h-4 mr-2" />
                                Bộ lọc
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-8"
                        >
                            <TabsContent value="calendar" className="mt-0 outline-none">
                                <CompanyCalendar
                                    interviews={(interviews as any) || []}
                                    isLoading={isLoading}
                                    onInterviewClick={handleInterviewClick}
                                    onEditInterview={setSelectedEditInterviewId}
                                    onCancelInterview={setCancelInterviewId}
                                />
                            </TabsContent>

                            <TabsContent value="list" className="mt-0 outline-none">
                                <CompanyInterviewList
                                    interviews={(interviews as any) || []}
                                    isLoading={isLoading}
                                    onInterviewClick={handleInterviewClick}
                                    onEditInterview={setSelectedEditInterviewId}
                                    onCancelInterview={setCancelInterviewId}
                                />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>

            {/* Modals */}
            <CreateInterviewModal
                open={isCreateOpen}
                onOpenChange={handleCreateOpenChange}
                initialApplicationId={prefilledApplicationId}
            />

            <InterviewDetailModal
                interviewId={selectedInterviewId}
                open={!!selectedInterviewId}
                onOpenChange={(open) => !open && setSelectedInterviewId(null)}
                onViewCandidate={(applicationId) => setSelectedCandidateId(applicationId)}
            />

            {selectedEditInterviewId && (
                <EditInterviewModal
                    key={selectedEditInterviewId}
                    interviewId={selectedEditInterviewId}
                    open={true}
                    onOpenChange={(open) => !open && setSelectedEditInterviewId(null)}
                />
            )}

            <CandidateDetailSheet />

            <AlertDialog open={!!cancelInterviewId} onOpenChange={(open) => !open && setCancelInterviewId(null)}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận hủy lịch hẹn</AlertDialogTitle>
                        <AlertDialogDescription>
                            Lịch phỏng vấn này sẽ được chuyển sang trạng thái đã hủy. Bạn có chắc chắn muốn tiếp tục?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-slate-200" disabled={cancelMutation.isPending}>
                            Đóng
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCancelInterview}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold border-none shadow-sm"
                            disabled={cancelMutation.isPending}
                        >
                            Xác nhận hủy
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
