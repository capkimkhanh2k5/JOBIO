import { motion } from "framer-motion";
import { AIInsightsResponse } from "@/types/matching";
import { BrainCircuit, Lightbulb, CheckCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MatchInsightsProps {
    insights: AIInsightsResponse;
    className?: string;
}

export function MatchInsights({ insights, className }: MatchInsightsProps) {
    return (
        <Card className={cn("overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-md relative", className)}>
            {/* Decorative Aurora background inside the insights card */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="p-8 relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-primary">AI Match Insights</h3>
                        <p className="text-sm text-muted-foreground">Generated analysis based on job DNA vs candidate profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Summary Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 rounded-2xl bg-background/50 border border-border/50 backdrop-blur-sm shadow-sm">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-accent" />
                                Brief Summary
                            </h4>
                            <p className="text-foreground/90 leading-relaxed italic">
                                "{insights.summary}"
                            </p>
                        </div>
                    </div>

                    {/* Highlights Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Key Highlights</h4>
                        <div className="space-y-3">
                            {insights.key_highlights.map((highlight, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/30 hover:border-primary/30 transition-colors"
                                >
                                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-sm">{highlight}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendation Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Next Steps</h4>
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/5">
                            <p className="text-sm font-medium text-primary mb-4 leading-relaxed">
                                {insights.recommendation}
                            </p>
                            <div className="flex justify-end">
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary cursor-pointer"
                                >
                                    View full analysis <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
