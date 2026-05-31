import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { companyService } from '@/services/companyService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Video, Phone, MapPin, ExternalLink, ChevronRight, CalendarX } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPE_CONFIG = {
    video: { label: 'Video call', icon: <Video className="w-3.5 h-3.5" />, className: 'bg-violet-50 text-violet-700 border-violet-200' },
    phone: { label: 'Điện thoại', icon: <Phone className="w-3.5 h-3.5" />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    onsite: { label: 'Trực tiếp', icon: <MapPin className="w-3.5 h-3.5" />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function UpcomingInterviewsCard() {
    const { data, isLoading } = useQuery({
        queryKey: ['company', 'interviews', 'upcoming'],
        queryFn: () => companyService.listUpcomingInterviews().then(r => r.data),
        staleTime: 60_000,
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Phỏng vấn sắp tới</h3>
                <Link
                    to="/company/interviews"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                    Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto min-h-[300px]">
                {isLoading
                    ? Array(4).fill(null).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    ))
                    : !data?.length
                        ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-slate-400">
                                <CalendarX className="w-10 h-10 opacity-50" />
                                <p className="text-sm font-medium">Chưa có phỏng vấn nào sắp tới</p>
                            </div>
                        )
                        : data.map((interview, i) => {
                            const typeNameLower = (interview.interview_type_name || '').toLowerCase();
                            let typeKey: keyof typeof TYPE_CONFIG = 'video';
                            if (typeNameLower.includes('trực tiếp') || typeNameLower.includes('onsite') || typeNameLower.includes('tại công ty')) typeKey = 'onsite';
                            else if (typeNameLower.includes('điện thoại') || typeNameLower.includes('phone') || typeNameLower.includes('gọi')) typeKey = 'phone';
                            const typeConf = TYPE_CONFIG[typeKey];
                            const scheduledDate = new Date(interview.scheduled_at);
                            return (
                                <motion.div
                                    key={interview.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.3 }}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                                >
                                    {/* Avatar */}
                                    <Avatar className="w-10 h-10 border border-slate-200 shrink-0 shadow-sm">
                                        <AvatarImage src={interview.applicant_avatar || undefined} />
                                        <AvatarFallback className="text-xs font-bold bg-blue-50 text-blue-700">
                                            {(interview.applicant_name || 'U').split(' ').pop()?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-slate-900 text-sm truncate">{interview.applicant_name || 'Ứng viên'}</p>
                                            <Badge className={`text-[10px] shadow-none font-bold border flex items-center gap-1 ${typeConf.className}`}>
                                                {typeConf.icon}
                                                {interview.interview_type_name || typeConf.label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{interview.job_title}</p>
                                        <p className="text-xs text-blue-600 mt-1 font-semibold">
                                            {format(scheduledDate, "EEEE, dd/MM · HH:mm", { locale: vi })}
                                        </p>
                                    </div>

                                    {/* Meeting link */}
                                    {interview.meeting_link && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all text-xs gap-1 shrink-0 shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                            asChild
                                        >
                                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-3 h-3" />
                                                Tham gia
                                            </a>
                                        </Button>
                                    )}
                                </motion.div>
                            );
                        })
                }
            </div>
        </div>
    );
}
