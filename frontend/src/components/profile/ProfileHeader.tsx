import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mail, Phone, MapPin, Globe, Linkedin, Facebook, Github, Loader2, CheckCircle2, FileUp, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { CVAutoFillDialog } from './CVAutoFillDialog';

interface ProfileHeaderProps {
    profile: any;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
    const previewObjectUrlRef = useRef<string | null>(null);
    const { user, updateUser } = useUserStore();
    const [isCVDialogOpen, setIsCVDialogOpen] = useState(false);

    const clearPreviewObjectUrl = () => {
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (previewObjectUrlRef.current) {
                URL.revokeObjectURL(previewObjectUrlRef.current);
            }
        };
    }, []);

    const avatarMutation = useMutation({
        mutationFn: (file: File) => authService.uploadAvatar(file).then(r => r.data),
        onSuccess: (data) => {
            const newUrl = data.avatar_url;
            clearPreviewObjectUrl();
            setLocalAvatarUrl(newUrl);
            // Sync avatar into auth store → updates navbar avatar immediately
            updateUser({ avatar_url: newUrl });
            queryClient.setQueryData(['profile', user?.id], (current: any) => current ? {
                ...current,
                avatar_url: newUrl,
                user: current.user ? { ...current.user, avatar_url: newUrl } : current.user,
            } : current);
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
            toast.success('Đã cập nhật ảnh đại diện!');
        },
        onError: () => toast.error('Không thể tải lên ảnh. Vui lòng thử lại.')
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            clearPreviewObjectUrl();
            const previewUrl = URL.createObjectURL(file);
            previewObjectUrlRef.current = previewUrl;
            setLocalAvatarUrl(previewUrl);
            avatarMutation.mutate(file, {
                onError: () => {
                    clearPreviewObjectUrl();
                    setLocalAvatarUrl(null);
                },
                onSettled: () => {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            });
        }
    };

    const isUploadingAvatar = avatarMutation.isPending;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.1, 0.9, 0.2, 1] }}
                id="header"
                className="bg-white border border-slate-200 shadow-sm p-8 rounded-[32px] relative overflow-hidden scroll-mt-32"
            >
                {/* Decorative Gradient */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-violet-50/60 via-cyan-50/30 to-transparent" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-100/40 blur-[80px] rounded-full" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    {/* Avatar Section with upload */}
                    <div className="relative group shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative"
                        >
                            <Avatar className="w-36 h-36 border-4 border-white shadow-2xl ring-2 ring-violet-200">
                                <AvatarImage
                                    src={localAvatarUrl || profile?.user?.avatar_url || profile?.avatar_url}
                                    className={`object-cover transition-all duration-300 ${isUploadingAvatar ? 'scale-[1.01] opacity-60 blur-[1px]' : ''}`}
                                />
                                <AvatarFallback className="text-3xl bg-gradient-to-br from-violet-200 to-cyan-400/20 text-violet-600 font-bold">
                                    {(profile?.user?.full_name || profile?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Upload Overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className={`absolute inset-0 rounded-full transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer backdrop-blur-[2px] ${isUploadingAvatar ? 'bg-black/40 opacity-100' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}
                                aria-label="Thay đổi ảnh đại diện"
                            >
                                {isUploadingAvatar ? (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-lg backdrop-blur-md">
                                        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                                    </div>
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                                <span className="text-white text-[10px] font-semibold uppercase tracking-wider">
                                    {avatarMutation.isPending ? 'Đang tải...' : 'Đổi ảnh'}
                                </span>
                            </button>

                            {/* Success checkmark */}
                            {avatarMutation.isSuccess && !avatarMutation.isPending && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                </motion.div>
                            )}
                        </motion.div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                        {/* Name & Basic Info */}
                        <div className="flex-1 space-y-4 pt-2 md:pt-0">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-1">{profile?.user?.full_name || profile?.full_name}</h1>
                                <p className="text-lg text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                                    <span>{profile?.current_position}</span>
                                    {profile?.current_company_name && (
                                        <>
                                            <span className="text-violet-400 text-sm">@</span>
                                            <span className="text-violet-600 font-semibold">{profile?.current_company_name}</span>
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {(profile?.user?.email || profile?.email) && (
                                    <a href={`mailto:${profile?.user?.email || profile?.email}`} className="flex items-center gap-2 hover:text-violet-600 transition-colors">
                                        <Mail className="w-4 h-4" />
                                        {profile?.user?.email || profile?.email}
                                    </a>
                                )}
                                {(profile?.user?.phone || profile?.phone) && (
                                    <a href={`tel:${profile?.user?.phone || profile?.phone}`} className="flex items-center gap-2 hover:text-violet-600 transition-colors">
                                        <Phone className="w-4 h-4" />
                                        {profile?.user?.phone || profile?.phone}
                                    </a>
                                )}
                                {profile?.address?.province && (
                                    <div className="flex items-center gap-2 text-violet-500">
                                        <MapPin className="w-4 h-4" />
                                        {profile.address.province}
                                    </div>
                                )}
                                {profile?.years_of_experience > 0 && (
                                    <Badge variant="outline" className="rounded-full border-violet-200 text-violet-500 text-xs">
                                        {profile.years_of_experience} năm kinh nghiệm
                                    </Badge>
                                )}
                            </div>

                            {/* Social Links */}
                            <div className="flex gap-2 flex-wrap">
                                {profile?.social_links?.linkedin && (
                                    <motion.a whileHover={{ scale: 1.1, y: -2 }} href={profile.social_links.linkedin} target="_blank" rel="noreferrer"
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:text-[#0077b5] hover:border-[#0077b5]/30 hover:bg-blue-50 transition-all text-slate-600"
                                        aria-label="LinkedIn">
                                        <Linkedin className="w-4 h-4" />
                                    </motion.a>
                                )}
                                {profile?.social_links?.github && (
                                    <motion.a whileHover={{ scale: 1.1, y: -2 }} href={profile.social_links.github} target="_blank" rel="noreferrer"
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all text-slate-600"
                                        aria-label="GitHub">
                                        <Github className="w-4 h-4" />
                                    </motion.a>
                                )}
                                {profile?.social_links?.facebook && (
                                    <motion.a whileHover={{ scale: 1.1, y: -2 }} href={profile.social_links.facebook} target="_blank" rel="noreferrer"
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:text-[#1877f2] hover:border-[#1877f2]/30 hover:bg-blue-50 transition-all text-slate-600"
                                        aria-label="Facebook">
                                        <Facebook className="w-4 h-4" />
                                    </motion.a>
                                )}
                                {profile?.social_links?.portfolio && (
                                    <motion.a whileHover={{ scale: 1.1, y: -2 }} href={profile.social_links.portfolio} target="_blank" rel="noreferrer"
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all text-slate-600"
                                        aria-label="Portfolio">
                                        <Globe className="w-4 h-4" />
                                    </motion.a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Banner CV Auto-fill */}
                    <div className="w-full bg-[#F5F5F7]/80 backdrop-blur-xl border border-black/[0.03] shadow-sm p-4 sm:p-5 rounded-2xl sm:rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:bg-[#F5F5F7]">
                        <div className="flex-1 pr-0 sm:pr-8">
                            <Label className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600 mb-2 block flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" />
                                Hoàn thiện nhanh
                            </Label>
                            <p className="text-[14px] text-[#86868b] leading-[1.5] font-medium tracking-tight">
                                Upload CV (PDF) để AI tự động trích xuất và điền toàn bộ thông tin cá nhân, học vấn và kinh nghiệm vào hồ sơ của bạn.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCVDialogOpen(true)}
                            className="shrink-0 flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-300 bg-[#5E5CE6] text-white hover:bg-[#5351CC] hover:shadow-lg active:scale-[0.96]"
                            id="cv-autofill-btn"
                        >
                            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg shrink-0">
                                <FileUp className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span className="text-[14px] font-bold tracking-wide whitespace-nowrap">Upload CV</span>
                        </button>
                    </div>
            </motion.div>

            {/* CV Auto-fill Dialog */}
            <CVAutoFillDialog
                open={isCVDialogOpen}
                onOpenChange={setIsCVDialogOpen}
                candidateId={profile?.id}
            />
        </>
    );
};
