import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { mockApi } from '@/services/mockApi';
import { JobCard } from '@/components/jobs/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase } from 'lucide-react';

interface Props {
    companyId: string;
}

export function CompanyJobsTab({ companyId }: Props) {
    const { data: jobs, isLoading } = useQuery({
        queryKey: ['company-jobs', companyId],
        queryFn: () => mockApi.getCompanyJobs(companyId),
        staleTime: 1000 * 60 * 2,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-44 w-full rounded-2xl bg-white/5" />
                ))}
            </div>
        );
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground mb-4">
                    <Briefcase size={28} />
                </div>
                <p className="font-medium text-muted-foreground">Chưa có tin tuyển dụng nào</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job: any, i: number) => (
                <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                    <JobCard job={job} view="grid" />
                </motion.div>
            ))}
        </div>
    );
}
