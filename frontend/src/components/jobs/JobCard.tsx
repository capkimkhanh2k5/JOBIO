import { useState, type MouseEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Briefcase,
    CalendarDays,
    CheckCircle2,
    Clock,
    DollarSign,
    Eye,
    Heart,
    MapPin,
    Star,
    Target,
    Users,
    Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savedJobService } from "@/services/savedJobService";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { showCandidateOnlyFeatureWarning } from "@/lib/candidateOnlyFeature";

const JOB_TYPE_LABELS: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    full_time: "Full-time",
    part_time: "Part-time",
    contract: "Contract",
    internship: "Thực tập",
    freelance: "Freelance",
};

const LEVEL_LABELS: Record<string, string> = {
    intern: "Intern",
    fresher: "Fresher",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    lead: "Lead",
    manager: "Manager",
    director: "Director",
};

const SALARY_TYPE_LABELS: Record<string, string> = {
    monthly: "/tháng",
    yearly: "/năm",
    hourly: "/giờ",
    project: "/dự án",
};

type JobSkillItem =
    | string
    | {
        name?: string;
        skill_name?: string;
        skill?: { name?: string };
        is_required?: boolean;
        years_required?: number | null;
    };

interface JobCardProps {
    job: {
        id: number | string;
        title: string;
        slug?: string;
        company?: {
            id?: number | string;
            slug?: string;
            company_name?: string;
            name?: string;
            logo_url?: string | null;
        };
        company_id?: number | string;
        company_name?: string;
        company_slug?: string;
        company_logo?: string | null;
        logo_url?: string | null;
        category_name?: string | null;
        job_type: string;
        level: string;
        experience_years_min?: number | string | null;
        experience_years_max?: number | string | null;
        salary_min?: number | string | null;
        salary_max?: number | string | null;
        salary_currency?: string;
        salary_type?: string;
        is_salary_visible?: boolean;
        is_salary_negotiable?: boolean;
        salary_negotiable?: boolean;
        number_of_positions?: number | string | null;
        description?: string | null;
        requirements?: string | null;
        benefits?: string | null;
        location?: string;
        locations?: string | { province_name?: string; city?: string }[];
        is_remote?: boolean;
        deadline?: string | null;
        application_deadline?: string | null;
        created_at?: string;
        published_at?: string | null;
        status?: string;
        is_expired?: boolean;
        featured?: boolean;
        is_featured?: boolean;
        skills?: JobSkillItem[];
        views_count?: number;
        view_count?: number;
        applications_count?: number;
        application_count?: number;
        is_saved?: boolean;
        saved_job_id?: number;
        has_applied?: boolean;
    };
    view: "grid" | "list";
}

