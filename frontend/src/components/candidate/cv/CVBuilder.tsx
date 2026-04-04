import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, Save, Clock, ChevronDown, Wand2,
    User, Briefcase, GraduationCap, Code, Globe, Award, FolderOpen,
    Plus, Trash2, ChevronUp, LinkIcon
} from 'lucide-react';
import { cvService } from '@/services/cvService';
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

// ── Reusable Section wrapper ────────────────────────────────────────────────
function Section({ icon, title, color, children, defaultOpen = true }: {
    icon: React.ReactNode; title: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
                        {icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="p-4 space-y-3 bg-white">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Field components ──────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
            {children}
        </div>
    );
}

const inputCls = "text-sm border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-400 focus:ring-violet-100 rounded-lg h-9";
const textareaCls = "w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none transition-all placeholder:text-slate-400";

// ── Template picker ─────────────────────────────────────────────────────────
const TEMPLATE_GRADIENTS: Record<string, string> = {
    'modern.html': 'from-slate-400 to-slate-600',
    'ATS_Prime.html': 'from-sky-500 to-blue-600',
    'editorialBold.html': 'from-rose-500 to-pink-600',
    'modernHybird.html': 'from-violet-500 to-purple-600',
    'modernHybird2.html': 'from-indigo-500 to-violet-600',
    'modernLuxury.html': 'from-amber-500 to-orange-600',
};
const TEMPLATE_ICONS: Record<string, string> = {
    'modern.html': '📄', 'ATS_Prime.html': '🎯', 'editorialBold.html': '✏️',
    'modernHybird.html': '🎨', 'modernHybird2.html': '💼', 'modernLuxury.html': '✨',
};

// ─── Main CVBuilder ─────────────────────────────────────────────────────────
export function CVBuilder({ cvName, selectedTemplateId, cvData, autoSaveStatus, onFieldChange, selectedCV }: Props) {
    const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

    const { data: templates = [], isLoading: loadingTemplates } = useQuery({
        queryKey: ['cv-templates'],
        queryFn: () => cvService.listTemplates({ page_size: 50 }).then(r => r.data.results ?? []),
        staleTime: 120_000,
    });

    // Helpers for nested cv_data access
    const get = useCallback((path: string) => {
        const parts = path.split('.');
        let cur: any = cvData;
        for (const p of parts) cur = cur?.[p];
        return cur ?? '';
    }, [cvData]);

    const set = useCallback((path: string, value: any) => {
        const parts = path.split('.');
        const newData = JSON.parse(JSON.stringify(cvData || {}));
        let cur = newData;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
        onFieldChange('cv_data', newData);
    }, [cvData, onFieldChange]);

    // Array helpers
    const getArr = (key: string): any[] => Array.isArray(cvData?.[key]) ? cvData[key] : [];

    const addItem = (key: string, template: object) => {
        onFieldChange('cv_data', { ...cvData, [key]: [...getArr(key), template] });
    };

    const removeItem = (key: string, idx: number) => {
        const arr = getArr(key).filter((_: any, i: number) => i !== idx);
        onFieldChange('cv_data', { ...cvData, [key]: arr });
    };

    const updateItem = (key: string, idx: number, field: string, value: any) => {
        const arr = getArr(key).map((item: any, i: number) => i === idx ? { ...item, [field]: value } : item);
        onFieldChange('cv_data', { ...cvData, [key]: arr });
    };

    if (!selectedCV) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mb-4 shadow-inner">
                    <FileText className="w-8 h-8 text-violet-400" />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Chọn CV để chỉnh sửa</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Chọn một CV từ danh sách bên trái hoặc tạo mới để bắt đầu.</p>
            </div>
        );
    }

    const currentTemplate = templates.find((t: any) => String(t.id) === String(selectedTemplateId));

    return (
        <div className="p-5 space-y-4">
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
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tên CV</Label>
                <Input value={cvName} onChange={(e) => onFieldChange('cv_name', e.target.value)}
                    placeholder="Nhập tên CV..." className={`text-sm font-medium ${inputCls}`} />
            </div>

            {/* Template selector */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => setIsTemplateExpanded(!isTemplateExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-semibold text-slate-700">Chọn template</span>
                        <Badge variant="outline" className="text-[10px] border-violet-200 bg-violet-50 text-violet-700">
                            {currentTemplate?.name ?? 'Chưa chọn'}
                        </Badge>
                    </div>
                    {isTemplateExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                <AnimatePresence>
                    {isTemplateExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="p-4 bg-white">
                                {loadingTemplates ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {templates.map((tpl: any) => {
                                            const isSelected = String(selectedTemplateId) === String(tpl.id);
                                            const grad = TEMPLATE_GRADIENTS[tpl.file_name || ''] || 'from-violet-400 to-cyan-400';
                                            const icon = TEMPLATE_ICONS[tpl.file_name || ''] || '📄';
                                            return (
                                                <button key={tpl.id} type="button"
                                                    onClick={() => { onFieldChange('template_id', tpl.id); setIsTemplateExpanded(false); }}
                                                    className={`relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${isSelected ? 'border-violet-500' : 'border-slate-200 hover:border-violet-300'}`}>
                                                    <div className={`h-12 bg-gradient-to-br ${grad} flex items-center justify-center`}>
                                                        <span className="text-xl">{icon}</span>
                                                    </div>
                                                    <div className="py-1.5 px-1 bg-white">
                                                        <p className="text-[9px] font-semibold text-slate-700 line-clamp-1 text-center">{tpl.name}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-white fill-violet-500" />
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

            {/* ─── Personal Info ─────────────────────────────────── */}
            <Section icon={<User className="w-4 h-4 text-white" />} title="Thông tin cá nhân" color="bg-violet-500">
                <Field label="Họ và tên">
                    <Input value={get('personal.full_name')} onChange={e => set('personal.full_name', e.target.value)}
                        placeholder="Nguyễn Văn A" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Email">
                        <Input value={get('personal.email')} onChange={e => set('personal.email', e.target.value)}
                            placeholder="email@example.com" className={inputCls} />
                    </Field>
                    <Field label="Số điện thoại">
                        <Input value={get('personal.phone')} onChange={e => set('personal.phone', e.target.value)}
                            placeholder="0900 000 000" className={inputCls} />
                    </Field>
                </div>
                <Field label="Vị trí / Chức danh">
                    <Input value={get('personal.current_position')} onChange={e => set('personal.current_position', e.target.value)}
                        placeholder="Senior Frontend Developer" className={inputCls} />
                </Field>
                <Field label="Giới thiệu bản thân">
                    <textarea value={get('personal.bio')} onChange={e => set('personal.bio', e.target.value)}
                        placeholder="Tóm tắt kinh nghiệm, thế mạnh và mục tiêu nghề nghiệp..." rows={3} className={textareaCls} />
                </Field>
            </Section>

            {/* ─── Links ─────────────────────────────────────────── */}
            <Section icon={<LinkIcon className="w-4 h-4 text-white" />} title="Liên kết" color="bg-sky-500" defaultOpen={false}>
                <Field label="LinkedIn">
                    <Input value={get('links.linkedin')} onChange={e => set('links.linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/..." className={inputCls} />
                </Field>
                <Field label="GitHub">
                    <Input value={get('links.github')} onChange={e => set('links.github', e.target.value)}
                        placeholder="https://github.com/..." className={inputCls} />
                </Field>
                <Field label="Portfolio / Website">
                    <Input value={get('links.portfolio')} onChange={e => set('links.portfolio', e.target.value)}
                        placeholder="https://portfolio.com" className={inputCls} />
                </Field>
            </Section>

            {/* ─── Experience ────────────────────────────────────── */}
            <Section icon={<Briefcase className="w-4 h-4 text-white" />} title="Kinh nghiệm làm việc" color="bg-cyan-500">
                {getArr('experience').map((exp: any, i: number) => (
                    <div key={i} className="relative rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50 group">
                        <button onClick={() => removeItem('experience', i)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Công ty">
                                <Input value={exp.company_name || ''} onChange={e => updateItem('experience', i, 'company_name', e.target.value)}
                                    placeholder="Tên công ty" className={inputCls} />
                            </Field>
                            <Field label="Vị trí">
                                <Input value={exp.position || exp.job_title || ''} onChange={e => updateItem('experience', i, 'position', e.target.value)}
                                    placeholder="Chức vụ" className={inputCls} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Từ ngày">
                                <Input type="date" value={exp.start_date || ''} onChange={e => updateItem('experience', i, 'start_date', e.target.value)}
                                    className={inputCls} />
                            </Field>
                            <Field label="Đến ngày">
                                <Input type="date" value={exp.end_date || ''} disabled={exp.is_current}
                                    onChange={e => updateItem('experience', i, 'end_date', e.target.value)} className={inputCls} />
                            </Field>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!exp.is_current} onChange={e => updateItem('experience', i, 'is_current', e.target.checked)}
                                className="rounded border-slate-300 text-violet-600" />
                            <span className="text-xs text-slate-600">Đang làm việc tại đây</span>
                        </label>
                        <Field label="Mô tả công việc">
                            <textarea value={exp.description || ''} onChange={e => updateItem('experience', i, 'description', e.target.value)}
                                placeholder="Mô tả công việc, thành tích..." rows={2} className={textareaCls} />
                        </Field>
                    </div>
                ))}
                <button onClick={() => addItem('experience', { company_name: '', position: '', start_date: null, end_date: null, is_current: false, description: '' })}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Thêm kinh nghiệm
                </button>
            </Section>

            {/* ─── Education ─────────────────────────────────────── */}
            <Section icon={<GraduationCap className="w-4 h-4 text-white" />} title="Học vấn" color="bg-emerald-500">
                {getArr('education').map((edu: any, i: number) => (
                    <div key={i} className="relative rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50 group">
                        <button onClick={() => removeItem('education', i)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Field label="Trường">
                            <Input value={edu.school_name || ''} onChange={e => updateItem('education', i, 'school_name', e.target.value)}
                                placeholder="Tên trường đại học" className={inputCls} />
                        </Field>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Bằng cấp">
                                <Input value={edu.degree || ''} onChange={e => updateItem('education', i, 'degree', e.target.value)}
                                    placeholder="Cử nhân, Thạc sĩ..." className={inputCls} />
                            </Field>
                            <Field label="Chuyên ngành">
                                <Input value={edu.field_of_study || ''} onChange={e => updateItem('education', i, 'field_of_study', e.target.value)}
                                    placeholder="Công nghệ thông tin" className={inputCls} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Field label="Từ năm">
                                <Input type="date" value={edu.start_date || ''} onChange={e => updateItem('education', i, 'start_date', e.target.value)}
                                    className={inputCls} />
                            </Field>
                            <Field label="Đến năm">
                                <Input type="date" value={edu.end_date || ''} onChange={e => updateItem('education', i, 'end_date', e.target.value)}
                                    className={inputCls} />
                            </Field>
                        </div>
                    </div>
                ))}
                <button onClick={() => addItem('education', { school_name: '', degree: '', field_of_study: '', start_date: null, end_date: null })}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Thêm học vấn
                </button>
            </Section>

            {/* ─── Skills ────────────────────────────────────────── */}
            <Section icon={<Code className="w-4 h-4 text-white" />} title="Kỹ năng" color="bg-orange-500">
                {getArr('skills').map((skill: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 group">
                        <Input value={skill.name || ''} onChange={e => updateItem('skills', i, 'name', e.target.value)}
                            placeholder="Tên kỹ năng" className={`flex-1 ${inputCls}`} />
                        <select value={skill.proficiency_level || 'intermediate'}
                            onChange={e => updateItem('skills', i, 'proficiency_level', e.target.value)}
                            className="h-9 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:border-violet-400 focus:outline-none">
                            <option value="basic">Cơ bản</option>
                            <option value="intermediate">Trung bình</option>
                            <option value="advanced">Nâng cao</option>
                            <option value="expert">Chuyên gia</option>
                        </select>
                        <button onClick={() => removeItem('skills', i)}
                            className="w-8 h-9 rounded-lg text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                <button onClick={() => addItem('skills', { name: '', proficiency_level: 'intermediate', years_of_experience: 0 })}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Thêm kỹ năng
                </button>
            </Section>

            {/* ─── Languages ─────────────────────────────────────── */}
            <Section icon={<Globe className="w-4 h-4 text-white" />} title="Ngôn ngữ" color="bg-teal-500" defaultOpen={false}>
                {getArr('languages').map((lang: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 group">
                        <Input value={lang.name || ''} onChange={e => updateItem('languages', i, 'name', e.target.value)}
                            placeholder="Tiếng Anh, Tiếng Việt..." className={`flex-1 ${inputCls}`} />
                        <select value={lang.proficiency_level || 'intermediate'}
                            onChange={e => updateItem('languages', i, 'proficiency_level', e.target.value)}
                            className="h-9 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:border-violet-400 focus:outline-none">
                            <option value="basic">Cơ bản</option>
                            <option value="intermediate">Trung cấp</option>
                            <option value="advanced">Khá</option>
                            <option value="fluent">Thành thạo</option>
                            <option value="native">Bản ngữ</option>
                        </select>
                        <button onClick={() => removeItem('languages', i)}
                            className="w-8 h-9 rounded-lg text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
                <button onClick={() => addItem('languages', { name: '', proficiency_level: 'intermediate' })}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Thêm ngôn ngữ
                </button>
            </Section>

            {/* ─── Certifications ────────────────────────────────── */}
            <Section icon={<Award className="w-4 h-4 text-white" />} title="Chứng chỉ" color="bg-amber-500" defaultOpen={false}>
                {getArr('certifications').map((cert: any, i: number) => (
                    <div key={i} className="relative rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50 group">
                        <button onClick={() => removeItem('certifications', i)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Field label="Tên chứng chỉ">
                            <Input value={cert.name || ''} onChange={e => updateItem('certifications', i, 'name', e.target.value)}
                                placeholder="AWS Certified, Google Analytics..." className={inputCls} />
                        </Field>
                        <Field label="Tổ chức cấp">
                            <Input value={cert.issuing_organization || ''} onChange={e => updateItem('certifications', i, 'issuing_organization', e.target.value)}
                                placeholder="Amazon, Google..." className={inputCls} />
                        </Field>
                        <Field label="Ngày cấp">
                            <Input type="date" value={cert.issue_date || ''} onChange={e => updateItem('certifications', i, 'issue_date', e.target.value)}
                                className={inputCls} />
                        </Field>
                    </div>
                ))}
                <button onClick={() => addItem('certifications', { name: '', issuing_organization: '', issue_date: null })}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Thêm chứng chỉ
                </button>
            </Section>

            {/* ─── Projects ──────────────────────────────────────── */}
            <Section icon={<FolderOpen className="w-4 h-4 text-white" />} title="Dự án" color="bg-pink-500" defaultOpen={false}>
                {getArr('projects').map((proj: any, i: number) => (
                    <div key={i} className="relative rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50 group">
                        <button onClick={() => removeItem('projects', i)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Field label="Tên dự án">
                            <Input value={proj.name || ''} onChange={e => updateItem('projects', i, 'name', e.target.value)}
                                placeholder="Tên dự án" className={inputCls} />
                        </Field>
                        <Field label="Link dự án">
                            <Input value={proj.project_url || ''} onChange={e => updateItem('projects', i, 'project_url', e.target.value)}
                                placeholder="https://..." className={inputCls} />
                        </Field>
                        <Field label="Công nghệ (ngăn cách bởi dấu phẩy)">
                            <Input value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                                onChange={e => updateItem('projects', i, 'technologies', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                                placeholder="React, Node.js, PostgreSQL..." className={inputCls} />
                        </Field>
                        <Field label="Mô tả">
                            <textarea value={proj.description || ''} onChange={e => updateItem('projects', i, 'description', e.target.value)}
                                placeholder="Mô tả dự án..." rows={2} className={textareaCls} />
                        </Field>
                    </div>
                ))}
                <button onClick={() => addItem('projects', { name: '', project_url: '', technologies: [], description: '' })}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors text-sm cursor-pointer">
                    <Plus className="w-4 h-4" /> Thêm dự án
                </button>
            </Section>

            {/* Padding bottom */}
            <div className="h-4" />
        </div>
    );
}
