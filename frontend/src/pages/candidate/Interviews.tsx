import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarClock,
    Video,
    MapPin,
    Building2,
    Clock,
    ExternalLink,
    Calendar,
    Phone,
    type LucideIcon,
} from 'lucide-react';
import { candidateService } from '@/services/candidateService';
import type { InterviewListItem } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type InterviewMode = 'video' | 'phone' | 'onsite';

const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    rescheduled: 'bg-violet-100 text-violet-700 border-violet-200',
    no_show: 'bg-rose-100 text-rose-700 border-rose-200',
    'no-show': 'bg-rose-100 text-rose-700 border-rose-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
};

const statusLabels: Record<string, string> = {
    scheduled: 'Sắp diễn ra',
    confirmed: 'Đã xác nhận',
    in_progress: 'Đang diễn ra',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
    rescheduled: 'Đổi lịch',
    no_show: 'Vắng mặt',
    'no-show': 'Vắng mặt',
    pending: 'Chờ xác nhận',
};

const modeConfig: Record<InterviewMode, {
    icon: LucideIcon;
    label: string;
    emptyText: string;
    avatarClass: string;
    iconClass: string;
}> = {
    video: {
        icon: Video,
        label: 'Phỏng vấn trực tuyến',
        emptyText: 'Nhà tuyển dụng chưa cập nhật link meeting',
        avatarClass: 'from-sky-50 to-cyan-50 border-sky-200',
        iconClass: 'text-sky-600',
    },
    phone: {
        icon: Phone,
        label: 'Phỏng vấn qua điện thoại',
        emptyText: 'Nhà tuyển dụng chưa cập nhật số điện thoại',
        avatarClass: 'from-emerald-50 to-teal-50 border-emerald-200',
        iconClass: 'text-emerald-600',
    },
    onsite: {
        icon: MapPin,
        label: 'Phỏng vấn trực tiếp',
        emptyText: 'Nhà tuyển dụng chưa cập nhật địa điểm phỏng vấn',
        avatarClass: 'from-violet-50 to-fuchsia-50 border-violet-200',
        iconClass: 'text-violet-600',
    },
};

const getInterviewMode = (interview: InterviewListItem): InterviewMode => {
    const rawType = `${interview.type || ''} ${interview.interview_type_name || ''}`.toLowerCase();

    if (rawType.includes('phone') || rawType.includes('điện thoại') || rawType.includes('gọi')) {
        return 'phone';
    }
    if (rawType.includes('onsite') || rawType.includes('offline') || rawType.includes('trực tiếp') || rawType.includes('tại công ty')) {
        return 'onsite';
    }
    if (rawType.includes('video') || rawType.includes('online') || rawType.includes('trực tuyến')) {
        return 'video';
    }

    const meetingLink = (interview.meeting_link || '').trim();
    if (meetingLink) {
        return /^https?:\/\//i.test(meetingLink) ? 'video' : 'phone';
    }

    return interview.location || interview.address ? 'onsite' : 'video';
};

const getModeDetail = (interview: InterviewListItem, mode: InterviewMode) => {
    const meetingLink = (interview.meeting_link || '').trim();

    if (mode === 'onsite') {
        return interview.location || modeConfig.onsite.emptyText;
    }

    if (mode === 'phone') {
        return meetingLink ? `Số điện thoại: ${meetingLink}` : modeConfig.phone.emptyText;
    }

    return meetingLink ? meetingLink : modeConfig.video.emptyText;
};

const getInitials = (name?: string | null) => {
    if (!name) return 'HR';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(-2).map((part) => part[0]).join('').toUpperCase() || 'HR';
};

const getPhoneHref = (value?: string | null) => {
    const phone = (value || '').replace(/[^\d+]/g, '');
    return phone ? `tel:${phone}` : undefined;
};

const isActionableStatus = (status: string) => ['scheduled', 'confirmed', 'rescheduled', 'in_progress'].includes(status);

const toArray = <T,>(value: T[] | { results?: T[] } | undefined | null): T[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    return [];
};

