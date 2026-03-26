import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mail, Phone, MapPin, Globe, Linkedin, Facebook, Github, Eye, EyeOff, Upload, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

interface ProfileHeaderProps {
    profile: any;
    onUpdateStatus: (status: string) => void;
    onTogglePrivacy: (isPublic: boolean) => void;
}

const JOB_SEARCH_STATUSES = [
    { value: 'active', label: 'Đang tìm việc', color: 'bg-emerald-500', textColor: 'text-emerald-500', borderColor: 'border-emerald-500/30' },
    { value: 'passive', label: 'Mở lời mời', color: 'bg-amber-500', textColor: 'text-amber-500', borderColor: 'border-amber-500/30' },
    { value: 'not_looking', label: 'Chưa có nhu cầu', color: 'bg-slate-400', textColor: 'text-slate-400', borderColor: 'border-slate-400/30' },
];

export const ProfileHeader = ({ profile, onUpdateStatus, onTogglePrivacy }: ProfileHeaderProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

    const avatarMutation = useMutation({
        mutationFn: (file: File) => authService.uploadAvatar(file).then(r => r.data),
        onSuccess: (data) => {
            setLocalAvatarUrl(data.avatar_url);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Đã cập nhật ảnh đại diện!');
        },
        onError: () => toast.error('Không thể tải lên ảnh. Vui lòng thử lại.')
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview locally first
            const previewUrl = URL.createObjectURL(file);
            setLocalAvatarUrl(previewUrl);
            avatarMutation.mutate(file);
        }
    };

    const currentStatus = JOB_SEARCH_STATUSES.find(s => s.value === profile?.job_search_status) || JOB_SEARCH_STATUSES[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.1, 0.9, 0.2, 1] }}
            id="header"
            className="bg-white border border-slate-200 shadow-sm p-8 rounded-[32px] relative overflow-hidden"
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
                            <AvatarImage src={localAvatarUrl || profile?.avatar_url} />
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-violet-200 to-cyan-400/20 text-violet-600 font-bold">
                                {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Upload Overlay */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarMutation.isPending}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer"
                            aria-label="Thay đổi ảnh đại diện"
                        >
                            {avatarMutation.isPending ? (
                                <Upload className="w-6 h-6 text-white animate-bounce" />
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

                    {/* Job search status badge */}
                    <div className={`mt-3 text-center px-3 py-1.5 rounded-full text-xs font-bold border ${currentStatus.borderColor} bg-background/50 flex items-center gap-1.5 justify-center w-full`}>
                        <span className={`w-2 h-2 rounded-full ${currentStatus.color} shrink-0`} />
                        <span className={currentStatus.textColor}>{currentStatus.label}</span>
                    </div>
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1 space-y-4 min-w-0">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-1 truncate">{profile?.full_name}</h1>
                        <p className="text-lg text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
                            <span>{profile?.current_position}</span>
                            {profile?.current_company && (
                                <>
                                    <span className="text-violet-400 text-sm">@</span>
                                    <span className="text-violet-600 font-semibold">{profile?.current_company}</span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {profile?.email && (
                            <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-violet-600 transition-colors">
                                <Mail className="w-4 h-4" />
                                {profile.email}
                            </a>
                        )}
                        {profile?.phone && (
                            <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:text-violet-600 transition-colors">
                                <Phone className="w-4 h-4" />
                                {profile.phone}
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

                {/* Privacy & Status Controls */}
                <div className="w-full md:w-56 space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl shrink-0">
                    {/* Profile visibility */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5 flex-1 min-w-0">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                {profile?.is_profile_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                Công khai hồ sơ
                            </Label>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                {profile?.is_profile_public ? 'Nhà tuyển dụng có thể tìm thấy' : 'Ẩn khỏi nhà tuyển dụng'}
                            </p>
                        </div>
                        <Switch
                            checked={profile?.is_profile_public ?? false}
                            onCheckedChange={onTogglePrivacy}
                            aria-label="Toggle profile visibility"
                            className="data-[state=checked]:bg-violet-600"
                        />
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Job search status */}
                    <div>
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Chế độ tìm việc</Label>
                        <div className="flex flex-col gap-1.5">
                            {JOB_SEARCH_STATUSES.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => onUpdateStatus(status.value)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all
                                        ${profile?.job_search_status === status.value
                                            ? `bg-white ${status.textColor} shadow-sm ring-1 ${status.borderColor}`
                                            : 'text-slate-500 hover:bg-white hover:shadow-sm'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${status.color} shrink-0`} />
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
