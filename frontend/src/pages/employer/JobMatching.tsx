import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchingService } from "@/services/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
    BrainCircuit,
    RefreshCw,
    ChevronLeft,
    Filter,
    Search,
    Sparkles,
    Zap,
    LayoutGrid,
    List as ListIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateMatchCard } from "@/components/jobs/CandidateMatchCard";
import { MatchInsights } from "@/components/jobs/MatchInsights";
import { toast } from "sonner"; // Assuming sonner is used for notifications
import { cn } from "@/lib/utils";

export default function JobMatching() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const { data: candidates, isLoading: isCandidatesLoading } = useQuery({
        queryKey: ['matching-candidates', id],
        queryFn: () => matchingService.getMatchingCandidates(id!),
        enabled: !!id,
    });

    const { data: insights, isLoading: isInsightsLoading } = useQuery({
        queryKey: ['match-insights', id],
        queryFn: () => matchingService.getMatchInsights(id!, 'current-recruiter'),
        enabled: !!id,
    });

    const refreshMutation = useMutation({
        mutationFn: () => matchingService.refreshScores(),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['matching-candidates', id] });
            toast.success(`Successfully refreshed ${data.refreshed_count} candidate scores!`);
        },
        onError: () => {
            toast.error("Failed to refresh matching scores. Please try again.");
        }
    });

    const filteredCandidates = candidates?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.headline.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-background border-b border-border/50 px-6 py-10 lg:px-12">
                {/* Aurora Drift Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -ml-48 -mb-48 opacity-50" />

                <div className="relative z-10 max-w-7xl mx-auto">
                    <Link
                        to="/employer/jobs"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors group"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Jobs
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                                    <BrainCircuit className="h-8 w-8" />
                                </div>
                                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold tracking-tighter uppercase px-2 py-0.5">
                                    AI Talent Matching
                                </Badge>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                                Candidates for <span className="text-primary italic">"Senior React Developer"</span>
                            </h1>
                            <p className="text-muted-foreground max-w-2xl">
                                Our AI engine has analyzed your job requirements against thousands of candidate profiles to find the most accurate matches based on skills, experience, and cultural fit.
                            </p>
                        </div>

                        <Button
                            onClick={() => refreshMutation.mutate()}
                            disabled={refreshMutation.isPending}
                            className="relative group bg-foreground text-background hover:bg-foreground/90 overflow-hidden px-6 h-12 rounded-xl"
                        >
                            <AnimatePresence mode="wait">
                                {refreshMutation.isPending ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>Recalculating...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ready"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <Zap className="h-4 w-4 fill-current text-primary" />
                                        <span>Refresh AI Scores</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Shimmer effect for premium button */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12 space-y-12">
                {/* Insights Section */}
                <section>
                    {isInsightsLoading ? (
                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                    ) : (
                        insights && <MatchInsights insights={insights} />
                    )}
                </section>

                {/* Filter & Results Section */}
                <section className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search matching candidates..."
                                className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="w-auto">
                                <TabsList className="bg-background/50 border border-border/50 h-10 p-1">
                                    <TabsTrigger value="list" className="h-8 w-8 p-0 rounded-md">
                                        <ListIcon className="h-4 w-4" />
                                    </TabsTrigger>
                                    <TabsTrigger value="grid" className="h-8 w-8 p-0 rounded-md">
                                        <LayoutGrid className="h-4 w-4" />
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <Button variant="outline" size="sm" className="h-10 rounded-xl px-4 gap-2 border-border/50 bg-background/50">
                                <Filter className="h-4 w-4" />
                                Score: High to Low
                            </Button>

                            <div className="h-6 w-px bg-border/50 mx-2 hidden md:block" />

                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:block">
                                Showing <span className="text-foreground">{filteredCandidates?.length || 0}</span> Results
                            </p>
                        </div>
                    </div>

                    {/* Results Grid/List */}
                    <div className={cn(
                        "grid gap-6",
                        viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                    )}>
                        {isCandidatesLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
                            ))
                        ) : filteredCandidates && filteredCandidates.length > 0 ? (
                            filteredCandidates.map((candidate, i) => (
                                <motion.div
                                    key={candidate.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <CandidateMatchCard match={candidate} />
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-muted/30 text-muted-foreground">
                                    <Sparkles className="h-12 w-12 opacity-20" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold">No High Matches Found</h3>
                                    <p className="text-muted-foreground max-w-xs">
                                        Try adjusting your search or refresh to calculate scores for new applicants.
                                    </p>
                                </div>
                                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchQuery("")}>
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
