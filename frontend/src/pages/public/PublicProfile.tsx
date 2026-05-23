import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileCover } from './components/ProfileCover';
import { ProfileInfoSidebar } from './components/ProfileInfoSidebar';
import { ProfileCVDetail } from './components/ProfileCVDetail';
import { ProfileTimelineFeed } from './components/ProfileTimelineFeed';
import { motion } from 'framer-motion';

export default function PublicProfile() {
    const { id } = useParams<{ id: string }>();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['public-profile', id],
        queryFn: () => candidateService.getPublicProfile(Number(id)).then(r => r.data),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pb-12">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    <Skeleton className="h-64 w-full rounded-[32px] mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-96 w-full rounded-[24px]" />
                        <Skeleton className="lg:col-span-2 h-96 w-full rounded-[24px]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return <div className="text-center py-20 font-semibold text-lg">Không tìm thấy hồ sơ!</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <ProfileCover profile={profile} />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="container mx-auto px-4 max-w-6xl mt-6 relative z-10"
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Personal Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileInfoSidebar profile={profile} />
                    </div>

                    {/* Right Column: Timeline & CV Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <ProfileTimelineFeed userId={Number(id)} />
                        <ProfileCVDetail userId={Number(id)} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
