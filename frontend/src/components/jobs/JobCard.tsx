import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchScoreRing } from "./MatchScoreRing";
import { MapPin, Clock, DollarSign, Heart, Users, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useStore";

interface JobCardProps {
    job: {
        id: string;
        title: string;
        company_name: string;
        logo_url: string;
        job_type: string;
        level: string;
        salary_min: number;
        salary_max: number;
        salary_currency: string;
        is_salary_visible: boolean;
        locations: string;
        is_remote: boolean;
        deadline?: string;
        created_at: string;
        is_featured: boolean;
        skills: string[];
        match_score: number;
        views_count?: number;
        applications_count?: number;
    };
    view: "grid" | "list";
}

export function JobCard({ job, view }: JobCardProps) {
    const { toggleSaveJob, isSaved } = useUIStore();
    const saved = isSaved(job.id);

    const formatSalary = (min: number, max: number) => {
        if (!job.is_salary_visible) return "Thỏa thuận";
        return `$${min.toLocaleString()} - ${max.toLocaleString()}`;
    };

    const getTimeAgo = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (diff < 60) return "vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return `${Math.floor(diff / 86400)} ngày trước`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={cn(
                "group relative overflow-hidden glass-card-tinted transition-all duration-300 shadow-xl hover:shadow-primary/10",
                view === "list" ? "flex flex-row items-center p-4 gap-6" : "p-0"
            )}>
                {/* Aurora Glow Effect on Hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />

                {job.is_featured && (
                    <div className="absolute top-0 right-0">
                        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg uppercase tracking-wider">
                            Featured
                        </div>
                    </div>
                )}

                {view === "grid" ? (
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-xl bg-white p-2 shadow-inner flex items-center justify-center overflow-hidden border border-white/20">
                                    <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{job.title}</h3>
                                    <p className="text-sm text-muted-foreground hover:underline cursor-pointer">{job.company_name}</p>
                                </div>
                            </div>
                            <MatchScoreRing score={job.match_score} size="md" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 transition-colors">
                                {job.job_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="border-white/20 bg-white/5">
                                {job.level}
                            </Badge>
                            {job.is_remote && (
                                <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                                    Remote
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="text-foreground/80">{job.locations}</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 py-1">
                            {job.skills.slice(0, 3).map(skill => (
                                <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                    {skill}
                                </span>
                            ))}
                            {job.skills.length > 3 && <span className="text-[10px] px-2 py-0.5 opacity-60">+{job.skills.length - 3}</span>}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-white/5">
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.applications_count} ứng tuyển</span>
                                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {job.views_count} xem</span>
                            </div>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeAgo(job.created_at)}</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button asChild className="flex-1 relative overflow-hidden bg-primary text-primary-foreground group/btn border-none shadow-lg shadow-primary/20 transition-all duration-500">
                                <motion.button
                                    whileHover={{
                                        scale: 1.03,
                                        boxShadow: "0 0 25px rgba(var(--primary), 0.5)"
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    className="relative z-10 w-full h-full flex items-center justify-center bg-primary"
                                >
                                    {/* Dynamic Background Gradient on Hover */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-primary to-violet-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                                    />

                                    <span className="relative z-20 font-black tracking-tight">Ứng tuyển ngay</span>

                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite]"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: '100%' }}
                                        transition={{ duration: 0.7 }}
                                    />
                                </motion.button>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn("border-white/10 bg-white/5 hover:bg-white/10 transition-colors", saved && "text-red-500")}
                                onClick={() => toggleSaveJob(job.id)}
                            >
                                <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                            </Button>
                        </div>
                    </CardContent>
                ) : (
                    /* List View Implementation */
                    <>
                        <div className="w-16 h-16 rounded-xl bg-white p-2 flex-shrink-0 flex items-center justify-center border border-white/20">
                            <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{job.title}</h3>
                                {job.is_featured && <Badge variant="secondary" className="text-[10px] h-4 bg-primary/20 text-primary border-primary/10">Featured</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground hover:underline cursor-pointer">{job.company_name}</span>
                                <span className="flex items-center gap-1 text-muted-foreground/80"><MapPin className="h-3 w-3 text-primary" /> {job.locations}</span>
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><DollarSign className="h-3 w-3" /> {formatSalary(job.salary_min, job.salary_max)}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                                {job.skills.slice(0, 4).map(skill => (
                                    <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-foreground/80">{skill}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pr-2">
                            <MatchScoreRing score={job.match_score} size="md" />
                            <div className="flex flex-col items-end gap-2 pr-4">
                                <Button asChild size="sm" className="w-32 relative overflow-hidden bg-primary text-primary-foreground group/btn border-none shadow-md shadow-primary/10 transition-all duration-500">
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05,
                                            boxShadow: "0 0 20px rgba(var(--primary), 0.4)"
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative z-10 w-full h-full flex items-center justify-center bg-primary"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-primary to-violet-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                                        />
                                        <span className="relative z-20 font-bold">Ứng tuyển</span>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                                            initial={{ x: '-100%' }}
                                            whileHover={{ x: '100%' }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </motion.button>
                                </Button>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8", saved && "text-red-500")}
                                        onClick={() => toggleSaveJob(job.id)}
                                    >
                                        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground uppercase">{getTimeAgo(job.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </motion.div>
    );
}
