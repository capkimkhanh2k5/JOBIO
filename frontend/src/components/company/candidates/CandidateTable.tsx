import { EmptyState } from '@/components/shared/EmptyState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Calendar, MoreHorizontal, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Application {
    id: string;
    job_id: string;
    candidate_id: string;
    candidate_name: string;
    candidate_avatar: string;
    job_title: string;
    status: string;
    ai_score: number;
    match_score?: number;
    applied_at: string;
    skills: string[];
}

const STATUS_LABELS: Record<string, string> = {
    'pending': '1. Ứng tuyển mới',
    'reviewing': '2. Phỏng vấn & Đánh giá',
    'shortlisted': '2. Phỏng vấn & Đánh giá',
    'interview': '2. Phỏng vấn & Đánh giá',
    'offered': '3. Tuyển dụng / Offer',
    'accepted': '3. Tuyển dụng / Offer',
    'rejected': '4. Đã từ chối',
    'withdrawn': '4. Đã từ chối'
};

const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'accepted':
        case 'offered':
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case 'interview':
        case 'shortlisted':
        case 'reviewing':
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case 'rejected':
        case 'withdrawn':
            return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        default:
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
};

export function CandidateTable({ applications, isLoading }: { applications: Application[], isLoading: boolean }) {
    const { setSelectedCandidateId, selectedCandidatesForBulk, toggleCandidateForBulk, selectAllForBulk } = useCandidateStore();

    const allSelected = applications.length > 0 && selectedCandidatesForBulk.length === applications.length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            selectAllForBulk(applications.map(a => a.id));
        } else {
            selectAllForBulk([]);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                {/* Skeleton simple implementation */}
                <div className="h-12 border-b border-border/60 bg-muted/50"></div>
                {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="h-16 border-b border-border/60 bg-card animate-pulse flex items-center px-4 gap-4">
                        <div className="w-4 h-4 rounded bg-secondary"></div>
                        <div className="w-10 h-10 rounded-full bg-secondary"></div>
                        <div className="w-32 h-4 rounded bg-secondary"></div>
                        <div className="ml-auto w-24 h-4 rounded bg-secondary"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <EmptyState
                icon={User}
                title="Không tìm thấy ứng viên nào"
                description="Thử thay đổi bộ lọc tuyển dụng hoặc chọn tin tuyển dụng khác để tìm kiếm ứng viên."
            />
        );
    }

    return (
        <div className="w-full h-full min-h-[calc(100vh-270px)] bg-card border border-border/60 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left relative">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="p-4 w-4">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                            </th>
                            <th scope="col" className="px-4 py-3 font-medium">Ứng viên</th>
                            <th scope="col" className="px-4 py-3 font-medium">Vị trí ứng tuyển</th>
                            <th scope="col" className="px-4 py-3 font-medium">Trạng thái</th>
                            <th scope="col" className="px-4 py-3 font-medium">Điểm Match</th>
                            <th scope="col" className="px-4 py-3 font-medium">Ngày ứng tuyển</th>
                            <th scope="col" className="px-4 py-3 rounded-tr-xl font-medium text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {applications.map((app) => {
                            const matchScore = app.match_score ?? app.ai_score ?? 0;

                            return (
                            <tr
                                key={app.id}
                                className="bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedCandidateId(app.id)}
                            >
                                <td className="p-4 w-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedCandidatesForBulk.includes(app.id)}
                                        onCheckedChange={() => toggleCandidateForBulk(app.id)}
                                    />
                                </td>
                                <th scope="row" className="px-4 py-3 font-medium text-foreground whitespace-nowrap flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-border/50">
                                        <AvatarImage src={app.candidate_avatar} />
                                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold text-sm hover:text-teal-600 transition-colors">{app.candidate_name}</div>
                                        <div className="text-xs text-muted-foreground font-normal">{(app.skills || []).slice(0, 2).join(", ")}</div>
                                    </div>
                                </th>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {app.job_title}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className={cn("font-normal shadow-sm", getStatusColor(app.status))}>
                                        {STATUS_LABELS[app.status] || app.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className={cn("font-medium", getScoreColor(matchScore))}>
                                        {matchScore}%
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-sm">
                                    {new Date(app.applied_at).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-teal-600" onClick={() => setSelectedCandidateId(app.id)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-card">
                                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setSelectedCandidateId(app.id)}>
                                                    <Eye className="w-4 h-4" /> Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                                    <Calendar className="w-4 h-4" /> Lên lịch phỏng vấn
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500">
                                                    Cập nhật trạng thái
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
