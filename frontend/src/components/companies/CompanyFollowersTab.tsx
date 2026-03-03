import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { companyService } from '@/services/companyService';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCircle } from 'lucide-react';

interface Props {
    companyId: string;
}

export function CompanyFollowersTab({ companyId }: Props) {
    const { data: followers, isLoading } = useQuery({
        queryKey: ['company-followers', companyId],
        queryFn: () => companyService.listFollowers(Number(companyId)).then(r => r.data),
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />
                ))}
            </div>
        );
    }

    if (!followers || followers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground mb-4">
                    <Users size={28} />
                </div>
                <p className="font-medium text-muted-foreground">Chưa có người theo dõi</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {followers.length} người theo dõi
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {followers.map((follower: any, i: number) => (
                    <motion.div
                        key={follower.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        {follower.avatar_url ? (
                            <img
                                src={follower.avatar_url}
                                alt={follower.full_name}
                                className="h-10 w-10 rounded-full object-cover border border-white/20 shrink-0"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <UserCircle size={20} className="text-muted-foreground" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{follower.full_name}</p>
                            {follower.current_position && (
                                <p className="text-xs text-muted-foreground truncate">{follower.current_position}</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
