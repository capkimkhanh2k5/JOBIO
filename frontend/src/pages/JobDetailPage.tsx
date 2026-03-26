import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { jobService } from '@/services/jobService';
import { companyService } from '@/services/companyService';
import { JobDetailHeader } from '@/components/jobs/JobDetailHeader';
import { JobDetailContent } from '@/components/jobs/JobDetailContent';
import { JobSkillsList } from '@/components/jobs/JobSkillsList';
import { CompanySidebar } from '@/components/companies/CompanySidebar';
import { ApplyForm } from '@/components/jobs/ApplyForm';
import { JobCard } from '@/components/jobs/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowRight, Sparkles } from 'lucide-react';

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    // Fetch Job Basic Info
    const { data: job, isLoading: isLoadingJob, isError: isJobError } = useQuery({
        queryKey: ['job', id],
        queryFn: () => jobService.getById(Number(id)).then(r => r.data),
    });

    // Fetch Job Skills
    const { data: skills } = useQuery({
        queryKey: ['job-skills', id],
        queryFn: () => jobService.listSkills(Number(id)).then(r => r.data),
        enabled: !!job
    });

    // Fetch Job Locations
    const { data: locations } = useQuery({
        queryKey: ['job-locations', id],
        queryFn: () => jobService.listLocations(Number(id)).then(r => r.data),
        enabled: !!job
    });

    // Fetch Company Info
    const { data: company } = useQuery({
        queryKey: ['company', job?.company?.id],
        queryFn: () => companyService.getById(Number(job?.company?.id)).then(r => r.data),
        enabled: !!job?.company?.id
    });

    // Fetch Related Jobs
    const { data: relatedJobs } = useQuery({
        queryKey: ['related-jobs', id],
        queryFn: () => jobService.similar(Number(id)).then(r => r.data),
        enabled: !!job
    });

    if (isLoadingJob) return <JobDetailSkeleton />;
    if (isJobError || !job) return <JobNotFoundError />;

    return (
        <div className="container mx-auto px-4 pt-32 pb-12 max-w-7xl relative z-10">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="mb-6 hover:bg-white/5 text-muted-foreground hover:text-foreground group"
                onClick={() => navigate(-1)}
            >
                <ChevronLeft size={20} className="mr-1 transition-transform group-hover:-translate-x-1" />
                Quay lại danh sách
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content (Left) */}
                <div className="lg:col-span-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-10"
                    >
                        <JobDetailHeader
                            job={job as any}
                            locations={locations || []}
                            onApply={() => setIsApplyModalOpen(true)}
                        />

                        <JobDetailContent
                            description={job.description}
                            requirements={job.requirements}
                            benefits={job.benefits}
                        />

                        {skills && <JobSkillsList skills={skills} />}

                        {/* Related Jobs Section */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <Sparkles size={24} className="text-violet-600" />
                                    Việc làm tương tự
                                </h3>
                                <Button variant="link" className="text-violet-600 group hover:text-violet-700">
                                    Xem tất cả
                                    <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relatedJobs?.slice(0, 4).map((rJob: any) => (
                                    <JobCard key={rJob.id} job={rJob} view="grid" />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar (Right) */}
                <div className="lg:col-span-4">
                    {company && <CompanySidebar company={company} />}
                </div>
            </div>

            {/* Apply Modal */}
            <ApplyForm
                jobId={job.id}
                jobTitle={job.title}
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
            />

            {/* Floating Apply Button for Mobile */}
            <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
                <Button
                    className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg rounded-2xl shadow-md shadow-violet-600/20 transition-all animate-in fade-in slide-in-from-bottom-10"
                    onClick={() => setIsApplyModalOpen(true)}
                >
                    Ứng tuyển ngay
                </Button>
            </div>
        </div>
    );
}

function JobDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 pt-32 pb-12 max-w-7xl animate-pulse">
            <Skeleton className="h-10 w-40 mb-6 bg-gray-100" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <Skeleton className="h-64 w-full rounded-2xl mb-8 bg-gray-100" />
                    <Skeleton className="h-40 w-full rounded-2xl mb-8 bg-gray-100" />
                    <Skeleton className="h-96 w-full rounded-2xl mb-8 bg-gray-100" />
                </div>
                <div className="lg:col-span-4">
                    <Skeleton className="h-[500px] w-full rounded-2xl bg-gray-100" />
                </div>
            </div>
        </div>
    );
}

function JobNotFoundError() {
    return (
        <div className="container mx-auto px-4 pt-32 pb-32 flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-full bg-red-400/10 flex items-center justify-center text-red-500 mb-6">
                <Sparkles size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Không tìm thấy việc làm</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                Tin tuyển dụng này có thể đã hết hạn hoặc không tồn tại. Hãy quay lại danh sách để tìm kiếm cơ hội khác.
            </p>
            <Button asChild className="bg-sky-700 hover:bg-sky-800 px-8 h-12 rounded-xl text-white font-medium">
                <a href="/jobs">Quay lại danh sách</a>
            </Button>
        </div>
    );
}
