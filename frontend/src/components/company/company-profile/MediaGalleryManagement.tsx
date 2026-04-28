import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Loader2, Upload, Trash2, Video, PlayCircle, Edit2 } from 'lucide-react';

export function MediaGalleryManagement({ companyId }: { companyId: string }) {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [editingMedia, setEditingMedia] = useState<any>(null);
    const [editData, setEditData] = useState({ title: '', caption: '', display_order: 0 });
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    const { data: mediaItems, isLoading } = useQuery({
        queryKey: ['companyMedia', companyId],
        queryFn: () => companyService.listMedia(Number(companyId)).then(r => r.data),
    });

    const { data: mediaTypesData, isLoading: isLoadingMediaTypes } = useQuery({
        queryKey: ['mediaTypes'],
        queryFn: () => companyService.listMediaTypes().then(r => r.data),
    });

    const mediaTypes = Array.isArray(mediaTypesData)
        ? mediaTypesData
        : ((mediaTypesData as any)?.results || []);

    const mediaList = Array.isArray(mediaItems)
        ? mediaItems
        : ((mediaItems as any)?.results || []);

    const getMediaTypeIdForFile = (file: File) => {
        const targetType = file.type.startsWith('video/') ? 'video' : 'image';
        const matchingType = mediaTypes.find((type: any) => {
            const typeName = String(type.type_name || '').toLowerCase();
            if (targetType === 'video') return typeName.includes('video');
            return typeName.includes('image') || typeName.includes('photo');
        });

        if (matchingType) return matchingType.id;

        if (targetType === 'image') {
            return mediaTypes.find((type: any) => {
                const typeName = String(type.type_name || '').toLowerCase();
                return !['video', 'document', 'pdf', 'link'].some(keyword => typeName.includes(keyword));
            })?.id;
        }

        return undefined;
    };

    const bulkUploadMutation = useMutation({
        mutationFn: (files: File[]) => Promise.all(files.map(file => {
            const mediaTypeId = getMediaTypeIdForFile(file);
            if (!mediaTypeId) {
                throw new Error(`Không tìm thấy loại media phù hợp cho ${file.name}`);
            }
            const fd = new FormData();
            fd.append('media_file', file);
            fd.append('media_type_id', String(mediaTypeId));
            fd.append('title', file.name.replace(/\.[^/.]+$/, ''));
            return companyService.addMedia(Number(companyId), fd);
        })).then(results => results.map(r => r.data)),
        onSuccess: () => {
            toast.success('Đã tải lên media thành công.');
            queryClient.invalidateQueries({ queryKey: ['companyMedia', companyId] });
            setIsUploading(false);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Có lỗi xảy ra khi tải lên.');
            setIsUploading(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (mediaId: string) => companyService.removeMedia(Number(companyId), Number(mediaId)).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã xóa media.');
            queryClient.invalidateQueries({ queryKey: ['companyMedia', companyId] });
            setDeleteTarget(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number, payload: any }) => companyService.updateMedia(Number(companyId), data.id, data.payload).then(r => r.data),
        onSuccess: () => {
            toast.success('Đã cập nhật media thành công.');
            queryClient.invalidateQueries({ queryKey: ['companyMedia', companyId] });
            setEditingMedia(null);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Có lỗi xảy ra khi cập nhật.');
        }
    });

    const handleSaveEdit = () => {
        if (!editingMedia) return;
        updateMutation.mutate({
            id: editingMedia.id,
            payload: {
                title: editData.title,
                caption: editData.caption,
                display_order: Number(editData.display_order) || 0
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            if (mediaTypes.length === 0) {
                toast.error('Chưa tải được danh sách loại media. Vui lòng thử lại.');
                e.target.value = '';
                return;
            }
            setIsUploading(true);
            bulkUploadMutation.mutate(files);
            e.target.value = '';
        }
    };

    return (
        <>
        <Card className="border-violet-500/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-violet-400" />
                        Thư viện Media
                    </CardTitle>
                    <CardDescription>Hình ảnh và video giới thiệu không gian làm việc, văn hóa công ty.</CardDescription>
                </div>
                <div>
                    <label className="cursor-pointer">
                        <Button asChild variant="outline" className="border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10" disabled={isUploading || isLoadingMediaTypes || mediaTypes.length === 0}>
                            <span>
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Tải lên
                            </span>
                        </Button>
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={isUploading || isLoadingMediaTypes || mediaTypes.length === 0} />
                    </label>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    </div>
                ) : mediaList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {mediaList.map((media: any) => {
                            const mediaUrl = media.media_url || media.url;
                            const thumbnailUrl = media.thumbnail_url || media.thumbnail;
                            const mediaTypeName = String(media.media_type_name || media.media_type?.type_name || '').toLowerCase();
                            const isVideo = mediaTypeName.includes('video') || /\.(mp4|mov|webm|avi|mkv)$/i.test(mediaUrl || '');

                            return (
                            <div key={media.id} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {isVideo ? (
                                    <>
                                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none z-10">
                                            <PlayCircle className="w-10 h-10 text-white/80" />
                                        </div>
                                        {thumbnailUrl ? (
                                            <img src={thumbnailUrl} alt={media.title || 'Media'} className="w-full h-full object-cover" />
                                        ) : mediaUrl ? (
                                            <video src={mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 opacity-30" /></div>
                                        )}
                                    </>
                                ) : mediaUrl ? (
                                    <img src={mediaUrl} alt={media.title || 'Media'} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 opacity-30" /></div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col justify-between p-2">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="w-7 h-7 bg-white/20 hover:bg-violet-500 text-white border-none rounded-md backdrop-blur-md transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setEditingMedia(media);
                                                setEditData({
                                                    title: media.title || '',
                                                    caption: media.caption || '',
                                                    display_order: media.display_order || 0
                                                });
                                            }}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="w-7 h-7 bg-white/20 hover:bg-red-500 text-white border-none rounded-md backdrop-blur-md transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setDeleteTarget(media);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <p className="text-white text-xs truncate drop-shadow-md">
                                        {media.title || "Không có tiêu đề"}
                                    </p>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 flex flex-col items-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
                        <h3 className="font-medium text-lg">Chưa có ảnh/video nào</h3>
                        <p className="text-muted-foreground mb-4">Tải lên media để giúp ứng viên hiểu rõ hơn về văn hóa công ty bạn</p>
                    </div>
                )}

                <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa Media</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Tiêu đề</Label>
                                <Input
                                    id="title"
                                    value={editData.title}
                                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Nhập tiêu đề..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="caption">Mô tả</Label>
                                <Textarea
                                    id="caption"
                                    value={editData.caption}
                                    onChange={(e) => setEditData(prev => ({ ...prev, caption: e.target.value }))}
                                    placeholder="Nhập mô tả cho ảnh/video này..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="display_order">Thứ tự hiển thị (từ nhỏ đến lớn)</Label>
                                <Input
                                    id="display_order"
                                    type="number"
                                    value={editData.display_order}
                                    onChange={(e) => setEditData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingMedia(null)}>Hủy</Button>
                            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa media này?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Media "{deleteTarget ? (deleteTarget.title || 'Không có tiêu đề') : ''}" sẽ bị xóa khỏi hồ sơ công ty. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-slate-200" disabled={deleteMutation.isPending}>
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold border-none"
                        disabled={deleteMutation.isPending}
                        onClick={(event) => {
                            event.preventDefault();
                            if (deleteTarget) deleteMutation.mutate(String(deleteTarget.id));
                        }}
                    >
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
