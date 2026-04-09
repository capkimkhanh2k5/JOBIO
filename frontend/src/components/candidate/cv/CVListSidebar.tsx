import { motion } from 'framer-motion';
import { FileText, Eye, Download, Star, MoreVertical, Globe, Lock, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CVItem } from '@/pages/candidate/CVManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
    cvList: CVItem[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (cv: CVItem) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
    onDownload: (id: string) => void;
    onTogglePrivacy: (id: string, is_public: boolean) => void;
    onCreateNew: () => void;
}

export function CVListSidebar({
    cvList, loading, selectedId, onSelect,
    onDelete, onSetDefault, onDownload, onTogglePrivacy, onCreateNew
}: Props) {
    return (
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-white/40 backdrop-blur-md overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Danh sách CV ({cvList.length})
                </p>
                <div 
                    onClick={onCreateNew}
                    className="w-7 h-7 rounded-md bg-violet-100 hover:bg-violet-200 text-violet-600 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                    title="Tạo CV mới"
                >
                    <Plus className="w-4 h-4" />
                </div>
            </div>

            {/* CV Cards list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))
                ) : cvList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Chưa có CV nào</p>
                        <p className="text-xs text-muted-foreground mt-1">Tạo CV đầu tiên của bạn ngay!</p>
                    </div>
                ) : (
                    cvList.map((cv, i) => (
                        <motion.div
                            key={cv.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div
                                onClick={() => onSelect(cv)}
                                className={`group relative rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${selectedId === cv.id
                                        ? 'border-violet-300 bg-violet-50 shadow-sm shadow-violet-100'
                                        : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/50'
                                    }`}
                            >
                                {/* Selected indicator */}
                                {selectedId === cv.id && (
                                    <motion.div
                                        layoutId="cv-list-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-gradient-to-b from-violet-400 to-cyan-500 rounded-full"
                                    />
                                )}

                                <div className="flex items-start gap-3">
                                    {/* Thumbnail */}
                                    <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-cyan-100 border border-violet-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        <img
                                            src={cv.thumbnail_url}
                                            alt={cv.template_name}
                                            className="w-full h-full object-cover opacity-70"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{cv.cv_name}</p>
                                            {cv.is_default && (
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate mb-2">{cv.template_name}</p>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Eye className="w-3 h-3" /> {cv.view_count}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Download className="w-3 h-3" /> {cv.download_count}
                                            </span>
                                            {cv.is_public ? (
                                                <Badge variant="outline" className="h-4 text-[10px] px-1.5 border-emerald-200 text-emerald-600 bg-emerald-50">
                                                    <Globe className="w-2.5 h-2.5 mr-1" /> Public
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="h-4 text-[10px] px-1.5 border-slate-200 text-slate-500">
                                                    <Lock className="w-2.5 h-2.5 mr-1" /> Private
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                            Cập nhật {formatDistanceToNow(new Date(cv.updated_at), { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>

                                    {/* Context menu */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-all">
                                                    <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 shadow-lg">
                                                {!cv.is_default && (
                                                    <DropdownMenuItem onClick={() => onSetDefault(cv.id)} className="text-xs">
                                                        <Star className="w-3.5 h-3.5 mr-2 text-amber-500" /> Đặt làm mặc định
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => onDownload(cv.id)} className="text-xs">
                                                    <Download className="w-3.5 h-3.5 mr-2 text-blue-500" /> Tải xuống PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onTogglePrivacy(cv.id, !cv.is_public)}
                                                    className="text-xs"
                                                >
                                                    {cv.is_public ? (
                                                        <><Lock className="w-3.5 h-3.5 mr-2 text-slate-400" /> Đặt riêng tư</>
                                                    ) : (
                                                        <><Globe className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Công khai</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(cv.id)}
                                                    className="text-xs text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa CV
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>


        </aside>
    );
}
