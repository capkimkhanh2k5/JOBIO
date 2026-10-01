import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Award,
    Briefcase,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Code,
    FileText,
    FolderOpen,
    Globe,
    GraduationCap,
    LinkIcon,
    Loader2,
    Pencil,
    Plus,
    Save,
    Sparkles,
    Trash2,
    User,
    Wand2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cvService } from '@/services/cvService';
import { taxonomyService } from '@/services/taxonomyService';
import { AutoSaveStatus, CVItem } from '@/pages/candidate/CVManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
    cvName: string;
    selectedTemplateId: string;
    cvData: Record<string, any>;
    autoSaveStatus: AutoSaveStatus;
    onFieldChange: (field: string, value: any) => void;
    selectedCV: CVItem | null;
    candidateId?: number;
    onCvUrlUpdated?: (url: string, pdfGeneratedAt?: string) => void;
}

interface SuggestionOption {
    value: string;
    label: string;
}

const inputCls =
    'h-9 rounded-lg border-border bg-muted text-sm focus:border-teal-400 focus:bg-card focus:ring-teal-100';
const textareaCls =
    'w-full resize-none rounded-lg border border-border bg-muted px-3 py-2 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-teal-400 focus:bg-card focus:outline-none focus:ring-2 focus:ring-teal-100';

const TEMPLATE_GRADIENTS: Record<string, string> = {
    'modern.html': 'from-slate-400 to-slate-600',
    'ATS_Prime.html': 'from-sky-500 to-primary',
    'editorialBold.html': 'from-rose-500 to-pink-600',
    'modernHybird.html': 'from-teal-500 to-emerald-600',
    'modernHybird2.html': 'from-teal-500 to-emerald-600',
    'modernLuxury.html': 'from-amber-500 to-orange-600',
};

