import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { companyService } from '@/services/companyService';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Play, Image, X } from 'lucide-react';

interface Props {
    companyId: string;
}

interface MediaItem {
    id: string | number;
    media_type: 'image' | 'video';
    url: string;
    thumbnail?: string | null;
    title?: string | null;
}

type RawMediaItem = {
    id: string | number;
    media_type?: number | string | { id?: number; type_name?: string };
    media_type_name?: string;
    media_url?: string;
    url?: string;
    thumbnail_url?: string | null;
    thumbnail?: string | null;
    title?: string | null;
    caption?: string | null;
};

const getMediaKind = (item: RawMediaItem): MediaItem['media_type'] => {
    const rawType = typeof item.media_type === 'object'
        ? item.media_type?.type_name
        : item.media_type;
    const typeName = String(item.media_type_name ?? rawType ?? '').toLowerCase();
    return typeName.includes('video') ? 'video' : 'image';
};

const normalizeMediaItem = (item: RawMediaItem): MediaItem | null => {
    const url = item.url || item.media_url;
    if (!url) return null;

    return {
        id: item.id,
        media_type: getMediaKind(item),
        url,
        thumbnail: item.thumbnail || item.thumbnail_url,
        title: item.title || item.caption || null,
    };
};

function MediaLightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                        <X size={16} className="text-white" />
                    </button>
                    {item.media_type === 'video' ? (
                        <video
                            src={item.url}
                            controls
                            autoPlay
                            className="w-full h-full object-contain bg-black"
                        />
                    ) : (
                        <img
                            src={item.url}
                            alt={item.title ?? 'Media'}
                            className="w-full h-full object-contain bg-black"
                        />
                    )}
                    {item.title && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <p className="text-white font-medium text-sm">{item.title}</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export function CompanyMediaTab({ companyId }: Props) {
    const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

    const { data: rawMedia, isLoading } = useQuery({
        queryKey: ['company-media', companyId],
        queryFn: () => companyService.listMedia(Number(companyId)).then(r => r.data as RawMediaItem[]),
        staleTime: 1000 * 60 * 5,
    });

    const media = (rawMedia ?? [])
        .map(normalizeMediaItem)
        .filter((item): item is MediaItem => Boolean(item));

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-xl bg-gray-100" />
                ))}
            </div>
        );
    }

    if (media.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4">
                    <Image size={28} />
                </div>
                <p className="font-medium text-gray-500">Chưa có media nào</p>
            </div>
        );
    }

    const images = media.filter(m => m.media_type === 'image');
    const videos = media.filter(m => m.media_type === 'video');

    return (
        <>
            {videos.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                        <Play size={12} /> Video ({videos.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {videos.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.08 }}
                                className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all"
                                onClick={() => setLightboxItem(item)}
                            >
                                <img
                                    src={item.thumbnail || item.url}
                                    alt={item.title ?? 'Media'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <div className="h-14 w-14 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Play size={22} className="text-gray-900 fill-gray-900 ml-1" />
                                    </div>
                                </div>
                                <Badge className="absolute bottom-3 left-3 bg-black/50 text-white border-0 text-xs">
                                    Video
                                </Badge>
                                {item.title && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-xs font-medium">{item.title}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {images.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Image size={12} /> Ảnh ({images.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {images.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.06 }}
                                className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all"
                                onClick={() => setLightboxItem(item)}
                            >
                                <img
                                    src={item.url}
                                    alt={item.title ?? 'Media'}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                {item.title && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-xs font-medium">{item.title}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxItem && (
                <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
            )}
        </>
    );
}
