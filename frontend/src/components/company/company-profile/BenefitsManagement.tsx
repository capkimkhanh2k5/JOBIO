import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, Trash2, Heart, Loader2 } from 'lucide-react';
import { Reorder } from 'framer-motion';

export function BenefitsManagement({ companyId }: { companyId: string }) {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newBenefit, setNewBenefit] = useState({ category: '', name: '', description: '' });

    const { data: benefits, isLoading } = useQuery({
        queryKey: ['companyBenefits', companyId],
        queryFn: () => companyService.listBenefits(Number(companyId)).then(r => r.data),
    });

    const { data: categories } = useQuery({
        queryKey: ['benefitCategories'],
        queryFn: () => companyService.listBenefitCategories().then(r => r.data),
    });

    const addMutation = useMutation({
        mutationFn: (data: any) => companyService.addBenefit(Number(companyId), data).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã thêm phúc lợi mới.');
            queryClient.invalidateQueries({ queryKey: ['companyBenefits', companyId] });
            setIsAdding(false);
            setNewBenefit({ category: '', name: '', description: '' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (benefitId: string) => companyService.removeBenefit(Number(companyId), Number(benefitId)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã xóa phúc lợi.');
            queryClient.invalidateQueries({ queryKey: ['companyBenefits', companyId] });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: (_order: string[]) => Promise.resolve(),  // TODO: no reorder endpoint
        onSettled: () => {
            // Background sync, no toast needed for reorder success unless there is an error
        }
    });

    const handleReorder = (newOrder: any[]) => {
        // Optimistic update locally
        queryClient.setQueryData(['companyBenefits', companyId], newOrder);
        reorderMutation.mutate(newOrder.map(b => b.id));
    };

    const handleAdd = () => {
        if (!newBenefit.category || !newBenefit.name || !newBenefit.description) {
            toast.error('Vui lòng điền đủ thông tin phúc lợi');
            return;
        }
        addMutation.mutate(newBenefit);
    };

    return (
        <Card className="border-cyan-500/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-cyan-400" />
                        Phúc lợi & Chế độ
                    </CardTitle>
                    <CardDescription>Giới thiệu những quyền lợi đặc biệt dành cho nhân viên (Tối đa 8 khoản).</CardDescription>
                </div>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding || (benefits?.length || 0) >= 8} variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm phúc lợi
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    </div>
                ) : benefits && benefits.length > 0 ? (
                    <Reorder.Group axis="y" values={benefits} onReorder={handleReorder} className="space-y-3">
                        {benefits.map((benefit: any) => (
                            <Reorder.Item key={benefit.id} value={benefit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-grab" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold">{benefit.name}</h4>
                                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {benefit.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => deleteMutation.mutate(benefit.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                ) : (
                    <div className="text-center py-12 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-muted-foreground">
                        Bạn chưa thêm phúc lợi nào.
                    </div>
                )}

                {isAdding && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-cyan-500/20 mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="font-medium text-sm">Thêm phúc lợi mới</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select value={newBenefit.category} onValueChange={(val) => setNewBenefit({ ...newBenefit, category: val })}>
                                <SelectTrigger className="bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900">
                                    {categories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Tên phúc lợi (VD: Bảo hiểm sức khỏe)"
                                value={newBenefit.name}
                                onChange={(e) => setNewBenefit({ ...newBenefit, name: e.target.value })}
                                className="bg-white dark:bg-slate-900"
                            />
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Mô tả chi tiết"
                                    value={newBenefit.description}
                                    onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
                                    className="bg-white dark:bg-slate-900"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Hủy</Button>
                            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                                {addMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                Thêm
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
