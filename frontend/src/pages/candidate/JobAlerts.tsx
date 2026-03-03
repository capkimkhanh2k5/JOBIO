import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Bell, Plus, Zap, Trash2, Mail, Bot, ChevronRight, MapPin, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertService } from '@/services/alertService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';

const alertSchema = z.object({
    alert_name: z.string().min(1, "Vui lòng nhập tên Alert"),
    keywords: z.string().optional(),
    category: z.string().optional(),
    frequency: z.string(),
    salary_min: z.string().optional(),
    email_notification: z.boolean(),
    use_ai_matching: z.boolean(),
});

type AlertFormValues = z.infer<typeof alertSchema>;

export default function JobAlerts() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewingMatchedAlertId, setViewingMatchedAlertId] = useState<string | null>(null);

    const { data: alerts, isLoading } = useQuery({
        queryKey: ['jobAlerts'],
        queryFn: () => alertService.list().then(r => r.data.results),
    });

    const { data: matchedJobs, isLoading: isLoadingMatched } = useQuery({
        queryKey: ['matchedJobs', viewingMatchedAlertId],
        queryFn: () => alertService.matches(Number(viewingMatchedAlertId!)).then(r => r.data.results),
        enabled: !!viewingMatchedAlertId
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) => alertService.toggle(Number(id)).then(r => r.data),
        onSuccess: (_, { id, is_active }) => {
            queryClient.setQueryData(['jobAlerts'], (old: any) =>
                old?.map((a: any) => a.id === id ? { ...a, is_active } : a)
            );
            toast.success(is_active ? "Đã bật Job Alert" : "Đã tắt Job Alert");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => alertService.delete(Number(id)),
        onSuccess: (_, id) => {
            queryClient.setQueryData(['jobAlerts'], (old: any) => old?.filter((a: any) => a.id !== id));
            toast.success("Đã xóa Job Alert");
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => alertService.create(data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobAlerts'] });
            toast.success("Đã tạo Job Alert mới");
            setIsCreateOpen(false);
            form.reset();
        }
    });

    const form = useForm<AlertFormValues>({
        resolver: zodResolver(alertSchema),
        defaultValues: {
            alert_name: '',
            keywords: '',
            category: 'all',
            frequency: 'daily',
            salary_min: '',
            email_notification: true,
            use_ai_matching: true,
        }
    });

    const onSubmit = (data: AlertFormValues) => {
        createMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
                <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-600">
                        Job Alerts
                    </h1>
                    <p className="text-slate-500 mt-1">Nhận thông báo tự động về các công việc phù hợp nhất</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all border-none">
                            <Plus className="w-4 h-4 mr-2" /> Tạo Alert mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-slate-200">
                        <div className="bg-gradient-to-br from-violet-500 to-cyan-600 p-6 text-white text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <DialogTitle className="text-xl font-bold">Tạo Job Alert</DialogTitle>
                            <p className="text-white/80 text-sm mt-1">Tùy chỉnh thông báo việc làm tự động</p>
                        </div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="alert_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên Alert</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Vd: Frontend Dev HCM" className="rounded-xl border-slate-200 focus-visible:ring-violet-500" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="keywords"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Từ khóa</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Vd: React, Node.js" className="rounded-xl border-slate-200 focus-visible:ring-violet-500" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="frequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tần suất nhận</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 focus:ring-violet-500">
                                                            <SelectValue placeholder="Chọn tần suất" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="instant">Ngay lập tức</SelectItem>
                                                        <SelectItem value="daily">Hàng ngày</SelectItem>
                                                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4 py-2 border-t border-slate-100 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="use_ai_matching"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4 bg-violet-50/50">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base font-semibold text-violet-900 flex items-center gap-2">
                                                        <Bot className="w-4 h-4 text-violet-600" />
                                                        Sử dụng AI Matching
                                                    </FormLabel>
                                                    <FormDescription className="text-xs">
                                                        AI sẽ phân tích CV của bạn để tìm việc phù hợp nhất thay vì chỉ dựa vào từ khóa.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-violet-600"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email_notification"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-slate-500" />
                                                        Nhận qua Email
                                                    </FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="data-[state=checked]:bg-cyan-500"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                                    >
                                        {createMutation.isPending ? "Đang tạo..." : "Lưu Job Alert"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {alerts?.length === 0 ? (
                <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-600">
                        <Bell className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có Job Alert nào</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Tạo Job Alert để không bỏ lỡ những cơ hội việc làm tốt nhất dành riêng cho bạn.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {alerts?.map((alert: any) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className={`relative overflow-hidden transition-all duration-300 rounded-3xl border ${alert.is_active ? 'bg-white shadow-sm hover:shadow-md hover:border-violet-200' : 'bg-slate-50/50 opacity-70 grayscale-[30%] border-slate-200'}`}>
                                {alert.use_ai_matching && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm">
                                        <Bot className="w-3 h-3" /> AI MATCH
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="pr-12">
                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{alert.alert_name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md"><Clock className="w-3 h-3" /> {alert.frequency === 'daily' ? 'Hàng ngày' : alert.frequency === 'weekly' ? 'Hàng tuần' : 'Ngay lập tức'}</span>
                                                {alert.email_notification && <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md"><Mail className="w-3 h-3" /> Email</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end z-10 relative">
                                            <Switch
                                                checked={alert.is_active}
                                                onCheckedChange={(c) => toggleMutation.mutate({ id: alert.id, is_active: c })}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        {alert.keywords && (
                                            <div className="flex flex-wrap gap-2">
                                                {alert.keywords.split(',').map((k: string) => (
                                                    <Badge key={k} variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg">{k.trim()}</Badge>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                                            {alert.locations && alert.locations.length > 0 && (
                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-500" /> {alert.locations.join(', ')}</span>
                                            )}
                                            {alert.salary_min > 0 && (
                                                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-500" /> Từ {alert.salary_min}$</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="text-xs text-slate-400">
                                            Lần gửi cuối: {new Date(alert.last_sent_date).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                onClick={() => deleteMutation.mutate(alert.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                                onClick={() => setViewingMatchedAlertId(alert.id)}
                                            >
                                                Xem việc khớp <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* View matched jobs Sheet */}
            <Sheet open={!!viewingMatchedAlertId} onOpenChange={(c) => !c && setViewingMatchedAlertId(null)}>
                <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 bg-slate-50 border-l-0 overflow-hidden flex flex-col">
                    <SheetHeader className="p-6 bg-white border-b border-slate-200">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                            Việc làm phù hợp
                        </SheetTitle>
                        <SheetDescription>Dựa trên thiết lập của Job Alert này</SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        {isLoadingMatched ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                            </div>
                        ) : matchedJobs?.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-500">Chưa tìm thấy việc làm nào phù hợp. Thử mở rộng bộ lọc của bạn.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {matchedJobs?.map((job: any) => (
                                    <div key={job.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-violet-300 transition-colors group">
                                        <div className="flex items-start gap-4">
                                            <img src={job.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <Link to={`/jobs/${job.id}`}>
                                                        <h4 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-violet-600 transition-colors cursor-pointer">{job.title}</h4>
                                                    </Link>
                                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 whitespace-nowrap">
                                                        {job.match_score}% Match
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">{job.company_name}</p>
                                                <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-2">
                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><MapPin className="w-3 h-3" /> {job.locations}</span>
                                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><DollarSign className="w-3 h-3" /> {job.salary_min} - {job.salary_max}$</span>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    {!job.is_viewed && <Badge className="bg-blue-500 hover:bg-blue-600 text-[10px] h-5">Mới</Badge>}
                                                    {job.is_sent && <Badge variant="outline" className="text-[10px] h-5 border-slate-200 text-slate-500"><Mail className="w-3 h-3 mr-1" /> Đã gửi</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}
