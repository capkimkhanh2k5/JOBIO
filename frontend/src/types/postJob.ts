// Shared types for the Post Job wizard, used across wizard step components

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SelectedSkill {
    skill_id: string;
    skill_name: string;
    is_required: boolean;
    proficiency_level: ProficiencyLevel;
    is_verified?: boolean;
    domain?: string;
    is_publishable?: boolean;
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

export interface JobPositionItem {
    id: string;
    title: string;
    category_id?: string;
    job_type?: JobType;
    is_remote?: boolean;
    level: JobLevel;
    quantity: number;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: SalaryCurrency;
    is_salary_visible?: boolean;
}

export interface PostJobFormData {
    title: string;
    is_multi_position: boolean;
    positions: JobPositionItem[];
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
}
