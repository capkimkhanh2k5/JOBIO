import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Search, Filter, Trash2, Edit2, Clock, MapPin, Briefcase, LucideIcon, Mail, Laptop } from 'lucide-react';
import { candidateService } from '@/services/candidateService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

export default function JobAlerts() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState<any>(null);

    // Fetch alerts
    const { data: alerts, isLoading } = useQuery({
        queryKey: ['candidate', 'job-alerts'],
        queryFn: () => candidateService.getJobAlerts().then(r => r.data),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => candidateService.deleteJobAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'job-alerts'] });
            toast.success("Đã xóa thông báo việc làm.");
        }
    });

    // Toggle status mutation
    const toggleMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => candidateService.updateJobAlert(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidate', 'job-alerts'] });
        }
    });

    return (
        <div className="min-h-screen relative pb-12 w-full flex-1">
            <PageHeader
                title="Thông báo việc làm"
                description="Tự động nhận thông báo khi có việc làm phù hợp với tiêu chí của bạn."
                icon={Bell}
                action={
                    <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11 px-6 shadow-md shadow-violet-500/20"
                        onClick={() => {
                            setEditingAlert(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <Plus size={18} className="mr-2" />
                        Tạo thông báo mới
                    </Button>
                }
            />

            <div className="p-6 lg:p-8 space-y-8 w-full flex-1 relative z-10">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                    </div>
                ) : !alerts?.length ? (
                    <div className="py-20 text-center flex flex-col items-center bg-white/50 border border-dashed border-slate-200 rounded-3xl w-full shadow-sm backdrop-blur-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <Bell className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn chưa có thông báo nào</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            Hãy tạo thông báo việc làm để không bỏ lỡ những cơ hội nghề nghiệp phù hợp nhất với bạn.
                        </p>
                        <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 px-8 shadow-lg shadow-violet-500/20"
                            onClick={() => setIsFormOpen(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            Tạo thông báo ngay
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {alerts.map((alert: any, idx: number) => (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                                >
                                    <Card className="p-6 bg-white border-slate-200 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 rounded-2xl group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                                                    <Mail className="w-6 h-6 text-violet-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-violet-600 transition-colors">{alert.title}</h3>
                                                    <p className="text-xs text-slate-500 font-medium">Tần suất: {alert.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={alert.is_active}
                                                    onCheckedChange={(checked) => toggleMutation.mutate({ id: alert.id, data: { is_active: checked } })}
                                                    className="data-[state=checked]:bg-violet-600 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {alert.keyword && (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium px-3 py-1">
                                                        <Search size={12} className="mr-1.5 opacity-60" /> {alert.keyword}
                                                    </Badge>
                                                )}
                                                {alert.location && (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium px-3 py-1">
                                                        <MapPin size={12} className="mr-1.5 opacity-60" /> {alert.location}
                                                    </Badge>
                                                )}
                                                {alert.job_type && (
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium px-3 py-1">
                                                        <Briefcase size={12} className="mr-1.5 opacity-60" /> {alert.job_type}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                                <Clock size={12} />
                                                Đã tạo: {new Date(alert.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-9 h-9 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                                    onClick={() => {
                                                        setEditingAlert(alert);
                                                        setIsFormOpen(true);
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-9 h-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    onClick={() => deleteMutation.mutate(alert.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none p-0 overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Bell className="w-24 h-24" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic">{editingAlert ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}</DialogTitle>
                        <DialogDescription className="text-violet-100 mt-2 font-medium">
                            Chúng tôi sẽ gửi email cho bạn khi có việc làm mới phù hợp với tiêu chí này.
                        </DialogDescription>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-white">
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="font-bold text-slate-700">Tên thông báo (Gợi nhớ)</Label>
                                <Input
                                    id="title"
                                    placeholder="Ví dụ: Senior React Developer tại Hà Nội"
                                    className="rounded-xl border-slate-200 h-11 focus-visible:ring-violet-600 py-6 text-base"
                                    defaultValue={editingAlert?.title}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="keyword" className="font-bold text-slate-700">Từ khóa kỹ năng</Label>
                                <Input
                                    id="keyword"
                                    placeholder="Ví dụ: React, Node.js, UI/UX..."
                                    className="rounded-xl border-slate-200 h-11 focus-visible:ring-violet-600 py-6 text-base"
                                    defaultValue={editingAlert?.keyword}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="location" className="font-bold text-slate-700">Địa điểm</Label>
                                    <Input
                                        id="location"
                                        placeholder="Ví dụ: Hà Nội, Remote..."
                                        className="rounded-xl border-slate-200 h-11 focus-visible:ring-violet-600 py-6 text-base"
                                        defaultValue={editingAlert?.location}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="frequency" className="font-bold text-slate-700">Tần suất nhận</Label>
                                    <Select defaultValue={editingAlert?.frequency || 'daily'}>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-11 focus:ring-violet-600 py-6 text-base">
                                            <SelectValue placeholder="Chọn tần nuôi" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="daily" className="py-3">Hàng ngày</SelectItem>
                                            <SelectItem value="weekly" className="py-3">Hàng tuần</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex flex-row justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl h-12 px-6 font-bold text-slate-500">
                            Hủy bỏ
                        </Button>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-violet-500/20">
                            {editingAlert ? 'Lưu thay đổi' : 'Tạo ngay'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
