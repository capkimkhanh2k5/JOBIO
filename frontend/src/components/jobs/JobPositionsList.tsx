import { Briefcase, Building2, Laptop, Tag, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface JobPosition {
    id: number | string;
    title: string;
    category?: { id: number; name: string } | string;
    category_id?: number | string;
    job_type?: string;
    level?: string;
    is_remote?: boolean;
    quantity?: number;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: 'Toàn thời gian',
    part_time: 'Bán thời gian',
    'full-time': 'Toàn thời gian',
    'part-time': 'Bán thời gian',
    contract: 'Hợp đồng',
    internship: 'Thực tập',
    freelance: 'Freelance',
};

const LEVEL_LABELS: Record<string, string> = {
    intern: 'Intern',
    fresher: 'Fresher',
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
    manager: 'Manager',
    director: 'Director',
};

export const JobPositionsList = ({ positions }: { positions?: JobPosition[] }) => {
    if (!positions || positions.length === 0) return null;

    const totalHeadcount = positions.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);

    return (
        <section className="bg-card rounded-2xl p-5 md:p-6 border border-teal-500/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground">Vị trí đang tuyển dụng ({positions.length})</h3>
                        <p className="text-xs text-muted-foreground">Đợt tuyển dụng này gồm nhiều vị trí công việc khác nhau</p>
                    </div>
                </div>
                <Badge className="bg-teal-600 text-white font-extrabold px-3 py-1 text-xs">
                    Tổng {totalHeadcount} chỉ tiêu
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {positions.map((pos, idx) => {
                    const catName = typeof pos.category === 'object' ? pos.category?.name : (typeof pos.category === 'string' ? pos.category : null);
                    const posSalary = (pos.salary_min || pos.salary_max)
                        ? `${pos.salary_min?.toLocaleString() ?? 0} - ${pos.salary_max?.toLocaleString() ?? '...'} ${pos.salary_currency || 'VND'}`
                        : 'Thương lượng';

                    return (
                        <div
                            key={pos.id || idx}
                            className="p-4 rounded-xl bg-muted/40 border border-border/80 hover:border-teal-500/40 transition-all space-y-2.5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-foreground text-sm leading-snug">
                                    #{idx + 1}. {pos.title || 'Vị trí tuyển dụng'}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-600/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shrink-0">
                                    {pos.quantity || 1} chỉ tiêu
                                </span>
                            </div>

                            {catName && (
                                <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                    <Tag size={12} /> {catName}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                                <div>Loại hình: <strong className="text-foreground">{JOB_TYPE_LABELS[pos.job_type || 'full_time'] || pos.job_type}</strong></div>
                                <div>Cấp bậc: <strong className="text-foreground">{LEVEL_LABELS[pos.level || 'middle'] || pos.level}</strong></div>
                                <div className="flex items-center gap-1">
                                    {pos.is_remote ? <Laptop size={13} className="text-teal-600" /> : <Building2 size={13} />}
                                    <strong className="text-foreground">{pos.is_remote ? 'Remote' : 'On-site'}</strong>
                                </div>
                                <div className="flex items-center gap-1">
                                    <DollarSign size={13} className="text-teal-600" />
                                    <strong className="text-teal-600 dark:text-teal-400">{posSalary}</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
