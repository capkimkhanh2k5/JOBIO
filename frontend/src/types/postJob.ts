// Shared types for the Post Job wizard, used across wizard step components

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SelectedSkill {
    skill_id: string;
    skill_name: string;
    is_required: boolean;
    proficiency_level: ProficiencyLevel;
}

export interface LocationRow {
    id: string;
    province_id: string;
    province_name: string;
    commune_id: string;
    commune_name: string;
    address_line: string;
    is_primary: boolean;
}

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type JobLevel = 'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead' | 'manager' | 'director';
export type SalaryCurrency = 'VND' | 'USD';

export interface PostJobFormData {
    title: string;
    category_id: string;
    job_type: JobType;
    level: JobLevel;
    quantity: number;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: SalaryCurrency;
    is_salary_visible: boolean;
    experience_min: number | null;
    experience_max: number | null;
    deadline: string;
    is_remote: boolean;
    description: string;
    requirements: string;
    benefits: string;
    skills: SelectedSkill[];
    locations: LocationRow[];
    seo_title: string;
    seo_description: string;
    seo_keywords: string[];
}
