import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, List, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { employerService } from '@/services/employerService';

import { EmployerCalendar } from '@/components/employer/interviews/EmployerCalendar';
import { EmployerInterviewList } from '@/components/employer/interviews/EmployerInterviewList';
import { CreateInterviewModal } from '@/components/employer/interviews/CreateInterviewModal';
import { InterviewDetailModal } from '@/components/employer/interviews/InterviewDetailModal';
import { PageHeader } from '@/components/shared/PageHeader';

export default function EmployerInterviewsPage() {
    const [view, setView] = useState('calendar');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

    const { data: interviews, isLoading } = useQuery({
        queryKey: ['employerInterviews'],
        queryFn: () => employerService.listInterviews().then(r => r.data.results)
    });

    const handleInterviewClick = (id: string) => {
        setSelectedInterviewId(id);
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
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-600/20 w-full md:w-auto px-6 h-11 rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo lịch phỏng vấn
                        </Button>
                    }
                />
            </div>

            {/* Main Content */}
            <div className="p-6 lg:p-8 space-y-8">
                <Tabs defaultValue="calendar" value={view} onValueChange={setView} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <TabsList className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm p-1 w-fit rounded-xl gap-1 h-auto">
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
                        className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/40 overflow-hidden shadow-sm mt-8"
                    >
                        <TabsContent value="calendar" className="mt-0 outline-none">
                            <EmployerCalendar
                                interviews={(interviews as any) || []}
                                isLoading={isLoading}
                                onInterviewClick={handleInterviewClick}
                            />
                        </TabsContent>

                        <TabsContent value="list" className="mt-0 outline-none">
                            <EmployerInterviewList
                                interviews={(interviews as any) || []}
                                isLoading={isLoading}
                                onInterviewClick={handleInterviewClick}
                            />
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
            </div>

            {/* Modals */}
            <CreateInterviewModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            <InterviewDetailModal
                interviewId={selectedInterviewId}
                open={!!selectedInterviewId}
                onOpenChange={(open) => !open && setSelectedInterviewId(null)}
            />
        </div>
    );
}
