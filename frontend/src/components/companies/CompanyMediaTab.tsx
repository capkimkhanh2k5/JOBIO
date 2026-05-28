import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { companyService } from '@/services/companyService';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Link as LinkIcon, Play, Video } from 'lucide-react';

interface Props {
    companyId: string;
}

interface MediaItem {
    id: string | number;
    media_type: 'image' | 'video' | 'link';
    url: string;
    thumbnail?: string | null;
    title?: string | null;
    caption?: string | null;
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

    if (typeName.includes('link')) return 'link';
    if (typeName.includes('video')) return 'video';
    return 'image';
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

const getYoutubeEmbedUrl = (url?: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : '';
};

const normalizeMediaItem = (item: RawMediaItem): MediaItem | null => {
    const url = item.url || item.media_url;
    if (!url) return null;

    return {
        id: item.id,
        media_type: getMediaKind(item),
        url,
        thumbnail: item.thumbnail || item.thumbnail_url,
        title: item.title || null,
        caption: item.caption || null,
    };
};

export function CompanyMediaTab({ companyId }: Props) {
    const [playingLinkId, setPlayingLinkId] = useState<string | number | null>(null);

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
            <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row">
                        <Skeleton className="aspect-video w-full rounded-xl bg-gray-100 sm:w-72 lg:w-80" />
                        <div className="flex-1 space-y-3 py-2">
                            <Skeleton className="h-5 w-2/5 bg-gray-100" />
                            <Skeleton className="h-4 w-full bg-gray-100" />
                            <Skeleton className="h-4 w-4/5 bg-gray-100" />
                        </div>
                    </div>
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

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Image size={12} /> Media ({media.length})
            </h3>

            <div className="space-y-4">
                {media.map((item, index) => {
                    const isLink = item.media_type === 'link';
                    const isVideo = item.media_type === 'video';
                    const youtubeThumbnailUrl = isLink ? getYoutubeThumbnailUrl(item.url) : '';
                    const youtubeEmbedUrl = isLink ? getYoutubeEmbedUrl(item.url) : '';
                    const isPlaying = playingLinkId === item.id && Boolean(youtubeEmbedUrl);
                    const thumbnailUrl = youtubeThumbnailUrl || item.thumbnail || item.url;
                    const title = item.title || 'Không có tiêu đề';
                    const caption = item.caption || (isLink ? item.url : 'Chưa có caption');

                    return (
                        <motion.article
                            key={item.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row"
                        >
                            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:w-72 lg:w-80 xl:w-96">
                                {isLink ? (
                                    isPlaying ? (
                                        <iframe
                                            src={youtubeEmbedUrl}
                                            title={title}
                                            className="h-full w-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className="group h-full w-full"
                                            onClick={() => setPlayingLinkId(item.id)}
                                        >
                                            {youtubeThumbnailUrl ? (
                                                <img
                                                    src={youtubeThumbnailUrl}
                                                    alt={title}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-500">
                                                    <LinkIcon size={34} />
                                                    <span className="text-xs font-semibold">YouTube link</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                                                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-105">
                                                    <Play size={26} className="ml-1 fill-gray-900 text-gray-900" />
                                                </span>
                                            </div>
                                        </button>
                                    )
                                ) : isVideo ? (
                                    <>
                                        <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                            <Video size={34} className="text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1 py-1">
                                <h3 className="line-clamp-2 text-lg font-bold text-gray-950">{title}</h3>
                                <p className="mt-2 line-clamp-4 text-sm leading-6 text-gray-600">{caption}</p>
                            </div>
                        </motion.article>
                    );
                })}
            </div>
        </div>
    );
}