export function JobCard({ job, view }: JobCardProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useUserStore();
    const [optimisticSaved, setOptimisticSaved] = useState(job.is_saved ?? false);
    const [savedJobId, setSavedJobId] = useState<number | null>(job.saved_job_id ?? null);
    const isAdminViewer = user?.role === "admin";
    const isCompanyViewer = user?.role === "company";

    const companyName = job.company_name ?? job.company?.company_name ?? job.company?.name ?? "Công ty";
    const companyTarget = job.company_slug ?? job.company?.slug ?? job.company_id ?? job.company?.id;
    const logoUrl = job.logo_url ?? job.company_logo ?? job.company?.logo_url;
    const deadlineDate = job.application_deadline ?? job.deadline ?? null;
    const isFeatured = job.is_featured ?? job.featured ?? false;
    const viewCount = job.views_count ?? job.view_count ?? 0;
    const applicationCount = job.applications_count ?? job.application_count ?? 0;
    const salaryText = formatSalary(job);
    const deadline = getDeadlineDiff(deadlineDate);
    const isExpired =
        job.is_expired === true || job.status === "expired" || deadline?.expired === true;
    const skills = getSkills(job.skills);
    const locationText = getLocationText(job);
    const experienceText = getExperienceText(job);
    const positionsText = getPositionsText(job.number_of_positions);
    const categoryText = job.category_name ?? "Chưa phân loại";
    const summary = getShortText(job.description, 180);
    const benefitsSummary = getShortText(job.benefits, 120);
    const requirementSummary = getShortText(job.requirements, benefitsSummary ? 140 : 280);
    const hasBothDetailSummaries = Boolean(requirementSummary && benefitsSummary);
    const postedAt = job.published_at ?? job.created_at;

    const saveMutation = useMutation({
        mutationFn: () => savedJobService.save(Number(job.id)),
        onSuccess: (res) => {
            setSavedJobId(res.data.id);
            setOptimisticSaved(true);
            toast.success("Đã lưu việc làm");
            queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
            queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["candidate", "saved-jobs"] });
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
            queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
            queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["candidate", "saved-jobs"] });
        },
        onError: () => toast.error("Không thể bỏ lưu"),
    });

    const handleToggleSave = (e: MouseEvent) => {
        e.stopPropagation();
        if (isCompanyViewer) {
            showCandidateOnlyFeatureWarning("Lưu việc làm");
            return;
        }
        if (isAdminViewer) {
            toast.info("Admin chỉ xem nội dung, không thể lưu việc làm");
            return;
        }
        if (!user) {
            toast.error("Vui lòng đăng nhập để lưu việc làm");
            return;
        }
        if (optimisticSaved) {
            unsaveMutation.mutate();
        } else {
            saveMutation.mutate();
        }
    };

    const handleCompanyClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (companyTarget) navigate(`/companies/${companyTarget}`);
    };

    const isSaving = saveMutation.isPending || unsaveMutation.isPending;
    const handleApplyClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (isCompanyViewer) {
            showCandidateOnlyFeatureWarning("Ứng tuyển việc làm");
            return;
        }
        if (!isAdminViewer && !isExpired) navigate(`/jobs/${job.id}`);
    };

    if (view === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="cursor-pointer group"
            >
                <div className={cn(
                    "relative bg-card border border-border rounded-xl p-5 sm:p-6",
                    "hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200",
                    isFeatured && !isExpired && "border-l-4 border-l-primary",
                    isExpired && "border-l-4 border-l-rose-300 bg-rose-50/30"
                )}>
                    <div className="flex flex-col xl:flex-row gap-5">
                        <div className="flex min-w-0 flex-1 gap-4">
                            <div className="w-14 h-14 rounded-xl bg-muted border border-border/60 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {logoUrl
                                    ? <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1.5" />
                                    : <span className="text-xl font-bold text-muted-foreground/60">{companyName?.[0]}</span>
                                }
                            </div>

                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base sm:text-lg leading-snug line-clamp-2">
                                            {job.title}
                                        </h3>
                                        <button
                                            className="mt-1 text-sm text-muted-foreground hover:text-primary transition-colors truncate max-w-full"
                                            onClick={handleCompanyClick}
                                        >
                                            {companyName}
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end shrink-0">
                                        {isExpired && (
                                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] px-2">
                                                <CalendarDays className="w-3 h-3 mr-1" /> Đã hết hạn
                                            </Badge>
                                        )}
                                        {isFeatured && !isExpired && (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] px-2">
                                                <Star className="w-3 h-3 mr-1 fill-current" /> Nổi bật
                                            </Badge>
                                        )}
                                        {job.has_applied && (
                                            <Badge className="bg-green-50 text-green-700 border-green-200 text-[11px] px-2">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Đã ứng tuyển
                                            </Badge>
                                        )}
                                        {job.is_remote && (
                                            <Badge className="bg-teal-50 text-cyan-700 border-teal-200 text-[11px] px-2">
                                                <Wifi className="w-3 h-3 mr-1" /> Remote
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                                    <MetaPill icon={<DollarSign className="w-4 h-4 text-emerald-500" />} label="Lương" value={salaryText} strong />
                                    <MetaPill icon={<MapPin className="w-4 h-4 text-muted-foreground/60" />} label="Địa điểm" value={locationText} />
                                    <MetaPill icon={<Target className="w-4 h-4 text-teal-500" />} label="Kinh nghiệm" value={experienceText} />
                                    <MetaPill icon={<Users className="w-4 h-4 text-teal-500" />} label="Tuyển" value={positionsText} />
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    <Badge variant="outline" className="text-[11px] h-6 border-border text-muted-foreground font-medium">
                                        {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] h-6 border-border text-muted-foreground font-medium">
                                        {LEVEL_LABELS[job.level] ?? job.level}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] h-6 border-border text-muted-foreground font-medium">
                                        {categoryText}
                                    </Badge>
                                    {skills.slice(0, 5).map(skill => (
                                        <span key={skill} className="h-6 inline-flex items-center rounded-full bg-muted px-2.5 text-[11px] font-medium text-muted-foreground border border-border">
                                            {skill}
                                        </span>
                                    ))}
                                    {skills.length > 5 && (
                                        <span className="h-6 inline-flex items-center px-1.5 text-[11px] text-muted-foreground/60">
                                            +{skills.length - 5}
                                        </span>
                                    )}
                                </div>

                                {(requirementSummary || benefitsSummary) && (
                                    <div className={cn(
                                        "grid grid-cols-1 gap-2 text-xs text-muted-foreground",
                                        hasBothDetailSummaries && "lg:grid-cols-2"
                                    )}>
                                        {requirementSummary && (
                                            <p className={cn(hasBothDetailSummaries ? "line-clamp-2" : "line-clamp-3")}>
                                                <span className="font-semibold text-foreground/80">Yêu cầu: </span>{requirementSummary}
                                            </p>
                                        )}
                                        {benefitsSummary && (
                                            <p className={cn(hasBothDetailSummaries ? "line-clamp-2" : "line-clamp-3")}>
                                                <span className="font-semibold text-foreground/80">Quyền lợi: </span>{benefitsSummary}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="xl:w-60 xl:border-l xl:border-border/60 xl:pl-5 flex flex-col gap-4 xl:items-stretch">
                            <div className="grid grid-cols-2 xl:grid-cols-1 gap-x-4 gap-y-2.5 text-sm text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                                    <span>{getTimeAgo(postedAt)}</span>
                                </span>
                                {deadline && (
                                    <span className={cn(
                                        "flex items-center gap-2 font-medium",
                                        deadline.urgent ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                        <CalendarDays className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                                        <span>{deadline.label}</span>
                                    </span>
                                )}
                                <span className="flex items-center gap-2">
                                    <Users className="w-4 h-4 shrink-0 text-teal-500" />
                                    <span>{applicationCount} ứng tuyển</span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 shrink-0 text-teal-500" />
                                    <span>{viewCount} lượt xem</span>
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 font-semibold text-sm rounded-lg"
                                    onClick={handleApplyClick}
                                    disabled={isAdminViewer || isExpired}
                                    title={
                                        isExpired
                                            ? "Việc làm đã hết hạn"
                                            : isAdminViewer
                                                ? "Admin chỉ xem nội dung, không thể ứng tuyển"
                                                : undefined
                                    }
                                >
                                    {isExpired ? "Đã hết hạn" : "Ứng tuyển ngay"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-11 w-11 rounded-lg border border-border/60 hover:bg-red-50 hover:border-red-100",
                                        optimisticSaved && "text-red-500 bg-red-50 border-red-100"
                                    )}
                                    onClick={handleToggleSave}
                                    disabled={isSaving || isAdminViewer}
                                    title={isAdminViewer ? "Admin chỉ xem nội dung, không thể lưu việc làm" : undefined}
                                    aria-label={optimisticSaved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                                >
                                    <Heart className={cn("h-4 w-4", optimisticSaved && "fill-current")} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="cursor-pointer group"
        >
            <div className={cn(
                "relative bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200",
                isFeatured && !isExpired && "border-t-2 border-t-primary",
                isExpired && "border-t-2 border-t-rose-300 bg-rose-50/30"
            )}>
                {isFeatured && !isExpired && (
                    <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[10px] shadow-sm">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-current" /> Nổi bật
                        </Badge>
                    </div>
                )}

                <div className="p-4 flex flex-col gap-2.5 flex-1">
                    <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-muted/80 border border-border/60 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {logoUrl
                                    ? <img src={logoUrl} alt={companyName} className="w-full h-full object-contain p-1" />
                                    : <span className="text-sm font-bold text-muted-foreground/60">{companyName?.[0]}</span>
                                }
                            </div>
                            <div className="min-w-0">
                                <button
                                    className="text-xs font-medium text-muted-foreground/80 truncate hover:text-teal-600 transition-colors cursor-pointer block max-w-full"
                                    onClick={handleCompanyClick}
                                >
                                    {companyName}
                                </button>
                                {job.has_applied && (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] h-4 px-1.5 mt-0.5 font-semibold">
                                        Đã ứng tuyển
                                    </Badge>
                                )}
                                {isExpired && (
                                    <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[10px] h-4 px-1.5 mt-0.5 font-semibold">
                                        Đã hết hạn
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-lg flex-shrink-0 border border-border/60 hover:bg-rose-50 hover:border-rose-100 dark:hover:bg-rose-950/20",
                                optimisticSaved && "text-rose-500 bg-rose-50 border-rose-200"
                            )}
                            onClick={handleToggleSave}
                            disabled={isSaving || isAdminViewer}
                            title={isAdminViewer ? "Admin chỉ xem nội dung, không thể lưu việc làm" : undefined}
                            aria-label={optimisticSaved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                        >
                            <Heart className={cn("h-3.5 w-3.5", optimisticSaved && "fill-current")} />
                        </Button>
                    </div>

                    <h3 className="font-bold text-foreground group-hover:text-teal-600 transition-colors line-clamp-2 text-sm leading-snug">
                        {job.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-5 border-border/70 text-muted-foreground font-medium px-2 bg-muted/30">
                            {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-5 border-border/70 text-muted-foreground font-medium px-2 bg-muted/30">
                            {LEVEL_LABELS[job.level] ?? job.level}
                        </Badge>
                        {job.is_remote && (
                            <Badge className="text-[10px] h-5 bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 font-medium px-2">
                                <Wifi className="w-2.5 h-2.5 mr-1" />Remote
                            </Badge>
                        )}
                    </div>

                    {/* Compact Meta Grid (2 columns for maximum space efficiency) */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-muted-foreground bg-muted/40 rounded-xl p-2.5 border border-border/50">
                        <div className="flex items-center gap-1.5 min-w-0" title={locationText}>
                            <MapPin className="w-3.5 h-3.5 text-teal-600/70 shrink-0" />
                            <span className="truncate text-foreground/80">{locationText}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0" title={salaryText}>
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-bold text-emerald-600 truncate">{salaryText}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0" title={experienceText}>
                            <Briefcase className="w-3.5 h-3.5 text-teal-600/70 shrink-0" />
                            <span className="truncate text-foreground/80">{experienceText}</span>
                        </div>
                        {positionsText && (
                            <div className="flex items-center gap-1.5 min-w-0" title={positionsText}>
                                <Users className="w-3.5 h-3.5 text-teal-600/70 shrink-0" />
                                <span className="truncate text-foreground/80">{positionsText}</span>
                            </div>
                        )}
                    </div>

                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {skills.slice(0, 3).map(skill => (
                                <span key={skill} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 font-medium">
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground/60 font-medium">+{skills.length - 3}</span>
                            )}
                        </div>
                    )}

                    <div className="mt-auto pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground/70">
                        <div className="flex gap-2.5">
                            <span className="flex items-center gap-1" title="Lượt ứng tuyển">
                                <Users className="h-3 w-3 text-muted-foreground/50" />{applicationCount} ứng tuyển
                            </span>
                            <span className="flex items-center gap-1" title="Lượt xem">
                                <Eye className="h-3 w-3 text-muted-foreground/50" />{viewCount}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-right font-medium">
                            <Clock className="h-3 w-3 text-muted-foreground/50" />
                            <span>{getTimeAgo(postedAt)}</span>
                            {deadline && (
                                <span className={cn(deadline.urgent ? "text-rose-600 font-bold" : "text-muted-foreground/70")}>
                                    · {deadline.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-3.5">
                    <Button
                        className="w-full h-9 bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-bold text-xs rounded-xl transition-all active:scale-[0.99]"
                        onClick={handleApplyClick}
                        disabled={isAdminViewer || isExpired}
                        title={
                            isExpired
                                ? "Việc làm đã hết hạn"
                                : isAdminViewer
                                    ? "Admin chỉ xem nội dung, không thể ứng tuyển"
                                    : undefined
                        }
                    >
                        {isExpired ? "Đã hết hạn" : "Ứng tuyển ngay"}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

function MetaPill({
    icon,
    label,
    value,
    strong,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="min-w-0 rounded-lg bg-muted border border-border/60 px-3 py-2 flex items-center gap-2">
            <span className="shrink-0">{icon}</span>
            <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/60 font-semibold">{label}</span>
                <span className={cn("block truncate text-xs text-foreground/80", strong && "font-bold text-emerald-600")}>{value}</span>
            </span>
        </div>
    );
}

function formatSalary(job: JobCardProps["job"]) {
    const min = toNumber(job.salary_min);
    const max = toNumber(job.salary_max);
    const hasVisibleFlag = typeof job.is_salary_visible === "boolean";
    const isNegotiable = job.is_salary_negotiable ?? job.salary_negotiable ?? (hasVisibleFlag ? !job.is_salary_visible : false);

    if (isNegotiable || (min === null && max === null)) return "Thỏa thuận";

    const currency = job.salary_currency ?? "VND";
    const suffix = job.salary_type ? ` ${SALARY_TYPE_LABELS[job.salary_type] ?? ""}` : "";
    const formatAmount = (value: number) => {
        if (currency === "VND" && value >= 1_000_000) {
            const million = value / 1_000_000;
            return `${Number.isInteger(million) ? million : million.toFixed(1)} triệu`;
        }
        return `${value.toLocaleString("vi-VN")} ${currency}`;
    };

    if (min !== null && max !== null) {
        if (min === max) return `${formatAmount(min)}${suffix}`;
        return `${formatAmount(min)} - ${formatAmount(max)}${suffix}`;
    }
    if (min !== null) return `Từ ${formatAmount(min)}${suffix}`;
    return `Đến ${formatAmount(max as number)}${suffix}`;
}

function getLocationText(job: JobCardProps["job"]) {
    if (job.location) return job.location;
    if (!job.locations) return "Toàn quốc";
    if (typeof job.locations === "string") return job.locations;
    if (Array.isArray(job.locations)) {
        const text = job.locations
            .map(location => location.province_name ?? location.city ?? "")
            .filter(Boolean)
            .join(", ");
        return text || "Toàn quốc";
    }
    return "Toàn quốc";
}

function getSkills(skills?: JobSkillItem[]) {
    if (!skills) return [];
    return skills
        .map(skill => {
            if (typeof skill === "string") return skill;
            return skill.name ?? skill.skill_name ?? skill.skill?.name ?? "";
        })
        .filter(Boolean);
}

function getExperienceText(job: JobCardProps["job"]) {
    const min = toNumber(job.experience_years_min);
    const max = toNumber(job.experience_years_max);

    if ((min === null || min === 0) && max === null) return "Không yêu cầu";
    if ((min === null || min === 0) && max !== null) return `Tối đa ${max} năm`;
    if (min !== null && max !== null) {
        if (min === max) return `${min} năm`;
        return `${min} - ${max} năm`;
    }
    return `Từ ${min} năm`;
}

function getPositionsText(value?: number | string | null) {
    const count = toNumber(value);
    if (!count || count <= 0) return "Không giới hạn";
    return `${count} vị trí`;
}

function getTimeAgo(date?: string | null) {
    if (!date) return "vừa xong";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (isNaN(diff)) return "";
    if (diff < 60) return "vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return `${Math.floor(diff / 2592000)} tháng trước`;
}

function getDeadlineDiff(deadline?: string | null) {
    if (!deadline) return null;
    const target = parseDateOnly(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (isNaN(diff)) return null;
    if (diff < 0) return { label: "Hết hạn", urgent: true, expired: true };
    if (diff === 0) return { label: "Hôm nay", urgent: true };
    if (diff <= 3) return { label: `Còn ${diff} ngày`, urgent: true };
    return { label: `Còn ${diff} ngày`, urgent: false };
}

function parseDateOnly(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return new Date(value);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getShortText(value?: string | null, limit = 140) {
    const text = value
        ?.replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!text) return "";
    return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

function toNumber(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
