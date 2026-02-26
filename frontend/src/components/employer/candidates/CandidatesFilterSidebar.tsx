import { useCandidateStore } from '@/store/candidateStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STATUSES = ['Submitted', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'];
const JOBS = [
    { id: 'all', title: 'Tất cả tin tuyển dụng' },
    { id: 'job-0', title: 'Senior Frontend Engineer' },
    { id: 'job-1', title: 'Product Manager' },
    { id: 'job-2', title: 'UI/UX Designer' }
];

export function CandidatesFilterSidebar() {
    const { filters, setFilters, clearFilters } = useCandidateStore();

    const toggleStatus = (status: string) => {
        const current = filters.statuses || [];
        if (current.includes(status)) {
            setFilters({ statuses: current.filter(s => s !== status) });
        } else {
            setFilters({ statuses: [...current, status] });
        }
    };

    const handleScoreChange = (value: number[]) => {
        setFilters({ aiScoreRange: [value[0], value[1]] });
    };

    return (
        <div className="w-[300px] flex-shrink-0 bg-card border border-border/50 rounded-xl p-5 flex flex-col h-[calc(100vh-200px)] sticky top-0 hide-scrollbar overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Filter className="w-4 h-4" />
                    </div>
                    <h2 className="font-semibold">Bộ lọc nâng cao</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                    Xóa lọc
                </Button>
            </div>

            <div className="space-y-6 flex-1">
                {/* Search */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Tìm kiếm</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Tên, email, kỹ năng..."
                            className="pl-9 h-10 border-border/50 bg-secondary/20"
                            value={filters.searchQuery || ''}
                            onChange={(e) => setFilters({ searchQuery: e.target.value })}
                        />
                    </div>
                </div>
                <Separator className="bg-border/50" />

                {/* Job Filter */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Tin tuyển dụng</label>
                    <Select
                        value={filters.jobId || 'all'}
                        onValueChange={(val) => setFilters({ jobId: val === 'all' ? null : val })}
                    >
                        <SelectTrigger className="w-full h-10 border-border/50 bg-secondary/20 truncate">
                            <SelectValue placeholder="Chọn tin tuyển dụng" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                            {JOBS.map(job => (
                                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Separator className="bg-border/50" />

                {/* Statuses */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Phân loại Trạng thái</label>
                    <div className="space-y-2">
                        {STATUSES.slice(0, 5).map(status => (
                            <div key={status} className="flex items-center gap-2">
                                <Checkbox
                                    id={`status-${status}`}
                                    checked={filters.statuses.includes(status)}
                                    onCheckedChange={() => toggleStatus(status)}
                                />
                                <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">{status}</label>
                            </div>
                        ))}
                        {STATUSES.length > 5 && (
                            <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">
                                + Xem thêm
                            </Button>
                        )}
                    </div>
                </div>
                <Separator className="bg-border/50" />

                {/* AI Score */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <label>AI Match Score</label>
                        <span className="text-xs text-muted-foreground">
                            {filters.aiScoreRange[0]}% - {filters.aiScoreRange[1]}%
                        </span>
                    </div>
                    <Slider
                        defaultValue={[0, 100]}
                        max={100}
                        step={5}
                        value={filters.aiScoreRange}
                        onValueChange={handleScoreChange}
                        className="py-2"
                    />
                </div>
                <Separator className="bg-border/50" />

                {/* Skills Quick Filter */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Kỹ năng được yêu cầu nhiều</label>
                    <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'Figma', 'Node.js', 'Python'].map(skill => {
                            const active = filters.skills.includes(skill);
                            return (
                                <button
                                    key={skill}
                                    onClick={() => {
                                        const cur = filters.skills;
                                        if (active) setFilters({ skills: cur.filter(s => s !== skill) });
                                        else setFilters({ skills: [...cur, skill] });
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${active
                                            ? 'bg-primary/20 border-primary/30 text-primary font-medium'
                                            : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary'
                                        }`}
                                >
                                    {skill}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border/50">
                <Button className="w-full font-medium" onClick={() => {
                    // Force refresh logic could be triggered here if needed
                }}>
                    Áp dụng bộ lọc
                </Button>
            </div>
        </div>
    );
}
