import React from 'react';
import { Camera, Mail, Phone, MapPin, Globe, Linkedin, Facebook, Github } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface ProfileHeaderProps {
    profile: any;
    onUpdateStatus: (status: string) => void;
    onTogglePrivacy: (isPublic: boolean) => void;
}

export const ProfileHeader = ({ profile, onUpdateStatus, onTogglePrivacy }: ProfileHeaderProps) => {
    return (
        <div className="glass-effect p-8 rounded-[32px] relative overflow-hidden">
            {/* Decorative Aurora Background */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Avatar Section */}
                <div className="relative group">
                    <Avatar className="w-32 h-32 border-4 border-background/50 shadow-xl">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-white text-xs font-medium">Thay đổi ảnh</span>
                    </div>
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-1">{profile?.full_name}</h1>
                        <p className="text-xl text-muted-foreground font-medium">
                            {profile?.current_position} <span className="text-primary/50 text-sm mx-2">@</span> {profile?.current_company}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {profile?.email}
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {profile?.phone}
                        </div>
                        <div className="flex items-center gap-2 text-primary/80">
                            <MapPin className="w-4 h-4" />
                            {profile?.address?.province}
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3">
                        {profile?.social_links?.linkedin && (
                            <a href={profile.social_links.linkedin} target="_blank" rel="noreferrer" className="p-2 glass-effect !rounded-full hover:text-primary transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        )}
                        {profile?.social_links?.github && (
                            <a href={profile.social_links.github} target="_blank" rel="noreferrer" className="p-2 glass-effect !rounded-full hover:text-primary transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        )}
                        {profile?.social_links?.portfolio && (
                            <a href={profile.social_links.portfolio} target="_blank" rel="noreferrer" className="p-2 glass-effect !rounded-full hover:text-primary transition-colors">
                                <Globe className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Privacy & Status Actions */}
                <div className="w-full md:w-auto space-y-4 glass-effect p-6 rounded-2xl bg-background/20">
                    <div className="flex items-center justify-between gap-8">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Công khai hồ sơ</Label>
                            <p className="text-[10px] text-muted-foreground">Nhà tuyển dụng có thể tìm thấy bạn</p>
                        </div>
                        <Switch
                            checked={profile?.is_profile_public}
                            onCheckedChange={onTogglePrivacy}
                        />
                    </div>

                    <div className="pt-4 border-t border-border/50">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Chế độ tìm việc</Label>
                        <div className="flex flex-col gap-2">
                            {['active', 'passive', 'not_looking'].map((status) => (
                                <Button
                                    key={status}
                                    variant={profile?.job_search_status === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onUpdateStatus(status)}
                                    className="w-full justify-start text-xs rounded-full h-8"
                                >
                                    <div className={`w-2 h-2 rounded-full mr-2 ${status === 'active' ? 'bg-emerald-500' :
                                            status === 'passive' ? 'bg-amber-500' : 'bg-slate-500'
                                        }`} />
                                    {status === 'active' ? 'Đang tìm việc' :
                                        status === 'passive' ? 'Mở lời mời' : 'Chưa có nhu cầu'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
