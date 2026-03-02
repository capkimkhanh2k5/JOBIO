import { motion } from 'framer-motion';
import {
    Building2,
    MapPin,
    Calendar,
    Users,
    Share2,
    Bookmark,
    CheckCircle2,
    Clock,
    DollarSign,
    Briefcase,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface JobDetailHeaderProps {
    job: {
        id: string;
        title: string;
        company_name: string;
        logo_url: string;
        banner_url?: string;
        job_type: string;
        level: string;
        salary_min: number;
        salary_max: number;
        salary_currency: string;
        is_salary_visible: boolean;
        is_remote: boolean;
        deadline: string;
        views_count: number;
        applications_count: number;
        is_featured: boolean;
    };
    locations: { province: string }[];
    onApply: () => void;
}

export const JobDetailHeader = ({ job, locations, onApply }: JobDetailHeaderProps) => {
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép liên kết vào bộ nhớ tạm");
    };

    const handleSave = () => {
        toast.success("Đã lưu tin tuyển dụng thành công");
    };

    const formatSalary = (min: number, max: number, currency: string) => {
        if (!job.is_salary_visible) return "Thỏa thuận";
        return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    };

    // Calculate days remaining
    const deadlineDate = new Date(job.deadline);
    const today = new Date();
    const diffTime = Math.abs(deadlineDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
        <section className="relative w-full mb-12">
            {/* Banner Section */}
            <div className="relative h-48 md:h-72 w-full rounded-[32px] overflow-hidden z-20">
                {job.banner_url ? (
                    <img
                        src={job.banner_url}
                        alt="Company Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-aurora-cyan/20 via-aurora-violet/20 to-aurora-lime/20 animate-aurora-shift" />
                )}
                {/* Fade Overlay - Reverses into the card below */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-40" />
            </div>

            {/* Main Info Section - Positioned below the banner shadow/fade */}
            <div className="relative -mt-32 pb-8">
                <div className="glass-card-tinted p-8 md:p-10 pt-36 md:pt-40 rounded-[40px] border-white/20 shadow-sm relative z-0">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                        <div className="flex items-start md:items-end gap-6">
                            {/* Logo */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative h-24 w-24 md:h-32 md:w-32 rounded-2xl glass-card-tinted p-3 overflow-hidden shadow-xl border border-white/30"
                            >
                                <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                                {job.is_featured && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-400 p-1 rounded-bl-lg">
                                        <Zap size={14} className="text-yellow-900 fill-yellow-900" />
                                    </div>
                                )}
                            </motion.div>

                            {/* Title & Company */}
                            <div className="flex-1">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground group">
                                        {job.title}
                                    </h1>
                                    <div className="flex items-center gap-2 text-muted-foreground font-medium mb-4">
                                        <Building2 size={18} />
                                        <span className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                                            {job.company_name}
                                            <CheckCircle2 size={14} className="text-blue-500 fill-blue-500/20" />
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Badges */}
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    <Badge variant="secondary" className="bg-aurora-cyan/10 text-aurora-cyan border-aurora-cyan/20 px-3 py-1 rounded-full">
                                        <Briefcase size={14} className="mr-1.5" />
                                        {job.job_type === 'full_time' ? 'Toàn thời gian' : 'Hợp đồng'}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-aurora-violet/10 text-aurora-violet border-aurora-violet/20 px-3 py-1 rounded-full">
                                        <Users size={14} className="mr-1.5" />
                                        {job.level.charAt(0).toUpperCase() + job.level.slice(1)}
                                    </Badge>
                                    {job.is_remote && (
                                        <Badge variant="secondary" className="bg-aurora-lime/10 text-aurora-lime border-aurora-lime/20 px-3 py-1 rounded-full">
                                            Remote
                                        </Badge>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* Actions */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col w-full md:w-auto gap-3"
                        >
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-8 font-bold text-lg shadow-lg glow-cyan transition-all active:scale-95 group"
                                onClick={onApply}
                            >
                                Ứng tuyển ngay
                                <Zap size={18} className="ml-2 group-hover:animate-pulse" />
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 glass border-white/20 hover:bg-white/10 dark:hover:bg-white/5 rounded-xl h-11" onClick={handleSave}>
                                    <Bookmark size={18} className="mr-2" />
                                    Lưu tin
                                </Button>
                                <Button variant="outline" size="icon" className="w-11 h-11 h glass border-white/20 hover:bg-white/10" onClick={handleShare}>
                                    <Share2 size={18} />
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-aurora-cyan/10 flex items-center justify-center text-aurora-cyan">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Mức lương</p>
                                <p className="font-bold">{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-aurora-violet/10 flex items-center justify-center text-aurora-violet">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Địa điểm</p>
                                <p className="font-bold truncate max-w-[150px]">{locations.map(l => l.province).join(", ")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-aurora-lime/10 flex items-center justify-center text-aurora-lime">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ngày đăng</p>
                                <p className="font-bold">Hôm nay</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-400/10 flex items-center justify-center text-red-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hạn nộp</p>
                                <p className="font-bold">Còn {diffDays} ngày</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
