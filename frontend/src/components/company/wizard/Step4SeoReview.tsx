import { useQuery } from '@tanstack/react-query';
import { useWatch, type Control } from 'react-hook-form';
import { Briefcase, CalendarDays, DollarSign, Eye, Globe, MapPin, Users, Tag } from 'lucide-react';
import { companyService } from '@/services/companyService';
import { taxonomyService } from '@/services/taxonomyService';
import { SkillIcon } from '@/components/ui/SkillIcon';
import type { LocationRow, PostJobFormData } from '@/types/postJob';

interface Step4SeoReviewProps {
    control: Control<PostJobFormData>;
}

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: 'Toàn thời gian',
    part_time: 'Bán thời gian',
    contract: 'Hợp đồng',
    internship: 'Thực tập',
    freelance: 'Freelance',
};

function toPlainText(value?: string) {
    return (value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function Summary({ title, value, emptyText }: { title: string; value?: string; emptyText: string }) {
    const content = toPlainText(value);
    return (
        <section className="rounded-xl border border-border bg-muted/50 p-4">
            <h4 className="text-sm font-bold text-foreground mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground leading-6">{content || emptyText}</p>
        </section>
    );
}

export function Step4SeoReview({ control }: Step4SeoReviewProps) {
    const data = useWatch({ control }) as PostJobFormData;
    const { data: company } = useQuery({
        queryKey: ['company-profile'],
        queryFn: () => companyService.getMyCompany().then(res => res.data),
    });
    const { data: categories = [] } = useQuery({
        queryKey: ['job-categories'],
        queryFn: () => taxonomyService.listJobCategories(),
        staleTime: 5 * 60_000,
    });

    const flatCatsMap = new Map<string, string>();
    categories.forEach((cat: any) => {
        flatCatsMap.set(String(cat.id), cat.name);
        (cat.children || []).forEach((c: any) => flatCatsMap.set(String(c.id), c.name));
    });

    const locations = data.locations || [];
    const primaryLocation = locations.find((location: LocationRow) => location.is_primary) || locations[0];
    const experience = data.experience_min != null || data.experience_max != null
        ? `${data.experience_min ?? 0} - ${data.experience_max ?? data.experience_min ?? 0} năm`
        : 'Không yêu cầu';
    const salary = !data.is_salary_visible
        ? 'Thương lượng'
        : data.salary_min != null || data.salary_max != null
            ? `${data.salary_min?.toLocaleString() ?? '0'} - ${data.salary_max?.toLocaleString() ?? '...'} ${data.salary_currency}`
            : 'Thương lượng';

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Eye size={16} className="text-teal-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-foreground">Xem trước tin tuyển dụng</h3>
                    <p className="text-xs text-muted-foreground">Kiểm tra lại nội dung trước khi đăng tin.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-teal-500 via-teal-500 to-lime-400" />
                <div className="p-5 space-y-5">
                    <div className="flex items-start gap-3">
                        {company?.logo_url ? (
                            <img src={company.logo_url} alt={company.company_name} className="w-14 h-14 rounded-xl object-contain border border-border bg-card" />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold">
                                {(company?.company_name || 'C')[0]}
                            </div>
                        )}
                        <div className="min-w-0 space-y-1">
                            <h3 className="text-lg font-bold text-foreground">{data.title || 'Tên vị trí tuyển dụng'}</h3>
                            <p className="text-sm text-muted-foreground">{company?.company_name || 'Công ty của bạn'}</p>

                            {data.is_multi_position && data.positions && data.positions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="text-xs font-bold text-teal-700 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                                        Đợt tuyển combo {data.positions.length} vị trí
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {data.is_multi_position && data.positions && data.positions.length > 0 && (
                        <div className="space-y-3 p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Briefcase size={14} /> Danh sách vị trí tuyển dụng chi tiết ({data.positions.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {data.positions.map((pos, idx) => {
                                    const posSalary = pos.salary_min || pos.salary_max
                                        ? `${pos.salary_min?.toLocaleString() ?? 0} - ${pos.salary_max?.toLocaleString() ?? '...'} ${pos.salary_currency || 'VND'}`
                                        : 'Thương lượng';
                                    const catName = pos.category_id ? flatCatsMap.get(String(pos.category_id)) : null;
                                    return (
                                        <div key={pos.id || idx} className="p-3 rounded-lg bg-card border border-border shadow-2xs space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between font-bold text-foreground">
                                                <span>#{idx + 1}. {pos.title || 'Vị trí chưa đặt tên'}</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-600 text-white font-extrabold">
                                                    {pos.quantity} chỉ tiêu
                                                </span>
                                            </div>
                                            {catName && (
                                                <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                                                    <Tag size={11} /> {catName}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap items-center justify-between text-muted-foreground text-[11px] pt-0.5 gap-y-1">
                                                <span>Loại hình: <strong className="text-foreground">{JOB_TYPE_LABELS[pos.job_type || 'full_time']}</strong></span>
                                                <span>Cấp bậc: <strong className="text-foreground">{pos.level}</strong></span>
                                                <span>{pos.is_remote ? '🏠 Remote' : '🏢 On-site'}</span>
                                                <span>Lương: <strong className="text-teal-600">{posSalary}</strong></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        {data.is_multi_position && data.positions && data.positions.length > 0 ? (
                            <>
                                <span className="flex items-center gap-2"><Users size={15} /> {data.positions.length} vị trí · Tổng {data.positions.reduce((s, p) => s + (Number(p.quantity) || 1), 0)} chỉ tiêu</span>
                                <span className="flex items-center gap-2"><MapPin size={15} /> {primaryLocation?.province_name || 'Chưa chọn địa điểm'}</span>
                                <span className="flex items-center gap-2"><CalendarDays size={15} /> HSD: {data.deadline || 'Chưa chọn'}</span>
                            </>
                        ) : (
                            <>
                                <span className="flex items-center gap-2"><Briefcase size={15} /> {JOB_TYPE_LABELS[data.job_type] || data.job_type}</span>
                                <span className="flex items-center gap-2"><Users size={15} /> {data.level} · {data.quantity} chỉ tiêu</span>
                                <span className="flex items-center gap-2"><DollarSign size={15} /> {salary}</span>
                                <span className="flex items-center gap-2"><MapPin size={15} /> {primaryLocation?.province_name || 'Chưa chọn địa điểm'}</span>
                                <span className="flex items-center gap-2"><CalendarDays size={15} /> HSD: {data.deadline || 'Chưa chọn'}</span>
                                <span className="flex items-center gap-2"><Globe size={15} /> {data.is_remote ? 'Có hỗ trợ remote' : 'Làm việc tại văn phòng'}</span>
                            </>
                        )}
                    </div>

                    {data.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map(skill => {
                                const isPending = skill.skill_id.startsWith('custom_') || skill.is_verified === false || skill.is_publishable === false || skill.domain === 'other';
                                return (
                                    <span key={skill.skill_id} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                                        <SkillIcon skillName={skill.skill_name} size={16} />
                                        {skill.skill_name}
                                        {isPending && <span className="font-bold text-amber-600 text-[10px]">chờ duyệt</span>}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Summary title="Mô tả công việc" value={data.description} emptyText="Chưa có mô tả." />
                        <Summary title="Yêu cầu ứng viên" value={data.requirements} emptyText="Chưa có yêu cầu." />
                        <Summary title="Phúc lợi" value={data.benefits} emptyText="Chưa có phúc lợi." />
                    </div>

                    {locations.length > 1 && (
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-2">Địa điểm làm việc</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                {locations.map(location => (
                                    <p key={location.id}>• {[location.address_line, location.commune_name, location.province_name].filter(Boolean).join(', ')}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
