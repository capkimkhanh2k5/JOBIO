import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, GripVertical, Trash2, Heart, Loader2, Pencil, Check, X } from 'lucide-react';
import { Reorder } from 'framer-motion';

export function BenefitsManagement({ companyId }: { companyId: string }) {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newBenefit, setNewBenefit] = useState({ category_id: '', benefit_name: '', description: '' });
    const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);
    const [editingBenefit, setEditingBenefit] = useState({ category_id: '', benefit_name: '', description: '' });
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    const { data: benefits, isLoading } = useQuery({
        queryKey: ['companyBenefits', companyId],
        queryFn: () => companyService.listBenefits(Number(companyId)).then(r => r.data),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['benefitCategories'],
        queryFn: () => companyService.listBenefitCategories().then(r => r.data),
    });

    const benefitCategories = Array.isArray(categoriesData)
        ? categoriesData
        : ((categoriesData as any)?.results || []);

    const addMutation = useMutation({
        mutationFn: (data: any) => companyService.addBenefit(Number(companyId), data).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã thêm phúc lợi mới.');
            queryClient.invalidateQueries({ queryKey: ['companyBenefits', companyId] });
            setIsAdding(false);
            setNewBenefit({ category_id: '', benefit_name: '', description: '' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ benefitId, data }: { benefitId: number; data: any }) => (
            companyService.updateBenefit(Number(companyId), benefitId, data).then(r => r.data)
        ),
        onSuccess: () => {
            toast.success('Đã cập nhật phúc lợi.');
            queryClient.invalidateQueries({ queryKey: ['companyBenefits', companyId] });
            setEditingBenefitId(null);
            setEditingBenefit({ category_id: '', benefit_name: '', description: '' });
        },
        onError: () => {
            toast.error('Lỗi khi cập nhật phúc lợi.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (benefitId: string) => companyService.removeBenefit(Number(companyId), Number(benefitId)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã xóa phúc lợi.');
            queryClient.invalidateQueries({ queryKey: ['companyBenefits', companyId] });
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error('Lỗi khi xóa phúc lợi.');
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
        if (!newBenefit.category_id || !newBenefit.benefit_name.trim() || !newBenefit.description.trim()) {
            toast.error('Vui lòng điền đủ thông tin phúc lợi');
            return;
        }
        addMutation.mutate({
            category_id: Number(newBenefit.category_id),
            benefit_name: newBenefit.benefit_name.trim(),
            description: newBenefit.description.trim(),
        });
    };

    const getBenefitCategoryId = (benefit: any) => {
        if (benefit.category_id) return String(benefit.category_id);
        if (typeof benefit.category === 'object' && benefit.category?.id) return String(benefit.category.id);
        if (benefit.category) return String(benefit.category);
        return '';
    };

    const handleStartEdit = (benefit: any) => {
        setIsAdding(false);
        setEditingBenefitId(Number(benefit.id));
        setEditingBenefit({
            category_id: getBenefitCategoryId(benefit),
            benefit_name: benefit.benefit_name || benefit.name || '',
            description: benefit.description || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingBenefitId(null);
        setEditingBenefit({ category_id: '', benefit_name: '', description: '' });
    };

    const handleUpdate = () => {
        if (!editingBenefitId) return;
        if (!editingBenefit.category_id || !editingBenefit.benefit_name.trim() || !editingBenefit.description.trim()) {
            toast.error('Vui lòng điền đủ thông tin phúc lợi');
            return;
        }
        updateMutation.mutate({
            benefitId: editingBenefitId,
            data: {
                category_id: Number(editingBenefit.category_id),
                benefit_name: editingBenefit.benefit_name.trim(),
                description: editingBenefit.description.trim(),
            },
        });
    };

    const getBenefitName = (benefit: any) => benefit.benefit_name || benefit.name || 'Phúc lợi';

    const getBenefitCategoryName = (benefit: any) => (
        benefit.category_name
        || benefit.category?.name
        || benefitCategories.find((category: any) => String(category.id) === String(benefit.category))?.name
        || 'Chưa phân loại'
    );

    return (
        <>
        <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-violet-600" />
                        Phúc lợi & Chế độ
                    </CardTitle>
                    <CardDescription>Giới thiệu những quyền lợi đặc biệt dành cho nhân viên (Tối đa 8 khoản).</CardDescription>
                </div>
                <Button
                    onClick={() => {
                        setEditingBenefitId(null);
                        setEditingBenefit({ category_id: '', benefit_name: '', description: '' });
                        setIsAdding(true);
                    }}
                    disabled={isAdding || (benefits?.length || 0) >= 8}
                    variant="outline"
                    className="border-violet-500/30 bg-white text-violet-600 hover:bg-violet-50"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm phúc lợi
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    </div>
                ) : benefits && benefits.length > 0 ? (
                    <Reorder.Group axis="y" values={benefits} onReorder={handleReorder} className="space-y-3">
                        {benefits.map((benefit: any) => {
                            const isEditing = editingBenefitId === Number(benefit.id);

                            return (
                                <Reorder.Item
                                    key={benefit.id}
                                    value={benefit}
                                    dragListener={!isEditing}
                                    className={`bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow ${isEditing ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                                >
                                    {isEditing ? (
                                        <div className="w-full space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3">
                                                <Select value={editingBenefit.category_id} onValueChange={(val) => setEditingBenefit({ ...editingBenefit, category_id: val })}>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Chọn danh mục" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white">
                                                        {benefitCategories.map((cat: any) => (
                                                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Tên phúc lợi"
                                                    value={editingBenefit.benefit_name}
                                                    onChange={(e) => setEditingBenefit({ ...editingBenefit, benefit_name: e.target.value })}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <Input
                                                placeholder="Mô tả chi tiết"
                                                value={editingBenefit.description}
                                                onChange={(e) => setEditingBenefit({ ...editingBenefit, description: e.target.value })}
                                                className="bg-white"
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={updateMutation.isPending}>
                                                    <X className="w-4 h-4 mr-2" />
                                                    Hủy
                                                </Button>
                                                <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                                    Lưu
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <GripVertical className="w-5 h-5 text-slate-400 mt-1 cursor-grab" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-slate-900">{getBenefitName(benefit)}</h4>
                                                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-violet-50 text-violet-700 border border-violet-100">
                                                        {getBenefitCategoryName(benefit)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">{benefit.description}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-violet-600 hover:bg-violet-50" onClick={() => handleStartEdit(benefit)} aria-label="Chỉnh sửa phúc lợi">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(benefit)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Reorder.Item>
                            );
                        })}
                    </Reorder.Group>
                ) : (
                    <div className="text-center py-12 border border-dashed rounded-xl border-slate-200 text-slate-500">
                        Bạn chưa thêm phúc lợi nào.
                    </div>
                )}

                {isAdding && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-violet-500/20 mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="font-medium text-sm">Thêm phúc lợi mới</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select value={newBenefit.category_id} onValueChange={(val) => setNewBenefit({ ...newBenefit, category_id: val })}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {benefitCategories.map((cat: any) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Tên phúc lợi (VD: Bảo hiểm sức khỏe)"
                                value={newBenefit.benefit_name}
                                onChange={(e) => setNewBenefit({ ...newBenefit, benefit_name: e.target.value })}
                                className="bg-white"
                            />
                            <div className="md:col-span-2">
                                <Input
                                    placeholder="Mô tả chi tiết"
                                    value={newBenefit.description}
                                    onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Hủy</Button>
                            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {addMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                Thêm
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa phúc lợi này?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Phúc lợi "{deleteTarget ? getBenefitName(deleteTarget) : ''}" sẽ bị xóa khỏi hồ sơ công ty. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-slate-200" disabled={deleteMutation.isPending}>
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold border-none"
                        disabled={deleteMutation.isPending}
                        onClick={(event) => {
                            event.preventDefault();
                            if (deleteTarget) deleteMutation.mutate(String(deleteTarget.id));
                        }}
                    >
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
