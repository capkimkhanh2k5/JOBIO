import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    Plus,
    Save,
    Trash2,
    User,
    Wand2,
} from 'lucide-react';
import { cvService } from '@/services/cvService';
import { taxonomyService } from '@/services/taxonomyService';
import { AutoSaveStatus, CVItem } from '@/pages/candidate/CVManager';
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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
}

interface SuggestionOption {
    value: string;
    label: string;
}

const inputCls =
    'h-9 rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-violet-400 focus:bg-white focus:ring-violet-100';
const textareaCls =
    'w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-all placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100';

const TEMPLATE_GRADIENTS: Record<string, string> = {
    'modern.html': 'from-slate-400 to-slate-600',
    'ATS_Prime.html': 'from-sky-500 to-blue-600',
    'editorialBold.html': 'from-rose-500 to-pink-600',
    'modernHybird.html': 'from-violet-500 to-purple-600',
    'modernHybird2.html': 'from-indigo-500 to-violet-600',
    'modernLuxury.html': 'from-amber-500 to-orange-600',
};

const TEMPLATE_ICONS: Record<string, string> = {
    'modern.html': 'MD',
    'ATS_Prime.html': 'ATS',
    'editorialBold.html': 'EB',
    'modernHybird.html': 'MH',
    'modernHybird2.html': 'MP',
    'modernLuxury.html': 'LX',
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
        <div className="overflow-hidden rounded-xl border border-slate-200">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
            >
                <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                        {icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{title}</span>
                </div>
                {open ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
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
                        <div className="space-y-3 bg-white p-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <Label className="mb-1 block text-xs font-medium text-slate-600">{label}</Label>
            {children}
        </div>
    );
}

function FreeSoloCombobox({
    value,
    onChange,
    options,
    placeholder,
    emptyMessage,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    options: SuggestionOption[];
    placeholder: string;
    emptyMessage: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filteredOptions = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return options;
        return options.filter((option) => option.label.toLowerCase().includes(keyword));
    }, [options, query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative flex-1">
                <PopoverTrigger asChild>
                    <div className="relative">
                        <Input
                            value={value}
                            autoComplete="off"
                            spellCheck={false}
                            onFocus={() => {
                                setQuery('');
                                setOpen(true);
                            }}
                            onChange={(e) => {
                                const nextValue = e.target.value;
                                onChange(nextValue);
                                setQuery(nextValue);
                                setOpen(true);
                            }}
                            placeholder={placeholder}
                            className={className}
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                setQuery('');
                                setOpen((prev) => !prev);
                            }}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500"
                            aria-label="Mở danh sách gợi ý"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="w-[--radix-popover-trigger-width] rounded-xl border-slate-200 bg-white p-0 shadow-lg"
                >
                    <Command shouldFilter={false} className="rounded-xl bg-white">
                        <CommandList className="max-h-64">
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        onSelect={() => {
                                            onChange(option.value);
                                            setQuery(option.value);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${
                                                value === option.value ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
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
            <SelectTrigger className="h-9 w-[132px] rounded-lg border-slate-200 bg-slate-50 text-xs focus:ring-violet-100">
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

export function CVBuilder({
    cvName,
    selectedTemplateId,
    cvData,
    autoSaveStatus,
    onFieldChange,
    selectedCV,
}: Props) {
    const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

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

    if (!selectedCV) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 shadow-inner"
                >
                    <FileText className="h-8 w-8 text-violet-400" />
                </motion.div>
                <h3 className="mb-2 text-lg font-bold text-slate-700">Chọn CV để chỉnh sửa</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                    Chọn một CV từ danh sách bên trái hoặc tạo mới để bắt đầu.
                </p>
            </div>
        );
    }

    const currentTemplate = templates.find((template: any) => String(template.id) === String(selectedTemplateId));

    return (
        <div className="space-y-4 p-5">
            <div className="flex h-5 items-center justify-end">
                <AnimatePresence mode="wait">
                    {autoSaveStatus === 'saving' && (
                        <motion.span
                            key="saving"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
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
                            className="flex items-center gap-1.5 text-[11px] text-emerald-600"
                        >
                            <Save className="h-3.5 w-3.5" />
                            Đã lưu
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Tên CV</Label>
                <Input
                    value={cvName}
                    onChange={(e) => onFieldChange('cv_name', e.target.value)}
                    placeholder="Nhập tên CV..."
                    className={`text-sm font-medium ${inputCls}`}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <button
                    type="button"
                    onClick={() => setIsTemplateExpanded((prev) => !prev)}
                    className="flex w-full cursor-pointer items-center justify-between bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                >
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-semibold text-slate-700">Chọn template</span>
                        <Badge
                            variant="outline"
                            className="border-violet-200 bg-violet-50 text-[10px] text-violet-700"
                        >
                            {currentTemplate?.name ?? 'Chưa chọn'}
                        </Badge>
                    </div>
                    {isTemplateExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
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
                            <div className="bg-white p-4">
                                {loadingTemplates ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {[...Array(6)].map((_, index) => (
                                            <Skeleton key={index} className="h-24 rounded-xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {templates.map((template: any) => {
                                            const isSelected =
                                                String(selectedTemplateId) === String(template.id);
                                            const gradient =
                                                TEMPLATE_GRADIENTS[template.file_name || ''] ||
                                                'from-violet-400 to-cyan-400';
                                            const icon = TEMPLATE_ICONS[template.file_name || ''] || 'CV';

                                            return (
                                                <button
                                                    key={template.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onFieldChange('template_id', template.id);
                                                        setIsTemplateExpanded(false);
                                                    }}
                                                    className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-violet-500'
                                                            : 'border-slate-200 hover:border-violet-300'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-12 items-center justify-center bg-gradient-to-br ${gradient}`}
                                                    >
                                                        <span className="text-xs font-bold text-white">{icon}</span>
                                                    </div>
                                                    <div className="bg-white px-1 py-1.5">
                                                        <p className="line-clamp-1 text-center text-[9px] font-semibold text-slate-700">
                                                            {template.name}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute right-1 top-1">
                                                            <CheckCircle2 className="h-3.5 w-3.5 fill-violet-500 text-white" />
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

            <Separator className="bg-slate-100" />

            <Section icon={<User className="h-4 w-4 text-white" />} title="Thông tin cá nhân" color="bg-violet-500">
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
                </Field>
            </Section>

            <Section icon={<LinkIcon className="h-4 w-4 text-white" />} title="Liên kết" color="bg-sky-500" defaultOpen={false}>
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
                icon={<Briefcase className="h-4 w-4 text-white" />}
                title="Kinh nghiệm làm việc"
                color="bg-cyan-500"
            >
                {getArr('experience').map((exp: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
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
                                className="rounded border-slate-300 text-violet-600"
                            />
                            <span className="text-xs text-slate-600">Đang làm việc tại đây</span>
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm kinh nghiệm
                </button>
            </Section>

            <Section
                icon={<GraduationCap className="h-4 w-4 text-white" />}
                title="Học vấn"
                color="bg-emerald-500"
            >
                {getArr('education').map((edu: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm học vấn
                </button>
            </Section>

            <Section icon={<Code className="h-4 w-4 text-white" />} title="Kỹ năng" color="bg-orange-500">
                {getArr('skills').map((skill: any, index: number) => (
                    <div key={index} className="group flex items-center gap-2">
                        <FreeSoloCombobox
                            value={skill.name || ''}
                            onChange={(nextValue) => updateItem('skills', index, 'name', nextValue)}
                            options={skillOptions}
                            placeholder="Nhập hoặc chọn kỹ năng"
                            emptyMessage="Không có kỹ năng phù hợp."
                            className={`flex-1 ${inputCls}`}
                        />
                        <ProficiencySelect
                            value={skill.proficiency_level || 'intermediate'}
                            onChange={(nextValue) =>
                                updateItem('skills', index, 'proficiency_level', nextValue)
                            }
                            items={[
                                { value: 'basic', label: 'Cơ bản' },
                                { value: 'intermediate', label: 'Trung bình' },
                                { value: 'advanced', label: 'Nâng cao' },
                                { value: 'expert', label: 'Chuyên gia' },
                            ]}
                        />
                        <button
                            type="button"
                            onClick={() => removeItem('skills', index)}
                            className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        addItem('skills', {
                            name: '',
                            proficiency_level: 'intermediate',
                            years_of_experience: 0,
                        })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm kỹ năng
                </button>
            </Section>

            <Section
                icon={<Globe className="h-4 w-4 text-white" />}
                title="Ngôn ngữ"
                color="bg-teal-500"
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm ngôn ngữ
                </button>
            </Section>

            <Section
                icon={<Award className="h-4 w-4 text-white" />}
                title="Chứng chỉ"
                color="bg-amber-500"
                defaultOpen={false}
            >
                {getArr('certifications').map((cert: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm chứng chỉ
                </button>
            </Section>

            <Section
                icon={<FolderOpen className="h-4 w-4 text-white" />}
                title="Dự án"
                color="bg-pink-500"
                defaultOpen={false}
            >
                {getArr('projects').map((project: any, index: number) => (
                    <div
                        key={index}
                        className="group relative space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-600"
                >
                    <Plus className="h-4 w-4" />
                    Thêm dự án
                </button>
            </Section>

            <div className="h-4" />
        </div>
    );
}
