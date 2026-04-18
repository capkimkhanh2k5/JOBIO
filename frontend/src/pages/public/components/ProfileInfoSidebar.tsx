import React from 'react';
import type { CandidateDetail } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Mail, Phone, Link as LinkIcon, Briefcase } from 'lucide-react';

export const ProfileInfoSidebar = ({ profile }: { profile: CandidateDetail }) => {
    return (
        <div className="space-y-6">
            {/* Giới thiệu */}
            <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Giới thiệu
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {profile.introduction || 'Ứng viên chưa cập nhật phần giới thiệu cá nhân.'}
                    </p>
                </CardContent>
            </Card>

            {/* Thông tin liên hệ */}
            <Card className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold">Liên hệ & Mạng xã hội</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-sm">
                    <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.user_email || 'Chưa cung cấp'}</span>
                    </div>
                    {profile.phone && (
                        <div className="flex items-center gap-3 text-slate-600">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{profile.phone}</span>
                        </div>
                    )}
                    {profile.portfolio_url && (
                        <div className="flex items-center gap-3 text-slate-600">
                            <LinkIcon className="w-4 h-4 text-muted-foreground" />
                            <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                {profile.portfolio_url}
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
