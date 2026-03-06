import { useState } from 'react';
import { ConnectionSuggestion } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Briefcase, UserPlus, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { SendConnectionDialog } from './SendConnectionDialog';
import { Badge } from '@/components/ui/badge';

interface SuggestionCardProps {
    suggestion: ConnectionSuggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { recruiter, mutual_connections_count, common_skills } = suggestion;

    return (
        <>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} layout>
                <Card className="flex flex-col p-5 h-full hover:shadow-md transition-shadow duration-300 border-slate-200 bg-white/50 backdrop-blur-sm group items-center text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-violet-50/80 to-transparent -z-10" />

                    <Avatar className="h-20 w-20 border-4 border-white shadow-sm ring-1 ring-slate-100 mb-4 mt-2">
                        <AvatarImage src={recruiter.avatar_url || ''} alt={recruiter.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-700 font-bold text-2xl">
                            {recruiter.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                        {recruiter.full_name}
                    </h3>

                    {recruiter.current_position && (
                        <div className="flex items-center text-sm text-slate-500 mt-1 justify-center w-full truncate">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5 opacity-70 flex-shrink-0" />
                            <span className="truncate">{recruiter.current_position}</span>
                        </div>
                    )}

                    {recruiter.current_company && (
                        <div className="flex items-center text-sm text-slate-500 mt-0.5 justify-center w-full truncate">
                            <Building2 className="w-3.5 h-3.5 mr-1.5 opacity-70 flex-shrink-0" />
                            <span className="truncate">{recruiter.current_company}</span>
                        </div>
                    )}

                    {mutual_connections_count > 0 && (
                        <div className="flex items-center mt-3 text-xs text-slate-500">
                            <Users className="w-3 h-3 mr-1" />
                            <span>{mutual_connections_count} bạn chung</span>
                        </div>
                    )}

                    {common_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3 justify-center">
                            {common_skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 font-normal">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto pt-5 w-full">
                        <Button
                            variant="outline"
                            className="w-full bg-white hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Kết nối
                        </Button>
                    </div>
                </Card>
            </motion.div>

            <SendConnectionDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                recruiterId={recruiter.id}
                recruiterName={recruiter.full_name}
            />
        </>
    );
}
