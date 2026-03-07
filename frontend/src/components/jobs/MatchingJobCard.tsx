import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, Briefcase, Clock, ChevronRight, Sparkles } from "lucide-react";
import { JobMatch } from "@/types/matching";
import { JobMatchBadge } from "./JobMatchBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MatchingJobCardProps {
    match: JobMatch;
    index: number;
}

export function MatchingJobCard({ match, index }: MatchingJobCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

            <div className="relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-card/60 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Company Logo Section */}
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                            {match.company_logo ? (
                                <img src={match.company_logo} alt={match.company_name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={32} className="text-muted-foreground/50" />
                            )}
                        </div>
                    </div>

                    {/* Main Info Section */}
                    <div className="flex-grow space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <Link to={`/jobs/${match.job_id}`} className="block">
                                    <h3 className="text-xl font-bold hover:text-primary transition-colors line-clamp-1">
                                        {match.title}
                                    </h3>
                                </Link>
                                <div className="flex items-center gap-2 text-slate-500 font-semibold mt-1">
                                    <span>{match.company_name}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-sm">{match.location}</span>
                                </div>
                            </div>
                            <JobMatchBadge score={match.overall_score} className="scale-110" />
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-1 font-medium">
                            <div className="flex items-center gap-1.5">
                                <Briefcase size={16} className="text-primary/70" />
                                {match.job_type}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Sparkles size={16} className="text-blue-600" />
                                {match.level}
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                                {match.salary}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={16} className="text-slate-500" />
                                {new Date(match.posted_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {match.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 text-[10px] uppercase tracking-wider font-bold h-5">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-row md:flex-col justify-between md:justify-center items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
                        <Button asChild className="w-full md:w-32 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg glow-cyan cursor-pointer">
                            <Link to={`/jobs/${match.job_id}`}>Ứng tuyển</Link>
                        </Button>
                        <Button variant="ghost" asChild className="w-full md:w-32 hover:bg-slate-50 rounded-xl group/btn">
                            <Link to={`/jobs/${match.job_id}`} className="flex items-center justify-center gap-1 text-slate-700 font-bold">
                                Chi tiết
                                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* AI Insight Snippet */}
                {match.insights.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={12} className="text-primary" />
                        </div>
                        <p className="text-sm italic text-muted-foreground leading-relaxed">
                            <span className="text-primary font-semibold not-italic mr-1">AI Insight:</span>
                            "{match.insights[0].message}"
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
