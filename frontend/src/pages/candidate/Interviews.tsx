import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Video, MapPin, Building2, Clock, MoreVertical, ExternalLink, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { employerService } from '@/services/employerService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusStyles: Record<string, string> = {
    'scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
    'completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'cancelled': 'bg-red-100 text-red-700 border-red-200',
    'pending': 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function Interviews() {
    const [activeTab, setActiveTab] = useState('upcoming');

    const { data: interviews, isLoading } = useQuery({
        queryKey: ['candidate', 'interviews'],
        queryFn: () => employerService.listInterviews().then(r => r.data.results),
    });

    const filteredInterviews = interviews?.filter((interview: any) => {
        if (activeTab === 'upcoming') return ['scheduled', 'pending'].includes(interview.status);
        if (activeTab === 'completed') return interview.status === 'completed';
        if (activeTab === 'cancelled') return interview.status === 'cancelled';
        return true;
    });

    return (
        <div className="relative pb-12 w-full flex-1">
            <PageHeader
                title="Lịch phỏng vấn"
                description="Theo dõi và quản lý các buổi phỏng vấn sắp tới của bạn."
                icon={CalendarClock}
            />

            <div className="p-6 lg:p-8 space-y-8 w-full flex-1 relative z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <TabsList className="bg-white/60 backdrop-blur-md border border-slate-200/50 p-1">
                            <TabsTrigger value="upcoming" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-md px-6">
                                Sắp tới
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-md px-6">
                                Đã xong
                            </TabsTrigger>
                            <TabsTrigger value="cancelled" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-md px-6">
                                Đã hủy
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50">
                            <Clock size={16} />
                            <span>Múi giờ: (GMT+07:00) Bangkok, Hanoi, Jakarta</span>
                        </div>
                    </div>

                    <TabsContent value={activeTab} className="mt-0 outline-none">
                        {isLoading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[200px] rounded-2xl" />)}
                            </div>
                        ) : !filteredInterviews?.length ? (
                            <div className="py-20 text-center flex flex-col items-center w-full">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                    <Calendar className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lịch phỏng vấn</h3>
                                <p className="text-slate-500">
                                    {activeTab === 'upcoming' 
                                        ? "Hiện tại bạn chưa có lịch phỏng vấn nào sắp tới. Hãy tiếp tục ứng tuyển và chờ phản hồi từ nhà tuyển dụng nhé!"
                                        : "Bạn chưa có dữ liệu phỏng vấn ở mục này."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredInterviews.map((interview: any, idx: number) => (
                                        <motion.div
                                            key={interview.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                                        >
                                            <Card className="group relative bg-white hover:shadow-xl hover:shadow-violet-500/5 border-slate-200 transition-all duration-300 rounded-2xl overflow-hidden p-6">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex gap-4">
                                                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
                                                            {interview.type === 'online' ? '💻' : '🏢'}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-violet-600 transition-colors line-clamp-1">
                                                                Phỏng vấn: {interview.job_title}
                                                            </h3>
                                                            <p className="font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                                                                <Building2 className="w-3.5 h-3.5" />
                                                                {interview.employer_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={`${statusStyles[interview.status]} font-medium border`}>
                                                        {interview.status === 'scheduled' ? 'Sắp diễn ra' : 
                                                         interview.status === 'completed' ? 'Đã hoàn thành' : 
                                                         interview.status === 'cancelled' ? 'Đã hủy' : interview.status}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-4 mb-6">
                                                    <div className="flex items-center gap-3 text-slate-600 bg-slate-50 rounded-xl p-3">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                                            <Calendar className="w-4 h-4 text-violet-600" />
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-bold text-slate-900 block capitalize">
                                                                {format(new Date(interview.scheduled_at), 'eeee, dd MMMM yyyy', { locale: vi })}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 mt-0.5">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                {format(new Date(interview.scheduled_at), 'HH:mm')} ({interview.duration} phút)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-slate-600 px-3">
                                                        <div className="p-2 bg-slate-100 rounded-lg">
                                                            {interview.type === 'online' ? <Video className="w-4 h-4 text-slate-500" /> : <MapPin className="w-4 h-4 text-slate-500" />}
                                                        </div>
                                                        <span className="text-sm font-medium line-clamp-1 italic">
                                                            {interview.type === 'online' ? 'Phỏng vấn trực tuyến qua ' + (interview.platform || 'Google Meet') : interview.location}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <div className="flex -space-x-2">
                                                        {[1, 2].map((i) => (
                                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                HR
                                                            </div>
                                                        ))}
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600">
                                                            +1
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="rounded-lg h-9 hover:bg-slate-50">
                                                            Liên hệ HR
                                                        </Button>
                                                        {interview.type === 'online' && interview.status === 'scheduled' && (
                                                            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg h-9 shadow-lg shadow-violet-500/20">
                                                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                                Tham gia
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
