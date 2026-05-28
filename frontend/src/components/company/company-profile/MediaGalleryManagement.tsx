import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, Loader2, Plus, Upload, Trash2, Video, PlayCircle, Edit2, Link as LinkIcon, X } from 'lucide-react';
import type { CompanyMedia } from '@/types/api';

const getErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.detail || error?.response?.data?.error || error?.message || fallback;
};

const getYoutubeVideoId = (url?: string) => {
    if (!url) return '';

    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.replace(/^www\./, '');

        if (hostname === 'youtu.be') {
            return parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
        }
        if (hostname.includes('youtube.com')) {
            if (parsedUrl.pathname === '/watch') {
                return parsedUrl.searchParams.get('v') || '';
            }
            const parts = parsedUrl.pathname.split('/').filter(Boolean);
            if (['embed', 'shorts'].includes(parts[0])) {
                return parts[1] || '';
            }
        }
    } catch {
        return '';
    }

    return '';
};

const getYoutubeThumbnailUrl = (url?: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

export function MediaGalleryManagement({ companyId }: { companyId: string }) {
    const queryClient = useQueryClient();
    const skipCleanupOnCloseRef = useRef(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addData, setAddData] = useState({ title: '', caption: '', media_type_id: '', media_url: '' });
    const [addFile, setAddFile] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState('');
    const [uploadedPreview, setUploadedPreview] = useState<CompanyMedia | null>(null);
    const [isUploadingPreview, setIsUploadingPreview] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
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

    const mediaTypes = Array.isArray(mediaTypesData) ? mediaTypesData : ((mediaTypesData as any)?.results || []);
    const mediaList = Array.isArray(mediaItems) ? mediaItems : ((mediaItems as any)?.results || []);

    const selectedMediaType = mediaTypes.find((type: any) => String(type.id) === addData.media_type_id);
    const selectedMediaTypeName = String(selectedMediaType?.type_name || '').toLowerCase();
    const isLinkType = selectedMediaTypeName.includes('link');
    const isImageType = selectedMediaTypeName.includes('image') || selectedMediaTypeName.includes('photo');

    const resetAddForm = () => {
        if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(localPreviewUrl);
        }
        setAddData({ title: '', caption: '', media_type_id: '', media_url: '' });
        setAddFile(null);
        setLocalPreviewUrl('');
        setUploadedPreview(null);
        setIsUploadingPreview(false);
        setIsPosting(false);
    };

    const discardUploadedPreview = async () => {
        if (!uploadedPreview) return;
        try {
            await companyService.removeMedia(Number(companyId), uploadedPreview.id);
        } catch {
            // Best-effort cleanup for media uploaded before the user publishes.
        }
    };

    const closeAddDialog = async (keepUploaded = false) => {
        if (!keepUploaded) {
            await discardUploadedPreview();
        } else {
            skipCleanupOnCloseRef.current = true;
        }
        setIsAddOpen(false);
        resetAddForm();
    };

    const openAddDialog = () => {
        resetAddForm();
        setIsAddOpen(true);
    };

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
            toast.error(getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật.'));
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

    const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!addData.media_type_id) {
            toast.error('Vui lòng chọn loại media trước khi chọn ảnh.');
            return;
        }

        if (isLinkType) return;

        if (uploadedPreview) {
            await discardUploadedPreview();
            setUploadedPreview(null);
        }

        const nextPreviewUrl = URL.createObjectURL(file);
        if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(localPreviewUrl);
        }
        setAddFile(file);
        setLocalPreviewUrl(nextPreviewUrl);
        setIsUploadingPreview(true);

        const fd = new FormData();
        fd.append('media_type_id', addData.media_type_id);
        fd.append('title', addData.title.trim() || file.name.replace(/\.[^/.]+$/, ''));
        fd.append('caption', addData.caption.trim());
        fd.append('media_file', file);

        try {
            const response = await companyService.addMedia(Number(companyId), fd);
            setUploadedPreview(response.data);
            URL.revokeObjectURL(nextPreviewUrl);
            setLocalPreviewUrl(response.data.media_url);
            toast.success('Ảnh đã được tải lên Cloudinary.');
        } catch (error: any) {
            URL.revokeObjectURL(nextPreviewUrl);
            setAddFile(null);
            setUploadedPreview(null);
            setLocalPreviewUrl('');
            toast.error(getErrorMessage(error, 'Có lỗi xảy ra khi tải ảnh lên.'));
        } finally {
            setIsUploadingPreview(false);
        }
    };

    const publishLinkMedia = async () => {
        const fd = new FormData();
        fd.append('media_type_id', addData.media_type_id);
        fd.append('title', addData.title.trim());
        fd.append('caption', addData.caption.trim());
        fd.append('media_url', addData.media_url.trim());
        await companyService.addMedia(Number(companyId), fd);
    };

    const handlePublish = async () => {
        if (!addData.media_type_id) {
            toast.error('Vui lòng chọn loại media.');
            return;
        }
        if (isLinkType && !addData.media_url.trim()) {
            toast.error('Vui lòng nhập link YouTube.');
            return;
        }
        if (!isLinkType && !uploadedPreview) {
            toast.error('Vui lòng chọn ảnh để tải lên Cloudinary.');
            return;
        }

        setIsPosting(true);
        try {
            if (isLinkType) {
                await publishLinkMedia();
            } else if (uploadedPreview) {
                await companyService.updateMedia(Number(companyId), uploadedPreview.id, {
                    title: addData.title.trim() || uploadedPreview.title || addFile?.name?.replace(/\.[^/.]+$/, '') || '',
                    caption: addData.caption.trim(),
                    display_order: uploadedPreview.display_order,
                });
            }
            toast.success('Đã thêm media thành công.');
            queryClient.invalidateQueries({ queryKey: ['companyMedia', companyId] });
            await closeAddDialog(true);
        } catch (error: any) {
            toast.error(getErrorMessage(error, 'Có lỗi xảy ra khi thêm media.'));
        } finally {
            setIsPosting(false);
        }
    };

    const handleTypeChange = async (value: string) => {
        if (uploadedPreview) {
            await discardUploadedPreview();
        }
        if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(localPreviewUrl);
        }
        setAddData(prev => ({ ...prev, media_type_id: value, media_url: '' }));
        setAddFile(null);
        setLocalPreviewUrl('');
        setUploadedPreview(null);
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
                    <Button
                        variant="outline"
                        className="border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                        disabled={isLoadingMediaTypes || mediaTypes.length === 0}
                        onClick={openAddDialog}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        </div>
                    ) : mediaList.length > 0 ? (
                        <div className="space-y-3">
                            {mediaList.map((media: any) => {
                                const mediaUrl = media.media_url || media.url;
                                const thumbnailUrl = media.thumbnail_url || media.thumbnail;
                                const mediaTypeName = String(media.media_type_name || media.media_type?.type_name || '').toLowerCase();
                                const isLink = mediaTypeName.includes('link');
                                const isVideo = mediaTypeName.includes('video') || /\.(mp4|mov|webm|avi|mkv)$/i.test(mediaUrl || '');
                                const youtubeThumbnailUrl = isLink ? getYoutubeThumbnailUrl(mediaUrl) : '';
                                const imageUrl = youtubeThumbnailUrl || thumbnailUrl || mediaUrl;
                                const title = media.title || 'Không có tiêu đề';
                                const caption = media.caption || (isLink ? mediaUrl : 'Chưa có caption');

                                return (
                                    <div key={media.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                                        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-44 lg:h-32 lg:w-56">
                                            {isLink ? (
                                                <a href={mediaUrl} target="_blank" rel="noreferrer" className="group block h-full w-full">
                                                    {youtubeThumbnailUrl ? (
                                                        <img src={youtubeThumbnailUrl} alt={title} className="h-full w-full object-cover transition group-hover:scale-105" />
                                                    ) : (
                                                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-500">
                                                            <LinkIcon className="h-8 w-8" />
                                                            <span className="text-xs font-semibold">YouTube link</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                                                        <PlayCircle className="h-10 w-10 text-white drop-shadow" />
                                                    </div>
                                                </a>
                                            ) : isVideo ? (
                                                <>
                                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 pointer-events-none">
                                                        <PlayCircle className="h-10 w-10 text-white/90" />
                                                    </div>
                                                    {thumbnailUrl ? (
                                                        <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
                                                    ) : mediaUrl ? (
                                                        <video src={mediaUrl} className="h-full w-full object-cover" muted preload="metadata" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center"><Video className="h-8 w-8 opacity-30" /></div>
                                                    )}
                                                </>
                                            ) : imageUrl ? (
                                                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-8 w-8 opacity-30" /></div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="line-clamp-2 text-base font-bold text-slate-900">{title}</h3>
                                            <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600">{caption}</p>
                                        </div>

                                        <div className="flex shrink-0 items-center justify-end gap-2 sm:self-stretch">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
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
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg border-slate-200 text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setDeleteTarget(media);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 border border-dashed rounded-xl border-slate-200 flex flex-col items-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
                            <h3 className="font-medium text-lg">Chưa có ảnh/video nào</h3>
                            <p className="text-muted-foreground mb-4">Thêm media để giúp ứng viên hiểu rõ hơn về văn hóa công ty bạn.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={(open) => {
                if (!open) {
                    if (skipCleanupOnCloseRef.current) {
                        skipCleanupOnCloseRef.current = false;
                        setIsAddOpen(false);
                        resetAddForm();
                    } else {
                        void closeAddDialog(false);
                    }
                } else {
                    setIsAddOpen(true);
                }
            }}>
                <DialogContent className="sm:max-w-[620px]">
                    <DialogHeader>
                        <DialogTitle>Thêm media</DialogTitle>
                        <DialogDescription>Thêm ảnh văn phòng hoặc link YouTube vào thư viện công ty.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tiêu đề</Label>
                            <Input value={addData.title} onChange={(e) => setAddData(prev => ({ ...prev, title: e.target.value }))} placeholder="Nhập tiêu đề media..." />
                        </div>
                        <div className="grid gap-2">
                            <Label>Caption</Label>
                            <Textarea value={addData.caption} onChange={(e) => setAddData(prev => ({ ...prev, caption: e.target.value }))} placeholder="Nhập mô tả ngắn..." rows={3} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Loại media</Label>
                            <Select value={addData.media_type_id} onValueChange={handleTypeChange} disabled={isUploadingPreview || isPosting}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Chọn media type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {mediaTypes.map((type: any) => (
                                        <SelectItem key={type.id} value={String(type.id)}>{type.type_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {isLinkType ? (
                            <div className="grid gap-2">
                                <Label>Link YouTube</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input value={addData.media_url} onChange={(e) => setAddData(prev => ({ ...prev, media_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="pl-9" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                <Label>{isImageType ? 'Ảnh' : 'File media'}</Label>
                                {localPreviewUrl ? (
                                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-video">
                                        <img src={localPreviewUrl} alt="Preview media" className="h-full w-full object-cover" />
                                        {isUploadingPreview && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-white">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="text-sm font-semibold">Đang tải lên Cloudinary...</span>
                                            </div>
                                        )}
                                        {!isUploadingPreview && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90"
                                                onClick={async () => {
                                                    await discardUploadedPreview();
                                                    setAddFile(null);
                                                    setUploadedPreview(null);
                                                    setLocalPreviewUrl('');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm font-semibold text-slate-500 transition hover:border-violet-300 hover:bg-violet-50/40 hover:text-violet-600">
                                        <Upload className="h-4 w-4" />
                                        Chọn ảnh để tải lên Cloudinary
                                        <input type="file" accept={isImageType ? 'image/*' : 'image/*,video/*'} className="hidden" onChange={handleImageFileChange} disabled={!addData.media_type_id || isUploadingPreview || isPosting} />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => void closeAddDialog(false)} disabled={isUploadingPreview || isPosting}>Hủy</Button>
                        <Button onClick={handlePublish} disabled={isUploadingPreview || isPosting}>
                            {isPosting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Đăng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            <Label htmlFor="display_order">Thứ tự hiển thị</Label>
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
