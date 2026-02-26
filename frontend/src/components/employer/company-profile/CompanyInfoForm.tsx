import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'sonner';

import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud, Building2, MapPin, Globe, Calendar, FileText } from 'lucide-react';

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
        mutationFn: (data: FormValues) => apiClient.updateCompany(company.id, data),
        onSuccess: () => {
            toast.success('Đã cập nhật thông tin công ty.');
            queryClient.invalidateQueries({ queryKey: ['employerCompany'] });
        },
        onError: () => {
            toast.error('Lỗi khi cập nhật thông tin công ty.');
        },
    });

    const logoMutation = useMutation({
        mutationFn: (file: File) => apiClient.uploadCompanyLogo(company.id, file),
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
        mutationFn: (file: File) => apiClient.uploadCompanyBanner(company.id, file),
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
        <div className="space-y-6">
            <Card className="border-cyan-500/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-cyan-400" />
                        Hình ảnh nhận diện
                    </CardTitle>
                    <CardDescription>Logo và ảnh bìa hiển thị trên trang hồ sơ và thẻ tin tuyển dụng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Banner Section */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Ảnh bìa hố sơ (Banner)</p>
                        <div className="relative group w-full h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {company?.banner_url ? (
                                <img src={company.banner_url} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center">
                                    <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-xs">Chưa có ảnh bìa</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur text-white flex items-center gap-2 text-sm font-medium transition-colors">
                                    {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    Thay đổi
                                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Logo Section */}
                    <div className="flex gap-6 items-center">
                        <div className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg">
                            {company?.logo_url ? (
                                <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building2 className="w-8 h-8 text-muted-foreground opacity-50" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 text-white transition-colors">
                                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                                </label>
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Logo công ty</p>
                            <p className="text-xs text-muted-foreground">Khuyến nghị kích thước 400x400px, định dạng JPG/PNG. Nền trong suốt sẽ đẹp hơn.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card className="border-cyan-500/10 bg-white/5 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-cyan-400" />
                                Thông tin cơ bản
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>Tên công ty</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: JOBIO Tech Corporation" className="bg-white/50 dark:bg-slate-900/50" {...field} />
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
                                        <FormLabel>Mã số thuế</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0123456789" className="bg-white/50 dark:bg-slate-900/50" {...field} />
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
                                        <FormLabel>Lĩnh vực hoạt động</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/50 dark:bg-slate-900/50">
                                                    <SelectValue placeholder="Chọn lĩnh vực" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-slate-900">
                                                {industries?.map(ind => (
                                                    <SelectItem key={ind.id} value={ind.name}>{ind.name}</SelectItem>
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
                                        <FormLabel>Quy mô công ty</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/50 dark:bg-slate-900/50">
                                                    <SelectValue placeholder="Chọn quy mô" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-slate-900">
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
                                        <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 opacity-70" /> Năm thành lập</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="2020" className="bg-white/50 dark:bg-slate-900/50" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                                        <FormLabel className="flex items-center gap-2"><Globe className="w-4 h-4 opacity-70" /> Website</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com" className="bg-white/50 dark:bg-slate-900/50" {...field} />
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
                                        <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-70" /> Địa chỉ trụ sở chính</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tầng 12, Tòa nhà ABC, Phường X, Quận Y, TP.HCM" className="bg-white/50 dark:bg-slate-900/50" {...field} />
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
                                        <FormLabel>Mô tả công ty (Giới thiệu, Văn hóa, Sứ mệnh...)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Giới thiệu về công ty của bạn..."
                                                className="min-h-[150px] resize-y bg-white/50 dark:bg-slate-900/50"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>Viết mô tả ngắn gọn và hấp dẫn để thu hút ứng viên.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" className="min-w-[120px]">Hủy</Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-none shadow-lg shadow-cyan-500/20 text-white min-w-[150px]"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Lưu thay đổi
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
