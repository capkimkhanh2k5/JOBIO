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
        <div className="space-y-6">
            {/* LinkedIn-Style Unified Brand Header Card */}
            <Card className="border-border/60 bg-card shadow-sm rounded-3xl overflow-hidden">
                <div className="relative w-full h-44 sm:h-52 bg-gradient-to-r from-teal-600/30 via-emerald-600/20 to-teal-800/40 border-b border-border/50 group" aria-busy={isUploadingBanner}>
                    {bannerImageUrl ? (
                        <img
                            src={bannerImageUrl}
                            alt="Banner"
                            className={`h-full w-full object-cover transition-all duration-300 ${isUploadingBanner ? 'opacity-60 blur-[1px]' : ''}`}
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/40 bg-muted/40">
                            <ImageIcon className="w-10 h-10 opacity-30" />
                        </div>
                    )}

                    <label className="absolute right-4 top-4 cursor-pointer bg-card/90 hover:bg-card text-foreground px-4 py-2 rounded-xl text-xs font-black shadow-lg backdrop-blur-md flex items-center gap-2 border border-border/60 transition-all hover:scale-105">
                        {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> : <UploadCloud className="w-4 h-4 text-teal-600" />}
                        <span>{bannerImageUrl ? 'Đổi ảnh bìa' : 'Tải ảnh bìa'}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                    </label>
                </div>

                <div className="p-5 sm:p-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
                    <div className="flex items-end gap-4">
                        <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-card border-4 border-card shadow-xl flex items-center justify-center shrink-0" aria-busy={isUploadingLogo}>
                            {logoImageUrl ? (
                                <img src={logoImageUrl} alt="Logo" className={`w-full h-full object-contain p-2 transition-all ${isUploadingLogo ? 'opacity-50 blur-[1px]' : ''}`} />
                            ) : (
                                <div className="p-3 bg-muted rounded-xl">
                                    <Building2 className="w-10 h-10 text-muted-foreground/40" />
                                </div>
                            )}

                            <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity backdrop-blur-xs text-[10px] font-black uppercase tracking-wider">
                                {isUploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 text-white" />}
                                <span>Đổi Logo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>

                        <div className="mb-1 space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black text-foreground">{company?.company_name || 'Tên công ty'}</h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                                {company?.tax_code && <span>MST: <strong className="text-foreground">{company.tax_code}</strong></span>}
                                {company?.tax_code && <span>•</span>}
                                <span>{company?.industry?.name || 'Chưa chọn lĩnh vực'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground font-medium self-end hidden md:block">
                        Khuyến nghị Logo PNG 400x400px • Banner 1200x300px
                    </div>
                </div>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Brand Info Card */}
                    <Card className="border-border/60 bg-card shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2.5 text-base font-black text-foreground">
                                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                Thông tin thương hiệu & Quy mô
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Tên công ty</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: JOBIO Tech Corporation" className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs" {...field} />
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Mã số thuế</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0123456789" className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs" {...field} />
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Lĩnh vực hoạt động</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs">
                                                    <SelectValue placeholder="Chọn lĩnh vực" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-card border-border rounded-xl">
                                                {industries.map((industry) => (
                                                    <SelectItem key={industry.id} value={String(industry.id)} className="font-bold cursor-pointer">
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Quy mô nhân sự</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs">
                                                    <SelectValue placeholder="Chọn quy mô" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-card border-border rounded-xl">
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Năm thành lập</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1800}
                                                    max={new Date().getFullYear()}
                                                    placeholder="2020"
                                                    className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <Popover open={isFoundedYearOpen} onOpenChange={setIsFoundedYearOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-11 shrink-0 rounded-xl border-border bg-card text-muted-foreground shadow-xs cursor-pointer"
                                                        aria-label="Chọn năm thành lập"
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0 rounded-xl border-border bg-card shadow-xl" align="end">
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
                                                                        className="font-semibold cursor-pointer"
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website Công ty</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com" className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Address Card */}
                    <Card className="border-border/60 bg-card shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2.5 text-base font-black text-foreground">
                                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                Địa chỉ & Trụ sở chính
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="province_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Tỉnh / Thành phố</FormLabel>
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
                                                searchPlaceholder="Tìm tỉnh/thành..."
                                                emptyMessage="Không tìm thấy tỉnh/thành phố phù hợp."
                                                className="h-11 justify-between rounded-xl border border-border bg-card px-3 font-bold text-foreground shadow-xs"
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Quận / Huyện</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={communeOptions}
                                                value={field.value}
                                                onChange={(value) => field.onChange(String(value))}
                                                disabled={!selectedProvinceId || communeLoading}
                                                placeholder="-- Chọn quận/huyện --"
                                                searchPlaceholder="Tìm quận/huyện..."
                                                emptyMessage="Không tìm thấy quận/huyện phù hợp."
                                                className="h-11 justify-between rounded-xl border border-border bg-card px-3 font-bold text-foreground shadow-xs"
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
                                        <FormLabel className="text-xs font-bold text-muted-foreground">Địa chỉ cụ thể</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số nhà, tên đường, tòa nhà, tầng..." className="h-11 bg-card border-border rounded-xl font-bold text-foreground shadow-xs" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-[11px] text-muted-foreground">Địa chỉ này sẽ được sử dụng làm địa chỉ chính trên tin tuyển dụng.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* About & Culture Card */}
                    <Card className="border-border/60 bg-card shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2.5 text-base font-black text-foreground">
                                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                                    <FileText className="w-4 h-4" />
                                </div>
                                Giới thiệu & Văn hóa Doanh nghiệp
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Giới thiệu chi tiết về tầm nhìn, sứ mệnh và môi trường làm việc tại công ty..."
                                                className="min-h-[140px] resize-y bg-card border-border rounded-2xl font-medium text-foreground leading-relaxed shadow-xs"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white h-11 px-8 rounded-xl font-black shadow-md shadow-teal-500/15 transition-all cursor-pointer"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Cập nhật hồ sơ
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
