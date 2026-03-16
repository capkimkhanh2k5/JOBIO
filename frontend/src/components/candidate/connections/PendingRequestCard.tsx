import { Connection } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';
import { Check, X, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface PendingRequestCardProps {
    request: Connection;
}

export function PendingRequestCard({ request }: PendingRequestCardProps) {
    const queryClient = useQueryClient();
    const requester = request.requester;

    const acceptMutation = useMutation({
        mutationFn: () => api.patch(`/api/connections/${request.id}/accept/`),
        onSuccess: () => {
            toast.success(`Đã chấp nhận kết nối với ${requester.full_name}`);
            queryClient.invalidateQueries({ queryKey: ['pendingConnections'] });
            queryClient.invalidateQueries({ queryKey: ['connections'] });
        },
        onError: () => toast.error('Có lỗi xảy ra khi chấp nhận kết nối')
    });

    const rejectMutation = useMutation({
        mutationFn: () => api.patch(`/api/connections/${request.id}/reject/`),
        onSuccess: () => {
            toast.success(`Đã từ chối kết nối với ${requester.full_name}`);
            queryClient.invalidateQueries({ queryKey: ['pendingConnections'] });
        },
        onError: () => toast.error('Có lỗi xảy ra khi từ chối kết nối')
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
            <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4 hover:shadow-md transition-shadow duration-300 border-slate-200 bg-white/50 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarImage src={requester.avatar_url || ''} alt={requester.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-700 font-medium text-lg">
                            {requester.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                            {requester.full_name}
                        </h3>
                        {requester.headline && (
                            <div className="flex items-center text-sm text-slate-500 mt-1">
                                <Briefcase className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                <span>{requester.headline}</span>
                            </div>
                        )}

                        {request.message && (
                            <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                "{request.message}"
                            </div>
                        )}

                        <span className="text-xs text-slate-400 mt-2">
                            Gửi lúc {new Date(request.created_at).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none bg-white text-slate-600 hover:text-slate-900"
                        onClick={() => rejectMutation.mutate()}
                        disabled={rejectMutation.isPending || acceptMutation.isPending}
                    >
                        <X className="w-4 h-4 mr-1.5" />
                        Trừ chối
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white"
                        onClick={() => acceptMutation.mutate()}
                        disabled={rejectMutation.isPending || acceptMutation.isPending}
                    >
                        <Check className="w-4 h-4 mr-1.5" />
                        Chấp nhận
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}
