import { useQuery } from '@tanstack/react-query';
import { Controller, type Control } from 'react-hook-form';
import { companyService } from '@/services/companyService';
import { LocationBuilder } from './LocationBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostJobFormData } from '@/types/postJob';

const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl text-sm',
    'bg-white/5 border border-white/10 text-white placeholder:text-white/30',
    'focus:outline-none focus:border-cyan-500/40 focus:bg-white/8',
    'transition-all duration-200'
);

interface Step3LocationProps {
    control: Control<PostJobFormData>;
}

export function Step3Location({ control }: Step3LocationProps) {
    const { data: company, isLoading } = useQuery({
        queryKey: ['employer-company'],
        queryFn: () => companyService.getMyCompany().then(r => r.data),
        staleTime: 5 * 60_000,
    });

    return (
        <div className="space-y-6">
            {/* Location section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                        <MapPin size={14} className="text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/90">Địa điểm làm việc</h3>
                </div>
                <Controller
                    name="locations"
                    control={control}
                    render={({ field }) => (
                        <LocationBuilder value={field.value} onChange={field.onChange} />
                    )}
                />
            </div>

            <div className="border-t border-white/10 pt-6">
                {/* Company section */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <Building2 size={14} className="text-violet-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white/90">Thông tin công ty</h3>
                    <span className="text-xs text-white/30 ml-1">(tự động điền từ hồ sơ)</span>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Company logo preview */}
                        {company && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <img
                                    src={company.logo_url}
                                    alt={company.company_name}
                                    className="w-10 h-10 rounded-lg object-cover bg-white/10"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-white">{company.company_name}</p>
                                    <p className="text-xs text-white/40">{company.website_url}</p>
                                </div>
                                <span className="ml-auto text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    ✓ Đã xác thực
                                </span>
                            </div>
                        )}

                        {/* Editable fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Tên công ty</label>
                                <input
                                    type="text"
                                    defaultValue={company?.company_name}
                                    readOnly
                                    className={cn(inputClass, 'opacity-60 cursor-not-allowed')}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Quy mô</label>
                                <input
                                    type="text"
                                    defaultValue={company?.company_size ? `${company.company_size} nhân viên` : ''}
                                    readOnly
                                    className={cn(inputClass, 'opacity-60 cursor-not-allowed')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-white/50 mb-1.5 flex items-center gap-1.5">
                                <Globe size={11} /> Website
                            </label>
                            <input
                                type="url"
                                defaultValue={company?.website_url}
                                readOnly
                                className={cn(inputClass, 'opacity-60 cursor-not-allowed')}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-white/50 mb-1.5 flex items-center gap-1.5">
                                <MapPin size={11} /> Trụ sở chính
                            </label>
                            <input
                                type="text"
                                defaultValue={company?.headquarters}
                                readOnly
                                className={cn(inputClass, 'opacity-60 cursor-not-allowed')}
                            />
                        </div>

                        <p className="text-xs text-white/30 italic">
                            💡 Để chỉnh sửa thông tin công ty, vui lòng cập nhật trong{' '}
                            <a href="/employer/company" className="text-cyan-400 hover:underline">Hồ sơ công ty</a>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
