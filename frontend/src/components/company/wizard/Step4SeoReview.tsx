import { useQuery } from '@tanstack/react-query';
import { useWatch, type Control } from 'react-hook-form';
import { Briefcase, CalendarDays, DollarSign, Eye, Globe, MapPin, Users } from 'lucide-react';
import { companyService } from '@/services/companyService';
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
        <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-2">{title}</h4>
            <p className="text-sm text-slate-600 leading-6">{content || emptyText}</p>
        </section>
    );
}

export function Step4SeoReview({ control }: Step4SeoReviewProps) {
    const data = useWatch({ control }) as PostJobFormData;
    const { data: company } = useQuery({
        queryKey: ['company-profile'],
        queryFn: () => companyService.getMyCompany().then(res => res.data),
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
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Eye size={16} className="text-cyan-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Xem trước tin tuyển dụng</h3>
                    <p className="text-xs text-slate-500">Kiểm tra lại nội dung trước khi đăng tin.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-lime-400" />
                <div className="p-5 space-y-5">
                    <div className="flex items-start gap-3">
                        {company?.logo_url ? (
                            <img src={company.logo_url} alt={company.company_name} className="w-14 h-14 rounded-xl object-contain border border-slate-200 bg-white" />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-bold">
                                {(company?.company_name || 'C')[0]}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-900">{data.title || 'Tên vị trí tuyển dụng'}</h3>
                            <p className="text-sm text-slate-500">{company?.company_name || 'Công ty của bạn'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-2"><Briefcase size={15} /> {JOB_TYPE_LABELS[data.job_type] || data.job_type}</span>
                        <span className="flex items-center gap-2"><Users size={15} /> {data.level} · {data.quantity} vị trí</span>
                        <span className="flex items-center gap-2"><DollarSign size={15} /> {salary}</span>
                        <span className="flex items-center gap-2"><MapPin size={15} /> {primaryLocation?.province_name || 'Chưa chọn địa điểm'}</span>
                        <span className="flex items-center gap-2"><CalendarDays size={15} /> HSD: {data.deadline || 'Chưa chọn'}</span>
                        <span className="flex items-center gap-2"><Globe size={15} /> {data.is_remote ? 'Có hỗ trợ remote' : 'Làm việc tại văn phòng'}</span>
                    </div>

                    <div className="text-sm text-slate-600">
                        <strong className="text-slate-800">Kinh nghiệm:</strong> {experience}
                    </div>

                    {data.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map(skill => (
                                <span key={skill.skill_id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                    <SkillIcon skillName={skill.skill_name} size={18} />
                                    {skill.skill_name}{skill.is_required ? ' *' : ''}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <Summary title="Mô tả công việc" value={data.description} emptyText="Chưa có mô tả." />
                        <Summary title="Yêu cầu ứng viên" value={data.requirements} emptyText="Chưa có yêu cầu." />
                        <Summary title="Phúc lợi" value={data.benefits} emptyText="Chưa có phúc lợi." />
                    </div>

                    {locations.length > 1 && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-2">Địa điểm làm việc</h4>
                            <div className="space-y-1 text-sm text-slate-600">
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
