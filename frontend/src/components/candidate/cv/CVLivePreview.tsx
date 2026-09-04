import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, RefreshCw, Maximize2, FileText, Lock, X, Printer, Loader2, AlertCircle, ZoomIn, ZoomOut, Check, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cvService } from '@/services/cvService';
import { useUserStore } from '@/store/userStore';
import { getCandidateId } from '@/lib/candidateIdentity';
import { createObjectUrlFromFileUrl } from '@/lib/download';
import { sanitizeHtml, sanitizeHtmlDocument } from '@/lib/sanitizeHtml';

interface Props {
    cvId: string | null;
    cvName: string;
    templateId: string | null;  // null for CV_Upload
    cvUrl?: string | null;       // URL of uploaded PDF for CV_Upload
    previewKey?: number; // increments from parent when data is saved → triggers re-fetch
    cvData?: Record<string, any>;
    onCvDataChange?: (nextData: Record<string, any>) => void;
}

interface EditableField {
    path: string;
    label: string;
    value: string;
    multiline: boolean;
}

interface ActiveEditor {
    field: EditableField;
    draft: string;
    top: number;
    left: number;
    width: number;
}

const LABELS: Record<string, string> = {
    full_name: 'Họ tên',
    email: 'Email',
    phone: 'Số điện thoại',
    current_position: 'Vị trí',
    bio: 'Giới thiệu',
    summary: 'Tóm tắt',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    portfolio: 'Portfolio',
    website: 'Website',
    position: 'Vị trí',
    job_title: 'Chức danh',
    company_name: 'Công ty',
    description: 'Mô tả',
    school_name: 'Trường',
    degree: 'Bằng cấp',
    field_of_study: 'Chuyên ngành',
    project_name: 'Dự án',
    name: 'Tên',
    issuing_organization: 'Tổ chức cấp',
};

const EDITABLE_OBJECT_KEYS = [
    'full_name',
    'email',
    'phone',
    'current_position',
    'bio',
    'summary',
    'linkedin',
    'github',
    'portfolio',
    'website',
    'position',
    'job_title',
    'company_name',
    'description',
    'school_name',
    'degree',
    'field_of_study',
    'project_name',
    'name',
    'issuing_organization',
];

const EDITABLE_ARRAY_SECTIONS = [
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'awards',
];

function isRecord(value: unknown): value is Record<string, any> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function makeEditableField(path: string, key: string, value: unknown): EditableField | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value).trim();
    if (!text) return null;
    return {
        path,
        label: LABELS[key] || key.replace(/_/g, ' '),
        value: text,
        multiline: key === 'bio' || key === 'summary' || key === 'description',
    };
}

function flattenEditableFields(cvData?: Record<string, any>) {
    if (!isRecord(cvData)) return [];
    const fields: EditableField[] = [];

    const collectObject = (basePath: string, value: unknown) => {
        if (!isRecord(value)) return;
        EDITABLE_OBJECT_KEYS.forEach((key) => {
            const field = makeEditableField(`${basePath}.${key}`, key, value[key]);
            if (field) fields.push(field);
        });
    };

    collectObject('personal', cvData.personal);
    collectObject('links', cvData.links);
    collectObject('location', cvData.location);

    EDITABLE_ARRAY_SECTIONS.forEach((section) => {
        const items = cvData[section];
        if (!Array.isArray(items)) return;
        items.forEach((item, index) => {
            if (typeof item === 'string') {
                const field = makeEditableField(`${section}.${index}`, 'name', item);
                if (field) fields.push(field);
                return;
            }
            if (!isRecord(item)) return;
            EDITABLE_OBJECT_KEYS.forEach((key) => {
                const field = makeEditableField(`${section}.${index}.${key}`, key, item[key]);
                if (field) fields.push(field);
            });
        });
    });

    return fields;
}

function findEditableField(text: string, fields: EditableField[]) {
    const normalized = normalizeText(text);
    if (!normalized) return null;
    return fields
        .filter((field) => {
            const candidate = normalizeText(field.value);
            return candidate && (normalized.includes(candidate) || candidate.includes(normalized));
        })
        .sort((left, right) => right.value.length - left.value.length)[0] || null;
}

