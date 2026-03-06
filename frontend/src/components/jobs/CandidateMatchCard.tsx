import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CandidateMatch } from "@/types/matching";
import { MatchScoreRing } from "./MatchScoreRing";
import { MatchScoreBreakdown } from "./MatchScoreBreakdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Star, MapPin, Briefcase, BrainCircuit, ExternalLink, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateMatchCardProps {
    match: CandidateMatch;
}

export function CandidateMatchCard({ match }: CandidateMatchCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
            {/* Visual background treatment */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-accent to-transparent opacity-50" />

            <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Match Score & Basic Info */}
                    <div className="flex items-start gap-4 flex-1">
                        <MatchScoreRing score={match.overall_score} size="md" className="shrink-0" />

                        <div className="space-y-1 mt-1">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-primary/20">
                                    <AvatarImage src={match.avatar} />
                                    <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                        {match.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{match.headline}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                                    <MapPin className="h-3 w-3" />
                                    <span>{match.breakdown.location_match_score}% Near Location</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                                    <Briefcase className="h-3 w-3" />
                                    <span>{Math.floor(match.breakdown.experience_match_score / 10)}y Exp Match</span>
                                </div>
                                <Badge variant="outline" className={cn(
                                    "capitalize border-primary/20 bg-primary/5 hover:bg-primary/10",
                                    match.match_status === 'excellent' && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                                    match.match_status === 'good' && "text-blue-500 border-blue-500/20 bg-blue-500/5",
                                )}>
                                    {match.match_status} Match
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                        <Button size="sm" variant="outline" className="flex-1 lg:w-32 backdrop-blur-sm group-hover:bg-primary/5">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Profile
                        </Button>
                        <Button size="sm" className="flex-1 lg:w-32 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <Send className="mr-2 h-4 w-4" />
                            Invite
                        </Button>
                    </div>
                </div>

                {/* Short Insights List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                    {match.insights.slice(0, 2).map((insight, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors",
                                insight.type === 'strength' && "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                insight.type === 'weakness' && "bg-orange-500/5 border-orange-500/10 text-orange-600 dark:text-orange-400",
                                insight.type === 'info' && "bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400",
                            )}
                        >
                            <div className="p-1.5 rounded-full bg-background/50 shrink-0">
                                {insight.type === 'strength' && <Star className="h-3.5 w-3.5 fill-current" />}
                                {insight.type === 'weakness' && <BrainCircuit className="h-3.5 w-3.5" />}
                                {insight.type === 'info' && <BrainCircuit className="h-3.5 w-3.5" />}
                            </div>
                            <span className="line-clamp-1 font-medium italic">"{insight.message}"</span>
                        </div>
                    ))}
                </div>

                {/* Expand Details Trigger */}
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-primary h-8"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <>Hide AI Analysis <ChevronUp className="ml-2 h-3 w-3" /></>
                        ) : (
                            <>Show Detailed Match Analysis <ChevronDown className="ml-2 h-3 w-3" /></>
                        )}
                    </Button>
                </div>

                {/* Expanded Analysis */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="py-6 border-t border-border/30 mt-2">
                                <MatchScoreBreakdown breakdown={match.breakdown} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}
