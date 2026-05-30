import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CheckCircle2, AlertCircle, Loader2, Sparkles,
    User, GraduationCap, Briefcase, Zap, Award, Languages, FolderGit2, Upload
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '@/services/candidateService';
import { cvService } from '@/services/cvService';

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

const cleanUrl = (value: unknown) => {
    const text = cleanText(value);
    if (!text) return '';
    if (/^https?:\/\//i.test(text)) return text;
    if (/^(linkedin\.com|github\.com|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(text)) {
        return `https://${text}`;
    }
    return text;
};

const hasParsedLinks = (data: any) =>
    Boolean(cleanUrl(data?.links?.linkedin) || cleanUrl(data?.links?.github) || cleanUrl(data?.links?.portfolio));

const getParsedProvince = (location: any) =>
    cleanText(location?.province) || cleanText(location?.city);

const normalizeNameKey = (value: unknown) =>
    cleanText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const LANGUAGE_ALIASES: Record<string, string> = {
    vietnamese: 'vi',
    'tieng viet': 'vi',
    'viet nam': 'vi',
    english: 'en',
    'tieng anh': 'en',
    japanese: 'ja',
    'tieng nhat': 'ja',
    korean: 'ko',
    'tieng han': 'ko',
    chinese: 'zh',
    'tieng trung': 'zh',
    french: 'fr',
    'tieng phap': 'fr',
    german: 'de',
    'tieng duc': 'de',
};

const getLanguageKey = (value: unknown) => {
    const key = normalizeNameKey(value);
    return LANGUAGE_ALIASES[key] || key;
};

const getErrorDetail = (error: unknown) => {
    const data = (error as any)?.response?.data;
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data.detail === 'string') return data.detail;
    return JSON.stringify(data);
};

const isDuplicateError = (error: unknown) => {
    const detail = getErrorDetail(error);
    const normalized = normalizeNameKey(detail);
    return normalized.includes('da duoc them') || normalized.includes('already') || normalized.includes('duplicate');
};

// ─── Component ──────────────────────────────────────────────────────────────

export const CVAutoFillDialog = ({ open, onOpenChange, candidateId }: CVAutoFillDialogProps) => {
    const queryClient = useQueryClient();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<DialogStep>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [sections, setSections] = useState<ParsedSection[]>([]);
    const [isApplying, setIsApplying] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    // ─── Parse mutation ─────────────────────────────────────────────────

    const parseMutation = useMutation({
        mutationFn: (file: File) => candidateService.parseCVForProfile(candidateId, file).then(r => r.data),
        onSuccess: (data) => {
            setParsedData(data);
            buildSections(data);
            setStep('review');
            toast.success('Phân tích CV thành công.');
        },
        onError: () => {
            toast.error('File CV không hợp lệ.');
            setStep('upload');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
    });

    // ─── Build sections from parsed data ────────────────────────────────

    const buildSections = (data: any) => {
        const result: ParsedSection[] = [];

        const hasPersonalData = Boolean(
            data?.personal?.full_name ||
            data?.personal?.current_position ||
            data?.personal?.bio ||
            getParsedProvince(data?.location) ||
            cleanText(data?.location?.address_line) ||
            hasParsedLinks(data)
        );

        if (data?.personal && hasPersonalData) {
            result.push({
                key: 'personal',
                label: 'Thông tin cá nhân',
                icon: User,
                count: Object.values(data.personal).filter((v: any) => v && v !== '').length
                    + (getParsedProvince(data.location) ? 1 : 0)
                    + (cleanText(data.location?.address_line) ? 1 : 0)
                    + Object.values(data.links || {}).filter((v: any) => cleanUrl(v)).length,
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
            toast.error('File CV không hợp lệ.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File CV không hợp lệ.');
            return;
        }
        setSelectedFile(file);
        setParsedData(null);
        setSections([]);
        setStep('processing');
        parseMutation.mutate(file);
    }, [parseMutation]);

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
        let skippedCount = 0;
        let cvSaved = false;
        let cvSaveError = false;

        try {
            const existingSkillKeys = new Set<string>();
            const existingLanguageKeys = new Set<string>();
            const skillsSection = selectedSections.find(s => s.key === 'skills');
            const languagesSection = selectedSections.find(s => s.key === 'languages');

            await Promise.all([
                skillsSection
                    ? candidateService.listSkills(candidateId)
                        .then(response => {
                            response.data.forEach(skill => {
                                const key = normalizeNameKey(skill.skill_name);
                                if (key) existingSkillKeys.add(key);
                            });
                        })
                        .catch(() => undefined)
                    : Promise.resolve(),
                languagesSection
                    ? candidateService.listLanguages(candidateId)
                        .then(response => {
                            response.data.forEach(language => {
                                const key = getLanguageKey(language.language_name);
                                if (key) existingLanguageKeys.add(key);
                            });
                        })
                        .catch(() => undefined)
                    : Promise.resolve(),
            ]);

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
                    const linkedinUrl = cleanUrl(parsedData.links?.linkedin);
                    const githubUrl = cleanUrl(parsedData.links?.github);
                    const portfolioUrl = cleanUrl(parsedData.links?.portfolio);
                    if (linkedinUrl) updateData.linkedin_url = linkedinUrl;
                    if (githubUrl) updateData.github_url = githubUrl;
                    if (portfolioUrl) updateData.portfolio_url = portfolioUrl;

                    // Address / Location
                    const province = getParsedProvince(parsedData.location);
                    const commune = cleanText(parsedData.location?.commune);
                    const addressLine = cleanText(parsedData.location?.address_line);
                    if (province || addressLine) {
                        updateData.address = {
                            province,
                            commune,
                            address_line: addressLine,
                        };
                    }

                    if (Object.keys(updateData).length > 0) {
                        const response = await candidateService.update(candidateId, updateData);
                        queryClient.setQueriesData({ queryKey: ['profile'] }, (current: any) => (
                            current ? { ...current, ...response.data } : response.data
                        ));
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
            if (skillsSection && parsedData.skills?.length > 0) {
                for (const skill of parsedData.skills) {
                    const skillName = cleanText(skill.name);
                    if (!skillName) continue;

                    const skillKey = normalizeNameKey(skillName);
                    if (skillKey && existingSkillKeys.has(skillKey)) {
                        skippedCount++;
                        continue;
                    }

                    try {
                        await candidateService.addSkill(candidateId, {
                            skill_name: skillName,
                            proficiency_level: skill.proficiency_level || 'intermediate',
                            years_of_experience: skill.years_of_experience || 0,
                        });
                        if (skillKey) existingSkillKeys.add(skillKey);
                        successCount++;
                    } catch (error) {
                        if (isDuplicateError(error)) {
                            if (skillKey) existingSkillKeys.add(skillKey);
                            skippedCount++;
                        } else {
                            errorCount++;
                        }
                    }
                }
            }

            // 7. Add languages
            if (languagesSection && parsedData.languages?.length > 0) {
                for (const lang of parsedData.languages) {
                    const languageName = cleanText(lang.name);
                    if (!languageName) continue;

                    const languageKey = getLanguageKey(languageName);
                    if (languageKey && existingLanguageKeys.has(languageKey)) {
                        skippedCount++;
                        continue;
                    }

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
                        if (languageKey) existingLanguageKeys.add(languageKey);
                        successCount++;
                    } catch (error) {
                        if (isDuplicateError(error)) {
                            if (languageKey) existingLanguageKeys.add(languageKey);
                            skippedCount++;
                        } else {
                            errorCount++;
                        }
                    }
                }
            }

            if (selectedFile) {
                try {
                    const cvName = selectedFile.name.replace(/\.pdf$/i, '') || 'Uploaded CV';
                    const savedCv = await cvService.uploadPdfFile(candidateId, selectedFile, cvName);
                    if (savedCv.data?.id) {
                        await cvService.update(candidateId, savedCv.data.id, { cv_data: parsedData });
                    }
                    cvSaved = true;
                } catch {
                    cvSaveError = true;
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
                queryClient.invalidateQueries({ queryKey: ['candidate', 'cvs', candidateId] }),
            ]);

            const skippedMessage = skippedCount > 0 ? ` Bỏ qua ${skippedCount} mục đã có.` : '';

            if (successCount === 0 && errorCount === 0 && !cvSaved) {
                toast.warning(`Không có dữ liệu mới hợp lệ để cập nhật từ CV.${skippedMessage}`);
            } else if (errorCount === 0 && !cvSaveError) {
                toast.success(`Đã cập nhật ${successCount} mục thành công từ CV${cvSaved ? ' và lưu CV vào hồ sơ!' : '!'}${skippedMessage}`);
            } else {
                toast.warning(`Đã cập nhật ${successCount} mục. ${errorCount} mục bị lỗi.${skippedMessage}${cvSaveError ? ' Lưu file CV thất bại.' : ''}`);
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
        onOpenChange(false);
    };

    if (!open || typeof document === 'undefined') return null;

    // ─── Render ─────────────────────────────────────────────────────────

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.1, 0.9, 0.2, 1] }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[88dvh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-violet-600" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Hoàn thiện hồ sơ bằng CV</h2>
                                <p className="text-xs text-slate-500">
                                    {step === 'upload' && 'Chọn hoặc kéo thả file PDF để AI tự phân tích'}
                                    {step === 'processing' && 'Đang phân tích CV của bạn...'}
                                    {step === 'review' && 'Phân tích thành công, hãy kiểm tra trước khi cập nhật'}
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

                                    <div className="space-y-3">
                                        <div className="mx-auto w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                                            <Upload className="w-7 h-7 text-violet-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Kéo thả file CV vào đây</p>
                                            <p className="text-xs text-slate-400 mt-1">hoặc bấm để chọn file • PDF • Tối đa 10MB</p>
                                        </div>
                                    </div>
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

                        {/* Step 3: Success */}
                        {step === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Phân tích CV thành công</h3>
                                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                                    AI có thể sai sót, hãy kiểm tra lại hồ sơ sau khi cập nhật.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-slate-100 shrink-0">
                    {step === 'upload' && (
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Huỷ
                        </button>
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
                        <button
                            onClick={handleApply}
                            disabled={isApplying || sections.filter(s => s.checked).length === 0}
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                        >
                            {isApplying ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang cập nhật...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Đồng ý
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
