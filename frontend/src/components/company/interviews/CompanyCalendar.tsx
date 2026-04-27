import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, Phone, MoreHorizontal, Eye, Edit, XCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Interview {
    id: string;
    candidate_name: string;
    applicant_name?: string;
    candidate_avatar: string;
    applicant_avatar?: string;
    job_title: string;
    type: 'video' | 'phone' | 'onsite';
    scheduled_at: string;
    duration_minutes: number;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    job_id?: string;
    candidate_id?: string;
    applicant_id?: string;
    location?: string;
    meeting_link?: string;
    notes?: string;
    feedback?: string;
    rating?: number;
    interviewers?: { id: string; name: string; avatar: string }[];
}

interface CompanyCalendarProps {
    interviews: Interview[];
    isLoading: boolean;
    onInterviewClick: (id: string) => void;
    onEditInterview: (id: string) => void;
    onCancelInterview: (id: string) => void;
}

export function CompanyCalendar({ interviews, isLoading, onInterviewClick, onEditInterview, onCancelInterview }: CompanyCalendarProps) {
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
            case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'completed': return 'bg-slate-50 text-slate-600 border-slate-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'no_show': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
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
                        "min-h-[100px] p-2 border-r border-b border-slate-200 transition-colors",
                        !isSameMonth(day, currentDate) ? "bg-slate-50/80 text-slate-400" : "bg-white text-slate-700",
                        isSameDay(day, new Date()) ? "bg-violet-50/30" : ""
                    )}
                >
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                            isSameDay(day, new Date()) ? "bg-violet-600 text-white shadow-sm" : "text-slate-700"
                        )}>
                            {formattedDate}
                        </span>
                        {dayInterviews.length > 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                                {dayInterviews.length}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 flex flex-col gap-1">
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
                                            "group flex flex-col gap-1 p-1.5 pr-8 rounded-md border text-xs cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all relative overflow-hidden",
                                            getStatusColor(interview.status)
                                        )}
                                    >
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-1 top-1 rounded p-0.5 text-current/70 opacity-0 transition-opacity hover:bg-white/60 hover:text-current group-hover:opacity-100 cursor-pointer"
                                                >
                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-white border-slate-200">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onInterviewClick(interview.id);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditInterview(interview.id);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa lịch
                                                </DropdownMenuItem>
                                                {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCancelInterview(interview.id);
                                                        }}
                                                        className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" /> Hủy lịch hẹn
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                                    <div className="text-[10px] text-center text-slate-500 font-medium cursor-pointer hover:text-violet-600 bg-slate-100/50 py-1 rounded-sm mt-1">
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
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            {/* Calendar Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-slate-900 capitalize min-w-[180px]">
                        {format(currentDate, 'MMMM, yyyy', { locale: vi })}
                    </h2>
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={prevMonth}>
                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-bold rounded-lg border-x border-slate-100 hover:bg-slate-100" onClick={today}>
                            Hôm nay
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100" onClick={nextMonth}>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        </Button>
                    </div>
                </div>
                <div className="hidden lg:flex items-center gap-4 bg-white p-1.5 px-3 rounded-xl border border-slate-200 shadow-sm flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Sắp tới
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Đã xác nhận
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Đang diễn ra
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Hoàn thành
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Hủy lịch
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div> Vắng mặt
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((dayName) => (
                        <div key={dayName} className="py-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-200 last:border-r-0">
                            {dayName}
                        </div>
                    ))}
                </div>
                <div className="flex-1 bg-slate-50/20">
                    {rows}
                </div>
            </div>
        </div>
    );
}