function resolveEditableCandidate(
    startElement: Element | null | undefined,
    fields: EditableField[],
    root: Document,
) {
    let current = startElement;
    while (current && current !== root.body && current !== root.documentElement) {
        const path = current.getAttribute('data-cv-path');
        const field = path
            ? fields.find((item) => item.path === path)
            : findEditableField(current.textContent || '', fields);

        if (field) {
            const normalizedText = normalizeText(current.textContent || '');
            const normalizedValue = normalizeText(field.value);
            const isTightMatch =
                path ||
                normalizedText.length <= normalizedValue.length + 80 ||
                current.children.length === 0;
            if (isTightMatch) return { element: current, field };
        }

        current = current.parentElement;
    }
    return null;
}

function setPathValue(source: Record<string, any>, path: string, value: string) {
    const next = structuredClone(source || {});
    const parts = path.split('.');
    let cursor: any = next;
    for (let index = 0; index < parts.length - 1; index += 1) {
        const part = parts[index];
        const nextPart = parts[index + 1];
        const existing = cursor[part];
        if (existing === undefined || existing === null) {
            cursor[part] = Number.isInteger(Number(nextPart)) ? [] : {};
        }
        cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = value;
    return next;
}

function EditablePreviewFrame({
    html,
    style,
    cvData,
    onEditPath,
}: {
    html: string;
    style?: CSSProperties;
    cvData?: Record<string, any>;
    onEditPath?: (path: string, value: string) => void;
}) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const fields = useMemo(() => flattenEditableFields(cvData), [cvData]);
    const safeHtml = useMemo(() => {
        if (!html) return '';
        // Preserve full template HTML from backend (Tailwind CDN, fonts, styles)
        if (html.includes('<html') || html.includes('<!DOCTYPE') || html.includes('tailwind')) {
            return html;
        }
        return sanitizeHtml(html);
    }, [html]);
    const [frameRevision, setFrameRevision] = useState(0);
    const [editor, setEditor] = useState<ActiveEditor | null>(null);

    useEffect(() => setEditor(null), [safeHtml]);

    useEffect(() => {
        const iframe = iframeRef.current;
        const wrapper = wrapperRef.current;
        const doc = iframe?.contentDocument;
        if (!iframe || !wrapper || !doc || !onEditPath || fields.length === 0) return;
        let highlighted: HTMLElement | null = null;

        const clearHighlight = () => {
            if (!highlighted) return;
            highlighted.style.outline = '';
            highlighted.style.outlineOffset = '';
            highlighted.style.cursor = '';
            highlighted.removeAttribute('data-cv-editor-hover');
            highlighted = null;
        };

        const setHighlight = (element: Element, field: EditableField) => {
            const target = element as HTMLElement;
            if (highlighted === target) return;
            clearHighlight();
            highlighted = target;
            target.style.outline = '1.5px dashed #8b5cf6';
            target.style.outlineOffset = '2px';
            target.style.cursor = 'text';
            target.setAttribute('data-cv-editor-hover', field.path);
            target.setAttribute('title', `Chỉnh ${field.label}`);
        };

        const resolveFromEvent = (event: MouseEvent) => {
            const rawTarget = event.target as (Node & { parentElement?: Element }) | null;
            const startElement = rawTarget?.nodeType === 1
                ? rawTarget as Element
                : rawTarget?.parentElement;
            return resolveEditableCandidate(
                startElement?.closest?.('[data-cv-path], h1, h2, h3, h4, p, span, li, a, strong, em, div') || startElement,
                fields,
                doc,
            );
        };

        const openEditor = (event: MouseEvent) => {
            const target = resolveFromEvent(event);
            if (!target) return;
            event.preventDefault();
            event.stopPropagation();
            const targetRect = target.element.getBoundingClientRect();
            const iframeRect = iframe.getBoundingClientRect();
            const wrapperRect = wrapper.getBoundingClientRect();
            const scaleY = wrapper.offsetHeight ? wrapperRect.height / wrapper.offsetHeight : 1;
            const scaleX = wrapper.offsetWidth ? wrapperRect.width / wrapper.offsetWidth : 1;

            const elementTopInWrapper = (iframeRect.top - wrapperRect.top) / (scaleY || 1) + targetRect.top;
            const elementLeftInWrapper = (iframeRect.left - wrapperRect.left) / (scaleX || 1) + targetRect.left;
            const popupWidth = Math.max(200, Math.min(targetRect.width + 32, wrapper.offsetWidth - 24));

            let top = elementTopInWrapper - 44;
            if (top < 8) {
                top = elementTopInWrapper + targetRect.height + 6;
            }
            const left = Math.max(8, Math.min(elementLeftInWrapper, wrapper.offsetWidth - popupWidth - 12));

            setEditor({
                field: target.field,
                draft: target.field.value,
                top,
                left,
                width: popupWidth,
            });
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (editor) return;
            const target = resolveFromEvent(event);
            if (target) {
                setHighlight(target.element, target.field);
                return;
            }
            clearHighlight();
        };

        const handleMouseLeave = () => clearHighlight();

        doc.addEventListener('mousemove', handleMouseMove);
        doc.addEventListener('mouseleave', handleMouseLeave);
        doc.addEventListener('click', openEditor);
        doc.addEventListener('dblclick', openEditor);
        return () => {
            clearHighlight();
            doc.removeEventListener('mousemove', handleMouseMove);
            doc.removeEventListener('mouseleave', handleMouseLeave);
            doc.removeEventListener('click', openEditor);
            doc.removeEventListener('dblclick', openEditor);
        };
    }, [editor, fields, frameRevision, onEditPath]);

    const commitEdit = () => {
        if (!editor) return;
        onEditPath?.(editor.field.path, editor.draft);
        setEditor(null);
    };

    return (
        <div ref={wrapperRef} className="relative overflow-hidden">
            <iframe
                ref={iframeRef}
                srcDoc={safeHtml}
                sandbox="allow-same-origin allow-scripts"
                style={{ width: '100%', border: 'none', ...style }}
                title="CV Preview"
                onLoad={() => setFrameRevision((value) => value + 1)}
            />
            <AnimatePresence>
                {editor && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="absolute z-20 rounded-md border border-teal-300 bg-card shadow-xl shadow-teal-500/15 p-1.5"
                        style={{
                            top: editor.top,
                            left: editor.left,
                            width: editor.width,
                        }}
                    >
                        <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-teal-700">
                            <PencilLine className="h-3 w-3" />
                            <span className="truncate">{editor.field.label}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                            {editor.field.multiline ? (
                                <textarea
                                    autoFocus
                                    value={editor.draft}
                                    onChange={(event) => setEditor({ ...editor, draft: event.target.value })}
                                    onKeyDown={(event) => {
                                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') commitEdit();
                                        if (event.key === 'Escape') setEditor(null);
                                    }}
                                    onBlur={(event) => {
                                        if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                                            commitEdit();
                                        }
                                    }}
                                    className="min-h-20 flex-1 resize-y rounded border border-border px-2 py-1.5 text-xs text-foreground outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                                    aria-label={editor.field.label}
                                />
                            ) : (
                                <input
                                    autoFocus
                                    value={editor.draft}
                                    onChange={(event) => setEditor({ ...editor, draft: event.target.value })}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') commitEdit();
                                        if (event.key === 'Escape') setEditor(null);
                                    }}
                                    onBlur={(event) => {
                                        if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
                                            commitEdit();
                                        }
                                    }}
                                    className="h-8 min-w-0 flex-1 rounded border border-border px-2 text-xs text-foreground outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                                    aria-label={editor.field.label}
                                />
                            )}
                            <button
                                type="button"
                                onClick={commitEdit}
                                title="Lưu"
                                className="h-8 w-8 shrink-0 rounded bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center transition-colors"
                            >
                                <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditor(null)}
                                title="Hủy"
                                className="h-8 w-8 shrink-0 rounded border border-border text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Fullscreen modal ─────────────────────────────────────────────────────────
