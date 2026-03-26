import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Award, ExternalLink, Calendar, Pencil, ShieldCheck } from 'lucide-react';
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

interface CertEntry {
    id: string;
    certification_name: string;
    issuing_organization: string;
    issue_date: string;
    expiry_date?: string | null;
    credential_id?: string;
    credential_url?: string;
    does_not_expire: boolean;
}

interface CertFormProps {
    open: boolean;
    onClose: () => void;
    entry?: CertEntry | null;
    userId: number;
}

const CertForm = ({ open, onClose, entry, userId }: CertFormProps) => {
    const queryClient = useQueryClient();
    const isEdit = !!entry;

    const [formData, setFormData] = useState<Partial<CertEntry>>(entry || {
        certification_name: '', issuing_organization: '', issue_date: '', expiry_date: '', credential_id: '', credential_url: '', does_not_expire: false
    });

    const mutation = useMutation({
        mutationFn: () => {
            const { issue_date, expiry_date, does_not_expire, ...rest } = formData;
            const payload = {
                ...rest,
                does_not_expire,
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

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="bg-white max-w-2xl rounded-[24px] border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa chứng chỉ' : 'Thêm chứng chỉ'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                    <div className="space-y-2">
                        <Label>Tên chứng chỉ <span className="text-destructive">*</span></Label>
                        <Input className="" placeholder="AWS Solutions Architect"
                            value={formData.certification_name || ''}
                            onChange={e => handleChange('certification_name', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Tổ chức cấp <span className="text-destructive">*</span></Label>
                        <Input className="" placeholder="Amazon Web Services"
                            value={formData.issuing_organization || ''}
                            onChange={e => handleChange('issuing_organization', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ngày cấp</Label>
                            <Input type="date" className=""
                                value={formData.issue_date || ''}
                                onChange={e => handleChange('issue_date', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Ngày hết hạn</Label>
                            <Input type="date" className="" disabled={formData.does_not_expire}
                                value={formData.expiry_date || ''}
                                onChange={e => handleChange('expiry_date', e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch id="no-expire" checked={!!formData.does_not_expire}
                            onCheckedChange={v => { handleChange('does_not_expire', v); if (v) handleChange('expiry_date', ''); }} />
                        <Label htmlFor="no-expire" className="cursor-pointer">Không có ngày hết hạn</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã chứng chỉ</Label>
                            <Input className="" placeholder="CERT-12345"
                                value={formData.credential_id || ''}
                                onChange={e => handleChange('credential_id', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>URL xác thực</Label>
                            <Input className="" placeholder="https://..."
                                value={formData.credential_url || ''}
                                onChange={e => handleChange('credential_url', e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Huỷ</Button>
                        <Button onClick={() => mutation.mutate()} className="rounded-full px-8"
                            disabled={mutation.isPending || !formData.certification_name || !formData.issuing_organization}>
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

    const { data: certifications = [], isLoading } = useQuery({
        queryKey: ['certifications', userId],
        queryFn: () => candidateService.listCertifications(Number(userId)).then(r => r.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (certId: string) => candidateService.deleteCertification(Number(userId), Number(certId)).then(r => r.data),
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
                                className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex gap-4 items-start group"
                            >
                                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Award className="w-6 h-6 text-violet-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-sm md:text-base truncate">{cert.certification_name}</h3>
                                            <p className="text-sm font-medium text-violet-500 flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                {cert.issuing_organization}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-100 hover:text-violet-600"
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

                                        {cert.credential_id && (
                                            <span className="font-mono text-[11px]">ID: {cert.credential_id}</span>
                                        )}
                                    </div>

                                    {cert.credential_url && (
                                        <a href={cert.credential_url} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1 mt-2 text-xs text-violet-600 hover:underline font-semibold">
                                            Xem chứng chỉ <ExternalLink className="w-3 h-3" />
                                        </a>
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
                    className="w-full h-12 border-dashed border-2 rounded-2xl hover:bg-violet-50 hover:border-violet-600 hover:text-violet-600 transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm chứng chỉ
                </Button>
            </div>

            <CertForm open={dialogOpen} onClose={() => { setDialogOpen(false); setEditEntry(null); }} entry={editEntry} userId={userId} />
        </SectionWrapper>
    );
};
