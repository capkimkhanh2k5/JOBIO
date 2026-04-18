import { MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export interface Candidate {
    id: string;
    name?: string;
    user?: {
        full_name: string;
        avatar_url: string | null;
    };
    avatar_url?: string;
    current_position: string | null;
    current_company: string | { company_name: string } | null;
    years_of_experience: number;
    top_skills?: string[];
    skills?: Array<{ skill: { name: string } }>;
    education_summary?: string;
    highest_education_level?: string;
    job_search_status: string;
    profile_completeness?: number;
    profile_completeness_score?: number;
    is_profile_public: boolean;
    location?: string;
    address?: { province_name?: string; province?: { province_name: string } };
}

interface CandidateCardProps {
    candidate: Candidate;
    onClick: (id: string) => void;
}

export const CandidateCard = ({ candidate, onClick }: CandidateCardProps) => {
    // Robust accessors
    const name = candidate.name || candidate.user?.full_name || 'N/A';
    const avatar = candidate.avatar_url || candidate.user?.avatar_url || undefined;
    const company = typeof candidate.current_company === 'string' 
        ? candidate.current_company 
        : candidate.current_company?.company_name || 'N/A';
    
    const location = candidate.location || 
        candidate.address?.province_name || 
        candidate.address?.province?.province_name || 
        'N/A';
    
    const completeness = candidate.profile_completeness ?? candidate.profile_completeness_score ?? 0;
    
    // Skill normalization
    const displaySkills = candidate.top_skills || candidate.skills?.map(s => s.skill.name) || [];

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': 
            case 'actively_looking': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'passive': 
            case 'open': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'closed': 
            case 'not_looking': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'actively_looking': return 'Đang tìm việc';
            case 'passive':
            case 'open': return 'Sẵn sàng cơ hội tốt';
            case 'closed':
            case 'not_looking': return 'Không tìm việc';
            default: return status || 'N/A';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            layout
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card
                className="group relative cursor-pointer overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:bg-card hover:shadow-md hover:border-primary/30 h-full flex flex-col"
                onClick={() => onClick(candidate.id)}
            >
                <CardContent className="p-6 flex flex-col h-full gap-4">
                    {/* Header: Avatar + Info */}
                    <div className="flex gap-4 items-start">
                        <Avatar className="h-14 w-14 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                            <AvatarImage src={avatar} alt={name} />
                            <AvatarFallback className="bg-primary/5 text-primary text-lg font-medium">
                                {name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-violet-600 transition-colors">
                                    {name}
                                </h3>
                                {candidate.is_profile_public && (
                                    <Badge variant="outline" className="shrink-0 bg-primary/5 text-primary text-[10px] px-1.5 border-primary/20">
                                        Verified
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm font-medium text-foreground/80 truncate">
                                {candidate.current_position || 'Chưa cập nhật vị trí'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                <Briefcase className="w-3.5 h-3.5" />
                                {company}
                            </p>
                        </div>
                    </div>

                    {/* Meta tags */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-foreground/50" />
                            {location}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-foreground/50" />
                            {candidate.years_of_experience || 0} năm KN
                        </div>
                        <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-foreground/50" />
                            <span className="truncate max-w-[150px]">{candidate.education_summary || candidate.highest_education_level || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                        {displaySkills.slice(0, 4).map(skill => (
                            <Badge key={skill} variant="secondary" className="bg-secondary/50 hover:bg-secondary font-normal transition-colors">
                                {skill}
                            </Badge>
                        ))}
                        {displaySkills.length > 4 && (
                            <Badge variant="secondary" className="bg-secondary/30 text-muted-foreground font-normal">
                                +{displaySkills.length - 4}
                            </Badge>
                        )}
                    </div>
                </CardContent>

                {/* Footer with status & score */}
                <div className="px-6 py-3 border-t border-border/40 bg-muted/20 flex justify-between items-center group-hover:bg-muted/40 transition-colors">
                    <Badge variant="outline" className={`font-normal ${getStatusColor(candidate.job_search_status)}`}>
                        {getStatusLabel(candidate.job_search_status)}
                    </Badge>

                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">Độ hoàn thiện</div>
                        <div className="flex items-center gap-1.5">
                            {/* Circular progress minimal */}
                            <div className="relative w-6 h-6 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-muted/30"
                                        strokeWidth="4"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className={completeness >= 80 ? 'text-primary' : 'text-blue-500'}
                                        strokeWidth="4"
                                        strokeDasharray={`${completeness}, 100`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-[8px] font-bold text-foreground">
                                    {completeness}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export const CandidateCardSkeleton = () => {
    return (
        <Card className="h-full border border-border/40 bg-card/60 flex flex-col">
            <CardContent className="p-6 flex flex-col h-full gap-4">
                <div className="flex gap-4 items-start">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                </div>
            </CardContent>
            <div className="px-6 py-3 border-t border-border/40 flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
        </Card>
    );
};