function Section({
    icon,
    title,
    color,
    children,
    defaultOpen = true,
}: {
    icon: ReactNode;
    title: string;
    color: string;
    children: ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="overflow-hidden rounded-xl border border-border">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between bg-muted px-4 py-3 transition-colors hover:bg-muted"
            >
                <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm ${color}`}>
                        {icon}
                    </div>
                    <span className="text-sm font-semibold text-foreground/80">{title}</span>
                </div>
                {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                )}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 bg-card p-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <Label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

function FreeSoloCombobox({
    value,
    onChange,
    onSelectOption,
    options,
    placeholder,
    emptyMessage,
    className,
    onKeyDown,
}: {
    value: string;
    onChange: (value: string) => void;
    onSelectOption?: (value: string) => void;
    options: SuggestionOption[];
    placeholder: string;
    emptyMessage: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filteredOptions = useMemo(() => {
        const keyword = (query || value).trim().toLowerCase();
        if (!keyword) return options;
        return options.filter((option) => option.label.toLowerCase().includes(keyword));
    }, [options, query, value]);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setQuery('');
        setOpen(false);
        if (onSelectOption) {
            onSelectOption(selectedValue);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative flex-1">
                <PopoverTrigger asChild>
                    <div className="relative">
                        <Input
                            value={value}
                            autoComplete="off"
                            spellCheck={false}
                            onChange={(e) => {
                                const nextValue = e.target.value;
                                onChange(nextValue);
                                setQuery(nextValue);
                                if (nextValue.trim().length > 0) {
                                    setOpen(true);
                                } else {
                                    setOpen(false);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setOpen(false);
                                } else if (onKeyDown) {
                                    onKeyDown(e);
                                }
                            }}
                            placeholder={placeholder}
                            className={className}
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                setOpen((prev) => !prev);
                            }}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Mở danh sách gợi ý"
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    sideOffset={8}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    className="w-[--radix-popover-trigger-width] rounded-xl border border-border bg-card p-1 shadow-lg z-50"
                >
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(option.value);
                                    }}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                                        value === option.value
                                            ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold'
                                            : 'hover:bg-muted text-foreground'
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && <Check className="h-3.5 w-3.5 text-teal-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="py-4 text-center text-xs text-muted-foreground italic">
                                {emptyMessage}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </div>
        </Popover>
    );
}

function ProficiencySelect({
    value,
    onChange,
    items,
}: {
    value: string;
    onChange: (value: string) => void;
    items: Array<{ value: string; label: string }>;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-9 w-[132px] rounded-lg border-border bg-muted text-xs focus:ring-teal-100">
                <SelectValue placeholder="Trình độ" />
            </SelectTrigger>
            <SelectContent>
                {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function AIRewriteButton({
    disabled,
    loading,
    onClick,
}: {
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClick}
            disabled={disabled || loading}
            className="h-7 gap-1.5 rounded-lg border-teal-200 bg-card px-2 text-[11px] font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-60"
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <Sparkles className="h-3 w-3" />
            )}
            AI rewrite
        </Button>
    );
}

export function CVBuilder({
    cvName,
    selectedTemplateId,
    cvData,
    autoSaveStatus,
    onFieldChange,
    selectedCV,
    candidateId,
    onCvUrlUpdated,
}: Props) {
    const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const [rewritingKey, setRewritingKey] = useState<string | null>(null);
    const [skillInput, setSkillInput] = useState('');

    const { data: templates = [], isLoading: loadingTemplates } = useQuery({
        queryKey: ['cv-templates'],
        queryFn: () =>
            cvService
                .listTemplates({ page_size: 50 })
                .then((response) =>
                    Array.isArray(response.data) ? response.data : (response.data.results ?? [])
                ),
        staleTime: 120_000,
    });

    const { data: availableLanguages = [] } = useQuery({
        queryKey: ['languages'],
        queryFn: () => taxonomyService.listLanguages(),
        staleTime: Infinity,
    });

    const { data: availableSkills = [] } = useQuery({
        queryKey: ['skills'],
        queryFn: () => taxonomyService.listSkills({ page_size: 100 }),
        staleTime: Infinity,
    });

    const languageOptions = useMemo(
        () =>
            availableLanguages.map((language: any) => ({
                value: language.language_name,
                label: language.language_name,
            })),
        [availableLanguages]
    );

    const skillOptions = useMemo(
        () =>
            availableSkills.map((skill: any) => ({
                value: skill.name,
                label: skill.name,
            })),
        [availableSkills]
    );

    const get = useCallback(
        (path: string) => {
            const parts = path.split('.');
            let current: any = cvData;
            for (const part of parts) current = current?.[part];
            return current ?? '';
        },
        [cvData]
    );

    const set = useCallback(
        (path: string, value: any) => {
            const parts = path.split('.');
            const nextData = JSON.parse(JSON.stringify(cvData || {}));
            let current = nextData;

            for (let index = 0; index < parts.length - 1; index += 1) {
                if (parts[index] === '__proto__' || parts[index] === 'constructor' || parts[index] === 'prototype') {
                    continue;
                }
                if (!current[parts[index]]) current[parts[index]] = {};
                current = current[parts[index]];
            }

            current[parts[parts.length - 1]] = value;
            onFieldChange('cv_data', nextData);
        },
        [cvData, onFieldChange]
    );

    const getArr = useCallback(
        (key: string): any[] => (Array.isArray(cvData?.[key]) ? cvData[key] : []),
        [cvData]
    );

    const addItem = useCallback(
        (key: string, template: object) => {
            onFieldChange('cv_data', { ...cvData, [key]: [...getArr(key), template] });
        },
        [cvData, getArr, onFieldChange]
    );

    const removeItem = useCallback(
        (key: string, index: number) => {
            const nextItems = getArr(key).filter((_: any, itemIndex: number) => itemIndex !== index);
            onFieldChange('cv_data', { ...cvData, [key]: nextItems });
        },
        [cvData, getArr, onFieldChange]
    );

    const updateItem = useCallback(
        (key: string, index: number, field: string, value: any) => {
            const nextItems = getArr(key).map((item: any, itemIndex: number) =>
                itemIndex === index ? { ...item, [field]: value } : item
            );
            onFieldChange('cv_data', { ...cvData, [key]: nextItems });
        },
        [cvData, getArr, onFieldChange]
    );

    const rewriteMutation = useMutation({
        mutationFn: ({
            section,
            text,
            context,
        }: {
            section: 'summary' | 'experience' | 'project';
            text: string;
            context?: Record<string, any>;
        }) => {
            if (!candidateId || !selectedCV?.id) throw new Error('missing_cv');
            return cvService
                .rewriteSection(candidateId, Number(selectedCV.id), { section, text, context })
                .then((response) => response.data);
        },
    });

    const rewriteField = async ({
        key,
        section,
        text,
        context,
        apply,
    }: {
        key: string;
        section: 'summary' | 'experience' | 'project';
        text: string;
        context?: Record<string, any>;
        apply: (nextText: string) => void;
    }) => {
        if (!String(text || '').trim()) {
            toast.error('Hãy nhập nội dung trước khi dùng AI rewrite.');
            return;
        }
        setRewritingKey(key);
        try {
            const currentLang = get('language') || 'vi';
            const result = await rewriteMutation.mutateAsync({
                section,
                text,
                context: { ...context, language: currentLang },
            });
            apply(result.rewritten_text);
            toast.success('Đã viết lại đoạn CV.');
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || 'AI rewrite tạm thời chưa sẵn sàng.');
        } finally {
            setRewritingKey(null);
        }
    };

    const handleSavePdf = async () => {
        if (!selectedCV || !candidateId) return;
        setIsSavingPdf(true);
        try {
            const res = await cvService.savePdf(candidateId, Number(selectedCV.id));
            onCvUrlUpdated?.(res.data.download_url, res.data.pdf_generated_at);
            toast.success('Đã lưu PDF thành công', { duration: 3000 });
        } catch {
            toast.error('Lưu PDF thất bại. Vui lòng thử lại.');
        } finally {
            setIsSavingPdf(false);
        }
    };

    if (!selectedCV) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 shadow-inner"
                >
                    <FileText className="h-8 w-8 text-teal-400" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-foreground/80">Chọn CV để chỉnh sửa</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Chọn một CV từ danh sách bên trái hoặc tạo mới để bắt đầu.
                </p>
            </div>
        );
    }

    // CV_Upload: has cv_url but no template_id — show read-only view with rename option
    const isUploadedCv = !selectedCV.template_id && !!selectedCV.cv_url;

    if (isUploadedCv) {
        const parseStatus = selectedCV.parse_status || 'queued';
        const parseStatusCopy =
            parseStatus === 'parsed'
                ? 'CV đã được trích xuất dữ liệu và có thể dùng cho gợi ý việc làm theo CV.'
                : parseStatus === 'failed'
                    ? selectedCV.parse_error_message || 'Hệ thống chưa trích xuất được CV này. Gợi ý việc làm sẽ tạm fallback theo hồ sơ.'
                    : 'Hệ thống đang trích xuất dữ liệu CV. Trong lúc chờ, gợi ý việc làm có thể tạm fallback theo hồ sơ.';

        const handleRenameStart = () => {
            setRenameValue(selectedCV.cv_name);
            setIsRenaming(true);
        };

        const handleRenameConfirm = () => {
            const trimmed = renameValue.trim();
            if (trimmed && trimmed !== selectedCV.cv_name) {
                onFieldChange('cv_name', trimmed);
            }
            setIsRenaming(false);
        };

        const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleRenameConfirm();
            if (e.key === 'Escape') setIsRenaming(false);
        };

        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8"
                >
                    <FileText className="h-8 w-8 text-primary" />
                </motion.div>

                <div className="flex flex-col items-center gap-1">
                    {isRenaming ? (
                        <div className="flex items-center gap-2">
                            <Input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={handleRenameConfirm}
                                onKeyDown={handleRenameKeyDown}
                                className="h-8 text-sm font-semibold text-foreground/80 text-center w-56"
                            />
                        </div>
                    ) : (
                        <h3 className="text-lg font-bold text-foreground/80">{selectedCV.cv_name}</h3>
                    )}
                    <p className="text-sm text-muted-foreground max-w-xs">
                        CV được tải lên từ file PDF — không thể chỉnh sửa nội dung
                    </p>
                    <div className={`mt-2 rounded-xl border px-3 py-2 text-xs font-medium ${parseStatus === 'parsed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : parseStatus === 'failed'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-sky-200 bg-sky-50 text-sky-700'
                        }`}>
                        {parseStatusCopy}
                    </div>
                </div>

                {!isRenaming && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRenameStart}
                        className="gap-2"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Đổi tên
                    </Button>
                )}
            </div>
        );
    }

    const currentTemplate = templates.find((template: any) => String(template.id) === String(selectedTemplateId));

    return (
        <div className="space-y-4 p-5">
            <div className="flex min-h-9 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {!isUploadedCv && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSavePdf}
                            disabled={isSavingPdf}
                            className="h-9 gap-2 rounded-xl border-teal-200 bg-teal-50 px-4 text-xs font-bold text-teal-700 shadow-sm shadow-teal-100/70 transition-all hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800 disabled:opacity-70 shrink-0"
                        >
                            {isSavingPdf ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {isSavingPdf ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    )}
                    {!isUploadedCv && (
                        <p className="hidden text-[11px] font-medium text-muted-foreground sm:block truncate">
                            Lưu để cập nhật bản CV mới nhất trước khi sử dụng hoặc tải CV.
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center justify-end">
                    <AnimatePresence mode="wait">
                        {autoSaveStatus === 'saving' && (
                            <motion.span
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-muted-foreground"
                            >
                                <Clock className="h-3.5 w-3.5 animate-spin" />
                                Đang lưu...
                            </motion.span>
                        )}
                        {autoSaveStatus === 'saved' && (
                            <motion.span
                                key="saved"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Đã lưu
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div>
                <Label className="mb-1.5 block text-xs font-semibold text-foreground/80">Tên CV</Label>
                <Input
                    value={cvName}
                    onChange={(e) => onFieldChange('cv_name', e.target.value)}
                    placeholder="Nhập tên CV..."
                    className={`text-sm font-medium ${inputCls}`}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
                <button
                    type="button"
                    onClick={() => setIsTemplateExpanded((prev) => !prev)}
                    className="flex w-full cursor-pointer items-center justify-between bg-muted px-4 py-3 transition-colors hover:bg-muted"
                >
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-teal-500" />
                        <span className="text-sm font-semibold text-foreground/80">Chọn template</span>
                        <Badge
                            variant="outline"
                            className="border-teal-200 bg-teal-50 text-[10px] text-teal-700"
                        >
                            {currentTemplate?.name ?? 'Chưa chọn'}
                        </Badge>
                    </div>
                    {isTemplateExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
                    )}
                </button>

                <AnimatePresence initial={false}>
                    {isTemplateExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-card p-4">
                                {loadingTemplates ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {[...Array(6)].map((_, index) => (
                                            <Skeleton key={index} className="h-44 rounded-xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        {templates.map((template: any) => {
                                            const isSelected =
                                                String(selectedTemplateId) === String(template.id);
                                            const thumbnailUrl =
                                                template.thumbnail_url || template.thumbnail || '';
                                            const gradient =
                                                TEMPLATE_GRADIENTS[template.file_name || ''] ||
                                                'from-teal-400 to-cyan-400';

                                            return (
                                                <button
                                                    key={template.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onFieldChange('template_id', template.id);
                                                        setIsTemplateExpanded(false);
                                                    }}
                                                    className={`relative overflow-hidden rounded-xl border-2 bg-card transition-all ${isSelected
                                                        ? 'border-teal-500 shadow-md shadow-teal-200'
                                                        : 'border-border hover:border-teal-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="aspect-[4/5] overflow-hidden border-b border-border/60 bg-muted">
                                                        {thumbnailUrl ? (
                                                            <img
                                                                src={thumbnailUrl}
                                                                alt={template.name}
                                                                className="h-full w-full object-cover object-top"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                                                                <FileText className="h-7 w-7 text-white" strokeWidth={2.2} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-card px-2 py-2">
                                                        <p className="line-clamp-1 text-center text-xs font-semibold text-foreground">
                                                            {template.name}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute right-2 top-2">
                                                            <CheckCircle2 className="h-4 w-4 fill-teal-500 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Separator className="bg-muted" />

            <Section icon={<User className="h-4 w-4" />} title="Thông tin cá nhân" color="border-teal-100 bg-teal-50 text-teal-600">
                <Field label="Họ và tên">
                    <Input
                        value={get('personal.full_name')}
                        onChange={(e) => set('personal.full_name', e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className={inputCls}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Email">
                        <Input
                            value={get('personal.email')}
                            onChange={(e) => set('personal.email', e.target.value)}
                            placeholder="email@example.com"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Số điện thoại">
                        <Input
                            value={get('personal.phone')}
                            onChange={(e) => set('personal.phone', e.target.value)}
                            placeholder="0900 000 000"
                            className={inputCls}
                        />
                    </Field>
                </div>
                <Field label="Vị trí / Chức danh">
                    <Input
                        value={get('personal.current_position')}
                        onChange={(e) => set('personal.current_position', e.target.value)}
                        placeholder="Senior Frontend Developer"
                        className={inputCls}
                    />
                </Field>
                <Field label="Giới thiệu bản thân">
                    <textarea
                        value={get('personal.bio')}
                        onChange={(e) => set('personal.bio', e.target.value)}
                        placeholder="Tóm tắt kinh nghiệm, thế mạnh và mục tiêu nghề nghiệp..."
                        rows={3}
                        className={textareaCls}
                    />
                    <div className="mt-2 flex justify-end">
                        <AIRewriteButton
                            loading={rewritingKey === 'personal.bio'}
                            disabled={!candidateId || !selectedCV?.id}
                            onClick={() =>
                                rewriteField({
                                    key: 'personal.bio',
                                    section: 'summary',
                                    text: get('personal.bio'),
                                    context: {
                                        current_position: get('personal.current_position'),
                                        skills: getArr('skills').map((skill: any) => skill.name).filter(Boolean),
                                    },
                                    apply: (nextText) => set('personal.bio', nextText),
                                })
                            }
                        />
                    </div>
                </Field>
            </Section>

            <Section icon={<LinkIcon className="h-4 w-4" />} title="Liên kết" color="border-sky-100 bg-sky-50 text-sky-600" defaultOpen={false}>
                <Field label="LinkedIn">
                    <Input
                        value={get('links.linkedin')}
                        onChange={(e) => set('links.linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className={inputCls}
                    />
                </Field>
                <Field label="GitHub">
                    <Input
                        value={get('links.github')}
                        onChange={(e) => set('links.github', e.target.value)}
                        placeholder="https://github.com/..."
                        className={inputCls}
                    />
                </Field>
                <Field label="Portfolio / Website">
                    <Input
                        value={get('links.portfolio')}
                        onChange={(e) => set('links.portfolio', e.target.value)}
                        placeholder="https://portfolio.com"
                        className={inputCls}
                    />
                </Field>
            </Section>

            <Section
                icon={<Briefcase className="h-4 w-4" />}
                title="Kinh nghiệm làm việc"
                color="border-cyan-100 bg-cyan-50 text-teal-600"
            >
                {getArr('experience').map((exp: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-border bg-muted p-3"
                    >
                        <button
                            type="button"
                            onClick={() => removeItem('experience', index)}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 transition-all hover:bg-red-100 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Công ty">
                                <Input
                                    value={exp.company_name || ''}
                                    onChange={(e) =>
                                        updateItem('experience', index, 'company_name', e.target.value)
                                    }
                                    placeholder="Tên công ty"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Vị trí">
                                <Input
                                    value={exp.position || exp.job_title || ''}
                                    onChange={(e) =>
                                        updateItem('experience', index, 'position', e.target.value)
                                    }
                                    placeholder="Chức vụ"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Từ ngày">
                                <Input
                                    type="date"
                                    value={exp.start_date || ''}
                                    onChange={(e) =>
                                        updateItem('experience', index, 'start_date', e.target.value)
                                    }
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Đến ngày">
                                <Input
                                    type="date"
                                    value={exp.end_date || ''}
                                    disabled={exp.is_current}
                                    onChange={(e) =>
                                        updateItem('experience', index, 'end_date', e.target.value)
                                    }
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!exp.is_current}
                                onChange={(e) =>
                                    updateItem('experience', index, 'is_current', e.target.checked)
                                }
                                className="rounded border-border text-teal-600"
                            />
                            <span className="text-xs text-muted-foreground">Đang làm việc tại đây</span>
                        </label>
                        <Field label="Mô tả công việc">
                            <textarea
                                value={exp.description || ''}
                                onChange={(e) =>
                                    updateItem('experience', index, 'description', e.target.value)
                                }
                                placeholder="Mô tả công việc, thành tích..."
                                rows={2}
                                className={textareaCls}
                            />
                            <div className="mt-2 flex justify-end">
                                <AIRewriteButton
                                    loading={rewritingKey === `experience.${index}.description`}
                                    disabled={!candidateId || !selectedCV?.id}
                                    onClick={() =>
                                        rewriteField({
                                            key: `experience.${index}.description`,
                                            section: 'experience',
                                            text: exp.description || '',
                                            context: {
                                                current_position: exp.position || exp.job_title,
                                                company_name: exp.company_name,
                                                skills: getArr('skills').map((skill: any) => skill.name).filter(Boolean),
                                            },
                                            apply: (nextText) =>
                                                updateItem('experience', index, 'description', nextText),
                                        })
                                    }
                                />
                            </div>
                        </Field>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        addItem('experience', {
                            company_name: '',
                            position: '',
                            start_date: null,
                            end_date: null,
                            is_current: false,
                            description: '',
                        })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm kinh nghiệm
                </button>
            </Section>

            <Section
                icon={<GraduationCap className="h-4 w-4" />}
                title="Học vấn"
                color="border-emerald-100 bg-emerald-50 text-emerald-600"
            >
                {getArr('education').map((edu: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-border bg-muted p-3"
                    >
                        <button
                            type="button"
                            onClick={() => removeItem('education', index)}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 transition-all hover:bg-red-100 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <Field label="Trường">
                            <Input
                                value={edu.school_name || ''}
                                onChange={(e) =>
                                    updateItem('education', index, 'school_name', e.target.value)
                                }
                                placeholder="Tên trường đại học"
                                className={inputCls}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Bằng cấp">
                                <Input
                                    value={edu.degree || ''}
                                    onChange={(e) => updateItem('education', index, 'degree', e.target.value)}
                                    placeholder="Cử nhân, Thạc sĩ..."
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Chuyên ngành">
                                <Input
                                    value={edu.field_of_study || ''}
                                    onChange={(e) =>
                                        updateItem('education', index, 'field_of_study', e.target.value)
                                    }
                                    placeholder="Công nghệ thông tin"
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Từ năm">
                                <Input
                                    type="date"
                                    value={edu.start_date || ''}
                                    onChange={(e) =>
                                        updateItem('education', index, 'start_date', e.target.value)
                                    }
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Đến năm">
                                <Input
                                    type="date"
                                    value={edu.end_date || ''}
                                    onChange={(e) =>
                                        updateItem('education', index, 'end_date', e.target.value)
                                    }
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        addItem('education', {
                            school_name: '',
                            degree: '',
                            field_of_study: '',
                            start_date: null,
                            end_date: null,
                        })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm học vấn
                </button>
            </Section>

            <Section icon={<Code className="h-4 w-4" />} title="Kỹ năng" color="border-teal-100 bg-teal-50 text-teal-600">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FreeSoloCombobox
                            value={skillInput}
                            onChange={(val) => setSkillInput(val)}
                            onSelectOption={(val) => {
                                const newSkill = val.trim();
                                if (newSkill && !getArr('skills').some((s: any) => s.name?.toLowerCase() === newSkill.toLowerCase())) {
                                    addItem('skills', { name: newSkill });
                                }
                                setSkillInput('');
                            }}
                            options={skillOptions.filter(
                                (opt) => !getArr('skills').some((s: any) => s.name?.toLowerCase() === opt.label.toLowerCase())
                            )}
                            placeholder="Thêm kỹ năng"
                            emptyMessage="Gõ tên kỹ năng rồi nhấn Thêm"
                            className={`flex-1 ${inputCls}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput.trim()) {
                                    e.preventDefault();
                                    const newSkill = skillInput.trim();
                                    if (!getArr('skills').some((s: any) => s.name?.toLowerCase() === newSkill.toLowerCase())) {
                                        addItem('skills', { name: newSkill });
                                    }
                                    setSkillInput('');
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const newSkill = skillInput.trim();
                                if (newSkill && !getArr('skills').some((s: any) => s.name?.toLowerCase() === newSkill.toLowerCase())) {
                                    addItem('skills', { name: newSkill });
                                }
                                setSkillInput('');
                            }}
                            disabled={!skillInput.trim()}
                            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 text-xs font-semibold text-white shadow-md shadow-teal-600/20 transition-all hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 disabled:hover:from-teal-600 disabled:hover:to-emerald-600 shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm
                        </button>
                    </div>

                    {getArr('skills').length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/20 p-3">
                            {getArr('skills').map((skill: any, index: number) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 shadow-2xs transition-all hover:bg-teal-500/20 hover:border-teal-500/40"
                                >
                                    <span>{skill.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem('skills', index)}
                                        className="rounded-full p-0.5 text-teal-600/70 hover:bg-teal-500/30 hover:text-teal-950 dark:text-teal-400 dark:hover:text-teal-100 transition-colors"
                                        title="Xóa kỹ năng"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-xs italic text-muted-foreground py-2">
                            Chưa có kỹ năng nào. Nhập tên kỹ năng phía trên để thêm nhanh.
                        </p>
                    )}
                </div>
            </Section>

            <Section
                icon={<Globe className="h-4 w-4" />}
                title="Ngôn ngữ"
                color="border-teal-100 bg-teal-50 text-teal-600"
                defaultOpen={false}
            >
                {getArr('languages').map((language: any, index: number) => (
                    <div key={index} className="group flex items-center gap-2">
                        <FreeSoloCombobox
                            value={language.name || ''}
                            onChange={(nextValue) => updateItem('languages', index, 'name', nextValue)}
                            options={languageOptions}
                            placeholder="Nhập hoặc chọn ngôn ngữ"
                            emptyMessage="Không có ngôn ngữ phù hợp."
                            className={`flex-1 ${inputCls}`}
                        />
                        <ProficiencySelect
                            value={language.proficiency_level || 'intermediate'}
                            onChange={(nextValue) =>
                                updateItem('languages', index, 'proficiency_level', nextValue)
                            }
                            items={[
                                { value: 'basic', label: 'Cơ bản' },
                                { value: 'intermediate', label: 'Trung cấp' },
                                { value: 'advanced', label: 'Khá' },
                                { value: 'fluent', label: 'Thành thạo' },
                                { value: 'native', label: 'Bản ngữ' },
                            ]}
                        />
                        <button
                            type="button"
                            onClick={() => removeItem('languages', index)}
                            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        addItem('languages', { name: '', proficiency_level: 'intermediate' })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm ngôn ngữ
                </button>
            </Section>

            <Section
                icon={<Award className="h-4 w-4" />}
                title="Chứng chỉ"
                color="border-amber-100 bg-amber-50 text-amber-600"
                defaultOpen={false}
            >
                {getArr('certifications').map((cert: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-border bg-muted p-3"
                    >
                        <button
                            type="button"
                            onClick={() => removeItem('certifications', index)}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 transition-all hover:bg-red-100 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <Field label="Tên chứng chỉ">
                            <Input
                                value={cert.name || ''}
                                onChange={(e) => updateItem('certifications', index, 'name', e.target.value)}
                                placeholder="AWS Certified, Google Analytics..."
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Tổ chức cấp">
                            <Input
                                value={cert.issuing_organization || ''}
                                onChange={(e) =>
                                    updateItem(
                                        'certifications',
                                        index,
                                        'issuing_organization',
                                        e.target.value
                                    )
                                }
                                placeholder="Amazon, Google..."
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Ngày cấp">
                            <Input
                                type="date"
                                value={cert.issue_date || ''}
                                onChange={(e) =>
                                    updateItem('certifications', index, 'issue_date', e.target.value)
                                }
                                className={inputCls}
                            />
                        </Field>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        addItem('certifications', {
                            name: '',
                            issuing_organization: '',
                            issue_date: null,
                        })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm chứng chỉ
                </button>
            </Section>

            <Section
                icon={<FolderOpen className="h-4 w-4" />}
                title="Dự án"
                color="border-pink-100 bg-pink-50 text-pink-600"
                defaultOpen={false}
            >
                {getArr('projects').map((project: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-border bg-muted p-3"
                    >
                        <button
                            type="button"
                            onClick={() => removeItem('projects', index)}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 transition-all hover:bg-red-100 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <Field label="Tên dự án">
                            <Input
                                value={project.name || ''}
                                onChange={(e) => updateItem('projects', index, 'name', e.target.value)}
                                placeholder="Tên dự án"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Link dự án">
                            <Input
                                value={project.project_url || ''}
                                onChange={(e) =>
                                    updateItem('projects', index, 'project_url', e.target.value)
                                }
                                placeholder="https://..."
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Công nghệ (ngăn cách bởi dấu phẩy)">
                            <Input
                                value={
                                    Array.isArray(project.technologies)
                                        ? project.technologies.join(', ')
                                        : project.technologies || ''
                                }
                                onChange={(e) =>
                                    updateItem(
                                        'projects',
                                        index,
                                        'technologies',
                                        e.target.value
                                            .split(',')
                                            .map((item: string) => item.trim())
                                            .filter(Boolean)
                                    )
                                }
                                placeholder="React, Node.js, PostgreSQL..."
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Mô tả">
                            <textarea
                                value={project.description || ''}
                                onChange={(e) =>
                                    updateItem('projects', index, 'description', e.target.value)
                                }
                                placeholder="Mô tả dự án..."
                                rows={2}
                                className={textareaCls}
                            />
                            <div className="mt-2 flex justify-end">
                                <AIRewriteButton
                                    loading={rewritingKey === `projects.${index}.description`}
                                    disabled={!candidateId || !selectedCV?.id}
                                    onClick={() =>
                                        rewriteField({
                                            key: `projects.${index}.description`,
                                            section: 'project',
                                            text: project.description || '',
                                            context: {
                                                project_name: project.name,
                                                technologies: Array.isArray(project.technologies)
                                                    ? project.technologies
                                                    : String(project.technologies || '')
                                                        .split(',')
                                                        .map((item) => item.trim())
                                                        .filter(Boolean),
                                            },
                                            apply: (nextText) =>
                                                updateItem('projects', index, 'description', nextText),
                                        })
                                    }
                                />
                            </div>
                        </Field>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        addItem('projects', {
                            name: '',
                            project_url: '',
                            technologies: [],
                            description: '',
                        })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm dự án
                </button>
            </Section>

            <div className="h-4" />
        </div>
    );
}
