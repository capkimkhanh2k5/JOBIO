import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileUp, X, CheckCircle2, AlertCircle, Loader2, Sparkles,
    User, GraduationCap, Briefcase, Zap, Award, Languages, FolderGit2,
    ChevronDown, ChevronUp, Upload
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';

import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CVAutoFillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidateId: number;
}

interface ParsedSection {
    key: string;
    label: string;
    icon: React.ElementType;
    count: number;
    items: any[];
    checked: boolean;
}

type DialogStep = 'upload' | 'processing' | 'review';

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const cleanText = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    return text.toLowerCase() === 'n/a' ? '' : text;
};

// ─── Component ──────────────────────────────────────────────────────────────

export const CVAutoFillDialog = ({ open, onOpenChange, candidateId }: CVAutoFillDialogProps) => {
    const queryClient = useQueryClient();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<DialogStep>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [sections, setSections] = useState<ParsedSection[]>([]);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // ─── Parse mutation ─────────────────────────────────────────────────

    const parseMutation = useMutation({
        mutationFn: (file: File) => candidateService.parseCVForProfile(candidateId, file).then(r => r.data),
        onSuccess: (data) => {
            setParsedData(data);
            buildSections(data);
            setStep('review');
        },
        onError: (error: any) => {
            const detail = error?.response?.data?.detail || 'Không thể phân tích CV. Vui lòng thử lại.';
            toast.error(detail);
            setStep('upload');
        },
    });

    // ─── Build sections from parsed data ────────────────────────────────

    const buildSections = (data: any) => {
        const result: ParsedSection[] = [];

        if (data?.personal && (data.personal.full_name || data.personal.current_position || data.personal.bio || data.location?.city)) {
            result.push({
                key: 'personal',
                label: 'Thông tin cá nhân',
                icon: User,
                count: Object.values(data.personal).filter((v: any) => v && v !== '').length + (data.location?.city ? 1 : 0),
                items: [data.personal],
                checked: true,
            });
        }

        if (data?.experience?.length > 0) {
            result.push({
                key: 'experience',
                label: 'Kinh nghiệm làm việc',
                icon: Briefcase,
                count: data.experience.length,
                items: data.experience,
                checked: true,
            });
        }

        if (data?.education?.length > 0) {
            result.push({
                key: 'education',
                label: 'Học vấn',
                icon: GraduationCap,
                count: data.education.length,
                items: data.education,
                checked: true,
            });
        }

        if (data?.skills?.length > 0) {
            result.push({
                key: 'skills',
                label: 'Kỹ năng',
                icon: Zap,
                count: data.skills.length,
                items: data.skills,
                checked: true,
            });
        }

        if (data?.certifications?.length > 0) {
            result.push({
                key: 'certifications',
                label: 'Chứng chỉ',
                icon: Award,
                count: data.certifications.length,
                items: data.certifications,
                checked: true,
            });
        }

        if (data?.languages?.length > 0) {
            result.push({
                key: 'languages',
                label: 'Ngôn ngữ',
                icon: Languages,
                count: data.languages.length,
                items: data.languages,
                checked: true,
            });
        }

        if (data?.projects?.length > 0) {
            result.push({
                key: 'projects',
                label: 'Dự án',
                icon: FolderGit2,
                count: data.projects.length,
                items: data.projects,
                checked: true,
            });
        }

        setSections(result);
    };

    // ─── File handling ──────────────────────────────────────────────────

    const validateAndSetFile = useCallback((file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Chỉ hỗ trợ file PDF');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File quá lớn. Tối đa 10MB.');
            return;
        }
        setSelectedFile(file);
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) validateAndSetFile(file);
    }, [validateAndSetFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSetFile(file);
    };

    const handleUploadAndParse = () => {
        if (!selectedFile) return;
        setStep('processing');
        parseMutation.mutate(selectedFile);
    };

    // ─── Section toggling ───────────────────────────────────────────────

    const toggleSection = (key: string) => {
        setSections(prev => prev.map(s => s.key === key ? { ...s, checked: !s.checked } : s));
    };

    // ─── Apply parsed data ──────────────────────────────────────────────

    const handleApply = async () => {
        if (!parsedData || !candidateId) return;

        const selectedSections = sections.filter(s => s.checked);
        if (selectedSections.length === 0) {
            toast.error('Vui lòng chọn ít nhất một mục để cập nhật.');
            return;
        }

        setIsApplying(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            // 1. Update personal info
            const personalSection = selectedSections.find(s => s.key === 'personal');
            if (personalSection && parsedData.personal) {
                try {
                    const p = parsedData.personal;
                    const updateData: any = {};
                    if (p.current_position) updateData.current_position = p.current_position;
                    if (p.bio) updateData.bio = p.bio;
                    if (p.years_of_experience != null) updateData.years_of_experience = p.years_of_experience;
                    if (p.full_name) updateData.full_name = p.full_name;

                    // Links
                    if (parsedData.links?.linkedin) updateData.linkedin_url = parsedData.links.linkedin;
                    if (parsedData.links?.github) updateData.github_url = parsedData.links.github;
                    if (parsedData.links?.portfolio) updateData.portfolio_url = parsedData.links.portfolio;

                    // Address / Location
                    const city = cleanText(parsedData.location?.city);
                    if (city) {
                        updateData.address = {
                            province: city,
                        };
                    }

                    if (Object.keys(updateData).length > 0) {
                        await candidateService.update(candidateId, updateData);
                        successCount++;
                    }
                } catch {
                    errorCount++;
                }
            }

            // 2. Add experience
            const experienceSection = selectedSections.find(s => s.key === 'experience');
            if (experienceSection && parsedData.experience?.length > 0) {
                for (const exp of parsedData.experience) {
                    const companyName = cleanText(exp.company_name);
                    const jobTitle = cleanText(exp.job_title || exp.position);
                    if (!companyName || !jobTitle || !exp.start_date) continue;

                    try {
                        await candidateService.addExperience(candidateId, {
                            company_name: companyName,
                            job_title: jobTitle,
                            start_date: exp.start_date,
                            end_date: exp.end_date || undefined,
                            is_current: exp.is_current || false,
                            description: cleanText(exp.description),
                        });
                        successCount++;
                    } catch {
                        errorCount++;
                    }
                }
            }

            // 3. Add education
            const educationSection = selectedSections.find(s => s.key === 'education');
            if (educationSection && parsedData.education?.length > 0) {
                for (const edu of parsedData.education) {
                    const schoolName = cleanText(edu.school_name);
                    if (!schoolName) continue;

                    try {
                        await candidateService.addEducation(candidateId, {
                            school_name: schoolName,
                            degree: cleanText(edu.degree),
                            field_of_study: cleanText(edu.field_of_study),
                            start_date: edu.start_date || undefined,
                            end_date: edu.end_date || undefined,
                            description: cleanText(edu.description),
                        });
                        successCount++;
                    } catch {
                        errorCount++;
                    }
                }
            }

            // 4. Add certifications
            const certsSection = selectedSections.find(s => s.key === 'certifications');
            if (certsSection && parsedData.certifications?.length > 0) {
                for (const cert of parsedData.certifications) {
                    const certificationName = cleanText(cert.name);
                    if (!certificationName) continue;

                    try {
                        await candidateService.addCertification(candidateId, {
                            certification_name: certificationName,
                            issuing_organization: cleanText(cert.issuing_organization),
                            issue_date: cert.issue_date || undefined,
                            expiry_date: cert.expiry_date || undefined,
                            credential_id: cleanText(cert.credential_id),
                            credential_url: cleanText(cert.credential_url),
                        });
                        successCount++;
                    } catch {
                        errorCount++;
                    }
                }
            }

            // 5. Add projects
            const projectsSection = selectedSections.find(s => s.key === 'projects');
            if (projectsSection && parsedData.projects?.length > 0) {
                for (const proj of parsedData.projects) {
                    const projectName = cleanText(proj.name);
                    if (!projectName) continue;

                    try {
                        const techList = Array.isArray(proj.technologies) ? proj.technologies : [];
                        await candidateService.addProject(candidateId, {
                            project_name: projectName,
                            description: cleanText(proj.description),
                            project_url: cleanText(proj.project_url),
                            start_date: proj.start_date || undefined,
                            end_date: proj.end_date || undefined,
                            technologies_used: techList.map(cleanText).filter(Boolean).join(', '),
                        });
                        successCount++;
                    } catch {
                        errorCount++;
                    }
                }
            }

            // 6. Add skills
            const skillsSection = selectedSections.find(s => s.key === 'skills');
            if (skillsSection && parsedData.skills?.length > 0) {
                for (const skill of parsedData.skills) {
                    const skillName = cleanText(skill.name);
                    if (!skillName) continue;

                    try {
                        await candidateService.addSkill(candidateId, {
                            skill_name: skillName,
                            proficiency_level: skill.proficiency_level || 'intermediate',
                            years_of_experience: skill.years_of_experience || 0,
                        });
                        successCount++;
                    } catch {
                        errorCount++;
                    }
                }
            }

            // 7. Add languages
            const languagesSection = selectedSections.find(s => s.key === 'languages');
            if (languagesSection && parsedData.languages?.length > 0) {
                for (const lang of parsedData.languages) {
                    const languageName = cleanText(lang.name);
                    if (!languageName) continue;

                    try {
                        let level = 'intermediate';
                        if (lang.proficiency_level && ['native', 'fluent', 'advanced', 'intermediate', 'basic'].includes(lang.proficiency_level.toLowerCase())) {
                            level = lang.proficiency_level.toLowerCase();
                        }
                        await candidateService.addLanguage(candidateId, {
                            language_name: languageName,
                            proficiency_level: level as any,
                            is_native: level === 'native',
                        });
                        successCount++;
                    } catch {
                        errorCount++;
                    }
                }
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['profile'] }),
                queryClient.invalidateQueries({ queryKey: ['profile-completeness'] }),
                queryClient.invalidateQueries({ queryKey: ['education', candidateId] }),
                queryClient.invalidateQueries({ queryKey: ['experience', candidateId] }),
                queryClient.invalidateQueries({ queryKey: ['skills', candidateId] }),
                queryClient.invalidateQueries({ queryKey: ['certifications', candidateId] }),
                queryClient.invalidateQueries({ queryKey: ['user-languages', candidateId] }),
                queryClient.invalidateQueries({ queryKey: ['projects', candidateId] }),
            ]);

            if (successCount === 0 && errorCount === 0) {
                toast.warning('Không có dữ liệu hợp lệ để cập nhật từ CV.');
            } else if (errorCount === 0) {
                toast.success(`Đã cập nhật ${successCount} mục thành công từ CV!`);
            } else {
                toast.warning(`Đã cập nhật ${successCount} mục. ${errorCount} mục bị lỗi.`);
            }
            handleClose();
        } catch {
            toast.error('Có lỗi xảy ra khi cập nhật hồ sơ.');
        } finally {
            setIsApplying(false);
        }
    };

    // ─── Reset & close ──────────────────────────────────────────────────

    const handleClose = () => {
        setStep('upload');
        setSelectedFile(null);
        setParsedData(null);
        setSections([]);
        setExpandedSection(null);
        onOpenChange(false);
    };

    if (!open) return null;

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.1, 0.9, 0.2, 1] }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-violet-600" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Hoàn thiện hồ sơ bằng CV</h2>
                                <p className="text-xs text-slate-500">
                                    {step === 'upload' && 'Tải lên file PDF để AI phân tích'}
                                    {step === 'processing' && 'Đang phân tích CV của bạn...'}
                                    {step === 'review' && 'Xem lại và chọn mục muốn cập nhật'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            aria-label="Đóng"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        {(['upload', 'processing', 'review'] as DialogStep[]).map((s, i) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${step === s ? 'text-violet-600' : sections.length > 0 && i < ['upload', 'processing', 'review'].indexOf(step) ? 'text-emerald-500' : 'text-slate-300'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-violet-600 text-white' : sections.length > 0 && i < ['upload', 'processing', 'review'].indexOf(step) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {sections.length > 0 && i < ['upload', 'processing', 'review'].indexOf(step) ? '✓' : i + 1}
                                    </div>
                                    <span className="hidden sm:inline">{s === 'upload' ? 'Tải lên' : s === 'processing' ? 'Phân tích' : 'Xác nhận'}</span>
                                </div>
                                {i < 2 && <div className={`flex-1 h-0.5 rounded ${i < ['upload', 'processing', 'review'].indexOf(step) ? 'bg-emerald-400' : 'bg-slate-100'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Upload */}
                        {step === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div
                                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragActive
                                        ? 'border-violet-400 bg-violet-50'
                                        : selectedFile
                                            ? 'border-emerald-300 bg-emerald-50/50'
                                            : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />

                                    {selectedFile ? (
                                        <div className="space-y-3">
                                            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 truncate max-w-[280px] mx-auto">{selectedFile.name}</p>
                                                <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                                className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
                                            >
                                                Chọn file khác
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="mx-auto w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                                                <Upload className="w-7 h-7 text-violet-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">Kéo thả file CV vào đây</p>
                                                <p className="text-xs text-slate-400 mt-1">hoặc bấm để chọn file • PDF • Tối đa 10MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Info box */}
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-start gap-2 text-xs text-slate-500">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                                        <div>
                                            <p className="font-semibold text-slate-600 mb-0.5">AI sẽ trích xuất thông tin từ CV</p>
                                            <p>Kinh nghiệm, học vấn, kỹ năng, chứng chỉ, dự án... sẽ được phân tích tự động. Bạn có thể xem lại trước khi cập nhật.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Processing */}
                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-col items-center justify-center py-12"
                            >
                                <div className="relative flex items-center justify-center w-20 h-20">
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Sparkles className="w-12 h-12 text-violet-600" />
                                    </motion.div>
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-[1.5px] border-violet-400/60"
                                        animate={{ scale: [0.6, 1.5], opacity: [1, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mt-6">Đang phân tích CV</h3>
                                <p className="text-sm text-slate-500 mt-1">AI đang đọc và trích xuất thông tin...</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                    <span className="text-xs text-slate-400">Có thể mất 15-30 giây</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Review */}
                        {step === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-3"
                            >
                                {sections.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                        <h3 className="text-base font-bold text-slate-900">Không tìm thấy thông tin</h3>
                                        <p className="text-sm text-slate-500 mt-1">CV có thể là ảnh scan hoặc không có đủ nội dung text.</p>
                                    </div>
                                ) : (
                                    sections.map((section) => {
                                        const Icon = section.icon;
                                        const isExpanded = expandedSection === section.key;

                                        return (
                                            <div
                                                key={section.key}
                                                className={`rounded-2xl border transition-all ${section.checked ? 'border-violet-200 bg-violet-50/30' : 'border-slate-100 bg-white opacity-60'}`}
                                            >
                                                {/* Section header */}
                                                <div className="flex items-center gap-3 p-4">
                                                    <button
                                                        onClick={() => toggleSection(section.key)}
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${section.checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}
                                                    >
                                                        {section.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </button>
                                                    <Icon className={`w-4 h-4 shrink-0 ${section.checked ? 'text-violet-500' : 'text-slate-400'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-semibold text-slate-800">{section.label}</span>
                                                        <span className="text-xs text-slate-400 ml-2">({section.count} mục)</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                                                        className="p-1 hover:bg-white rounded-lg transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                </div>

                                                {/* Expanded items */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4 space-y-2">
                                                                {section.key === 'personal' && section.items[0] && (
                                                                    <div className="text-xs space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                                                                        {section.items[0].full_name && <p><span className="font-semibold text-slate-600">Họ tên:</span> {section.items[0].full_name}</p>}
                                                                        {section.items[0].current_position && <p><span className="font-semibold text-slate-600">Vị trí:</span> {section.items[0].current_position}</p>}
                                                                        {section.items[0].email && <p><span className="font-semibold text-slate-600">Email:</span> {section.items[0].email}</p>}
                                                                        {section.items[0].phone && <p><span className="font-semibold text-slate-600">SĐT:</span> {section.items[0].phone}</p>}
                                                                        {section.items[0].bio && <p className="text-slate-500 line-clamp-2">{section.items[0].bio}</p>}
                                                                    </div>
                                                                )}
                                                                {section.key === 'experience' && section.items.map((exp: any, i: number) => (
                                                                    <div key={i} className="text-xs bg-white p-3 rounded-xl border border-slate-100">
                                                                        <p className="font-semibold text-slate-800">{exp.job_title || exp.position}</p>
                                                                        <p className="text-slate-500">{exp.company_name} {exp.start_date && `• ${exp.start_date}`}{exp.end_date ? ` → ${exp.end_date}` : exp.is_current ? ' → Hiện tại' : ''}</p>
                                                                    </div>
                                                                ))}
                                                                {section.key === 'education' && section.items.map((edu: any, i: number) => (
                                                                    <div key={i} className="text-xs bg-white p-3 rounded-xl border border-slate-100">
                                                                        <p className="font-semibold text-slate-800">{edu.school_name}</p>
                                                                        <p className="text-slate-500">{edu.degree} {edu.field_of_study && `— ${edu.field_of_study}`}</p>
                                                                    </div>
                                                                ))}
                                                                {section.key === 'skills' && (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {section.items.map((skill: any, i: number) => (
                                                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-xs font-medium text-slate-700">
                                                                                {skill.name}
                                                                                {skill.proficiency_level && <span className="ml-1 text-slate-400">• {skill.proficiency_level}</span>}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {section.key === 'certifications' && section.items.map((cert: any, i: number) => (
                                                                    <div key={i} className="text-xs bg-white p-3 rounded-xl border border-slate-100">
                                                                        <p className="font-semibold text-slate-800">{cert.name}</p>
                                                                        <p className="text-slate-500">{cert.issuing_organization}</p>
                                                                    </div>
                                                                ))}
                                                                {section.key === 'languages' && (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {section.items.map((lang: any, i: number) => (
                                                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-xs font-medium text-slate-700">
                                                                                {lang.name} <span className="ml-1 text-slate-400">• {lang.proficiency_level}</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {section.key === 'projects' && section.items.map((proj: any, i: number) => (
                                                                    <div key={i} className="text-xs bg-white p-3 rounded-xl border border-slate-100">
                                                                        <p className="font-semibold text-slate-800">{proj.name}</p>
                                                                        {proj.description && <p className="text-slate-500 line-clamp-2">{proj.description}</p>}
                                                                        {proj.technologies?.length > 0 && <p className="text-violet-500 mt-0.5">{proj.technologies.join(', ')}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-slate-100 shrink-0">
                    {step === 'upload' && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleUploadAndParse}
                                disabled={!selectedFile}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                            >
                                <FileUp className="w-4 h-4" />
                                Phân tích CV
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Huỷ bỏ
                        </button>
                    )}

                    {step === 'review' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setStep('upload');
                                    setSelectedFile(null);
                                    setParsedData(null);
                                    setSections([]);
                                }}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Tải CV khác
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={isApplying || sections.filter(s => s.checked).length === 0}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                            >
                                {isApplying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Cập nhật hồ sơ
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
