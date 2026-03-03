import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { toast } from 'sonner';
import { Linkedin, Github, Globe, Facebook, Banknote, CalendarDays, Link2 } from 'lucide-react';
import { Separator } from '../ui/separator';

const personalSchema = z.object({
    full_name: z.string().min(2, "Họ tên quá ngắn"),
    bio: z.string().max(800, "Giới thiệu tối đa 800 ký tự").optional(),
    dob: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']),
    address: z.object({
        province: z.string().optional(),
        commune: z.string().optional(),
        address_line: z.string().optional(),
    }),
    social_links: z.object({
        linkedin: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
        github: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
        facebook: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
        portfolio: z.string().url("URL không hợp lệ").or(z.literal("")).optional(),
    }),
    desired_salary: z.object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional(),
        currency: z.string().optional(),
    }),
    available_from: z.string().optional(),
    years_of_experience: z.number().min(0).max(50).optional(),
    highest_education: z.string().optional(),
});

type PersonalFormValues = z.infer<typeof personalSchema>;

const EDUCATION_LEVELS = [
    { value: 'High School', label: 'Trung học phổ thông' },
    { value: 'Associate', label: 'Cao đẳng' },
    { value: 'Bachelor', label: 'Đại học' },
    { value: 'Master', label: 'Thạc sĩ' },
    { value: 'PhD', label: 'Tiến sĩ' },
    { value: 'Other', label: 'Khác' },
];

const CURRENCIES = ['USD', 'VND', 'EUR', 'SGD'];

export const PersonalForm = ({ profile }: { profile: any }) => {
    const queryClient = useQueryClient();
    const form = useForm<PersonalFormValues>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            full_name: profile?.full_name || "",
            bio: profile?.bio || "",
            dob: profile?.dob || "",
            gender: profile?.gender || "other",
            address: {
                province: profile?.address?.province || "",
                commune: profile?.address?.commune || "",
                address_line: profile?.address?.address_line || "",
            },
            social_links: {
                linkedin: profile?.social_links?.linkedin || "",
                github: profile?.social_links?.github || "",
                facebook: profile?.social_links?.facebook || "",
                portfolio: profile?.social_links?.portfolio || "",
            },
            desired_salary: {
                min: profile?.desired_salary?.min || undefined,
                max: profile?.desired_salary?.max || undefined,
                currency: profile?.desired_salary?.currency || "USD",
            },
            available_from: profile?.available_from || "",
            years_of_experience: profile?.years_of_experience || 0,
            highest_education: profile?.highest_education || "Bachelor",
        }
    });

    const mutation = useMutation({
        mutationFn: (data: PersonalFormValues) => candidateService.update(Number(profile?.id ?? 0), data as any).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success("Đã cập nhật thông tin cá nhân!");
        },
        onError: () => toast.error("Không thể lưu thay đổi. Hãy thử lại.")
    });

    const onSubmit = (values: PersonalFormValues) => {
        mutation.mutate(values);
    };

    const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{children}</span>
        </div>
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ và tên <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nguyễn Văn A" {...field} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="dob"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày sinh</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giới tính</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="">
                                                <SelectValue placeholder="Chọn giới tính" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="male">Nam</SelectItem>
                                            <SelectItem value="female">Nữ</SelectItem>
                                            <SelectItem value="other">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="years_of_experience"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số năm kinh nghiệm</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={0} max={50}
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                            className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="highest_education"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trình độ học vấn cao nhất</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="">
                                                <SelectValue placeholder="Chọn trình độ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {EDUCATION_LEVELS.map(l => (
                                                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="available_from"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        Có thể bắt đầu từ
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                    </div>

                    <FormField control={form.control} name="bio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Giới thiệu bản thân</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Chia sẻ về bản thân, kỹ năng nổi bật và định hướng sự nghiệp..."
                                        className="min-h-[130px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <div className="flex justify-between items-center mt-1">
                                    <FormMessage />
                                    <span className="text-xs text-muted-foreground ml-auto">{(field.value || "").length}/800</span>
                                </div>
                            </FormItem>
                        )} />
                </div>

                <Separator className="opacity-50" />

                {/* Address */}
                <div>
                    <SectionTitle icon={Globe}>Địa chỉ</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <FormField control={form.control} name="address.province"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tỉnh / Thành phố</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Hồ Chí Minh" {...field} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="address.commune"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quận / Huyện</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Quận 1" {...field} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                    </div>

                    <FormField control={form.control} name="address.address_line"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Địa chỉ cụ thể</FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Đường ABC, Phường XYZ" {...field} className="" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                </div>

                <Separator className="opacity-50" />

                {/* Desired Salary */}
                <div>
                    <SectionTitle icon={Banknote}>Mức lương mong muốn</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="desired_salary.min"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lương tối thiểu</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={0}
                                            placeholder="2000"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                            className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="desired_salary.max"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lương tối đa</FormLabel>
                                    <FormControl>
                                        <Input type="number" min={0}
                                            placeholder="4000"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                            className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="desired_salary.currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Đơn vị tiền tệ</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                    </div>
                </div>

                <Separator className="opacity-50" />

                {/* Social Links */}
                <div>
                    <SectionTitle icon={Link2}>Liên kết mạng xã hội</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="social_links.linkedin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" /> LinkedIn
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://linkedin.com/in/yourname" {...field} value={field.value ?? ''} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="social_links.github"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Github className="w-3.5 h-3.5" /> GitHub
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://github.com/yourname" {...field} value={field.value ?? ''} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="social_links.facebook"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Facebook className="w-3.5 h-3.5 text-[#1877f2]" /> Facebook
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://facebook.com/yourname" {...field} value={field.value ?? ''} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="social_links.portfolio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Globe className="w-3.5 h-3.5 text-primary" /> Portfolio / Website
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://yourname.dev" {...field} value={field.value ?? ''} className="" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" className="px-10 rounded-full shadow-lg hover:shadow-primary/20 transition-all font-bold" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Đang lưu...
                            </span>
                        ) : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
