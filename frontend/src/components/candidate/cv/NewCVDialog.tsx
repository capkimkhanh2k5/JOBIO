import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { mockApi } from '@/services/mockApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    onClose: () => void;
    onCreated: (cv: any) => void;
}

const schema = z.object({
    cv_name: z.string().min(1, 'Vui lòng nhập tên CV').max(80, 'Tên quá dài'),
});
type FormValues = z.infer<typeof schema>;

const STARTER_TEMPLATES = [
    { id: 'tpl-1', name: 'Aurora Professional', color: 'from-violet-400 to-cyan-400' },
    { id: 'tpl-2', name: 'Neo Minimal', color: 'from-slate-400 to-slate-600' },
    { id: 'tpl-5', name: 'Tech Blueprint', color: 'from-cyan-500 to-sky-400' },
];

export function NewCVDialog({ onClose, onCreated }: Props) {
    const [selectedTemplate, setSelectedTemplate] = useState('tpl-1');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { cv_name: '' },
    });

    const createMutation = useMutation({
        mutationFn: (data: FormValues) =>
            mockApi.createCV('me', { cv_name: data.cv_name, template_id: selectedTemplate, template_name: STARTER_TEMPLATES.find(t => t.id === selectedTemplate)?.name ?? '', cv_data: {} }),
        onSuccess: (newCV) => onCreated(newCV),
    });

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 w-full max-w-md overflow-hidden border border-slate-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md">
                                <FileText className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Tạo CV mới</h3>
                                <p className="text-xs text-muted-foreground">Bắt đầu từ template yêu thích</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-5">
                        {/* CV Name */}
                        <div>
                            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Tên CV</Label>
                            <Input
                                {...register('cv_name')}
                                placeholder="vd: Frontend Developer 2025, Portfolio Tech..."
                                className="border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-100 rounded-xl"
                                autoFocus
                            />
                            {errors.cv_name && (
                                <p className="text-xs text-destructive mt-1">{errors.cv_name.message}</p>
                            )}
                        </div>

                        {/* Template picker */}
                        <div>
                            <Label className="text-sm font-semibold text-slate-700 mb-3 block">Chọn template khởi đầu</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {STARTER_TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`relative rounded-xl border-2 overflow-hidden transition-all duration-150 ${selectedTemplate === t.id
                                                ? 'border-violet-500 shadow-md shadow-violet-200'
                                                : 'border-slate-200 hover:border-violet-300'
                                            }`}
                                    >
                                        <div className={`h-16 bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                                            <FileText className="w-5 h-5 text-white/80" />
                                        </div>
                                        <div className="py-2 px-1">
                                            <p className="text-[10px] font-semibold text-slate-700 line-clamp-1">{t.name}</p>
                                        </div>
                                        {selectedTemplate === t.id && (
                                            <div className="absolute top-1.5 right-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-white fill-violet-500" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2">
                                Bạn có thể đổi template bất cứ lúc nào trong CV Builder.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 border-slate-200"
                                onClick={onClose}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 text-white border-0 shadow-md hover:opacity-90"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? 'Đang tạo...' : 'Tạo CV'}
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    );
}
