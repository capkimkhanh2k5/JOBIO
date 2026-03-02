import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, Phone } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface Interview {
    id: string;
    candidate_name: string;
    candidate_avatar: string;
    job_title: string;
    type: 'video' | 'phone' | 'onsite';
    scheduled_at: string;
    duration_minutes: number;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    job_id: string;
    candidate_id: string;
    location?: string;
    meeting_link?: string;
    notes?: string;
    interviewers?: { id: string; name: string; avatar: string }[];
}

interface EmployerCalendarProps {
    interviews: Interview[];
    isLoading: boolean;
    onInterviewClick: (id: string) => void;
}

export function EmployerCalendar({ interviews, isLoading, onInterviewClick }: EmployerCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const today = () => setCurrentDate(new Date());

    const startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    const getStatusColor = (status: Interview['status']) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            case 'cancelled':
            case 'no_show': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800';
            case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const formattedDate = format(day, dateFormat);
            const cloneDay = day;

            // Find interviews for this day
            const dayInterviews = interviews?.filter(inv => isSameDay(parseISO(inv.scheduled_at), cloneDay)) || [];

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "min-h-[140px] p-2 border-r border-b border-slate-200 dark:border-slate-800 transition-colors",
                        !isSameMonth(day, currentDate) ? "bg-slate-50/50 dark:bg-slate-900/50 text-slate-400" : "bg-white dark:bg-slate-900",
                        isSameDay(day, new Date()) ? "bg-violet-50/50 dark:bg-violet-900/10" : ""
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                            isSameDay(day, new Date()) ? "bg-violet-600 text-white" : "text-slate-700 dark:text-slate-300"
                        )}>
                            {formattedDate}
                        </span>
                        {dayInterviews.length > 0 && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                                {dayInterviews.length}
                            </span>
                        )}
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                        {isLoading ? (
                            Array(2).fill(null).map((_, idx) => (
                                <Skeleton key={idx} className="h-12 w-full rounded-md" />
                            ))
                        ) : (
                            <>
                                {dayInterviews.slice(0, 3).map((interview) => (
                                    <div
                                        key={interview.id}
                                        onClick={() => onInterviewClick(interview.id)}
                                        className={cn(
                                            "group flex flex-col gap-1 p-1.5 rounded-md border text-xs cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all relative overflow-hidden",
                                            getStatusColor(interview.status)
                                        )}
                                    >
                                        <div className="font-semibold truncate flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 opacity-70" />
                                                {format(parseISO(interview.scheduled_at), 'HH:mm')}
                                            </span>
                                            {interview.type === 'video' && <Video className="w-3 h-3 opacity-70" />}
                                            {interview.type === 'phone' && <Phone className="w-3 h-3 opacity-70" />}
                                            {interview.type === 'onsite' && <MapPin className="w-3 h-3 opacity-70" />}
                                        </div>
                                        <div className="truncate opacity-90">{interview.candidate_name}</div>
                                    </div>
                                ))}
                                {dayInterviews.length > 3 && (
                                    <div className="text-[10px] text-center text-slate-500 font-medium cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 bg-slate-100 dark:bg-slate-800 py-1 rounded-sm mt-1">
                                        + {dayInterviews.length - 3} lịch khác
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* Calendar Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize min-w-[180px]">
                        {format(currentDate, 'MMMM, yyyy', { locale: vi })}
                    </h2>
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-0.5 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={prevMonth}>
                            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-medium rounded-sm border-x border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={today}>
                            Hôm nay
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={nextMonth}>
                            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                    </div>
                </div>
                <div className="hidden lg:flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 px-3 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Sắp tới
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Đã xác nhận
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Hoàn thành
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((dayName) => (
                        <div key={dayName} className="py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {dayName}
                        </div>
                    ))}
                </div>
                <div className="flex-1 bg-slate-50/50 dark:bg-slate-900">
                    {rows}
                </div>
            </div>
        </div>
    );
}
