import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { companyService } from '@/services/companyService';
import { LocationBuilder } from './LocationBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostJobFormData } from '@/types/postJob';

const inputClass = cn(
    'w-full px-4 py-2.5 rounded-xl text-sm',
    'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/5',
    'transition-all duration-200 shadow-sm'
);

interface Step3LocationProps {
    control: Control<PostJobFormData>;
}

function isEmptyLocation(row: PostJobFormData['locations'][number] | undefined) {
    return !row || (!row.province_id && !row.commune_id && !row.address_line);
}

function buildCompanyLocation(company: any): PostJobFormData['locations'][number] | null {
    const address = company?.address;
    if (!address?.province) return null;

    return {
        id: 'company_headquarters',
        province_id: String(address.province),
        province_name: address.province_name || '',
        commune_id: address.commune ? String(address.commune) : '',
        commune_name: address.commune_name || '',
        address_line: address.address_line || company?.headquarters || '',
        is_primary: true,
    };
}

function CompanySeededLocationBuilder({
    value,
    onChange,
    company,
}: {
    value: PostJobFormData['locations'];
    onChange: (rows: PostJobFormData['locations']) => void;
    company: any;
}) {
    const companyLocation = useMemo(() => buildCompanyLocation(company), [company]);

    useEffect(() => {
        if (!companyLocation) return;
        if (value.length === 0 || (value.length === 1 && isEmptyLocation(value[0]))) {
            onChange([companyLocation]);
        }
    }, [companyLocation, onChange, value]);

    return <LocationBuilder value={value} onChange={onChange} />;
}

export function Step3Location({ control }: Step3LocationProps) {
    const { data: company, isLoading } = useQuery({
        queryKey: ['company-company'],
        queryFn: () => companyService.getMyCompany().then(r => r.data),
        staleTime: 5 * 60_000,
    });

    return (
        <div className="space-y-6">
            {/* Location section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <MapPin size={14} className="text-violet-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Địa điểm làm việc</h3>
                </div>
                <Controller
                    name="locations"
                    control={control}
                    render={({ field }) => (
                        <CompanySeededLocationBuilder value={field.value} onChange={field.onChange} company={company} />
                    )}
                />
            </div>

            <div className="border-t border-slate-100 pt-6">
                {/* Company section */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <Building2 size={14} className="text-violet-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Thông tin công ty</h3>
                    <span className="text-xs text-slate-400 ml-1 font-medium">(tự động điền từ hồ sơ)</span>
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
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <img
                                    src={company.logo_url || '/placeholder-company.png'}
                                    alt={company.company_name}
                                    className="w-10 h-10 rounded-lg object-cover bg-white"
                                />
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{company.company_name}</p>
                                    <p className="text-xs text-slate-500">{company.website}</p>
                                </div>
                                <span className="ml-auto text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                                    ✓ Đã xác thực
                                </span>
                            </div>
                        )}

                        {/* Editable fields */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1.5 block font-medium">Tên công ty</label>
                                <input
                                    type="text"
                                    defaultValue={company?.company_name}
                                    readOnly
                                    className={cn(inputClass, 'opacity-60 cursor-not-allowed bg-slate-50')}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1.5 block font-medium">Quy mô</label>
                                <input
                                    type="text"
                                    defaultValue={company?.company_size ? `${company.company_size} nhân viên` : ''}
                                    readOnly
                                    className={cn(inputClass, 'opacity-60 cursor-not-allowed bg-slate-50')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5 font-medium">
                                <Globe size={11} /> Website
                            </label>
                            <input
                                type="url"
                                defaultValue={company?.website || ''}
                                readOnly
                                className={cn(inputClass, 'opacity-60 cursor-not-allowed bg-slate-50')}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5 font-medium">
                                <MapPin size={11} /> Trụ sở chính
                            </label>
                            <input
                                type="text"
                                defaultValue={company?.address?.address_line || ''}
                                readOnly
                                className={cn(inputClass, 'opacity-60 cursor-not-allowed bg-slate-50')}
                            />
                        </div>

                        <p className="text-xs text-slate-400 italic font-medium">
                            💡 Để chỉnh sửa thông tin công ty, vui lòng cập nhật trong{' '}
                            <a href="/company/profile" className="text-violet-600 hover:underline">Hồ sơ công ty</a>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
