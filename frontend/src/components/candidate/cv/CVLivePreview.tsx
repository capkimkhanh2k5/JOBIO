import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, RefreshCw, Maximize2, FileText, Lock, X, Printer, Loader2, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cvService } from '@/services/cvService';
import { useUserStore } from '@/store/userStore';
import { getCandidateId } from '@/lib/candidateIdentity';

interface Props {
    cvId: string | null;
    cvName: string;
    templateId: string | null;  // null for CV_Upload
    cvUrl?: string | null;       // URL of uploaded PDF for CV_Upload
    previewKey?: number; // increments from parent when data is saved → triggers re-fetch
}

function CVIframe({ html, style }: { html: string; style?: React.CSSProperties }) {
    return (
        <iframe
            srcDoc={html}
            sandbox="allow-same-origin allow-scripts"
            style={{ width: '100%', border: 'none', ...style }}
            title="CV Preview"
        />
    );
}

// ─── Fullscreen modal ─────────────────────────────────────────────────────────
function CVFullscreenModal({ cvName, html, cvUrl, isUploadedCv, templateName, onClose }: {
    cvName: string; html?: string | null; cvUrl?: string | null; isUploadedCv?: boolean; templateName?: string; onClose: () => void;
}) {
    const [pdfError, setPdfError] = useState(false);

    const handlePrint = () => {
        if (!html) return;
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 800);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // PDF mode for CV_Upload
    if (isUploadedCv && cvUrl) {
        const cleanUrl = cvUrl.split('#')[0];
        const iframeSrc = `${cleanUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col"
                style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            >
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{cvName || 'Xem trước CV'}</p>
                            <p className="text-[11px] text-white/50">PDF Upload · Bản in đầy đủ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1.5 h-8 cursor-pointer"
                            onClick={() => window.open(cvUrl, '_blank')}>
                            <Printer className="w-3.5 h-3.5" /> Mở tab mới
                        </Button>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer">
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex justify-center items-start py-6 px-4">
                    {pdfError ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                            <p className="text-sm text-red-400 font-medium">Không thể tải file PDF</p>
                            <Button size="sm" variant="outline"
                                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1.5"
                                onClick={() => window.open(cvUrl, '_blank')}>
                                Mở trong tab mới
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white shadow-2xl rounded overflow-hidden" style={{ width: '210mm', height: 'calc(90vh - 80px)' }}>
                            <iframe src={iframeSrc} className="w-full h-full border-none" title="CV PDF Preview" onError={() => setPdfError(true)} />
                        </div>
                    )}
                </div>
                <div className="text-center py-3 shrink-0">
                    <p className="text-[11px] text-white/30">Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Esc</kbd> để đóng</p>
                </div>
            </motion.div>
        );
    }

    // HTML mode for CV_Template
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-md">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{cvName || 'Xem trước CV'}</p>
                        <p className="text-[11px] text-white/50">{templateName || 'Template'} · Bản in đầy đủ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handlePrint}
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1.5 h-8 cursor-pointer">
                        <Printer className="w-3.5 h-3.5" /> In / PDF
                    </Button>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto flex justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="relative flex justify-center items-start w-full"
                >
                    <div className="bg-white shadow-2xl rounded overflow-hidden origin-top"
                         style={{ 
                             width: '210mm', 
                             height: '297mm',
                             transform: 'scale(0.8)',
                             flexShrink: 0,
                             marginBottom: '-50mm'
                         }}>
                        <CVIframe html={html || ''} style={{ height: '100%', display: 'block' }} />
                    </div>
                </motion.div>
            </div>

            <div className="text-center py-3 shrink-0">
                <p className="text-[11px] text-white/30">
                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Esc</kbd> để đóng
                </p>
            </div>
        </motion.div>
    );
}

// ─── PDF iframe preview (for CV_Upload) ──────────────────────────────────────
function PdfIframePreview({ url }: { url: string }) {
    const [error, setError] = useState(false);
    const [key, setKey] = useState(0);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-500">Không thể tải file PDF. Vui lòng thử lại.</p>
                <Button size="sm" variant="outline" onClick={() => { setError(false); setKey(k => k + 1); }} className="cursor-pointer">
                    Thử lại
                </Button>
            </div>
        );
    }

    return (
        <iframe
            key={key}
            src={url}
            className="w-full h-full border-none"
            title="CV PDF Preview"
            onError={() => setError(true)}
        />
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CVLivePreview({ cvId, cvName, templateId, cvUrl, previewKey = 0 }: Props) {
    const { user } = useUserStore();
    const candidateId = getCandidateId(user);

    // CV_Upload: no template, but has a cv_url (uploaded PDF)
    // CV_Template: has templateId (even if cv_url is also set after saving PDF)
    const isUploadedCv = !templateId && !!cvUrl;

    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState<string | undefined>();
    const [fullscreen, setFullscreen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [zoom, setZoom] = useState(0.58); // default zoom

    const fetchPreview = useCallback(async () => {
        // CV_Upload: no need to fetch HTML preview
        if (isUploadedCv) return;
        if (!cvId || !candidateId) return;
        const cvIdNum = parseInt(cvId, 10);
        const candidateIdNum = candidateId;
        if (isNaN(cvIdNum)) return;

        setLoading(true);
        setError(null);
        try {
            // Use the CV-specific preview endpoint (uses cv_data!)
            const res = await cvService.previewCv(candidateIdNum, cvIdNum);
            setHtml(res.data.html_content);
        } catch {
            setError('Không thể tải preview. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [cvId, candidateId, refreshKey, previewKey, isUploadedCv]); // previewKey triggers on auto-save

    useEffect(() => { fetchPreview(); }, [fetchPreview]);

    // Fetch template name for display
    useEffect(() => {
        if (!templateId) return;
        const tplId = parseInt(templateId, 10);
        if (isNaN(tplId)) return;
        cvService.getTemplate(tplId).then(r => setTemplateName(r.data.name)).catch(() => {});
    }, [templateId]);

    const clampedZoom = Math.max(0.35, Math.min(1.0, zoom));

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-semibold text-slate-700">Xem trước</span>
                    {templateName && (
                        <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                            {templateName}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    <button onClick={() => setZoom(z => Math.max(0.35, z - 0.1))} title="Thu nhỏ"
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                        <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <span className="text-[10px] text-slate-400 w-8 text-center font-mono">{Math.round(clampedZoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.0, z + 0.1))} title="Phóng to"
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                        <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button onClick={() => setRefreshKey(k => k + 1)} disabled={!cvId || loading} title="Làm mới"
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40">
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin text-violet-500' : ''}`} />
                    </button>
                    <button onClick={() => setFullscreen(true)} disabled={!cvId || (!html && !isUploadedCv)} title="Xem toàn màn hình"
                        className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Preview area - scrollable */}
            <div className="flex-1 overflow-auto p-3" style={{ background: '#e8eaed' }}>
                {!cvId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        <Lock className="w-8 h-8 text-slate-300" />
                        <p className="text-sm text-slate-400">Chọn CV để xem trước</p>
                    </div>
                ) : isUploadedCv ? (
                    // CV_Upload: render PDF iframe
                    <div className="w-full h-full min-h-[600px] bg-white rounded-lg shadow-sm overflow-hidden">
                        <PdfIframePreview url={cvUrl!} />
                    </div>
                ) : loading ? (
                    <div className="bg-white rounded-lg p-6 shadow space-y-3">
                        <Skeleton className="h-5 w-2/3 rounded" />
                        <Skeleton className="h-4 w-1/3 rounded" />
                        <Skeleton className="h-32 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <div className="flex items-center justify-center pt-2 gap-2 text-violet-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Đang render template...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <p className="text-sm text-red-500">{error}</p>
                        <Button size="sm" variant="outline" onClick={() => setRefreshKey(k => k + 1)} className="cursor-pointer">Thử lại</Button>
                    </div>
                ) : html ? (
                    <motion.div
                        key={`${cvId}-${refreshKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="relative"
                        style={{
                            width: `${100 / clampedZoom}%`,
                            transform: `scale(${clampedZoom})`,
                            transformOrigin: 'top left',
                        }}
                    >
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <CVIframe html={html} style={{ height: 1050, display: 'block' }} />
                        </div>
                    </motion.div>
                ) : null}
            </div>

            <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
                <Button onClick={() => setFullscreen(true)} disabled={!cvId || (!html && !isUploadedCv)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/25 gap-2 cursor-pointer">
                    <Maximize2 className="w-4 h-4" /> Xem bản in đầy đủ
                </Button>
            </div>

            {createPortal(
                <AnimatePresence>
                    {fullscreen && (
                        <CVFullscreenModal
                            cvName={cvName}
                            html={html}
                            cvUrl={cvUrl}
                            isUploadedCv={isUploadedCv}
                            templateName={templateName}
                            onClose={() => setFullscreen(false)}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
