import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toast } from 'sonner';

interface SendConnectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    recruiterId: number;
    recruiterName: string;
}

export function SendConnectionDialog({ isOpen, onClose, recruiterId, recruiterName }: SendConnectionDialogProps) {
    const [message, setMessage] = useState('');
    const queryClient = useQueryClient();

    const connectMutation = useMutation({
        mutationFn: () => api.post(`/api/recruiters/${recruiterId}/connect/`, { message }),
        onSuccess: () => {
            toast.success(`Đã gửi lời mời kết nối đến ${recruiterName}`);
            queryClient.invalidateQueries({ queryKey: ['connectionSuggestions'] });
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            onClose();
            setMessage('');
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi gửi lời mời kết nối');
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gửi lời mời kết nối do JOBIO</DialogTitle>
                    <DialogDescription>
                        Kết nối với {recruiterName} để mở rộng mạng lưới của bạn. Bạn có thể thêm một tin nhắn cá nhân hóa.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Thêm lời nhắn... (Tùy chọn)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="resize-none min-h-[100px] border-slate-200 focus-visible:ring-violet-500"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={connectMutation.isPending}>
                        Hủy
                    </Button>
                    <Button
                        onClick={() => connectMutation.mutate()}
                        disabled={connectMutation.isPending}
                        className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white"
                    >
                        {connectMutation.isPending ? 'Đang gửi...' : 'Gửi lời mời'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