function CVFullscreenModal({ cvName, html, cvUrl, isUploadedCv, templateName, cvData, onEditPath, onClose }: {
    cvName: string; html?: string | null; cvUrl?: string | null; isUploadedCv?: boolean; templateName?: string; cvData?: Record<string, any>; onEditPath?: (path: string, value: string) => void; onClose: () => void;
}) {
    const [pdfError, setPdfError] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

    const handlePrint = () => {
        if (!html) return;
        const printFrame = document.createElement('iframe');
        printFrame.setAttribute('title', 'CV Print');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        printFrame.srcdoc = sanitizeHtmlDocument(html);
        printFrame.onload = () => {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
            window.setTimeout(() => printFrame.remove(), 1000);
        };
        document.body.appendChild(printFrame);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (!isUploadedCv || !cvUrl) {
            setPdfObjectUrl(null);
            return;
        }

        let active = true;
        let objectUrl: string | null = null;
        setPdfLoading(true);
        setPdfError(false);

        createObjectUrlFromFileUrl(cvUrl)
            .then((url) => {
                objectUrl = url;
                if (active) {
                    setPdfObjectUrl(url);
                } else {
                    window.URL.revokeObjectURL(url);
                }
            })
            .catch(() => {
                if (active) setPdfError(true);
            })
            .finally(() => {
                if (active) setPdfLoading(false);
            });

        return () => {
            active = false;
            if (objectUrl) window.URL.revokeObjectURL(objectUrl);
        };
    }, [isUploadedCv, cvUrl]);

    // PDF mode for CV_Upload
    if (isUploadedCv && cvUrl) {
        const cleanUrl = (pdfObjectUrl || cvUrl).split('#')[0];
        const iframeSrc = `${cleanUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
        const openPdf = () => window.open(pdfObjectUrl || cvUrl, '_blank', 'noopener,noreferrer');
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
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-md">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{cvName || 'Xem trước CV'}</p>
                            <p className="text-[11px] text-white/50">PDF Upload · Bản in đầy đủ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline"
                            className="border-white/20 bg-card/10 text-white hover:bg-card/20 hover:text-white gap-1.5 h-8 cursor-pointer"
                            onClick={openPdf}
                            disabled={pdfLoading || !pdfObjectUrl}>
                            <Printer className="w-3.5 h-3.5" /> Mở tab mới
                        </Button>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-card/10 hover:bg-card/25 flex items-center justify-center transition-colors cursor-pointer">
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex justify-center items-start py-6 px-4">
                    {pdfLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="w-10 h-10 text-white/70 animate-spin" />
                            <p className="text-sm text-white/60 font-medium">Đang tải file PDF...</p>
                        </div>
                    ) : pdfError ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                            <p className="text-sm text-red-400 font-medium">Không thể tải file PDF</p>
                            <Button size="sm" variant="outline"
                                className="border-white/20 bg-card/10 text-white hover:bg-card/20 hover:text-white gap-1.5"
                                onClick={openPdf}
                                disabled={!pdfObjectUrl}>
                                Mở trong tab mới
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-card shadow-2xl rounded overflow-hidden" style={{ width: '210mm', height: 'calc(90vh - 80px)' }}>
                            <iframe src={iframeSrc} className="w-full h-full border-none" title="CV PDF Preview" onError={() => setPdfError(true)} />
                        </div>
                    )}
                </div>
                <div className="text-center py-3 shrink-0">
                    <p className="text-[11px] text-white/30">Nhấn <kbd className="px-1.5 py-0.5 rounded bg-card/10 text-white/50 font-mono text-[10px]">Esc</kbd> để đóng</p>
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-md">
                        <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">{cvName || 'Xem trước CV'}</p>
                        <p className="text-[11px] text-white/50">{templateName || 'Template'} · Bản in đầy đủ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handlePrint}
                        className="border-white/20 bg-card/10 text-white hover:bg-card/20 hover:text-white gap-1.5 h-8 cursor-pointer">
                        <Printer className="w-3.5 h-3.5" /> In / PDF
                    </Button>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-card/10 hover:bg-card/25 flex items-center justify-center transition-colors cursor-pointer">
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
                    <div className="bg-card shadow-2xl rounded overflow-hidden origin-top"
                         style={{ 
                             width: '210mm', 
                             height: '297mm',
                             transform: 'scale(0.8)',
                             flexShrink: 0,
                             marginBottom: '-50mm'
                         }}>
                        <EditablePreviewFrame
                            html={html || ''}
                            cvData={cvData}
                            onEditPath={onEditPath}
                            style={{ height: '100%', display: 'block' }}
                        />
                    </div>
                </motion.div>
            </div>

            <div className="text-center py-3 shrink-0">
                <p className="text-[11px] text-white/30">
                    Nhấn <kbd className="px-1.5 py-0.5 rounded bg-card/10 text-white/50 font-mono text-[10px]">Esc</kbd> để đóng
                </p>
            </div>
        </motion.div>
    );
}

// ─── PDF iframe preview (for CV_Upload) ──────────────────────────────────────
function PdfIframePreview({ url }: { url: string }) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [key, setKey] = useState(0);

    useEffect(() => {
        let active = true;
        let nextObjectUrl: string | null = null;

        setLoading(true);
        setError(false);
        createObjectUrlFromFileUrl(url)
            .then((createdUrl) => {
                nextObjectUrl = createdUrl;
                if (active) {
                    setObjectUrl(createdUrl);
                } else {
                    window.URL.revokeObjectURL(createdUrl);
                }
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            if (nextObjectUrl) window.URL.revokeObjectURL(nextObjectUrl);
        };
    }, [url, key]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Đang tải file PDF...</p>
            </div>
        );
    }

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

    if (!objectUrl) return null;

    return (
        <iframe
            key={key}
            src={objectUrl}
            className="w-full h-full border-none"
            title="CV PDF Preview"
            onError={() => setError(true)}
        />
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CVLivePreview({
    cvId,
    cvName,
    templateId,
    cvUrl,
    previewKey = 0,
    cvData,
    onCvDataChange,
}: Props) {
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
    const handlePreviewEdit = useCallback((path: string, value: string) => {
        if (!cvData || !onCvDataChange) return;
        onCvDataChange(setPathValue(cvData, path, value));
    }, [cvData, onCvDataChange]);

    return (
        <div className="flex flex-col h-full bg-muted">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Eye className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="text-sm font-semibold text-foreground/80 shrink-0 whitespace-nowrap">Xem trước</span>
                    {templateName && (
                        <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                            {templateName}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => setZoom(z => Math.max(0.35, z - 0.1))} title="Thu nhỏ"
                        className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center transition-colors cursor-pointer">
                        <ZoomOut className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <span className="text-[10px] text-muted-foreground/60 w-8 text-center font-mono">{Math.round(clampedZoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.0, z + 0.1))} title="Phóng to"
                        className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center transition-colors cursor-pointer">
                        <ZoomIn className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <div className="w-px h-4 bg-muted mx-1" />
                    <button onClick={() => setRefreshKey(k => k + 1)} disabled={!cvId || loading} title="Làm mới"
                        className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40">
                        <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin text-teal-500' : ''}`} />
                    </button>
                    <button onClick={() => setFullscreen(true)} disabled={!cvId || (!html && !isUploadedCv)} title="Xem toàn màn hình"
                        className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40">
                        <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Preview area - scrollable */}
            <div className="flex-1 overflow-auto p-3" style={{ background: '#e8eaed' }}>
                {!cvId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                        <Lock className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground/60">Chọn CV để xem trước</p>
                    </div>
                ) : isUploadedCv ? (
                    // CV_Upload: render PDF iframe
                    <div className="w-full h-full min-h-[600px] bg-card rounded-lg shadow-sm overflow-hidden">
                        <PdfIframePreview url={cvUrl!} />
                    </div>
                ) : loading ? (
                    <div className="bg-card rounded-lg p-6 shadow space-y-3">
                        <Skeleton className="h-5 w-2/3 rounded" />
                        <Skeleton className="h-4 w-1/3 rounded" />
                        <Skeleton className="h-32 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <div className="flex items-center justify-center pt-2 gap-2 text-teal-500">
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
                        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                            <EditablePreviewFrame
                                html={html}
                                cvData={cvData}
                                onEditPath={handlePreviewEdit}
                                style={{ height: 1050, display: 'block' }}
                            />
                        </div>
                    </motion.div>
                ) : null}
            </div>

            <div className="px-4 py-3 border-t border-border bg-card shrink-0">
                <Button onClick={() => setFullscreen(true)} disabled={!cvId || (!html && !isUploadedCv)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/25 gap-2 cursor-pointer">
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
                            cvData={cvData}
                            onEditPath={handlePreviewEdit}
                            onClose={() => setFullscreen(false)}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
