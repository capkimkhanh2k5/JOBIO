import { useQuery } from "@tanstack/react-query";
import { matchingService } from "@/services/apiClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, ArrowUpRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export function TopMatchesWidget() {
    const { data: matches, isLoading } = useQuery({
        queryKey: ['top-matches-widget'],
        queryFn: () => matchingService.getTopMatches(5),
    });

    return (
        <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-xl group h-full">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <BrainCircuit className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-sm uppercase tracking-tight">AI Talent Pulse</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                    NEW MATCHES
                </Badge>
            </div>

            <div className="p-0">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {matches?.map((match, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 hover:bg-primary/5 transition-colors group/item"
                            >
                                <Link to={`/employer/jobs/${match.job_id}/matching`} className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate group-hover/item:text-primary transition-colors">
                                            {match.candidate_name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate uppercase tracking-tighter">
                                            Matching for: <span className="font-medium">{match.job_title}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-emerald-500">
                                                <TrendingUp className="h-3 w-3" />
                                                <span className="text-xs font-black">{match.overall_score}%</span>
                                            </div>
                                        </div>
                                        <div className="p-1.5 rounded-full bg-secondary/50 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                            <ArrowUpRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-border/50 bg-muted/20">
                <Link
                    to="/employer/jobs"
                    className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary text-center block w-full transition-colors"
                >
                    View all job matches
                </Link>
            </div>
        </Card>
    );
}
