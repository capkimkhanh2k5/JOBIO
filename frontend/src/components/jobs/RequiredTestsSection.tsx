import { motion } from 'framer-motion';
import { ClipboardList, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TestReq {
    id: string;
    title: string;
    type: string;
    difficulty: string;
    duration: number;
    is_mandatory: boolean;
    minimum_score: number;
}

interface RequiredTestsSectionProps {
    tests: TestReq[];
}

export const RequiredTestsSection = ({ tests }: RequiredTestsSectionProps) => {
    if (!tests || tests.length === 0) return null;

    return (
        <section className="glass-card-tinted rounded-[32px] p-8 md:p-10 border-white/20 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <ClipboardList size={22} />
                </div>
                <h3 className="text-xl font-bold">Bài đánh giá yêu cầu</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests.map((test, index) => (
                    <motion.div
                        key={test.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all bg-gradient-to-br from-white/5 to-transparent"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-foreground mb-1">{test.title}</h4>
                                <p className="text-xs text-muted-foreground">{test.type} • {test.difficulty}</p>
                            </div>
                            {test.is_mandatory && (
                                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] uppercase">Bắt buộc</Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-6 mt-auto pt-3 border-t border-white/5 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock size={14} className="text-muted-foreground/50" />
                                <span>{test.duration} phút</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <ShieldCheck size={14} className="text-muted-foreground/50" />
                                <span>Yêu cầu: <span className="text-foreground font-bold">{test.minimum_score}%</span></span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-500/80 leading-relaxed">
                    Bạn cần hoàn thành các bài đánh giá trên sau khi nộp đơn ứng tuyển để nhà tuyển dụng có thể xem xét hồ sơ của bạn một cách đầy đủ nhất.
                </p>
            </div>
        </section>
    );
};
