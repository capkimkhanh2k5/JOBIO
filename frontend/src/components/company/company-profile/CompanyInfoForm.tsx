import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { geographyService } from '@/services/geographyService';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, UploadCloud, Building2, MapPin, Globe, Calendar, FileText, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { htmlToPlainText } from '@/lib/htmlText';

const formSchema = z.object({
    company_name: z.string().min(2, 'Tên công ty phải có ít nhất 2 ký tự.'),
    tax_code: z.string().min(5, 'Mã số thuế không hợp lệ.'),
    industry_id: z.string().min(1, 'Vui lòng chọn lĩnh vực hoạt động.'),
    company_size: z.string().min(1, 'Vui lòng chọn quy mô công ty.'),
    website: z.string().url('URL không hợp lệ.').or(z.literal('')),
    founded_year: z.number().int().min(1800).max(new Date().getFullYear()),
    description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự.'),
    headquarters: z.string().min(5, 'Địa chỉ trụ sở chính không hợp lệ.'),
    province_id: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố.'),
    commune_id: z.string().min(1, 'Vui lòng chọn quận/huyện.'),
    address_line: z.string().min(5, 'Địa chỉ cụ thể không hợp lệ.'),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyInfoFormProps {
    company: any;
    industries: any[];
}

const getIndustryId = (company: any) => {
    if (!company?.industry) return '';
    return String(typeof company.industry === 'object' ? company.industry.id : company.industry);
};

const getDefaultValues = (company: any): FormValues => ({
    company_name: company?.company_name || '',
    tax_code: company?.tax_code || '',
    industry_id: getIndustryId(company),
    company_size: company?.company_size || '',
    website: company?.website || '',
    founded_year: company?.founded_year || new Date().getFullYear(),
    description: htmlToPlainText(company?.description),
    headquarters: company?.headquarters || '',
    province_id: company?.address?.province ? String(company.address.province) : '',
    commune_id: company?.address?.commune ? String(company.address.commune) : '',
    address_line: company?.address?.address_line || company?.headquarters || '',
});

export function CompanyInfoForm({ company, industries }: CompanyInfoFormProps) {
    const queryClient = useQueryClient();
    const updateUser = useUserStore((state) => state.updateUser);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [localLogoUrl, setLocalLogoUrl] = useState<string | null>(null);
    const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);
    const [isFoundedYearOpen, setIsFoundedYearOpen] = useState(false);
    const foundedYearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: currentYear - 1800 + 1 }, (_, index) => currentYear - index);
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(company),
    });
    const selectedProvinceId = form.watch('province_id');
    const addressLine = form.watch('address_line');
    const { data: provinces = [], isLoading: provinceLoading } = useQuery({
        queryKey: ['company-profile-provinces'],
        queryFn: () => geographyService.getProvinces(),
        staleTime: 60_000,
    });
    const { data: communes = [], isLoading: communeLoading } = useQuery({
        queryKey: ['company-profile-communes', selectedProvinceId],
        queryFn: () => geographyService.getCommunes(selectedProvinceId),
        enabled: !!selectedProvinceId,
        staleTime: 60_000,
    });

    useEffect(() => {
        form.reset(getDefaultValues(company));
    }, [company?.id, company?.updated_at, form]);

    useEffect(() => {
        if (addressLine) {
            form.setValue('headquarters', addressLine, { shouldDirty: false, shouldValidate: false });
        }
    }, [addressLine, form]);

    useEffect(() => {
        return () => {
            if (localLogoUrl?.startsWith('blob:')) URL.revokeObjectURL(localLogoUrl);
            if (localBannerUrl?.startsWith('blob:')) URL.revokeObjectURL(localBannerUrl);
        };
    }, [localLogoUrl, localBannerUrl]);

    const updateMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const province = provinces.find((item) => String(item.id) === data.province_id);
            const commune = communes.find((item) => String(item.id) === data.commune_id);
            const address = await geographyService.createAddress({
                address_line: data.address_line,
                province: Number(data.province_id),
                commune: Number(data.commune_id),
            });
            const headquarters = [
                data.address_line,
                commune?.commune_name,
                province?.province_name,
            ].filter(Boolean).join(', ');

            return companyService.update(Number(company.id), {
                company_name: data.company_name,
                tax_code: data.tax_code,
                industry_id: Number(data.industry_id),
                company_size: data.company_size,
                website: data.website,
                founded_year: data.founded_year,
                description: data.description,
                address_id: address.id,
                headquarters,
            } as any).then(r => r.data);
        },
        onSuccess: (updatedCompany) => {
            queryClient.setQueryData(['companyProfile'], updatedCompany);
            form.reset(getDefaultValues(updatedCompany));
            toast.success('Đã cập nhật thông tin công ty.');
            queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
        },
        onError: () => {
            toast.error('Lỗi khi cập nhật thông tin công ty.');
        },
    });

    const logoMutation = useMutation({
        mutationFn: (file: File) => companyService.uploadLogo(Number(company.id), file).then(r => r.data),
        onSuccess: (data) => {
            setLocalLogoUrl(data.logo_url);
            updateUser({ avatar_url: data.avatar_url || data.logo_url });
            queryClient.setQueryData(['companyProfile'], (current: any) => (
                current ? { ...current, logo_url: data.logo_url } : current
            ));
            toast.success('Đã cập nhật logo.');
            queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
            setIsUploadingLogo(false);
        },
        onError: () => {
            toast.error('Lỗi khi tải lên logo.');
            setLocalLogoUrl(null);
            setIsUploadingLogo(false);
        },
    });

    const bannerMutation = useMutation({
        mutationFn: (file: File) => companyService.uploadBanner(Number(company.id), file).then(r => r.data),
        onSuccess: (data) => {
            setLocalBannerUrl(data.banner_url);
            queryClient.setQueryData(['companyProfile'], (current: any) => (
                current ? { ...current, banner_url: data.banner_url } : current
            ));
            toast.success('Đã cập nhật ảnh bìa.');
            queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
            setIsUploadingBanner(false);
        },
        onError: () => {
            toast.error('Lỗi khi tải lên ảnh bìa.');
            setLocalBannerUrl(null);
            setIsUploadingBanner(false);
        },
    });

    function onSubmit(values: FormValues) {
        updateMutation.mutate(values);
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingLogo(true);
            setLocalLogoUrl(URL.createObjectURL(file));
            logoMutation.mutate(file);
            e.target.value = '';
        }
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingBanner(true);
            setLocalBannerUrl(URL.createObjectURL(file));
            bannerMutation.mutate(file);
            e.target.value = '';
        }
    };

    const bannerImageUrl = localBannerUrl || company?.banner_url;
    const logoImageUrl = localLogoUrl || company?.logo_url;
    const provinceOptions = provinces.map((province) => ({
        value: String(province.id),
        label: province.province_name,
    }));
    const communeOptions = communes.map((commune) => ({
        value: String(commune.id),
        label: commune.commune_name,
    }));

    return (
        <div className="space-y-8">
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                        <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600">
                            <UploadCloud className="w-5 h-5" />
                        </div>
                        Hình ảnh nhận diện
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-semibold">Logo và ảnh bìa hiển thị trên trang hồ sơ và thẻ tin tuyển dụng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Banner Section */}
                    <div className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Ảnh bìa hồ sơ (Banner)</p>
                        <div className="relative group w-full h-56 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-violet-400/50" aria-busy={isUploadingBanner}>
                            {bannerImageUrl ? (
                                <img
                                    src={bannerImageUrl}
                                    alt="Banner"
                                    className={`h-full w-full object-cover object-center transition-all duration-300 ${isUploadingBanner ? 'scale-[1.01] opacity-60 blur-[1px]' : ''}`}
                                />
                            ) : (
                                <div className={`text-slate-400 flex flex-col items-center transition-all duration-300 ${isUploadingBanner ? 'opacity-50 blur-[1px]' : ''}`}>
                                    <div className="p-4 rounded-full bg-slate-100 mb-3 shadow-inner">
                                        <ImageIcon className="w-8 h-8 opacity-40" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider opacity-60">Click để tải lên ảnh bìa</span>
                                </div>
                            )}
                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity backdrop-blur-[2px] ${isUploadingBanner ? 'bg-black/30 opacity-100' : 'bg-slate-900/60 opacity-0 group-hover:opacity-100'}`}>
                                {isUploadingBanner ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-lg backdrop-blur-md">
                                            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                                        </div>
                                        <div className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-black text-white shadow-sm backdrop-blur-md">
                                            Đang tải ảnh...
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer bg-white px-5 py-2.5 rounded-xl text-slate-900 flex items-center gap-3 text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95">
                                        <UploadCloud className="w-4 h-4 text-violet-500" />
                                        Thay đổi ảnh bìa
                                        <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Logo Section */}
                    <div className="flex gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                        <div className="relative group w-28 h-28 rounded-[24px] overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm transition-all group-hover:shadow-md" aria-busy={isUploadingLogo}>
                            {logoImageUrl ? (
                                <img
                                    src={logoImageUrl}
                                    alt="Logo"
                                    className={`w-full h-full object-contain p-3 transition-all duration-300 ${isUploadingLogo ? 'scale-[1.01] opacity-55 blur-[1px]' : ''}`}
                                />
                            ) : (
                                <div className={`p-3 bg-slate-50 rounded-2xl shadow-inner transition-all duration-300 ${isUploadingLogo ? 'opacity-50 blur-[1px]' : ''}`}>
                                    <Building2 className="w-10 h-10 text-slate-300" />
                                </div>
                            )}
                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity backdrop-blur-[2px] ${isUploadingLogo ? 'bg-black/30 opacity-100' : 'bg-slate-900/60 opacity-0 group-hover:opacity-100'}`}>
                                {isUploadingLogo ? (
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-lg backdrop-blur-md">
                                        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                                    </div>
                                ) : (
                                    <label className="cursor-pointer p-3 rounded-full bg-white text-slate-900 shadow-xl transition-all hover:scale-110 active:scale-90">
                                        <UploadCloud className="w-5 h-5 text-violet-500" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-black text-slate-800">Logo thương hiệu</p>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold">Khuyến nghị kích thước <span className="text-violet-600 font-black">400x400px</span>. Sử dụng logo nền trong suốt (PNG) để tối ưu hiển thị.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card className="border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                                <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600">
                                    <FileText className="w-5 h-5" />
                                </div>
                                Thông tin cơ bản
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Tên công ty</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: JOBIO Tech Corporation" className="h-12 bg-white border-slate-200 focus:ring-violet-500/20 focus:border-violet-500 rounded-xl font-bold text-slate-800 shadow-sm" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tax_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Mã số thuế</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0123456789" className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="industry_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Lĩnh vực hoạt động</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm">
                                                    <SelectValue placeholder="Chọn lĩnh vực" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 rounded-xl">
                                                {industries.map((industry) => (
                                                    <SelectItem key={industry.id} value={String(industry.id)} className="hover:bg-slate-50 focus:bg-slate-50 font-bold">
                                                        {industry.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="company_size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Quy mô nhân sự</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm">
                                                    <SelectValue placeholder="Chọn quy mô" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 rounded-xl">
                                                <SelectItem value="1-10">1-10 nhân viên</SelectItem>
                                                <SelectItem value="11-50">11-50 nhân viên</SelectItem>
                                                <SelectItem value="51-200">51-200 nhân viên</SelectItem>
                                                <SelectItem value="201-500">201-500 nhân viên</SelectItem>
                                                <SelectItem value="501-1000">501-1000 nhân viên</SelectItem>
                                                <SelectItem value="1000+">1000+ nhân viên</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="founded_year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Năm thành lập</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1800}
                                                    max={new Date().getFullYear()}
                                                    placeholder="2020"
                                                    className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <Popover open={isFoundedYearOpen} onOpenChange={setIsFoundedYearOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-12 w-12 shrink-0 rounded-xl border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900"
                                                        aria-label="Chọn năm thành lập"
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0 rounded-xl border-slate-200 bg-white shadow-xl" align="end">
                                                    <Command>
                                                        <CommandInput placeholder="Tìm năm..." />
                                                        <CommandList className="max-h-64">
                                                            <CommandEmpty>Không tìm thấy năm phù hợp.</CommandEmpty>
                                                            <CommandGroup>
                                                                {foundedYearOptions.map((year) => (
                                                                    <CommandItem
                                                                        key={year}
                                                                        value={String(year)}
                                                                        onSelect={() => {
                                                                            field.onChange(year);
                                                                            setIsFoundedYearOpen(false);
                                                                        }}
                                                                        className="font-semibold"
                                                                    >
                                                                        {year}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Website Công ty</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com" className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="headquarters"
                                render={({ field }) => (
                                    <FormItem className="hidden">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Địa chỉ trụ sở chính</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tầng 12, Tòa nhà ABC, Phường X, Quận Y, TP.HCM" className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="province_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Tỉnh / Thành phố</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={provinceOptions}
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(String(value));
                                                    form.setValue('commune_id', '', { shouldDirty: true, shouldValidate: true });
                                                }}
                                                disabled={provinceLoading}
                                                placeholder="-- Chọn tỉnh/thành phố --"
                                                searchPlaceholder="Tìm tỉnh/thành phố..."
                                                emptyMessage="Không tìm thấy tỉnh/thành phố phù hợp."
                                                className="h-12 justify-between rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800 shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="commune_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Quận / Huyện</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={communeOptions}
                                                value={field.value}
                                                onChange={(value) => field.onChange(String(value))}
                                                disabled={!selectedProvinceId || communeLoading}
                                                placeholder="-- Chọn quận/huyện --"
                                                searchPlaceholder="Tìm quận/huyện..."
                                                emptyMessage="Không tìm thấy quận/huyện phù hợp."
                                                className="h-12 justify-between rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800 shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address_line"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Địa chỉ cụ thể</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số nhà, tên đường, tòa nhà, tầng..." className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[10px] font-black text-slate-400 italic opacity-80 mt-2">Địa chỉ này sẽ được dùng mặc định khi tạo tin tuyển dụng mới.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Giới thiệu văn hóa & Sứ mệnh</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Giới thiệu về công ty của bạn..."
                                                className="min-h-[160px] resize-y bg-white border-slate-200 rounded-xl font-bold text-slate-800 leading-relaxed shadow-sm"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] font-black text-slate-400 italic opacity-80 mt-2">Viết mô tả ngắn gọn và hấp dẫn để thu hút ứng viên.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-5 mt-10">
                        <Button type="button" variant="ghost" className="h-11 px-8 rounded-xl font-black text-slate-400 hover:text-slate-600 transition-colors">Hủy</Button>
                        <Button
                            type="submit"
                            className="bg-violet-600 text-white hover:bg-violet-700 h-11 px-10 rounded-xl font-black shadow-xl shadow-violet-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-3 opacity-70" /> : null}
                            Cập nhật hồ sơ
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
