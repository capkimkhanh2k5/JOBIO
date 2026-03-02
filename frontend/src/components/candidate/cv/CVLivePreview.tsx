import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, RefreshCw, Maximize2, FileText, Lock, X, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
    cvId: string | null;
    cvName: string;
    cvData: Record<string, any>;
    templateId: string;
}

// Color schemes map for visual mock preview
const colorSchemes: Record<string, { from: string; to: string; accent: string; bg: string }> = {
    'tpl-1': { from: 'from-violet-500', to: 'to-cyan-400', accent: 'text-violet-700', bg: 'bg-violet-50' },
    'tpl-2': { from: 'from-slate-400', to: 'to-slate-600', accent: 'text-slate-600', bg: 'bg-slate-50' },
    'tpl-3': { from: 'from-slate-700', to: 'to-slate-900', accent: 'text-slate-900', bg: 'bg-slate-100' },
    'tpl-4': { from: 'from-indigo-400', to: 'to-purple-500', accent: 'text-indigo-700', bg: 'bg-indigo-50' },
    'tpl-5': { from: 'from-cyan-500', to: 'to-sky-400', accent: 'text-cyan-700', bg: 'bg-cyan-50' },
    'tpl-6': { from: 'from-rose-400', to: 'to-violet-500', accent: 'text-rose-700', bg: 'bg-rose-50' },
    'tpl-7': { from: 'from-neutral-400', to: 'to-neutral-600', accent: 'text-neutral-700', bg: 'bg-neutral-50' },
    'tpl-8': { from: 'from-amber-400', to: 'to-orange-500', accent: 'text-amber-700', bg: 'bg-amber-50' },
};

type Scheme = (typeof colorSchemes)[string];

