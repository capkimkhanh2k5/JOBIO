import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cvService } from '@/services/cvService';
import { useUserStore } from '@/store/userStore';
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

// Map file_name → gradient color for visual variety in the picker
const TEMPLATE_GRADIENTS: Record<string, string> = {
    'modern.html':        'from-slate-400 to-slate-600',
    'ATS_Prime.html':     'from-sky-500 to-blue-600',
    'editorialBold.html': 'from-rose-500 to-pink-600',
    'modernHybird.html':  'from-violet-500 to-purple-600',
    'modernHybird2.html': 'from-indigo-500 to-violet-600',
    'modernLuxury.html':  'from-amber-500 to-orange-600',
};

const TEMPLATE_ICONS: Record<string, string> = {
    'modern.html':        '📄',
    'ATS_Prime.html':     '🎯',
    'editorialBold.html': '✏️',
    'modernHybird.html':  '🎨',
    'modernHybird2.html': '💼',
    'modernLuxury.html':  '✨',
};

export function NewCVDialog({ onClose, onCreated }: Props) {
    const user = useUserStore(s => s.user);
    const candidateId = user?.candidate_id;  // candidate profile ID, not user.id

    const { data: templatesRaw, isLoading: loadingTemplates } = useQuery({
        queryKey: ['cv-templates-picker'],
        queryFn: () => cvService.listTemplates({ page_size: 12 }).then(r => r.data),
    });
    const templateItems = Array.isArray(templatesRaw) ? templatesRaw : (templatesRaw?.results ?? []);
    const templates = templateItems.map((t) => ({
        id: String(t.id),
        name: t.name,
        file_name: (t as any).file_name || '',
        color: TEMPLATE_GRADIENTS[(t as any).file_name || ''] || 'from-violet-400 to-cyan-400',
        icon: TEMPLATE_ICONS[(t as any).file_name || ''] || '📄',
        tags: (t as any).tags || [],
    }));

    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

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
            cvService.create(candidateId!, { cv_name: data.cv_name, template_id: Number(selectedTemplate) || undefined } as any).then(r => r.data),
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
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md text-white text-lg">
                                📄
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
                            {loadingTemplates ? (
                                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
                            ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {templates.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`relative rounded-xl border-2 overflow-hidden transition-all duration-150 cursor-pointer ${selectedTemplate === t.id
                                                ? 'border-violet-500 shadow-md shadow-violet-200'
                                                : 'border-slate-200 hover:border-violet-300'
                                            }`}
                                    >
                                        <div className={`h-16 bg-gradient-to-br ${t.color} flex flex-col items-center justify-center gap-1`}>
                                            <span className="text-2xl">{t.icon}</span>
                                        </div>
                                        <div className="py-2 px-1 bg-white">
                                            <p className="text-[10px] font-semibold text-slate-700 line-clamp-1 text-center">{t.name}</p>
                                        </div>
                                        {selectedTemplate === t.id && (
                                            <div className="absolute top-1.5 right-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-white fill-violet-500" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            )}
                            <p className="text-[11px] text-muted-foreground mt-2">
                                Bạn có thể đổi template bất cứ lúc nào trong CV Builder.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 border-slate-200 cursor-pointer"
                                onClick={onClose}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/25 cursor-pointer"
                                disabled={createMutation.isPending || !candidateId || !selectedTemplate}
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
