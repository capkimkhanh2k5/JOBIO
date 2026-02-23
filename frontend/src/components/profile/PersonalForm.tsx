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
import { mockApi } from '../../services/mockApi';
import { toast } from 'sonner';

const personalSchema = z.object({
    full_name: z.string().min(2, "Họ tên quá ngắn"),
    bio: z.string().max(500, "Giới thiệu tối đa 500 ký tự"),
    dob: z.string(),
    gender: z.string(),
    address: z.object({
        province: z.string(),
        commune: z.string(),
        address_line: z.string()
    }),
    years_of_experience: z.number().min(0),
    highest_education: z.string()
});

export const PersonalForm = ({ profile }: { profile: any }) => {
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof personalSchema>>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            full_name: profile?.full_name || "",
            bio: profile?.bio || "",
            dob: profile?.dob || "",
            gender: profile?.gender || "other",
            address: {
                province: profile?.address?.province || "",
                commune: profile?.address?.commune || "",
                address_line: profile?.address?.address_line || ""
            },
            years_of_experience: profile?.years_of_experience || 0,
            highest_education: profile?.highest_education || "Bachelor"
        }
    });

    const mutation = useMutation({
        mutationFn: (data: any) => mockApi.updateProfile(profile.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success("Đã cập nhật thông tin cá nhân");
        }
    });

    const onSubmit = (values: z.infer<typeof personalSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Họ và tên</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nguyễn Văn A" {...field} className="glass-effect" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ngày sinh</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} className="glass-effect" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Giới tính</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="glass-effect">
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
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="years_of_experience"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Số năm kinh nghiệm</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="glass-effect" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Giới thiệu bản thân</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Chia sẻ ngắn gọn về bản thân và định hướng sự nghiệp của bạn..."
                                    className="glass-effect min-h-[120px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Địa chỉ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="address.province"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tỉnh / Thành phố</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="glass-effect" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address.commune"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quận / Huyện</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="glass-effect" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="address.address_line"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Địa chỉ cụ thể</FormLabel>
                                <FormControl>
                                    <Input {...field} className="glass-effect" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="px-8 rounded-full shadow-lg hover:shadow-primary/20 transition-all font-bold" disabled={mutation.isPending}>
                        {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
