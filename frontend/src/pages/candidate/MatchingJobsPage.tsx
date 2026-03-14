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
import { PageHeader } from "@/components/shared/PageHeader";

export default function MatchingJobsPage() {
    const { user } = useUserStore();
    const recruiterId = user?.id ?? 0;

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["matching-jobs", recruiterId],
        queryFn: () => matchingService.getMatchingJobs(recruiterId),
    });

    return (
        <div className="flex-1 flex flex-col w-full min-h-screen">
            <PageHeader
                title="Recommended for you"
                description="Hệ thống AI của JOBIO đã phân tích profile của bạn và tìm ra những công việc phù hợp nhất với kỹ năng và kinh nghiệm của bạn."
                icon={BrainCircuit}
            />

            <div className="p-6 lg:p-8 w-full flex-1 relative z-10">
                <div className="flex justify-end mb-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <Button variant="outline" className="rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm h-11 px-6">
                            <Filter size={18} className="mr-2" />
                            Lọc kết quả
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="rounded-xl h-11 w-11 hover:bg-slate-100"
                        >
                            <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
                        </Button>
                    </motion.div>
                </div>

                <Alert className="mb-8 bg-blue-50 border-blue-200 text-blue-900 rounded-2xl p-4 shadow-sm backdrop-blur-sm border-l-4 border-l-blue-500">
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
                            <div key={i} className="bg-white/50 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 h-48 animate-pulse">
                                <div className="flex gap-6">
                                    <Skeleton className="w-16 h-16 rounded-xl bg-slate-100" />
                                    <div className="flex-grow space-y-4">
                                        <Skeleton className="h-6 w-1/3 bg-slate-100" />
                                        <Skeleton className="h-4 w-1/4 bg-slate-100" />
                                        <Skeleton className="h-4 w-1/2 bg-slate-100" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (data as any)?.results && (data as any).results.length > 0 ? (
                        (data as any).results.map((match: any, index: number) => (
                            <MatchingJobCard key={match.id} match={match} index={index} />
                        ))
                    ) : (
                        <div className="text-center py-20 px-6 rounded-3xl bg-white/50 border border-dashed border-slate-200">
                            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900">Chưa tìm thấy kết quả phù hợp</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                Hãy thử cập nhật hồ sơ của bạn với nhiều kỹ năng và kinh nghiệm hơn để AI có thể gợi ý chính xác hơn.
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-20 p-10 rounded-3xl bg-gradient-to-br from-violet-50/50 via-white to-white border border-violet-100/50 text-center space-y-6 shadow-sm"
                >
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-violet-500 blur-3xl opacity-10 -z-10" />
                        <BrainCircuit size={48} className="mx-auto text-violet-600 mb-2" />
                    </div>
                    <h2 className="text-3xl font-black italic text-slate-900">Muốn điểm số cao hơn?</h2>
                    <p className="text-slate-600 text-lg mx-auto">
                        Profile của bạn đang ở mức hoàn thiện 75%. Hãy hoàn thành các bài test kỹ năng để chúng tôi chứng thực khả năng của bạn với nhà tuyển dụng.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" asChild className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl px-8 h-14 shadow-xl shadow-violet-500/20 cursor-pointer">
                            <Link to="/assessment-tests">Làm Skill Test ngay</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="rounded-2xl border-slate-200 bg-white px-8 h-14 hover:bg-slate-50 cursor-pointer">
                            <Link to="/candidate/profile">Chỉnh sửa Profile</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