export default function Interviews() {
    const [activeTab, setActiveTab] = useState('upcoming');

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ['candidate', 'interviews'],
        queryFn: async () => {
            const response = await candidateService.listInterviews();
            return toArray<InterviewListItem>(response.data);
        },
    });

    const filteredInterviews = interviews.filter((interview: InterviewListItem) => {
        const status = String(interview.status || '').toLowerCase();

        if (activeTab === 'upcoming') {
            return !['completed', 'cancelled', 'no_show', 'no-show'].includes(status);
        }
        if (activeTab === 'completed') return status === 'completed';
        if (activeTab === 'cancelled') return ['cancelled', 'no_show', 'no-show'].includes(status);
        return true;
    });

    return (
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Lịch phỏng vấn"
                    description="Theo dõi và quản lý các buổi phỏng vấn sắp tới của bạn."
                    icon={CalendarClock}
                />
            </div>

            <div className="p-6 lg:p-8 space-y-6 w-full flex-1 relative z-10">
                {/* Filter bar — notification style */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        {[
                            { key: 'upcoming', label: 'Sắp tới' },
                            { key: 'completed', label: 'Đã xong' },
                            { key: 'cancelled', label: 'Đã hủy' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer',
                                    activeTab === tab.key
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <Clock size={16} />
                        <span>Múi giờ: (GMT+07:00) Bangkok, Hanoi, Jakarta</span>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[240px] rounded-2xl" />)}
                    </div>
                ) : !filteredInterviews.length ? (
                    <div className="py-20 text-center flex flex-col items-center w-full bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lịch phỏng vấn</h3>
                        <p className="text-slate-500 max-w-xl">
                            {activeTab === 'upcoming'
                                ? 'Hiện tại bạn chưa có lịch phỏng vấn nào sắp tới. Hãy tiếp tục ứng tuyển và chờ phản hồi từ nhà tuyển dụng nhé!'
                                : 'Bạn chưa có dữ liệu phỏng vấn ở mục này.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                                    {filteredInterviews.map((interview: InterviewListItem, idx: number) => {
                                        const mode = getInterviewMode(interview);
                                        const config = modeConfig[mode];
                                        const ModeIcon = config.icon;
                                        const companyName = interview.company_name || 'Công ty chưa cập nhật';
                                        const scheduledAt = new Date(interview.scheduled_at);
                                        const interviewers = interview.interviewers?.length
                                            ? interview.interviewers
                                            : interview.interviewer_name
                                                ? [{ id: interview.interviewer || 0, name: interview.interviewer_name, avatar: interview.interviewer_avatar }]
                                                : [];
                                        const meetingLink = (interview.meeting_link || '').trim();
                                        const phoneHref = getPhoneHref(meetingLink);
                                        const canAct = isActionableStatus(interview.status);

                                        return (
                                            <motion.div
                                                key={interview.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                            >
                                                <Card className="group relative bg-white hover:shadow-md border-slate-200 shadow-sm transition-all duration-300 rounded-2xl overflow-hidden p-6">
                                                    <div className="flex justify-between items-start gap-4 mb-6">
                                                        <div className="flex gap-4 min-w-0">
                                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br border shadow-sm flex items-center justify-center shrink-0 ${config.avatarClass}`}>
                                                                <ModeIcon className={`w-6 h-6 ${config.iconClass}`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-violet-600 transition-colors line-clamp-1">
                                                                    Phỏng vấn: {interview.job_title || 'Vị trí ứng tuyển'}
                                                                </h3>
                                                                <p className="font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider text-xs line-clamp-1">
                                                                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                                                                    {companyName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge className={`${statusStyles[interview.status] || statusStyles.pending} font-medium border shrink-0`}>
                                                            {statusLabels[interview.status] || interview.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-4 mb-6">
                                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 rounded-xl p-3">
                                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                <Calendar className="w-4 h-4 text-violet-600" />
                                                            </div>
                                                            <div className="text-sm min-w-0">
                                                                <span className="font-bold text-slate-900 block capitalize">
                                                                    {format(scheduledAt, 'eeee, dd MMMM yyyy', { locale: vi })}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 mt-0.5">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                    {format(scheduledAt, 'HH:mm')} ({interview.duration_minutes || interview.duration || 0} phút)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3 text-slate-600 px-3">
                                                            <div className="p-2 bg-slate-100 rounded-lg mt-0.5">
                                                                <ModeIcon className="w-4 h-4 text-slate-500" />
                                                            </div>
                                                            <div className="text-sm font-medium min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-slate-900">{config.label}</span>
                                                                    {interview.interview_type_name && (
                                                                        <Badge variant="outline" className="bg-white/70 border-slate-200 text-slate-500">
                                                                            {interview.interview_type_name}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="mt-1 text-slate-500 line-clamp-2">
                                                                    {getModeDetail(interview, mode)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                                        <div className="flex -space-x-2 min-w-0">
                                                            {interviewers.length ? interviewers.slice(0, 3).map((person) => (
                                                                <div key={`${person.id}-${person.name}`} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden">
                                                                    {person.avatar ? (
                                                                        <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        getInitials(person.name)
                                                                    )}
                                                                </div>
                                                            )) : (
                                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                    HR
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2 shrink-0">
                                                            <Button variant="ghost" size="sm" className="rounded-lg h-9 hover:bg-slate-50">
                                                                Liên hệ HR
                                                            </Button>
                                                            {mode === 'video' && meetingLink && canAct && (
                                                                <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg h-9 shadow-lg shadow-violet-500/20">
                                                                    <a href={meetingLink} target="_blank" rel="noreferrer">
                                                                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                                        Tham gia
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {mode === 'phone' && phoneHref && canAct && (
                                                                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 shadow-lg shadow-emerald-500/20">
                                                                    <a href={phoneHref}>
                                                                        <Phone className="w-3.5 h-3.5 mr-2" />
                                                                        Gọi HR
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
            </div>
        </div>
    );
}
