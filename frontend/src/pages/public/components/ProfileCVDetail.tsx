import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Briefcase, Award, Code, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const ProfileCVDetail = ({ userId }: { userId: number }) => {
    // Lấy dữ liệu học vấn
    const { data: education, isLoading: isLoadingEdu } = useQuery({
        queryKey: ['public-education', userId],
        queryFn: () => candidateService.listEducation(userId).then(r => r.data),
    });

    // Lấy dữ liệu kinh nghiệm
    const { data: experience, isLoading: isLoadingExp } = useQuery({
        queryKey: ['public-experience', userId],
        queryFn: () => candidateService.listExperience(userId).then(r => r.data),
    });

    // Lấy dữ liệu kỹ năng
    const { data: skills, isLoading: isLoadingSkills } = useQuery({
        queryKey: ['public-skills', userId],
        queryFn: () => candidateService.listSkills(userId).then(r => r.data),
    });

    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return 'Hiện tại';
        try {
            return format(new Date(dateString), 'MM/yyyy', { locale: vi });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Chi tiết Hồ sơ</h2>

            {/* KN Làm việc */}
            <Card className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-orange-500" />
                        Kinh nghiệm làm việc
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoadingExp ? (
                        <Skeleton className="h-32 w-full" />
                    ) : experience?.length ? (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {experience.map((exp, index) => (
                                <div key={exp.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-orange-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-orange-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                                            <h3 className="font-bold text-slate-900 text-base">{exp.position}</h3>
                                            <time className="text-sm font-medium text-orange-500">
                                                {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                                            </time>
                                        </div>
                                        <p className="text-slate-600 font-medium text-sm mb-2">{exp.company_name}</p>
                                        {exp.description && (
                                            <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4 text-sm">Chưa có thông tin kinh nghiệm làm việc.</p>
                    )}
                </CardContent>
            </Card>

            {/* Học vấn */}
            <Card className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-violet-500" />
                        Học vấn
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoadingEdu ? (
                        <Skeleton className="h-24 w-full" />
                    ) : education?.length ? (
                        <div className="space-y-6">
                            {education.map((edu, index) => (
                                <div key={edu.id || index} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="bg-violet-100 text-violet-600 p-3 rounded-xl h-fit shrink-0">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                                        <p className="text-slate-600 font-medium text-sm mt-1">{edu.degree} - {edu.field_of_study}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4 text-sm">Chưa có thông tin học vấn.</p>
                    )}
                </CardContent>
            </Card>

            {/* Kỹ năng */}
            <Card className="rounded-[24px] border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Code className="w-5 h-5 text-fuchsia-500" />
                        Kỹ năng
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoadingSkills ? (
                        <div className="flex gap-2 flex-wrap">
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <Skeleton className="h-8 w-32 rounded-full" />
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                    ) : skills?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                                <div key={skill.id || index} className="px-4 py-2 bg-fuchsia-50 text-fuchsia-700 rounded-full border border-fuchsia-100 text-sm font-medium flex items-center gap-2 transition-all hover:shadow-sm hover:border-fuchsia-300">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {skill.skill_name} 
                                    {skill.proficiency_level && <span className="text-xs opacity-70 ml-1">({skill.proficiency_level})</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-4 text-sm">Chưa có thông tin kỹ năng.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
