import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Heart, Users, Eye, Star, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedJobService } from "@/services/savedJobService";
import { toast } from "sonner";

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full-time", part_time: "Part-time", contract: "Contract",
    internship: "Thực tập", freelance: "Freelance",
};

const LEVEL_LABELS: Record<string, string> = {
    intern: "Intern", fresher: "Fresher", junior: "Junior", middle: "Middle",
    senior: "Senior", lead: "Lead", manager: "Manager", director: "Director",
};

interface JobCardProps {
    job: {
        id: number | string;
        title: string;
        company_name: string;
        company_slug?: string;
        logo_url?: string;
        job_type: string;
        level: string;
        salary_min?: number;
        salary_max?: number;
        salary_currency?: string;
        is_salary_visible?: boolean;
        locations?: string | { province_name?: string; city?: string }[];
        is_remote?: boolean;
        deadline?: string;
        created_at: string;
        is_featured?: boolean;
        skills?: string[] | { name: string }[];
        views_count?: number;
        applications_count?: number;
        // From API: saved status
        is_saved?: boolean;
        saved_job_id?: number;
        // Applied status
        has_applied?: boolean;
    };
    view: "grid" | "list";
}

export function JobCard({ job, view }: JobCardProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [optimisticSaved, setOptimisticSaved] = useState(job.is_saved ?? false);
    const [savedJobId, setSavedJobId] = useState(job.saved_job_id ?? null);

    const saveMutation = useMutation({
        mutationFn: () => savedJobService.save(Number(job.id)),
        onSuccess: (res) => {
            setSavedJobId(res.data.id);
            setOptimisticSaved(true);
            toast.success("Đã lưu việc làm");
            queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
        },
        onError: () => toast.error("Không thể lưu việc làm"),
    });

    const unsaveMutation = useMutation({
        mutationFn: () => savedJobId
            ? savedJobService.unsave(savedJobId)
            : savedJobService.unsaveByJob(Number(job.id)),
        onSuccess: () => {
            setOptimisticSaved(false);
            setSavedJobId(null);
            toast.success("Đã bỏ lưu");
            queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
        },
        onError: () => toast.error("Không thể bỏ lưu"),
    });

    const handleToggleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (optimisticSaved) { unsaveMutation.mutate(); } else { saveMutation.mutate(); }
    };

    const formatSalary = () => {
        if (!job.is_salary_visible) return "Thỏa thuận";
        const currency = job.salary_currency === "VND" ? "₫" : "$";
        const min = job.salary_min?.toLocaleString() ?? "0";
        const max = job.salary_max?.toLocaleString() ?? "0";
        return `${currency}${min} – ${currency}${max}`;
    };

    const getLocationText = () => {
        if (!job.locations) return "-";
        if (typeof job.locations === "string") return job.locations;
        if (Array.isArray(job.locations)) {
            return job.locations.map((l: any) => l.province_name ?? l.city ?? "").filter(Boolean).join(", ");
        }
        return "-";
    };

    const getSkills = (): string[] => {
        if (!job.skills) return [];
        return job.skills.map((s: any) => (typeof s === "string" ? s : s.name));
    };

    const getTimeAgo = (date: string) => {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (diff < 60) return "vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
        return `${Math.floor(diff / 2592000)} tháng trước`;
    };

    const getDeadlineDiff = (deadline?: string) => {
        if (!deadline) return null;
        const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
        if (diff < 0) return { label: "Hết hạn", urgent: true };
        if (diff === 0) return { label: "Hôm nay", urgent: true };
        if (diff <= 3) return { label: `Còn ${diff} ngày`, urgent: true };
        return { label: `Còn ${diff} ngày`, urgent: false };
    };

    const deadline = getDeadlineDiff(job.deadline);
    const skills = getSkills();
    const locationText = getLocationText();
    const isSaving = saveMutation.isPending || unsaveMutation.isPending;

    if (view === "list") {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="cursor-pointer group"
            >
                <div className={cn(
                    "bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4",
                    "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200",
                    job.is_featured && "border-l-4 border-l-primary"
                )}>
                    {/* Logo */}
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {job.logo_url
                            ? <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain p-1" />
                            : <span className="text-lg font-bold text-gray-400">{job.company_name?.[0]}</span>
                        }
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate text-sm md:text-base">
                                    {job.title}
                                </h3>
                                <p className="text-sm text-gray-500 truncate"
                                    onClick={e => { e.stopPropagation(); navigate(`/companies/${job.company_slug ?? job.id}`); }}>
                                    {job.company_name}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {job.is_featured && (
                                    <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] px-1.5">
                                        <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Nổi bật
                                    </Badge>
                                )}
                                {job.has_applied && (
                                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5">Đã ứng tuyển</Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                            <Badge variant="outline" className="text-[10px] h-5 border-gray-200 text-gray-600 font-normal">
                                {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 border-gray-200 text-gray-600 font-normal">
                                {LEVEL_LABELS[job.level] ?? job.level}
                            </Badge>
                            {job.is_remote && (
                                <Badge className="text-[10px] h-5 bg-cyan-50 text-cyan-700 border-cyan-200 font-normal">
                                    <Wifi className="w-2.5 h-2.5 mr-0.5" /> Remote
                                </Badge>
                            )}
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{locationText}</span>
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <DollarSign className="w-3 h-3" />{formatSalary()}
                            </span>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            className="h-8 px-4 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-lg hidden sm:flex"
                            onClick={e => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                        >
                            Ứng tuyển
                        </Button>
                        <Button
                            variant="ghost" size="icon"
                            className={cn("h-8 w-8 rounded-lg border border-gray-100 hover:bg-red-50", optimisticSaved && "text-red-500")}
                            onClick={handleToggleSave}
                            disabled={isSaving}
                        >
                            <Heart className={cn("h-3.5 w-3.5", optimisticSaved && "fill-current")} />
                        </Button>
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] text-gray-400">{getTimeAgo(job.created_at)}</p>
                            {deadline && (
                                <p className={cn("text-[10px] font-medium", deadline.urgent ? "text-red-500" : "text-gray-400")}>
                                    {deadline.label}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Grid view
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="cursor-pointer group"
        >
            <div className={cn(
                "bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200",
                job.is_featured && "border-t-2 border-t-primary"
            )}>
                {/* Featured banner */}
                {job.is_featured && (
                    <div className="absolute top-3 right-3">
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[10px] shadow-sm">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Nổi bật
                        </Badge>
                    </div>
                )}

                <div className="p-5 flex flex-col gap-3 flex-1 relative">
                    {/* Logo + company + save */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {job.logo_url
                                    ? <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain p-1" />
                                    : <span className="text-base font-bold text-gray-400">{job.company_name?.[0]}</span>
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-400 truncate hover:text-primary transition-colors cursor-pointer"
                                    onClick={e => { e.stopPropagation(); navigate(`/companies/${job.company_slug ?? job.id}`); }}>
                                    {job.company_name}
                                </p>
                                {job.has_applied && (
                                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] h-4 px-1.5 mt-0.5">
                                        Đã ứng tuyển
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost" size="icon"
                            className={cn("h-7 w-7 rounded-lg flex-shrink-0 border border-gray-100 hover:bg-red-50 hover:border-red-100",
                                optimisticSaved && "text-red-500 bg-red-50 border-red-100")}
                            onClick={handleToggleSave}
                            disabled={isSaving}
                        >
                            <Heart className={cn("h-3.5 w-3.5", optimisticSaved && "fill-current")} />
                        </Button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                        {job.title}
                    </h3>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-5 border-gray-200 text-gray-600 font-normal">
                            {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 border-gray-200 text-gray-600 font-normal">
                            {LEVEL_LABELS[job.level] ?? job.level}
                        </Badge>
                        {job.is_remote && (
                            <Badge className="text-[10px] h-5 bg-cyan-50 text-cyan-700 border-cyan-200 font-normal">
                                <Wifi className="w-2.5 h-2.5 mr-0.5" />Remote
                            </Badge>
                        )}
                    </div>

                    {/* Location + salary */}
                    <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{locationText}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="font-semibold text-emerald-600">{formatSalary()}</span>
                        </div>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {skills.slice(0, 4).map(s => (
                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                    {s}
                                </span>
                            ))}
                            {skills.length > 4 && (
                                <span className="text-[10px] px-2 py-0.5 text-gray-400">+{skills.length - 4}</span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex gap-3">
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />{job.applications_count ?? 0} ứng tuyển
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />{job.views_count ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{getTimeAgo(job.created_at)}
                            </span>
                            {deadline && (
                                <span className={cn("font-medium", deadline.urgent ? "text-red-500" : "text-gray-400")}>
                                    · {deadline.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* CTA bar */}
                <div className="px-5 pb-4">
                    <Button
                        className="w-full h-9 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-lg transition-colors"
                        onClick={e => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                    >
                        Ứng tuyển ngay
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
