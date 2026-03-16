import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MoreHorizontal, Edit, Pause, Play, Trash2, Eye, Briefcase, Calendar, DollarSign, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from "@/components/ui/progress";

export interface Campaign {
    id: string;
    title?: string;
    campaign_name?: string;
    campaign_type?: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
    budget?: number;
    spent_amount?: number;
    target_positions?: number;
    hired_count?: number;
    start_date: string;
    end_date: string;
    job_count: number;
}

interface CampaignListProps {
    campaigns: Campaign[];
    isLoading: boolean;
    onViewDetail: (id: string) => void;
    onEdit: (id: string) => void;
    onStatusChange: (id: string, newStatus: string) => void;
    onDelete: (id: string) => void;
}

export function CampaignList({ campaigns, isLoading, onViewDetail, onEdit, onStatusChange, onDelete }: CampaignListProps) {
    const getStatusInfo = (status: Campaign['status']) => {
        switch (status) {
            case 'active': return { text: 'Active', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' };
            case 'draft': return { text: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
            case 'paused': return { text: 'Paused', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' };
            case 'completed': return { text: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
            case 'cancelled': return { text: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
            default: return { text: 'Unknown', color: 'bg-slate-100 text-slate-700' };
        }
    };

    const getTypeInfo = (type: string | undefined) => {
        if (!type) return 'N/A';
        switch (type) {
            case 'mass_hiring': return 'Mass Hiring';
            case 'campus': return 'Campus Tour';
            case 'referral': return 'Referral';
            case 'social_media': return 'Social Media';
            case 'job_fair': return 'Job Fair';
            default: return type;
        }
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 min-h-[50px] border-b border-slate-200"></div>
                    {Array(4).fill(null).map((_, i) => (
                        <div key={i} className="flex p-4 border-b border-slate-200 gap-4">
                            <Skeleton className="w-10 h-10 rounded-md" />
                            <div className="flex-1 space-y-2 py-1">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                            <div className="w-[150px] space-y-2 py-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-2 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="p-16 text-center text-slate-500 border border-slate-200 rounded-3xl bg-slate-50/50 mt-4">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                    <Target className="w-10 h-10 text-violet-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Chưa có chiến dịch nào</h3>
                <p className="text-sm">Bạn chưa tạo chiến dịch tuyển dụng nào hoặc không có kết quả phù hợp với bộ lọc.</p>
            </div>
        );
    }

    return (
        <div className="w-full border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mt-4">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Chiến dịch</th>
                            <th className="px-6 py-4 whitespace-nowrap">Loại / Trạng thái</th>
                            <th className="px-6 py-4 whitespace-nowrap">Ngân sách</th>
                            <th className="px-6 py-4 whitespace-nowrap">Tuyển dụng</th>
                            <th className="px-6 py-4 whitespace-nowrap">Thời gian</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {campaigns.map((camp) => {
                            const statusInfo = getStatusInfo(camp.status);
                            const budget = camp.budget || 0;
                            const spent = camp.spent_amount || 0;
                            const targets = camp.target_positions || 0;
                            const hired = camp.hired_count || 0;

                            const budgetPercent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                            const hirePercent = targets > 0 ? Math.min(100, (hired / targets) * 100) : 0;

                            return (
                                <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-900 text-base group-hover:text-cyan-600 transition-colors cursor-pointer" onClick={() => onViewDetail(camp.id)}>
                                                {camp.title || camp.campaign_name || 'Unnamed Campaign'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {camp.job_count} Jobs
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-2">
                                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[10px]">
                                                {getTypeInfo(camp.campaign_type)}
                                            </Badge>
                                            <Badge variant="outline" className={cn("px-2 py-0.5 font-bold border-none text-[10px] uppercase rounded-md", statusInfo.color)}>
                                                {statusInfo.text}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-[140px]">
                                            <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                                                <span className="text-slate-700 flex items-center"><DollarSign className="w-3 h-3 mr-0.5 text-violet-500" />{spent.toLocaleString()}</span>
                                                <span className="text-slate-400">/ {budget.toLocaleString()}</span>
                                            </div>
                                            <Progress value={budgetPercent} className="h-1.5 bg-slate-100" indicatorClassName={budgetPercent > 90 ? "bg-red-500" : budgetPercent > 75 ? "bg-amber-500" : "bg-violet-500"} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-[120px]">
                                            <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                                                <span className="text-slate-700">{hired} hired</span>
                                                <span className="text-slate-400">/ {targets}</span>
                                            </div>
                                            <Progress value={hirePercent} className="h-1.5 bg-slate-100" indicatorClassName="bg-indigo-500" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm text-slate-700 gap-1.5">
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{format(parseISO(camp.start_date), 'dd/MM/yyyy', { locale: vi })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                <span className="w-3.5 h-[1px] bg-slate-300 dark:bg-slate-700 text-transparent">-</span>
                                                <span>{format(parseISO(camp.end_date), 'dd/MM/yyyy', { locale: vi })}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 rounded-xl hover:bg-white hover:text-violet-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[180px] bg-white/90 dark:bg-slate-900/90 backdrop-blur border-slate-200 dark:border-slate-800">
                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onViewDetail(camp.id)} className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4 text-slate-500" /> Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit(camp.id)} className="cursor-pointer">
                                                    <Edit className="mr-2 h-4 w-4 text-slate-500" /> Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {camp.status === 'active' && (
                                                    <DropdownMenuItem onClick={() => onStatusChange(camp.id, 'paused')} className="cursor-pointer">
                                                        <Pause className="mr-2 h-4 w-4 text-amber-500" /> Tạm dừng
                                                    </DropdownMenuItem>
                                                )}
                                                {(camp.status === 'draft' || camp.status === 'paused') && (
                                                    <DropdownMenuItem onClick={() => onStatusChange(camp.id, 'active')} className="cursor-pointer">
                                                        <Play className="mr-2 h-4 w-4 text-green-500" /> Kích hoạt
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => onDelete(camp.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-500 dark:focus:bg-red-900/30 cursor-pointer">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa chiến dịch
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {campaigns.length > 0 && (
                <div className="py-4 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div>Tổng cộng: <span className="font-bold text-slate-900">{campaigns.length}</span> chiến dịch</div>
                </div>
            )}
        </div>
    );
}
