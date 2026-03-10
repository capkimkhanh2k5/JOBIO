import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, Filter, RefreshCw, Info } from "lucide-react";
import { matchingService } from "@/services/matchingService";
import { useUserStore } from "@/store/userStore";
import { MatchingJobCard } from "@/components/jobs/MatchingJobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function MatchingJobsPage() {
    const { user } = useUserStore();
    const recruiterId = user?.id ?? 0;

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["matching-jobs", recruiterId],
        queryFn: () => matchingService.getMatchingJobs(recruiterId),
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
            {/* Aurora Background Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/20 blur-[120px] -z-10 rounded-full opacity-50 pointer-events-none" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div className="space-y-3">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest"
                    >
                        <BrainCircuit size={14} />
                        AI-Powered Matching
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black tracking-tight"
                    >
                        Recommended <span className="text-primary italic">for you</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg max-w-2xl"
                    >
                        Hệ thống AI của JOBIO đã phân tích profile của bạn và tìm ra những công việc phù hợp nhất với kỹ năng và kinh nghiệm của bạn.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                >
                    <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-11 px-6">
                        <Filter size={18} className="mr-2" />
                        Lọc kết quả
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="rounded-xl h-11 w-11 hover:bg-white/5"
                    >
                        <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
                    </Button>
                </motion.div>
            </div>

            <Alert className="mb-8 bg-blue-50 border-blue-200 text-blue-900 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertTitle className="font-bold flex items-center gap-2 text-blue-900">
                    Mẹo tăng điểm phù hợp
                </AlertTitle>
                <AlertDescription className="text-blue-800 font-medium">
                    Cập nhật thêm kỹ năng <span className="font-bold text-blue-600 underline">Node.js</span> và <span className="font-bold text-blue-600 underline">AWS</span> vào hồ sơ để tăng khả năng match với các job Senior.
                </AlertDescription>
            </Alert>

            {/* Results List */}
            <div className="space-y-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-48 animate-pulse">
                            <div className="flex gap-6">
                                <Skeleton className="w-16 h-16 rounded-xl bg-white/5" />
                                <div className="flex-grow space-y-4">
                                    <Skeleton className="h-6 w-1/3 bg-white/5" />
                                    <Skeleton className="h-4 w-1/4 bg-white/5" />
                                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : data?.results && data.results.length > 0 ? (
                    data.results.map((match, index) => (
                        <MatchingJobCard key={match.id} match={match} index={index} />
                    ))
                ) : (
                    <div className="text-center py-20 px-6 rounded-3xl bg-white/5 border border-dashed border-white/10">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                            <Sparkles size={32} className="text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Chưa tìm thấy kết quả phù hợp</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Hãy thử cập nhật hồ sơ của bạn với nhiều kỹ năng và kinh nghiệm hơn để AI có thể gợi ý chính xác hơn.
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="mt-20 p-10 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 text-center space-y-6"
            >
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary blur-3xl opacity-20 -z-10" />
                    <BrainCircuit size={48} className="mx-auto text-primary mb-2" />
                </div>
                <h2 className="text-3xl font-black italic">Muốn điểm số cao hơn?</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Profile của bạn đang ở mức hoàn thiện 75%. Hãy hoàn thành các bài test kỹ năng để chúng tôi chứng thực khả năng của bạn với nhà tuyển dụng.
                </p>
                <div className="flex justify-center gap-4">
                    <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl px-8 h-14 shadow-xl glow-cyan cursor-pointer">
                        <Link to="/assessment-tests">Làm Skill Test ngay</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="rounded-2xl border-slate-200 bg-white/5 px-8 h-14 hover:bg-slate-50 cursor-pointer">
                        <Link to="/candidate/profile">Chỉnh sửa Profile</Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
