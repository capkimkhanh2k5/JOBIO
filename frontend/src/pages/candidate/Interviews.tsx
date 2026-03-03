import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Calendar, Clock, Video, Phone, MapPin,
    ExternalLink, Download, Star, MessageCircle, CalendarPlus
} from 'lucide-react';
import { employerService } from '@/services/employerService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'scheduled':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Đã lên lịch</Badge>;
        case 'confirmed':
            return <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Đã xác nhận</Badge>;
        case 'completed':
            return <Badge variant="default" className="bg-slate-100 text-slate-700 hover:bg-slate-100">Đã hoàn thành</Badge>;
        case 'cancelled':
            return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">Đã hủy</Badge>;
        case 'no_show':
            return <Badge variant="outline" className="border-red-200 text-red-600">Không tham gia</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

const TypeIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type) {
        case 'video': return <Video className={className} />;
        case 'phone': return <Phone className={className} />;
        case 'onsite': return <MapPin className={className} />;
        default: return <Calendar className={className} />;
    }
};

const TypeLabel = ({ type }: { type: string }) => {
    switch (type) {
        case 'video': return 'Phỏng vấn Online';
        case 'phone': return 'Phỏng vấn Điện thoại';
        case 'onsite': return 'Phỏng vấn Trực tiếp';
        default: return 'Phỏng vấn';
    }
};

