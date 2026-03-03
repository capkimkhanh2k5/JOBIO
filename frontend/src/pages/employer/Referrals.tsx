import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Gift, Plus } from 'lucide-react';
// No backend endpoint for referral programs yet
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReferralList } from '@/components/employer/referrals/ReferralList';
import { CreateReferralModal } from '@/components/employer/referrals/CreateReferralModal';

export default function EmployerReferrals() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: programs, isLoading: isLoadingPrograms } = useQuery({
        queryKey: ['referral-programs'],
        queryFn: () => Promise.resolve([]),
    });

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground mb-2 flex items-center gap-3">
                        <Gift className="w-8 h-8 text-cyan-500" />
                        Quản lý Giới thiệu (Referrals)
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-2xl">
                        Giới thiệu nhân tài và nhận thưởng hấp dẫn. Theo dõi trạng thái ứng viên bạn đã giới thiệu.
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25 shrink-0"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Giới thiệu ứng viên
                </Button>
            </div>

            {/* Programs Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">Chương trình thưởng hiện tại</h2>
                {isLoadingPrograms ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {programs?.map((prog: any, i: number) => (
                            <motion.div
                                key={prog.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-5 rounded-2xl bg-white/2 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/5 transition-colors"
                            >
                                <div>
                                    <h3 className="font-semibold text-foreground">{prog.title}</h3>
                                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mt-2">
                                        ${prog.bonus}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{prog.active_referrals} đang chờ</span>
                                    <span>{prog.successful_hires} đã tuyển</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Referral List */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">Danh sách Giới thiệu</h2>
                <ReferralList />
            </section>

            {/* Create Modal */}
            <CreateReferralModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
