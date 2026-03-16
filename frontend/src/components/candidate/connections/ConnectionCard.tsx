import { Connection } from '@/types/api';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, UserMinus, Building2, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConnectionCardProps {
    connection: Connection;
    currentUserId: number;
}

export function ConnectionCard({ connection, currentUserId }: ConnectionCardProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Determine which user is the connection (the other person)
    const isRequester = connection.requester.id === currentUserId;
    const connectedUser = isRequester ? connection.receiver : connection.requester;

    const removeMutation = useMutation({
        mutationFn: () => api.delete(`/api/connections/${connection.id}/`),
        onSuccess: () => {
            toast.success(`Đã hủy kết nối với ${connectedUser.full_name}`);
            queryClient.invalidateQueries({ queryKey: ['connections'] });
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi hủy kết nối');
        }
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
            <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4 hover:shadow-md transition-shadow duration-300 border-slate-200 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarImage src={connectedUser.avatar_url || ''} alt={connectedUser.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-700 font-medium text-lg">
                            {connectedUser.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                            {connectedUser.full_name}
                        </h3>
                        {connectedUser.headline && (
                            <div className="flex items-center text-sm text-slate-500 mt-1">
                                <Briefcase className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                <span>{connectedUser.headline}</span>
                            </div>
                        )}
                        <span className="text-xs text-slate-400 mt-2">
                            Kết nối từ {new Date(connection.updated_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none bg-white"
                        onClick={() => navigate(`/candidate/messages?userId=${connectedUser.id}`)}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Nhắn tin
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 data-[state=open]:bg-slate-100">
                                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                <span className="sr-only">More menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-slate-200 shadow-lg">
                            <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                                onClick={() => removeMutation.mutate()}
                                disabled={removeMutation.isPending}
                            >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Hủy kết nối
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>
        </motion.div>
    );
}
