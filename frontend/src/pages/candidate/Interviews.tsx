import { useMemo, useState } from 'react';
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
    Search,
    type LucideIcon,
} from 'lucide-react';
import { candidateService } from '@/services/candidateService';
import type { InterviewListItem } from '@/types/api';
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
    const [searchQuery, setSearchQuery] = useState('');

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ['candidate', 'interviews'],
        queryFn: async () => {
            const response = await candidateService.listInterviews({ page_size: 100 });
            return toArray<InterviewListItem>(response.data);
        },
    });

    const { filteredInterviews, tabCounts } = useMemo(() => {
        const isInTab = (interview: InterviewListItem, tab: string) => {
            const status = String(interview.status || '').toLowerCase();

            if (tab === 'upcoming') {
                return !['completed', 'cancelled', 'no_show', 'no-show'].includes(status);
            }
            if (tab === 'completed') return status === 'completed';
            if (tab === 'cancelled') return status === 'cancelled';
            if (tab === 'missed') return ['no_show', 'no-show'].includes(status);
            return true;
        };

        const normalizedQuery = searchQuery.trim().toLowerCase();
        const searchableInterviews = interviews.filter((interview: InterviewListItem) => {
            if (!normalizedQuery) return true;

            return [interview.job_title, interview.company_name]
                .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
        });

        return {
            filteredInterviews: searchableInterviews.filter((interview) => isInTab(interview, activeTab)),
            tabCounts: {
                upcoming: interviews.filter((interview) => isInTab(interview, 'upcoming')).length,
                completed: interviews.filter((interview) => isInTab(interview, 'completed')).length,
                cancelled: interviews.filter((interview) => isInTab(interview, 'cancelled')).length,
                missed: interviews.filter((interview) => isInTab(interview, 'missed')).length,
            },
        };
    }, [activeTab, interviews, searchQuery]);

    return (
        <div className="relative flex flex-col w-full h-full min-h-0">
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Lịch phỏng vấn"
                    description="Theo dõi và quản lý các buổi phỏng vấn sắp tới của bạn."
                    icon={CalendarClock}
                />
            </div>

            <div className="p-6 lg:p-8 w-full flex-1 relative z-10">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50/50">
                        <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full sm:w-fit">
                            {[
                                { key: 'upcoming', label: 'Sắp tới' },
                                { key: 'completed', label: 'Đã xong' },
                                { key: 'cancelled', label: 'Đã hủy' },
                                { key: 'missed', label: 'Vắng mặt' },
                            ].map((tab) => {
                                const isActive = activeTab === tab.key;
                                const count = tabCounts[tab.key as keyof typeof tabCounts];

                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={cn(
                                            'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                                            isActive
                                                ? 'bg-violet-600 text-white shadow-md'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        )}
                                    >
                                        {tab.label}
                                        {count > 0 && (
                                            <span className={cn(
                                                'text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                            )}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative w-full sm:w-72 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo vị trí hoặc công ty..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 bg-white shadow-sm"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map((item) => <Skeleton key={item} className="w-full h-36 rounded-xl" />)}
                        </div>
                    ) : !filteredInterviews.length ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Không tìm thấy lịch phỏng vấn</h3>
                            <p className="text-slate-500 text-sm max-w-sm">
                                {searchQuery
                                    ? 'Không có kết quả nào phù hợp với tìm kiếm của bạn.'
                                    : 'Bạn chưa có lịch phỏng vấn nào ở trạng thái này.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            <AnimatePresence mode="popLayout">
                                {filteredInterviews.map((interview: InterviewListItem, idx: number) => {
                                    const mode = getInterviewMode(interview);
                                    const config = modeConfig[mode];
                                    const ModeIcon = config.icon;
                                    const companyName = interview.company_name || 'Công ty chưa cập nhật';
                                    const scheduledAt = new Date(interview.scheduled_at);
                                    const meetingLink = (interview.meeting_link || '').trim();
                                    const phoneHref = getPhoneHref(meetingLink);
                                    const canAct = isActionableStatus(interview.status);

                                    return (
                                        <motion.div
                                            key={interview.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                            className="p-5 hover:bg-slate-50 transition-colors group flex flex-col sm:flex-row gap-5"
                                        >
                                            <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                                                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center p-2 group-hover:border-violet-200 transition-colors overflow-hidden">
                                                    {interview.company_logo ? (
                                                        <img src={interview.company_logo} alt={companyName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 className="w-7 h-7 text-slate-300" />
                                                    )}
                                                </div>
                                                <Badge className={`${statusStyles[interview.status] || statusStyles.pending} font-medium border hidden sm:inline-flex`}>
                                                    {statusLabels[interview.status] || interview.status}
                                                </Badge>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-3 mb-1">
                                                    <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-violet-600 transition-colors">
                                                        {interview.job_title || 'Vị trí ứng tuyển'}
                                                    </h3>
                                                    <Badge className={`${statusStyles[interview.status] || statusStyles.pending} font-medium border sm:hidden shrink-0`}>
                                                        {statusLabels[interview.status] || interview.status}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 mb-3">
                                                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                                                        <Building2 className="w-4 h-4 text-slate-400" />
                                                        {companyName}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1.5 text-slate-500 capitalize">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        {format(scheduledAt, 'eeee, dd/MM/yyyy', { locale: vi })}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1.5 text-slate-500">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        {format(scheduledAt, 'HH:mm')} ({interview.duration_minutes || interview.duration || 0} phút)
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 flex items-center gap-1.5 font-normal">
                                                        <ModeIcon className={`w-3.5 h-3.5 ${config.iconClass}`} />
                                                        {config.label}
                                                    </Badge>
                                                    <span className="text-slate-500 line-clamp-1">
                                                        {getModeDetail(interview, mode)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 flex items-center gap-2 sm:self-center">
                                                {mode === 'video' && meetingLink && canAct && (
                                                    <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm">
                                                        <a href={meetingLink} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                            Tham gia
                                                        </a>
                                                    </Button>
                                                )}
                                                {mode === 'phone' && phoneHref && canAct && (
                                                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">
                                                        <a href={phoneHref}>
                                                            <Phone className="w-3.5 h-3.5 mr-2" />
                                                            Gọi HR
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
