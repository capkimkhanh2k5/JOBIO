import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2, Upload, Trash2, Video, PlayCircle } from 'lucide-react';

export function MediaGalleryManagement({ companyId }: { companyId: string }) {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const { data: mediaItems, isLoading } = useQuery({
        queryKey: ['companyMedia', companyId],
        queryFn: () => companyService.listMedia(Number(companyId)).then(r => r.data),
    });

    const bulkUploadMutation = useMutation({
        mutationFn: (files: File[]) => Promise.all(files.map(file => {
            const fd = new FormData();
            fd.append('file', file);
            return companyService.addMedia(Number(companyId), fd);
        })).then(results => results.map(r => r.data)),
        onSuccess: () => {
            toast.success('Đã tải lên media thành công.');
            queryClient.invalidateQueries({ queryKey: ['companyMedia', companyId] });
            setIsUploading(false);
        },
        onError: () => {
            toast.error('Có lỗi xảy ra khi tải lên.');
            setIsUploading(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (mediaId: string) => companyService.removeMedia(Number(companyId), Number(mediaId)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã xóa media.');
            queryClient.invalidateQueries({ queryKey: ['companyMedia', companyId] });
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setIsUploading(true);
            bulkUploadMutation.mutate(files);
        }
    };

    return (
        <Card className="border-cyan-500/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-cyan-400" />
                        Thư viện Media
                    </CardTitle>
                    <CardDescription>Hình ảnh và video giới thiệu không gian làm việc, văn hóa công ty.</CardDescription>
                </div>
                <div>
                    <label className="cursor-pointer">
                        <Button asChild variant="outline" className="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10" disabled={isUploading}>
                            <span>
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Tải lên
                            </span>
                        </Button>
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    </div>
                ) : mediaItems && mediaItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaItems.map((media: any) => (
                            <div key={media.id} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {media.media_type === 'video' ? (
                                    <>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-10">
                                            <PlayCircle className="w-10 h-10 text-white/80" />
                                        </div>
                                        {media.thumbnail ? (
                                            <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 opacity-30" /></div>
                                        )}
                                    </>
                                ) : (
                                    <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col justify-between p-2">
                                    <div className="flex justify-end">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="w-7 h-7 bg-white/20 hover:bg-red-500 text-white border-none rounded-md backdrop-blur-md"
                                            onClick={() => deleteMutation.mutate(media.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <p className="text-white text-xs truncate drop-shadow-md">
                                        {media.title || "Không có tiêu đề"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
                        <h3 className="font-medium text-lg">Chưa có ảnh/video nào</h3>
                        <p className="text-muted-foreground mb-4">Tải lên media để giúp ứng viên hiểu rõ hơn về văn hóa công ty bạn</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
