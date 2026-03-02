import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Save, Clock, ChevronDown, Wand2, Plus } from 'lucide-react';
import { mockApi } from '@/services/mockApi';
import { AutoSaveStatus, CVItem } from '@/pages/candidate/CVManager';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface Props {
    cvName: string;
    selectedTemplateId: string;
    cvData: Record<string, any>;
    autoSaveStatus: AutoSaveStatus;
    onFieldChange: (field: string, value: any) => void;
    selectedCV: CVItem | null;
}

// ── Template category filter tabs ───────────────────────────────────────────
function TemplateCategoryTabs({
    categories, active, onChange
}: { categories: any[]; active: string; onChange: (id: string) => void }) {
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onChange(cat.id)}
                    className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${active === cat.id
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700'
                        }`}
                >
                    {cat.name} <span className="opacity-60">({cat.count})</span>
                </button>
            ))}
        </div>
    );
}

// ── Single template card ────────────────────────────────────────────────────
function TemplateCard({
    template, isSelected, onSelect, popularIds
}: { template: any; isSelected: boolean; onSelect: () => void; popularIds: string[] }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            whileHover={{ y: -3 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={onSelect}
            className={`relative rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-200 group ${isSelected
                    ? 'border-violet-500 shadow-md shadow-violet-200'
                    : 'border-slate-200 hover:border-violet-300'
                }`}
        >
            {/* Thumbnail */}
            <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-80"
                />
                {/* Hover overlay with preview hint */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-violet-900/50 flex items-center justify-center"
                        >
                            <span className="text-white text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Chọn template
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {template.is_premium && (
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            PREMIUM
                        </span>
                    )}
                    {popularIds.includes(template.id) && (
                        <span className="bg-violet-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            HOT
                        </span>
                    )}
                </div>
                {/* Selected check */}
                {isSelected && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-white fill-violet-500" />
                    </div>
                )}
            </div>

            <div className="p-2.5">
                <p className="text-[12px] font-semibold text-slate-800 truncate">{template.name}</p>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-1 flex-wrap">
                        {template.tags.slice(0, 2).map((t: string) => (
                            <span key={t} className="text-[9px] text-muted-foreground">{t}</span>
                        ))}
                    </div>
                    {template.is_premium ? (
                        <span className="text-[11px] font-bold text-amber-600">
                            {template.price.toLocaleString('vi-VN')}₫
                        </span>
                    ) : (
                        <span className="text-[11px] font-bold text-emerald-600">Miễn phí</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ── CV content form fields ──────────────────────────────────────────────────
function CVFormFields({
    cvData, onChange
}: { cvData: Record<string, any>; onChange: (field: string, value: any) => void }) {
    const sections = [
        { key: 'summary', label: 'Giới thiệu bản thân', type: 'textarea', placeholder: 'Viết tóm tắt về bản thân, kinh nghiệm và mục tiêu nghề nghiệp...' },
        { key: 'headline', label: 'Tiêu đề chuyên môn', type: 'text', placeholder: 'vd: Senior Frontend Engineer | React Specialist' },
        { key: 'skills', label: 'Kỹ năng (ngăn cách bằng dấu phẩy)', type: 'text', placeholder: 'React, TypeScript, TailwindCSS, Node.js...' },
        { key: 'languages', label: 'Ngôn ngữ', type: 'text', placeholder: 'Tiếng Việt (Native), Tiếng Anh (C1)...' },
        { key: 'interests', label: 'Sở thích / Mục tiêu', type: 'textarea', placeholder: 'Chia sẻ thêm về đam mê và mục tiêu sự nghiệp...' },
    ];

    return (
        <div className="space-y-4">
            {sections.map((section) => (
                <div key={section.key}>
                    <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">{section.label}</Label>
                    {section.type === 'textarea' ? (
                        <textarea
                            value={cvData[section.key] ?? ''}
                            onChange={(e) => onChange(section.key, e.target.value)}
                            placeholder={section.placeholder}
                            rows={3}
                            className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none transition-all placeholder:text-slate-400"
                        />
                    ) : (
                        <Input
                            value={cvData[section.key] ?? ''}
                            onChange={(e) => onChange(section.key, e.target.value)}
                            placeholder={section.placeholder}
                            className="text-sm border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-100 rounded-xl"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Main CVBuilder ────────────────────────────────────────────────────────

export function CVBuilder({ cvName, selectedTemplateId, cvData, autoSaveStatus, onFieldChange, selectedCV }: Props) {
    const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
    const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

    const { data: templates = [], isLoading: loadingTemplates } = useQuery({
        queryKey: ['cv-templates'],
        queryFn: mockApi.getCVTemplates,
        staleTime: 120_000,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['cv-template-categories'],
        queryFn: mockApi.getCVTemplateCategories,
        staleTime: 120_000,
    });

    const { data: popularIds = [] } = useQuery({
        queryKey: ['cv-templates', 'popular'],
        queryFn: mockApi.getPopularCVTemplates,
        staleTime: 120_000,
    });

    const filteredTemplates = templateCategoryFilter === 'all'
        ? templates
        : templates.filter((t: any) => t.category === templateCategoryFilter);

    if (!selectedCV) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mb-4 shadow-inner"
                >
                    <FileText className="w-8 h-8 text-violet-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Chọn CV để chỉnh sửa</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Chọn một CV từ danh sách bên trái hoặc tạo mới để bắt đầu.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Auto-save indicator */}
            <div className="flex items-center justify-end h-5">
                <AnimatePresence mode="wait">
                    {autoSaveStatus === 'saving' && (
                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                        </motion.span>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <motion.span key="saved" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                            <Save className="w-3.5 h-3.5" /> Đã lưu
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* CV Name */}
            <div>
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">Tên CV</Label>
                <Input
                    value={cvName}
                    onChange={(e) => onFieldChange('cv_name', e.target.value)}
                    placeholder="Nhập tên CV..."
                    className="text-base font-medium border-slate-200 bg-slate-50 focus:border-violet-400 focus:ring-violet-100 rounded-xl"
                />
            </div>

            <Separator className="bg-slate-100" />

            {/* Template selector */}
            <div>
                <button
                    onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
                    className="flex items-center justify-between w-full mb-3 group"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">Chọn template</span>
                        <Badge variant="outline" className="text-[10px] border-violet-200 bg-violet-50 text-violet-700">
                            {templates.find((t: any) => t.id === selectedTemplateId)?.name ?? 'Chưa chọn'}
                        </Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isTemplateExpanded ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isTemplateExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-4 pt-1">
                                <TemplateCategoryTabs
                                    categories={categories}
                                    active={templateCategoryFilter}
                                    onChange={setTemplateCategoryFilter}
                                />
                                {loadingTemplates ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        {filteredTemplates.map((tpl: any) => (
                                            <TemplateCard
                                                key={tpl.id}
                                                template={tpl}
                                                isSelected={selectedTemplateId === tpl.id}
                                                onSelect={() => {
                                                    onFieldChange('template_id', tpl.id);
                                                    setIsTemplateExpanded(false);
                                                }}
                                                popularIds={popularIds}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Separator className="bg-slate-100" />

            {/* CV Content Form */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Nội dung CV</h3>
                    <span className="text-[10px] text-muted-foreground">(Auto-fill từ hồ sơ)</span>
                </div>
                <CVFormFields cvData={cvData} onChange={onFieldChange} />
            </div>

            <Separator className="bg-slate-100" />

            {/* Experience preview (auto-filled) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-cyan-500" /> Kinh nghiệm làm việc
                        <span className="text-[10px] text-muted-foreground">(từ hồ sơ)</span>
                    </h3>
                </div>
                <div className="space-y-2">
                    {(cvData.experience ?? [{ company: 'Tech Solutions Inc.', title: 'Frontend Developer', period: '2018 – 2021' }]).map((exp: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-violet-100 flex items-center justify-center shrink-0">
                                <span className="text-[11px] font-bold text-violet-600">{exp.company?.charAt(0)}</span>
                            </div>
                            <div>
                                <p className="text-[12px] font-semibold text-slate-800">{exp.title}</p>
                                <p className="text-[11px] text-muted-foreground">{exp.company} · {exp.period}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
