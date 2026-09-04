import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Award, ExternalLink, Calendar, Pencil, ShieldCheck, 
    UploadCloud, FileText, Image as ImageIcon, Link as LinkIcon, X, Loader2 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SectionWrapper } from './SectionWrapper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import type { CandidateCertificationRequest } from '@/types/api';

interface CertEntry {
    id: string | number;
    certification_name: string;
    issuing_organization?: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    credential_id?: string | null;
    credential_url?: string | null;
    does_not_expire: boolean;
}

interface CertFormProps {
    open: boolean;
    onClose: () => void;
    entry?: CertEntry | null;
    userId: number;
}

const isPdfUrl = (url?: string | null) => {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
};

const CertForm = ({ open, onClose, entry, userId }: CertFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [formData, setFormData] = useState<Partial<CertEntry>>({
        certification_name: '', 
        issuing_organization: '', 
        issue_date: '', 
        expiry_date: '', 
        credential_id: '', 
        credential_url: '', 
        does_not_expire: false
    });

    const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    useEffect(() => {
        if (open) {
            setFormData(entry || {
                certification_name: '', 
                issuing_organization: '', 
                issue_date: '', 
                expiry_date: '', 
                credential_id: '', 
                credential_url: '', 
                does_not_expire: false
            });
            setUploadedFileName('');
            setUploadMode(entry?.credential_url ? 'file' : 'file');
        }
    }, [entry, open]);

    const mutation = useMutation({
        mutationFn: () => {
            const { issue_date, expiry_date, does_not_expire, ...rest } = formData;
            const payload: CandidateCertificationRequest = {
                ...rest,
                certification_name: formData.certification_name || '',
                issuing_organization: formData.issuing_organization || '',
                credential_id: '', // Cleared credential_id as required
                credential_url: formData.credential_url || '',
                does_not_expire: !!does_not_expire,
                issue_date: issue_date || null,
                expiry_date: does_not_expire ? null : (expiry_date || null)
            };
            return isEdit
                ? candidateService.updateCertification(Number(userId), Number(entry!.id), payload).then(r => r.data)
                : candidateService.addCertification(Number(userId), payload).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certifications', userId] });
            queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
            toast.success(isEdit ? 'Đã cập nhật chứng chỉ!' : 'Đã thêm chứng chỉ!');
            onClose();
        },
        onError: () => toast.error('Không thể lưu chứng chỉ.')
    });

    const handleChange = (key: keyof CertEntry, value: string | boolean) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingFile(true);
        try {
            const res = await candidateService.uploadFile(file, 'certification');
            let fileUrl = res.data.file_path || (res.data as any).safe_preview_url || '';
            if (fileUrl.startsWith('/')) {
                fileUrl = `${window.location.origin}${fileUrl}`;
            }
            handleChange('credential_url', fileUrl);
            setUploadedFileName(file.name);
            toast.success('Đã tải lên tệp minh chứng chứng chỉ!');
        } catch (err) {
            toast.error('Không thể tải tệp lên. Vui lòng nhập link trực tiếp hoặc thử lại.');
        } finally {
            setIsUploadingFile(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="bg-card max-w-2xl rounded-[28px] border border-teal-500/20 dark:border-teal-500/30 shadow-2xl overflow-hidden p-0">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-600/10 dark:bg-teal-400/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 shadow-xs">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-foreground">
                                    {isEdit ? 'Chỉnh sửa chứng chỉ' : 'Thêm chứng chỉ & bằng cấp'}
                                </h3>
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isEdit ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-teal-500/10 text-teal-600 border-teal-500/20'}`}>
                                    {isEdit ? 'Chỉnh sửa' : 'Thêm mới'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Đính kèm chứng chỉ và minh chứng giúp tăng độ uy tín với nhà tuyển dụng
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs font-semibold">
                            <Award className="w-3.5 h-3.5 text-teal-600" />
                            Tên chứng chỉ <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                            className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                            placeholder="Ví dụ: AWS Certified Solutions Architect, IELTS 7.5..."
                            value={formData.certification_name || ''}
                            onChange={e => handleChange('certification_name', e.target.value)} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Tổ chức / Đơn vị cấp <span className="text-destructive">*</span></Label>
                        <Input 
                            className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                            placeholder="Ví dụ: Amazon Web Services, British Council, Coursera..."
                            value={formData.issuing_organization || ''}
                            onChange={e => handleChange('issuing_organization', e.target.value)} 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                Ngày cấp
                            </Label>
                            <Input 
                                type="date" 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                                value={formData.issue_date || ''}
                                onChange={e => handleChange('issue_date', e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                Ngày hết hạn
                            </Label>
                            <Input 
                                type="date" 
                                className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500" 
                                disabled={formData.does_not_expire}
                                value={formData.expiry_date || ''}
                                onChange={e => handleChange('expiry_date', e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${formData.does_not_expire ? 'bg-teal-500/10 border-teal-500/30' : 'bg-muted/30 border-border/60'}`}>
                        <div className="flex items-center gap-3">
                            <Switch 
                                id="no-expire" 
                                checked={!!formData.does_not_expire}
                                onCheckedChange={v => { handleChange('does_not_expire', v); if (v) handleChange('expiry_date', ''); }} 
                            />
                            <Label htmlFor="no-expire" className="cursor-pointer text-sm font-medium text-foreground">
                                Vĩnh viễn (Không có ngày hết hạn)
                            </Label>
                        </div>
                        {formData.does_not_expire && (
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Có hiệu lực vĩnh viễn
                            </span>
                        )}
                    </div>

                    {/* Section: Minh chứng chứng chỉ (PDF, IMG hoặc Link) */}
                    <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Đính kèm minh chứng (Ảnh, PDF hoặc Link)</Label>
                            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl text-xs font-medium border border-border/50">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('file')}
                                    className={`px-3 py-1 rounded-lg transition-all ${uploadMode === 'file' ? 'bg-background shadow-xs text-teal-600 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <UploadCloud className="w-3.5 h-3.5 inline mr-1" />
                                    Tải tệp lên
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('link')}
                                    className={`px-3 py-1 rounded-lg transition-all ${uploadMode === 'link' ? 'bg-background shadow-xs text-teal-600 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <LinkIcon className="w-3.5 h-3.5 inline mr-1" />
                                    URL Link
                                </button>
                            </div>
                        </div>

                        {uploadMode === 'file' ? (
                            <div className="space-y-2">
                                {formData.credential_url ? (
                                    <div className="flex items-center justify-between p-3.5 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center shrink-0">
                                                {isPdfUrl(formData.credential_url) ? (
                                                    <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold truncate text-foreground">
                                                    {uploadedFileName || (formData.credential_url.split('/').pop() || 'Đã đính kèm tệp minh chứng')}
                                                </p>
                                                <a
                                                    href={formData.credential_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 font-medium mt-0.5"
                                                >
                                                    Xem tệp minh chứng <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                                            onClick={() => {
                                                handleChange('credential_url', '');
                                                setUploadedFileName('');
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-border hover:border-teal-500/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/10 transition-all rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer group text-center">
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            disabled={isUploadingFile}
                                        />
                                        {isUploadingFile ? (
                                            <div className="flex flex-col items-center gap-2 py-2">
                                                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                                                <span className="text-xs font-medium text-muted-foreground">Đang tải tệp minh chứng lên...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    <UploadCloud className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        Tải lên ảnh hoặc PDF chứng chỉ
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        Hỗ trợ định dạng PDF, PNG, JPG, WEBP
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Input
                                    className="rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                                    placeholder="https://example.com/minh-chung-aws.pdf"
                                    value={formData.credential_url || ''}
                                    onChange={e => handleChange('credential_url', e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Đường dẫn trực tiếp (URL) đến minh chứng hoặc chứng chỉ của bạn.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-6">
                            Hủy
                        </Button>
                        <Button 
                            onClick={() => mutation.mutate()} 
                            className="rounded-full px-8 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={mutation.isPending || isUploadingFile || !formData.certification_name || !formData.issuing_organization}
                        >
                            {mutation.isPending ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm chứng chỉ')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const CertificationsSection = ({ userId }: { userId: number }) => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<CertEntry | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: certifications = [], isLoading } = useQuery({
        queryKey: ['certifications', userId],
        queryFn: () => candidateService.listCertifications(Number(userId)).then(r => r.data),
        enabled: !!userId && !isNaN(Number(userId)),
    });

    const deleteMutation = useMutation({
        mutationFn: (certId: string | number) => candidateService.deleteCertification(Number(userId), Number(certId)).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certifications', userId] });
            toast.success('Đã xoá chứng chỉ.');
        }
    });

    // Detect if cert is expiring soon (within 90 days)
    const isExpiringSoon = (expiryDate: string | null | undefined) => {
        if (!expiryDate) return false;
        const diff = new Date(expiryDate).getTime() - Date.now();
        return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
    };

    const isExpired = (expiryDate: string | null | undefined) => {
        if (!expiryDate) return false;
        return new Date(expiryDate).getTime() < Date.now();
    };

    if (isLoading) return (
        <SectionWrapper title="Chứng chỉ" id="certifications">
            <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-24 bg-background/40 animate-pulse rounded-2xl" />)}</div>
        </SectionWrapper>
    );

    return (
        <SectionWrapper title="Chứng chỉ" id="certifications">
            <div className="space-y-4">
                <AnimatePresence>
                    {(certifications as CertEntry[]).length > 0 ? (
                        (certifications as CertEntry[]).map((cert) => (
                            <motion.div
                                key={cert.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-card border border-border shadow-sm p-5 rounded-2xl flex gap-4 items-start"
                                onMouseEnter={() => setHoveredId(String(cert.id))}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/60 rounded-xl flex items-center justify-center shrink-0">
                                    <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm md:text-base truncate">{cert.certification_name}</h3>
                                            <p className="text-sm font-medium text-teal-500 flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                {cert.issuing_organization}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0 transition-opacity" style={{ opacity: hoveredId === String(cert.id) ? 1 : 0, pointerEvents: hoveredId === String(cert.id) ? 'auto' : 'none' }}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-100 hover:text-teal-600"
                                                onClick={() => { setEditEntry(cert); setDialogOpen(true); }}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => deleteMutation.mutate(cert.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                        {cert.issue_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Cấp: {cert.issue_date}
                                            </span>
                                        )}

                                        {!cert.does_not_expire && cert.expiry_date && (
                                            <span className={`font-medium flex items-center gap-1 ${isExpired(cert.expiry_date) ? 'text-destructive' : isExpiringSoon(cert.expiry_date) ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                                Hết hạn: {cert.expiry_date}
                                                {isExpiringSoon(cert.expiry_date) && !isExpired(cert.expiry_date) && (
                                                    <Badge variant="outline" className="ml-1 text-[9px] h-4 px-1.5 border-amber-500/30 text-amber-500">Sắp hết hạn</Badge>
                                                )}
                                                {isExpired(cert.expiry_date) && (
                                                    <Badge variant="outline" className="ml-1 text-[9px] h-4 px-1.5 border-destructive/30 text-destructive">Đã hết hạn</Badge>
                                                )}
                                            </span>
                                        )}

                                        {cert.does_not_expire && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/30 text-emerald-500">Không hết hạn</Badge>
                                        )}
                                    </div>

                                    {cert.credential_url && (
                                        <div className="mt-3 pt-2.5 border-t border-border/50">
                                            <a href={cert.credential_url} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 hover:bg-teal-100/80 rounded-xl text-xs font-semibold transition-all border border-teal-200/60 dark:border-teal-800/40">
                                                {isPdfUrl(cert.credential_url) ? (
                                                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                                                ) : (
                                                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                                                )}
                                                Xem minh chứng chứng chỉ (PDF/IMG)
                                                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-10 text-muted-foreground">
                            <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Chưa có chứng chỉ nào</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button variant="outline" onClick={() => { setEditEntry(null); setDialogOpen(true); }}
                    className="w-full h-12 border-dashed border-2 rounded-2xl hover:bg-teal-50 hover:border-teal-600 hover:text-teal-600 transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm chứng chỉ
                </Button>
            </div>

            <CertForm open={dialogOpen} onClose={() => { setDialogOpen(false); setEditEntry(null); }} entry={editEntry} userId={userId} />
        </SectionWrapper>
    );
};