export default function CandidateInterviews() {
    const { data: upcomingInterviews, isLoading: upcomingLoading } = useQuery({
        queryKey: ['interviews', 'upcoming'],
        queryFn: () => employerService.listInterviews({ status: 'scheduled,confirmed' }).then(r => r.data.results),
        staleTime: 60000,
    });

    const { data: pastInterviews, isLoading: pastLoading } = useQuery({
        queryKey: ['interviews', 'history'],
        queryFn: () => employerService.listInterviews({ status: 'completed,cancelled,no_show' }).then(r => r.data.results),
        staleTime: 60000,
    });

    const generateGoogleCalendarLink = (interview: any) => {
        const startDate = new Date(interview.scheduled_at);
        const endDate = new Date(startDate.getTime() + (interview.duration_minutes * 60000));

        const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const text = encodeURIComponent(`Phỏng vấn: ${interview.job_title} tại ${interview.company_name}`);
        const dates = `${formatTime(startDate)}/${formatTime(endDate)}`;
        const details = encodeURIComponent(`Nhà tuyển dụng: ${interview.company_name}\n\nChi tiết xem tại hệ thống JOBIO.`);
        const location = encodeURIComponent(interview.meeting_link || interview.location || 'Chưa cập nhật');

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
    };

    const handleDownloadICS = (interview: any) => {
        const startDate = new Date(interview.scheduled_at);
        const endDate = new Date(startDate.getTime() + (interview.duration_minutes * 60000));

        const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const event = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${formatTime(startDate)}`,
            `DTEND:${formatTime(endDate)}`,
            `SUMMARY:Phỏng vấn ${interview.job_title} - ${interview.company_name}`,
            `DESCRIPTION:Nhà tuyển dụng: ${interview.company_name}`,
            `LOCATION:${interview.meeting_link || interview.location || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `interview_${interview.company_name.replace(/\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Lịch phỏng vấn</h1>
                <p className="text-muted-foreground">Theo dõi và quản lý các lịch hẹn phỏng vấn với nhà tuyển dụng.</p>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-6 bg-slate-100/50 p-1">
                    <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-6">
                        Sắp tới
                        {upcomingInterviews && upcomingInterviews.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center bg-cyan-100 text-cyan-700 text-[10px] font-bold h-4 min-w-[16px] rounded-full">
                                {upcomingInterviews.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-6">
                        Lịch sử
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-6 outline-none">
                    {upcomingLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            {[1, 2].map(i => (
                                <Card key={i} className="overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start gap-4">
                                            <Skeleton className="w-12 h-12 rounded-xl" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : upcomingInterviews?.length === 0 ? (
                        <Card className="border-dashed bg-slate-50 border-slate-200">
                            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Calendar className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có lịch phỏng vấn nào</h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    Bạn hiện không có lịch phỏng vấn nào sắp diễn ra. Hãy tiếp tục ứng tuyển để nhận thêm nhiều cơ hội.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {upcomingInterviews?.map((interview: any) => (
                                <Card key={interview.id} className="group overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-300">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                    <img src={interview.company_logo} alt={interview.company_name} className="w-8 h-8 object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-violet-700 transition-colors">{interview.job_title}</h3>
                                                    <p className="text-sm text-slate-500 line-clamp-1">{interview.company_name}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={interview.status} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-y-3 text-sm text-slate-600">
                                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="truncate">{format(new Date(interview.scheduled_at), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{format(new Date(interview.scheduled_at), 'HH:mm')} ({interview.duration_minutes} phút)</span>
                                            </div>
                                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1 border-t border-transparent pt-1 sm:pt-0">
                                                <TypeIcon type={interview.type} className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="truncate"><TypeLabel type={interview.type} /></span>
                                            </div>
                                            <div className="flex items-center gap-2 col-span-2 sm:col-span-1 border-t border-transparent pt-1 sm:pt-0">
                                                {interview.type === 'onsite' ? (
                                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                ) : (
                                                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                {interview.meeting_link ? (
                                                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline truncate">
                                                        Tham gia ngay
                                                    </a>
                                                ) : (
                                                    <span className="truncate" title={interview.location || 'Chưa cập nhật'}>
                                                        {interview.location || 'Chưa cập nhật'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                                            <a
                                                href={generateGoogleCalendarLink(interview)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex flex-1 items-center justify-center gap-2 text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 h-9 px-3 rounded-lg transition-colors border border-slate-200"
                                            >
                                                <CalendarPlus className="w-3.5 h-3.5" />
                                                Google Calendar
                                            </a>
                                            <button
                                                onClick={() => handleDownloadICS(interview)}
                                                className="inline-flex flex-1 items-center justify-center gap-2 text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 h-9 px-3 rounded-lg transition-colors border border-slate-200"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Outlook / iCal
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6 outline-none">
                    {pastLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            {[1, 2].map(i => (
                                <Card key={i} className="overflow-hidden opacity-80">
                                    <CardHeader className="pb-4">
                                        <Skeleton className="h-12 w-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-20 w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : pastInterviews?.length === 0 ? (
                        <Card className="border-dashed bg-slate-50 border-slate-200">
                            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Clock className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Chưa có lịch sử phỏng vấn</h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    Các phỏng vấn đã hoàn thành sẽ xuất hiện tại đây cùng với đánh giá và phản hồi từ nhà tuyển dụng.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {pastInterviews?.map((interview: any) => (
                                <Card key={interview.id} className="group overflow-hidden border-slate-200/60 shadow-sm transition-all duration-300">
                                    <CardHeader className="pb-4 bg-slate-50/50">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center opacity-80 grayscale group-hover:grayscale-0 transition-all">
                                                    <img src={interview.company_logo} alt={interview.company_name} className="w-6 h-6 object-contain" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-slate-700">{interview.job_title}</h3>
                                                    <p className="text-xs text-slate-500">{interview.company_name}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={interview.status} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{format(new Date(interview.scheduled_at), 'dd/MM/yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <TypeIcon type={interview.type} className="w-3.5 h-3.5" />
                                                <span><TypeLabel type={interview.type} /></span>
                                            </div>
                                        </div>

                                        {(interview.feedback || interview.rating) && (
                                            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-100 mt-2">
                                                {interview.rating && (
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <span className="text-xs font-medium text-slate-700 mr-1">Đánh giá chung:</span>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                className={`w-3.5 h-3.5 ${star <= interview.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
                                                            />
                                                        ))}
                                                        <span className="text-xs font-bold ml-1 text-slate-700">{interview.rating}/5</span>
                                                    </div>
                                                )}
                                                {interview.feedback && (
                                                    <div className="relative">
                                                        <MessageCircle className="w-4 h-4 absolute top-0.5 text-slate-400" />
                                                        <p className="pl-6 text-sm text-slate-600 leading-relaxed italic">
                                                            "{interview.feedback}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {(!interview.feedback && !interview.rating && interview.status === 'completed') && (
                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2 text-center text-xs text-slate-500 italic">
                                                Nhà tuyển dụng chưa để lại phản hồi cho phỏng vấn này.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
