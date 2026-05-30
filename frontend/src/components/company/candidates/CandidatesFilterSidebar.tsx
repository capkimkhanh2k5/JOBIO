import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useCandidateStore } from '@/store/candidateStore';
import { companyService } from '@/services/companyService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CandidatesFilterSidebar() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { filters, setFilters } = useCandidateStore();

    const { data: jobsRaw } = useQuery({
        queryKey: ['company-my-jobs'],
        queryFn: () => companyService.listMyJobs().then(response => response.data),
        staleTime: 60_000,
    });
    const jobs = [
        { id: 'all', title: 'Tất cả tin tuyển dụng' },
        ...((jobsRaw as any)?.results ?? []).map((job: any) => ({
            id: String(job.id),
            title: job.title,
        })),
    ];

    const handleJobChange = (jobId: string) => {
        const nextJobId = jobId === 'all' ? null : jobId;
        const nextParams = new URLSearchParams(searchParams);

        if (nextJobId) {
            nextParams.set('job_id', nextJobId);
        } else {
            nextParams.delete('job_id');
        }

        setFilters({ jobId: nextJobId });
        setSearchParams(nextParams);
    };

    return (
        <Select value={filters.jobId || 'all'} onValueChange={handleJobChange}>
            <SelectTrigger className="h-10 w-[260px] border-slate-200 bg-white shadow-sm lg:w-[320px]">
                <SelectValue placeholder="Chọn tin tuyển dụng" />
            </SelectTrigger>
            <SelectContent className="bg-white">
                {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