// ─── Shared CV renderer – used by both mini-preview AND fullscreen modal ──────
function CVBody({
    cvName, cvData, scheme, size = 'sm',
}: {
    cvName: string;
    cvData: Record<string, any>;
    scheme: Scheme;
    size?: 'sm' | 'lg';
}) {
    const sm = size === 'sm';

    const skills: string[] = cvData.skills
        ? cvData.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['React', 'TypeScript', 'TailwindCSS', 'Node.js'];

    const experience: any[] = cvData.experience ?? [
        { company: 'Tech Solutions Inc.', title: 'Frontend Developer', period: '2018 – 2021' },
        { company: 'JOBIO Tech', title: 'Senior Frontend Engr.', period: '2021 – Nay' },
    ];

    return (
        <div
            className={`bg-white overflow-hidden ${sm ? 'rounded-xl shadow-md border border-slate-100' : ''}`}
            style={sm ? { minHeight: 520 } : {}}
        >
            {/* Accent bar */}
            <div className={`${sm ? 'h-2' : 'h-3'} bg-gradient-to-r ${scheme.from} ${scheme.to}`} />

            {/* Header */}
            <div className={`px-6 ${sm ? 'pt-5 pb-4' : 'pt-8 pb-6'} bg-gradient-to-br ${scheme.from} ${scheme.to}`}>
                <div className="flex items-center gap-4">
                    <div className={`${sm ? 'w-14 h-14' : 'w-20 h-20'} rounded-full bg-white/25 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center shadow-lg shrink-0`}>
                        <FileText className={`${sm ? 'w-6 h-6' : 'w-9 h-9'} text-white`} />
                    </div>
                    <div>
                        <h2 className={`${sm ? 'text-base' : 'text-2xl'} font-black text-white`}>
                            {cvName || 'Tên CV của bạn'}
                        </h2>
                        <p className={`${sm ? 'text-xs' : 'text-sm'} text-white/80 mt-1`}>
                            {cvData.headline || 'Senior Frontend Engineer'}
                        </p>
                        {!sm && cvData.languages && (
                            <p className="text-xs text-white/60 mt-1">{cvData.languages}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Body sections */}
            <div className={`${sm ? 'px-5 py-4' : 'px-8 py-6'} space-y-5`}>
                {/* Summary */}
                <div>
                    <h4 className={`${sm ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-widest mb-2 ${scheme.accent}`}>
                        Giới thiệu bản thân
                    </h4>
                    <p className={`${sm ? 'text-[11px] line-clamp-3' : 'text-sm leading-relaxed'} text-slate-600`}>
                        {cvData.summary || 'Kỹ sư Frontend với 5+ năm kinh nghiệm xây dựng sản phẩm web hiệu năng cao, đam mê UI/UX và animation. Thành thạo React, TypeScript, TailwindCSS và các công nghệ frontend hiện đại.'}
                    </p>
                </div>

                {/* Skills */}
                <div>
                    <h4 className={`${sm ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-widest mb-2 ${scheme.accent}`}>
                        Kỹ năng
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                        {(sm ? skills.slice(0, 6) : skills).map((s, i) => (
                            <span
                                key={i}
                                className={`${sm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'} rounded-full border ${scheme.accent} border-current ${scheme.bg} font-medium`}
                            >
                                {s}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Experience */}
                <div>
                    <h4 className={`${sm ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-widest mb-2 ${scheme.accent}`}>
                        Kinh nghiệm làm việc
                    </h4>
                    <div className="space-y-3">
                        {experience.map((exp, i) => (
                            <div key={i} className="flex gap-3">
                                <div
                                    className={`w-1 rounded-full bg-gradient-to-b ${scheme.from} ${scheme.to} shrink-0 mt-1`}
                                    style={{ height: sm ? 32 : 44 }}
                                />
                                <div>
                                    <p className={`${sm ? 'text-[11px]' : 'text-sm'} font-bold text-slate-800`}>{exp.title}</p>
                                    <p className={`${sm ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
                                        {exp.company} · {exp.period}
                                    </p>
                                    {!sm && (
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Xây dựng và tối ưu các component UI phức tạp. Cải thiện hiệu năng, giảm 40% thời gian tải trang.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education */}
                <div>
                    <h4 className={`${sm ? 'text-[10px]' : 'text-xs'} font-bold uppercase tracking-widest mb-2 ${scheme.accent}`}>
                        Học vấn
                    </h4>
                    <div className="flex gap-3">
                        <div
                            className={`w-1 rounded-full bg-gradient-to-b ${scheme.from} ${scheme.to} shrink-0`}
                            style={{ height: sm ? 28 : 40 }}
                        />
                        <div>
                            <p className={`${sm ? 'text-[11px]' : 'text-sm'} font-bold text-slate-800`}>
                                {cvData.education?.[0]?.degree ?? 'Kỹ sư Công nghệ thông tin'}
                            </p>
                            <p className={`${sm ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
                                {cvData.education?.[0]?.school ?? 'Đại học Bách Khoa TP.HCM'} · {cvData.education?.[0]?.period ?? '2013 – 2017'}
                            </p>
                            {!sm && (
                                <p className="text-xs text-slate-500 mt-0.5">GPA: 3.6 / 4.0 · Tốt nghiệp loại Giỏi</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Interests / Objective – fullscreen only */}
                {!sm && cvData.interests && (
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">
                            Mục tiêu nghề nghiệp
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{cvData.interests}</p>
                    </div>
                )}
            </div>

            {/* Footer watermark */}
            <div className={`${sm ? 'px-5 pb-4' : 'px-8 pb-6'} flex items-center justify-between`}>
                <span className={`${sm ? 'text-[9px]' : 'text-[11px]'} text-slate-300 uppercase tracking-widest`}>
                    Made with JOBIO
                </span>
                <div className={`${sm ? 'h-1 w-12' : 'h-1.5 w-20'} rounded-full bg-gradient-to-r ${scheme.from} ${scheme.to}`} />
            </div>
        </div>
    );
}

// ─── Fullscreen modal ─────────────────────────────────────────────────────────
function CVFullscreenModal({
    cvName, cvData, templateId, onClose,
}: {
    cvName: string;
    cvData: Record<string, any>;
    templateId: string;
    onClose: () => void;
}) {
    const scheme = colorSchemes[templateId] ?? colorSchemes['tpl-1'];
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) return;
        win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${cvName || 'CV'} – JOBIO</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>${content}</body>
</html>`);
        win.document.close();
        win.focus();
        // Give fonts time to load then print
        setTimeout(() => {
            win.print();
            win.close();
        }, 600);
    };

    return (
        // Fixed overlay covering entire viewport
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            tabIndex={-1}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/10 backdrop-blur-sm border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${scheme.from} ${scheme.to} flex items-center justify-center shadow-md`}>
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{cvName || 'Xem trước CV'}</p>
                        <p className="text-[11px] text-white/50">Bản xem trước · nội dung thực tế có thể khác khi xuất PDF</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1.5 h-8"
                        onClick={handlePrint}
                    >
                        <Printer className="w-3.5 h-3.5" /> In CV
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1.5 h-8"
                    >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                    </Button>
                    <button
                        onClick={onClose}
                        aria-label="Đóng"
                        className="ml-1 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Scrollable A4-like preview */}
            <div className="flex-1 overflow-y-auto flex justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    // Width capped at A4-ish 794px
                    className="w-full max-w-[794px] shadow-2xl shadow-black/50 rounded-xl overflow-hidden"
                    ref={printRef}
                >
                    <CVBody cvName={cvName} cvData={cvData} scheme={scheme} size="lg" />
                </motion.div>
            </div>

            {/* Hint */}
            <div className="text-center py-3 shrink-0">
                <p className="text-[11px] text-white/30">
                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 font-mono text-[10px]">Esc</kbd> để đóng
                </p>
            </div>
        </motion.div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CVLivePreview({ cvId, cvName, cvData, templateId }: Props) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const scheme = colorSchemes[templateId] ?? colorSchemes['tpl-1'];

    const handleRefresh = () => {
        if (!cvId || refreshing) return;
        setRefreshing(true);
        setTimeout(() => {
            setRefreshKey((k) => k + 1);
            setRefreshing(false);
        }, 700);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Panel header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-semibold text-slate-700">Xem trước CV</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Refresh mini preview */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-violet-600"
                        onClick={handleRefresh}
                        disabled={!cvId || refreshing}
                        title="Làm mới preview"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    {/* Fullscreen */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-violet-600"
                        onClick={() => setFullscreen(true)}
                        disabled={!cvId}
                        title="Xem toàn màn hình"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Mini preview area */}
            <div className="flex-1 overflow-y-auto p-4">
                {!cvId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">Chọn CV để xem trước</p>
                    </div>
                ) : refreshing ? (
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-4 w-full rounded-lg" />
                        <Skeleton className="h-4 w-5/6 rounded-lg" />
                    </div>
                ) : (
                    <motion.div
                        key={`${templateId}-${refreshKey}`}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CVBody cvName={cvName} cvData={cvData} scheme={scheme} size="sm" />
                    </motion.div>
                )}
            </div>

            {/* Bottom CTA – opens fullscreen */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                <Button
                    className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white border-0 shadow-md shadow-violet-200 hover:opacity-90 gap-2"
                    onClick={() => setFullscreen(true)}
                    disabled={!cvId}
                >
                    <Maximize2 className="w-4 h-4" />
                    Xem bản in đầy đủ
                </Button>
            </div>

            {/* Fullscreen overlay – rendered via portal to escape stacking context */}
            {createPortal(
                <AnimatePresence>
                    {fullscreen && (
                        <CVFullscreenModal
                            cvName={cvName}
                            cvData={cvData}
                            templateId={templateId}
                            onClose={() => setFullscreen(false)}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
