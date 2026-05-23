// ═══════════════════════════════════════════════════════════════════════════════
// Shared / Generic Types
// ═══════════════════════════════════════════════════════════════════════════════

/** DRF paginated response wrapper */
export interface PaginatedResponse<T> {
  count: number;
  total_pages?: number;
  current_page?: number;
  page_size?: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Auth / User
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'candidate' | 'company' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type SocialProvider = '' | 'google' | 'facebook' | 'linkedin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  date_joined: string;
  last_login: string | null;
  social_provider?: SocialProvider;
  has_usable_password?: boolean;
  candidate_id?: number;
  company_id?: number;
  subscription_plan?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  requires_2fa?: boolean;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
  password_confirm: string;
  otp: string;
  role: 'candidate' | 'company';
  company_name?: string;
  tax_code?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ConfirmSetPasswordRequest {
  otp: string;
  new_password: string;
  new_password_confirm: string;
}

export interface TwoFactorStatus {
  is_enabled: boolean;
  secret?: string;
  qr_uri?: string;
}

export interface SocialAuthRequest {
  provider: string;
  access_token: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Geography
// ═══════════════════════════════════════════════════════════════════════════════

export interface Province {
  id: number;
  province_code: string;
  province_name: string;
  province_type: 'province' | 'municipality';
  region: 'north' | 'central' | 'south';
}

export interface Commune {
  id: number;
  commune_code: string;
  province: number;
  province_name?: string;
  commune_name: string;
  commune_type: 'commune' | 'ward' | 'township' | 'special_zone';
  commune_type_display?: string;
}

export interface Address {
  id: number;
  address_line: string;
  commune: number;
  province: number;
  province_name?: string;
  commune_name?: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Taxonomy (Industries, Job Categories, Skills)
// ═══════════════════════════════════════════════════════════════════════════════

export interface Industry {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  is_active: boolean;
  display_order: number;
  children?: Industry[];
}

export interface JobCategory {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  is_active: boolean;
  display_order: number;
  children?: JobCategory[];
}

export interface Skill {
  id: number;
  name: string;
  slug: string;
  category: number | null;
  is_verified: boolean;
  usage_count: number;
}

export interface LanguageRef {
  id: number;
  language_code: string;
  language_name: string;
  native_name: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Company
// ═══════════════════════════════════════════════════════════════════════════════

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface CompanyBrief {
  id: number;
  company_name: string;
  logo_url: string | null;
}

export interface CompanyListItem {
  id: number;
  company_name: string;
  slug: string;
  logo_url: string | null;
  industry: { id: number; name: string } | null;
  company_size: CompanySize;
  verification_status: VerificationStatus;
  follower_count: number;
  job_count: number;
}

export interface CompanyDetail extends CompanyListItem {
  user: number;
  description: string | null;
  banner_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  tax_code: string | null;
  address: Address | null;
  headquarters: string | null;
  founded_year: number | null;
  benefits: CompanyBenefit[];
  media: CompanyMedia[];
  created_at: string;
  updated_at: string;
}

export interface CompanyCreateRequest {
  company_name: string;
  tax_code?: string;
  company_size?: CompanySize;
  industry_id?: number;
  website?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  address_id?: number;
  founded_year?: number;
}

export type CompanyUpdateRequest = Partial<CompanyCreateRequest>;

export interface CompanyBenefit {
  id: number;
  category: number | { id: number; name: string };
  category_name?: string;
  category_icon?: string | null;
  benefit_name: string;
  description: string | null;
  display_order: number;
}

export interface CompanyMedia {
  id: number;
  media_type: number | { id: number; type_name: string };
  media_type_name?: string;
  media_url: string;
  thumbnail_url: string | null;
  title: string | null;
  caption: string | null;
  display_order: number;
}

export interface BenefitCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface MediaType {
  id: number;
  type_name: string;
  description: string | null;
  is_active: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Jobs
// ═══════════════════════════════════════════════════════════════════════════════

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type JobLevel = 'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead' | 'manager' | 'director' | 'c_level';
export type JobStatus = 'draft' | 'published' | 'closed' | 'expired';

export interface JobListItem {
  id: number;
  title: string;
  slug: string;
  company: CompanyBrief;
  category: { id: number; name: string } | null;
  job_type: JobType;
  level: JobLevel;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_negotiable: boolean;
  is_remote: boolean;
  application_deadline: string | null;
  status: JobStatus;
  view_count: number;
  application_count: number;
  featured: boolean;
  urgent: boolean;
  published_at: string | null;
  created_at: string;
}

export interface JobDetail extends JobListItem {
  description: string;
  requirements: string;
  benefits: string | null;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  address: Address | null;
  experience_years_min: number | null;
  experience_years_max: number | null;
  updated_at: string;
  skills: JobSkill[];
  locations: JobLocation[];
}

export interface JobSkill {
  id: number;
  skill: Skill;
  skill_id?: number;
  skill_name?: string;
  is_required: boolean;
  proficiency_level: string | null;
  years_required: number | null;
}

export interface JobLocation {
  id: number;
  address?: Address;
  address_id?: number;
  street?: string | null;
  province_name?: string | null;
  commune_name?: string | null;
  is_primary: boolean;
}

export interface JobCreateRequest {
  title: string;
  category_id: number;
  job_type: JobType;
  level: JobLevel;
  experience_years_min?: number | null;
  experience_years_max?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  salary_negotiable?: boolean;
  description: string;
  requirements: string;
  benefits?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  address_id?: number;
  is_remote?: boolean;
  application_deadline?: string;
  status?: JobStatus;
  skill_ids?: number[];
  location_ids?: number[];
}

export type JobUpdateRequest = Partial<JobCreateRequest>;

export interface JobFilters {
  search?: string;
  category_id?: number;
  province_id?: number;
  job_type?: string | string[];
  level?: string | string[];
  salary_min?: number;
  salary_max?: number;
  is_remote?: boolean;
  experience_min?: number;
  experience_max?: number;
  skills?: string[];
  company_id?: number;
  status?: JobStatus;
  featured?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Applications
// ═══════════════════════════════════════════════════════════════════════════════

export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationListItem {
  id: number;
  job_id?: number;
  job_title?: string;
  company_name?: string;
  company_logo?: string | null;
  candidate_id?: number;
  candidate_name?: string;
  candidate_email?: string;
  candidate_avatar?: string | null;
  recruiter_id?: number;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_avatar?: string | null;
  recruiter_phone?: string | null;
  job: { id: number; title: string; company_name: string } | null;
  candidate: { id: number; full_name: string; avatar: string | null } | null;
  cv: { id: number; file_name: string } | null;
  cv_url?: string | null;
  cv_name?: string | null;
  cv_id?: number | null;
  status: ApplicationStatus;
  rating: number | null;
  applied_at: string;
  created_at: string;
  updated_at?: string;
  ai_score?: number;
  match_score?: number;
  skills?: string[];
  position?: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  cover_letter: string | null;
  notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  updated_at: string;
  status_history: ApplicationStatusHistoryItem[];
}

export interface ApplicationCreateRequest {
  job_id: number;
  cv_id: number;
  cover_letter?: string;
}

export interface ApplicationUpdateRequest {
  status?: ApplicationStatus;
  rating?: number;
  notes?: string;
}

export interface ApplicationStatusHistoryItem {
  id: number;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by: number | null;
  notes: string | null;
  created_at: string;
}

export interface ApplicationFilters {
  status?: string | string[];
  job_id?: number;
  candidate_id?: number;
  rating_min?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  ai_score_min?: number;
  ai_score_max?: number;
  skills?: string[];
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Saved Jobs
// ═══════════════════════════════════════════════════════════════════════════════

export interface SavedJob {
  id: number;
  job?: { id: number; title: string; company_name: string; slug: string };
  job_id?: number;
  job_title?: string;
  job_slug?: string;
  company_id?: number | null;
  company_name?: string | null;
  company_slug?: string | null;
  logo_url?: string | null;
  job_type?: string | null;
  level?: string | null;
  status?: string | null;
  locations?: string | null;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  salary_currency?: string | null;
  salary_negotiable?: boolean;
  is_salary_visible?: boolean;
  deadline?: string | null;
  folder_name: string | null;
  notes: string | null;
  created_at: string;
  saved_at?: string;
}

export interface SavedJobUpdateRequest {
  folder_name?: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Candidate / Candidate Profile
// ═══════════════════════════════════════════════════════════════════════════════

export type JobSearchStatus = 'actively_looking' | 'open' | 'not_looking';
export type Gender = 'male' | 'female' | 'other';

export interface CandidateListItem {
  id: number;
  user: { id: number; email: string; full_name: string; avatar_url: string | null };
  current_position: string | null;
  current_company: CompanyBrief | null;
  years_of_experience: number | null;
  job_search_status: JobSearchStatus;
  profile_completeness_score: number;
}

export interface CandidateDetail extends CandidateListItem {
  date_of_birth: string | null;
  gender: Gender | null;
  address: Address | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  salary_currency: string | null;
  highest_education_level: string | null;
  is_profile_public: boolean;
  score: number;
  checklist: Array<{ task: string; completed: boolean }>;
  skills: CandidateSkill[];
  education: CandidateEducation[];
  experience: CandidateExperience[];
  certifications: CandidateCertification[];
  languages: CandidateLanguage[];
  projects: CandidateProject[];
  created_at: string;
  updated_at: string;
}

export interface CandidateUpdateRequest {
  current_position?: string;
  current_company_id?: number;
  date_of_birth?: string;
  gender?: Gender;
  address_id?: number;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  job_search_status?: JobSearchStatus;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  salary_currency?: string;
  highest_education_level?: string;
  is_profile_public?: boolean;
}

// ─── Education ───────────────────────────────────────────────────────────────

export interface CandidateEducation {
  id: number;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  gpa: number | null;
  description: string | null;
  display_order: number;
}

export interface CandidateEducationRequest {
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string | null;
  description?: string;
  display_order?: number;
}

export interface CandidateExperience {
  id: number;
  company_name: string;
  job_title: string;
  industry?: number;
  industry_id?: number;
  industry_name?: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  address?: number;
  address_id?: number;
  province_id?: number;
  province_name?: string;
  description: string | null;
  achievements?: string | null;
  display_order: number;
}

export interface CandidateExperienceRequest {
  company_name: string;
  job_title: string;
  industry_id?: number | null;
  province_id?: number | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  description?: string;
  achievements?: string;
  display_order?: number;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface CandidateSkill {
  id: number;
  skill: Skill;
  proficiency_level: string | null;
  years_of_experience: number | null;
  endorsement_count: number;
}

export interface CandidateSkillRequest {
  skill_id: number;
  proficiency_level?: string;
  years_of_experience?: number;
}

// ─── Certifications ──────────────────────────────────────────────────────────

export interface CandidateCertification {
  id: number;
  certification_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  does_not_expire: boolean;
  display_order: number;
}

export interface CandidateCertificationRequest {
  certification_name: string;
  issuing_organization?: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string;
  credential_url?: string;
  does_not_expire?: boolean;
  display_order?: number;
}

// ─── Languages ───────────────────────────────────────────────────────────────

export type LanguageProficiency = 'basic' | 'intermediate' | 'advanced' | 'fluent' | 'native';

export interface CandidateLanguage {
  id: number;
  language_id: number;
  language_code: string;
  language_name: string;
  proficiency_level: LanguageProficiency;
  is_native: boolean;
  created_at: string;
}

export interface CandidateLanguageRequest {
  language_id: number;
  proficiency_level: LanguageProficiency;
  is_native?: boolean;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface CandidateProject {
  id: number;
  project_name: string;
  description: string | null;
  project_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
  technologies_used: string;
  technologies?: string[] | string;
  display_order: number;
}

export interface CandidateProjectRequest {
  project_name: string;
  description?: string;
  project_url?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_ongoing?: boolean;
  technologies_used?: string;
  display_order?: number;
}

// ─── Recommendations ───────────────────────────────────────────────────────────

export interface Recommendation {
  id: number;
  recommender: {
    id: number;
    full_name: string;
    avatar_url: string | null;
    current_position?: string | null;
    current_company?: string | null;
  };
  relationship: string;
  content: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecommendationCreateRequest {
  relationship: string;
  content: string;
}

export interface RecommendationUpdateRequest {
  relationship?: string;
  content?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CV / Resume
// ═══════════════════════════════════════════════════════════════════════════════

export type CVPrivacy = 'public' | 'private' | 'link_only';

export interface CandidateCV {
  id: number;
  template: number | null;
  cv_name: string;
  cv_data: Record<string, unknown> | null;
  file_url: string | null;
  is_default: boolean;
  privacy: CVPrivacy;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface CVCreateRequest {
  template_id?: number;
  cv_name: string;
  cv_data?: Record<string, unknown>;
}

export interface CVUpdateRequest {
  cv_name?: string;
  cv_data?: Record<string, unknown>;
  template_id?: number;
}

export interface CVTemplate {
  id: number;
  name: string;
  slug: string;
  category: { id: number; name: string } | null;
  description: string | null;
  thumbnail: string | null;
  preview_image: string | null;
  is_premium: boolean;
  is_active: boolean;
  usage_count: number;
  display_order: number;
}

export interface CVTemplateCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Job Alerts
// ═══════════════════════════════════════════════════════════════════════════════

export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export interface JobAlert {
  id: number;
  alert_name: string;
  keywords: string | null;
  category: number | null;
  locations_detail: Province[];
  location_ids: number[];
  skills_detail: Skill[];
  skill_ids: number[];
  job_type: JobType | null;
  level: JobLevel | null;
  salary_min: number | null;
  frequency: AlertFrequency;
  email_notification: boolean;
  use_ai_matching: boolean;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobAlertCreateRequest {
  alert_name: string;
  keywords?: string;
  category?: number;
  location_ids?: number[];
  skill_ids?: number[];
  job_type?: JobType;
  level?: JobLevel;
  salary_min?: number;
  frequency?: AlertFrequency;
  email_notification?: boolean;
  use_ai_matching?: boolean;
}

export type JobAlertUpdateRequest = Partial<JobAlertCreateRequest> & {
  is_active?: boolean;
};

export interface JobAlertMatch {
  id: number;
  job: number;
  job_detail: JobListItem;
  is_sent: boolean;
  is_viewed: boolean;
  matched_at: string;
  score: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Interviews
// ═══════════════════════════════════════════════════════════════════════════════

export type InterviewStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show' | 'no-show';
export type InterviewResult = 'pass' | 'fail' | 'pending';
export type InterviewMode = 'video' | 'phone' | 'onsite';

export interface InterviewListItem {
  id: number;
  application_id: number;
  job_id?: number;
  job_title: string;
  company_id?: number;
  company_name?: string;
  company_slug?: string | null;
  company_logo?: string | null;
  applicant_name: string;
  applicant_avatar?: string | null;
  interview_type_id?: number;
  interview_type_name: string;
  interview_type?: InterviewType | null;
  round_number: number;
  scheduled_at: string;
  duration_minutes: number;
  address_id?: number | null;
  address?: Address | null;
  location?: string | null;
  meeting_link?: string | null;
  status: InterviewStatus;
  result: InterviewResult;
  rating?: number | null;
  notes?: string | null;
  interviewer?: number | null;
  interviewer_name?: string | null;
  interviewer_avatar?: string | null;
  interviewers?: Array<{ id: number; name: string; avatar?: string | null }>;
  // Legacy fields from previous type iterations (kept for fallback)
  application?: any;
  created_at?: string;
  type?: InterviewMode | string;
  candidate_name?: string;
  candidate_avatar?: string | null;
  duration?: number;
}

export interface InterviewDetail extends InterviewListItem {
  meeting_link: string | null;
  notes: string | null;
  feedback: string | null;
  updated_at: string;
}

export interface InterviewType {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: number;
  notification_type: number;
  notification_type_name: string;
  title: string;
  content: string;
  link: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  job_alerts: boolean;
  application_updates: boolean;
  message_notifications: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Connections & Networking
// ═══════════════════════════════════════════════════════════════════════════════

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface CandidateBrief {
  id: number;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  job_search_status: string;
}

export interface Connection {
  id: number;
  requester: CandidateBrief;
  receiver: CandidateBrief;
  status: ConnectionStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionSuggestion {
  candidate: CandidateBrief;
  mutual_connections: number;
  common_skills: string[];
  score: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Social – Reviews, Followers, Connections
// ═══════════════════════════════════════════════════════════════════════════════

export interface Review {
  id: number;
  company: CompanyBrief;
  candidate: { id: number; full_name: string; avatar_url: string | null } | null;
  rating: number;
  title: string;
  content: string;
  pros: string | null;
  cons: string | null;
  work_environment_rating: number | null;
  salary_benefits_rating: number | null;
  management_rating: number | null;
  career_development_rating: number | null;
  employment_status: 'current' | 'former' | 'intern';
  position: string | null;
  employment_duration: string | null;
  is_verified: boolean;
  is_anonymous: boolean;
  helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CompanyFollower {
  id: number;
  company: number;
  company_detail: CompanyBrief;
  candidate: number;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Billing
// ═══════════════════════════════════════════════════════════════════════════════

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  duration_days: number;
  features: Record<string, unknown>;
  is_active: boolean;
}

export interface CompanySubscription {
  id: number;
  company: number;
  plan: SubscriptionPlan;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  auto_renew: boolean;
}

export interface Transaction {
  id: string; // Transaction code
  amount: number | string;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: string;
  description: string;
  vnpay_transaction_no?: string;
  subscription_id?: number;
  subscription_name?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'e_wallet';
  provider: string; // e.g., 'Visa', 'Mastercard', 'MoMo', 'VNPay'
  last4?: string;
  expiry?: string;
  is_default: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard / Analytics
// ═══════════════════════════════════════════════════════════════════════════════

export interface AdminOverviewStats {
  users: {
    total: number;
    new_30d: number;
    by_role: {
      candidate: number;
      company: number;
    };
  };
  jobs: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
    new_30d: number;
    pending: number;
    accepted: number;
  };
  interviews: {
    total: number;
    scheduled: number;
    completed: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
  reports: {
    total: number;
    pending: number;
  };
  companies: {
    total: number;
    pending_verification: number;
  };
}

export interface UserGrowthData {
  month: string;
  users: number;
  jobs: number;
}

export interface IndustryDistributionData {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface RevenueTrendData {
  day: string;
  revenue: number;
}

export interface ViolationBreakdownData {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface TopJobAnalytics {
  id: number;
  title: string;
  company: string;
  status: string;
  views: number;
  saves: number;
  applications: number;
}

export interface CompanyStats {
  active_jobs: number;
  total_applications: number;
  new_applications: number;
  job_views: number;
  active_jobs_delta?: number;
  new_applications_delta?: number;
  job_views_delta?: number;
  upcoming_interviews?: number;
  upcoming_interviews_delta?: number;
  jobs?: {
    total: number;
    published: number;
    draft: number;
    closed: number;
  };
  applications?: {
    total: number;
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// Blog
// ═══════════════════════════════════════════════════════════════════════════════

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  post_count: number;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  post_count: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author: number;
  author_name: string;
  author_avatar?: string | null;
  category: BlogCategory | null;
  tags: BlogTag[];
  summary: string | null;
  content: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  published_at: string | null;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// System Settings & Logs
// ═══════════════════════════════════════════════════════════════════════════════

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'integer' | 'boolean' | 'json';
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogType {
  id: number;
  type_name: string;
  description: string;
}

export interface ActivityLog {
  id: number;
  user: { id: number; full_name: string; email: string; avatar_url: string | null } | null;
  action: string;
  log_type: ActivityLogType | null;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// File Upload
// ═══════════════════════════════════════════════════════════════════════════════

export interface FileUpload {
  id: number;
  file_name: string;
  original_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  entity_type: string | null;
  entity_id: number | null;
  is_public: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Billing & Subscription
// ═══════════════════════════════════════════════════════════════════════════════

export type PlanType = 'free' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  plan_type: PlanType;
  price: number;
  duration_days: number;
  description: string | null;
  features: PlanFeatures;
  is_active: boolean;
  display_order: number;
}

export interface PlanFeatures {
  job_post_limit?: number;
  featured_job_limit?: number;
  cv_view_limit?: number;
  top_job?: boolean;
  mass_email?: boolean;
  priority_support?: boolean;
  employer_branding?: boolean;
  max_jobs?: number;
  max_featured_jobs?: number;
  max_cv_views?: number;
  can_export_cv?: boolean;
  has_ai_matching?: boolean;
  has_priority_support?: boolean;
}

export interface BillingSubscription {
  id: number;
  company: number;
  plan: BillingPlan;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  usage?: {
    jobs: { current: number; limit: number };
    featured_jobs: { current: number; limit: number };
    cv_views: { current: number; limit: number };
    ai_matching: { enabled: boolean };
  };
  created_at: string;
  updated_at: string;
}

export interface BillingTransaction {
  id: string;
  reference_code: string;
  subscription: number;
  amount: number;
  currency: string;
  payment_method: { id: number; name: string; code: string } | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  vnpay_txn_ref?: string;
  payment_url?: string;
  description?: string;
  clean_description?: string;
  plan_name?: string;
  subscription_name?: string;
  metadata?: Record<string, unknown>;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'e_wallet';
  provider: string;
  last4?: string;
  expiry?: string;
  is_default: boolean;
  created_at: string;
}

export interface SubscriptionCreateRequest {
  plan_id: number;
  payment_method_code?: string;
  payment_method?: string;
}

export interface SubscriptionPreCheckResponse {
  can_checkout: boolean;
  mode: 'new' | 'renew' | 'blocked' | 'pending_reuse';
  message: string;
  code?: string;
  plan: {
    id: number;
    name: string;
    slug: string;
    duration_days: number;
    price: string;
  };
  current_subscription: null | {
    id: number;
    plan_id: number;
    plan_name: string;
    status: string;
    end_date: string;
  };
  pending_transaction: null | {
    id: number;
    reference_code: string;
    created_at: string;
  };
}

export interface SubscribeResponse {
  payment_url: string;
  transaction_ref: string;
}
