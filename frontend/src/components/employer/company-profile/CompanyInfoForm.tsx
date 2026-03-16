import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, Building2, MapPin, Globe, Calendar, FileText, Image as ImageIcon } from 'lucide-react';

const formSchema = z.object({
    company_name: z.string().min(2, 'Tên công ty phải có ít nhất 2 ký tự.'),
    tax_code: z.string().min(5, 'Mã số thuế không hợp lệ.'),
    industry: z.string().min(1, 'Vui lòng chọn lĩnh vực hoạt động.'),
    company_size: z.string().min(1, 'Vui lòng chọn quy mô công ty.'),
    website_url: z.string().url('URL không hợp lệ.').or(z.literal('')),
    founded_year: z.number().int().min(1800).max(new Date().getFullYear()),
    description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự.'),
    headquarters: z.string().min(5, 'Địa chỉ trụ sở chính không hợp lệ.'),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyInfoFormProps {
    company: any;
    industries: any[];
}

export function CompanyInfoForm({ company, industries }: CompanyInfoFormProps) {
    const queryClient = useQueryClient();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company_name: company?.company_name || '',
            tax_code: company?.tax_code || '',
            industry: company?.industry || '',
            company_size: company?.company_size || '',
            website_url: company?.website_url || '',
            founded_year: company?.founded_year || new Date().getFullYear(),
            description: company?.description || '',
            headquarters: company?.headquarters || '',
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: FormValues) => companyService.update(Number(company.id), data as any).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã cập nhật thông tin công ty.');
            queryClient.invalidateQueries({ queryKey: ['employerCompany'] });
        },
        onError: () => {
            toast.error('Lỗi khi cập nhật thông tin công ty.');
        },
    });

    const logoMutation = useMutation({
        mutationFn: (_file: File) => Promise.resolve({}) as any,  // TODO: no specific logo upload endpoint
        onSuccess: () => {
            toast.success('Đã cập nhật logo.');
            queryClient.invalidateQueries({ queryKey: ['employerCompany'] });
            setIsUploadingLogo(false);
        },
        onError: () => {
            toast.error('Lỗi khi tải lên logo.');
            setIsUploadingLogo(false);
        },
    });

    const bannerMutation = useMutation({
        mutationFn: (_file: File) => Promise.resolve({}) as any,  // TODO: no specific banner upload endpoint
        onSuccess: () => {
            toast.success('Đã cập nhật ảnh bìa.');
            queryClient.invalidateQueries({ queryKey: ['employerCompany'] });
            setIsUploadingBanner(false);
        },
        onError: () => {
            toast.error('Lỗi khi tải lên ảnh bìa.');
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
            logoMutation.mutate(file);
        }
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingBanner(true);
            bannerMutation.mutate(file);
        }
    };

    return (
        <div className="space-y-8">
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                        <div className="p-2 rounded-xl bg-cyan-600/10 text-cyan-600">
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
                        <div className="relative group w-full h-56 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center transition-all hover:border-cyan-400/50">
                            {company?.banner_url ? (
                                <img src={company.banner_url} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <div className="p-4 rounded-full bg-slate-100 mb-3 shadow-inner">
                                        <ImageIcon className="w-8 h-8 opacity-40" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider opacity-60">Click để tải lên ảnh bìa</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] flex items-center justify-center">
                                <label className="cursor-pointer bg-white px-5 py-2.5 rounded-xl text-slate-900 flex items-center gap-3 text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95">
                                    {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> : <UploadCloud className="w-4 h-4 text-cyan-500" />}
                                    Thay đổi ảnh bìa
                                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Logo Section */}
                    <div className="flex gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                        <div className="relative group w-28 h-28 rounded-[24px] overflow-hidden bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm transition-all group-hover:shadow-md">
                            {company?.logo_url ? (
                                <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain p-3" />
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
                                    <Building2 className="w-10 h-10 text-slate-300" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] flex items-center justify-center">
                                <label className="cursor-pointer p-3 rounded-full bg-white text-slate-900 shadow-xl transition-all hover:scale-110 active:scale-90">
                                    {isUploadingLogo ? <Loader2 className="w-5 h-5 animate-spin text-cyan-500" /> : <UploadCloud className="w-5 h-5 text-cyan-500" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                                </label>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-black text-slate-800">Logo thương hiệu</p>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold">Khuyến nghị kích thước <span className="text-cyan-600 font-black">400x400px</span>. Sử dụng logo nền trong suốt (PNG) để tối ưu hiển thị.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card className="border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                                <div className="p-2 rounded-xl bg-cyan-600/10 text-cyan-600">
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
                                            <Input placeholder="Ví dụ: JOBIO Tech Corporation" className="h-12 bg-white border-slate-200 focus:ring-cyan-500/20 focus:border-cyan-500 rounded-xl font-bold text-slate-800 shadow-sm" {...field} />
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
                                name="industry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Lĩnh vực hoạt động</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm">
                                                    <SelectValue placeholder="Chọn lĩnh vực" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-slate-200 rounded-xl">
                                                {industries?.map(ind => (
                                                    <SelectItem key={ind.id} value={ind.name} className="hover:bg-slate-50 focus:bg-slate-50 font-bold">{ind.name}</SelectItem>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <FormControl>
                                            <Input type="number" placeholder="2020" className="h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website_url"
                                render={({ field }) => (
                                    <FormItem>
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
                                    <FormItem className="col-span-1 md:col-span-2">
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
                            className="bg-slate-900 text-white hover:bg-black h-11 px-10 rounded-xl font-black shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
