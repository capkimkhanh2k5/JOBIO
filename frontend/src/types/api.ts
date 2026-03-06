// ═══════════════════════════════════════════════════════════════════════════════
// Shared / Generic Types
// ═══════════════════════════════════════════════════════════════════════════════

/** DRF paginated response wrapper */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Auth / User
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'recruiter' | 'company' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'banned';

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
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  requires_2fa?: boolean;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
  confirm_password: string;
  role: 'recruiter' | 'company';
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
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
  category: { id: number; name: string };
  benefit_name: string;
  description: string | null;
  display_order: number;
}

export interface CompanyMedia {
  id: number;
  media_type: { id: number; type_name: string };
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
  is_required: boolean;
  proficiency_level: string | null;
  years_required: number | null;
}

export interface JobLocation {
  id: number;
  address: Address;
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
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationListItem {
  id: number;
  job: { id: number; title: string; company_name: string };
  recruiter: { id: number; full_name: string; avatar: string | null };
  cv: { id: number; file_name: string } | null;
  status: ApplicationStatus;
  rating: number | null;
  applied_at: string;
  created_at: string;
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
  recruiter_id?: number;
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
  job: { id: number; title: string; company_name: string; slug: string };
  folder_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface SavedJobUpdateRequest {
  folder_name?: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Candidate / Recruiter Profile
// ═══════════════════════════════════════════════════════════════════════════════

export type JobSearchStatus = 'actively_looking' | 'open' | 'not_looking';
export type Gender = 'male' | 'female' | 'other';

export interface RecruiterListItem {
  id: number;
  user: { id: number; email: string; full_name: string; avatar_url: string | null };
  current_position: string | null;
  current_company: CompanyBrief | null;
  years_of_experience: number | null;
  job_search_status: JobSearchStatus;
  profile_completeness_score: number;
}

export interface RecruiterDetail extends RecruiterListItem {
  date_of_birth: string | null;
  gender: Gender | null;
  address: Address | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  salary_currency: string | null;
  highest_education_level: string | null;
  is_profile_public: boolean;
  ai_assessment_result: Record<string, unknown> | null;
  skills: RecruiterSkill[];
  education: RecruiterEducation[];
  experience: RecruiterExperience[];
  certifications: RecruiterCertification[];
  languages: RecruiterLanguage[];
  projects: RecruiterProject[];
  created_at: string;
  updated_at: string;
}

export interface RecruiterUpdateRequest {
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

export interface RecruiterEducation {
  id: number;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  display_order: number;
}

export interface RecruiterEducationRequest {
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  display_order?: number;
}

// ─── Experience ──────────────────────────────────────────────────────────────

export interface RecruiterExperience {
  id: number;
  company_name: string;
  position: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  display_order: number;
}

export interface RecruiterExperienceRequest {
  company_name: string;
  position: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
  display_order?: number;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface RecruiterSkill {
  id: number;
  skill: Skill;
  proficiency_level: string | null;
  years_of_experience: number | null;
  endorsement_count: number;
}

export interface RecruiterSkillRequest {
  skill_id: number;
  proficiency_level?: string;
  years_of_experience?: number;
}

// ─── Certifications ──────────────────────────────────────────────────────────

export interface RecruiterCertification {
  id: number;
  certification_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  display_order: number;
}

export interface RecruiterCertificationRequest {
  certification_name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  display_order?: number;
}

// ─── Languages ───────────────────────────────────────────────────────────────

export type LanguageProficiency = 'basic' | 'conversational' | 'proficient' | 'fluent' | 'native';

export interface RecruiterLanguage {
  id: number;
  language: LanguageRef;
  proficiency_level: LanguageProficiency;
  is_native: boolean;
}

export interface RecruiterLanguageRequest {
  language_id: number;
  proficiency_level: LanguageProficiency;
  is_native?: boolean;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface RecruiterProject {
  id: number;
  project_name: string;
  description: string | null;
  project_url: string | null;
  start_date: string | null;
  end_date: string | null;
  technologies: string[];
  display_order: number;
}

export interface RecruiterProjectRequest {
  project_name: string;
  description?: string;
  project_url?: string;
  start_date?: string;
  end_date?: string;
  technologies?: string[];
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

export interface RecruiterCV {
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

export type InterviewStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type InterviewResult = 'pass' | 'fail' | 'pending';

export interface InterviewListItem {
  id: number;
  application: { id: number; job_title: string; recruiter_name: string };
  interview_type: { id: number; name: string };
  round_number: number;
  scheduled_at: string;
  duration_minutes: number;
  status: InterviewStatus;
  result: InterviewResult;
  created_at: string;
}

export interface InterviewDetail extends InterviewListItem {
  address: Address | null;
  meeting_link: string | null;
  notes: string | null;
  feedback: string | null;
  interviewers: User[];
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

export interface RecruiterBrief {
  id: number;
  full_name: string;
  avatar_url: string | null;
  current_position: string | null;
  current_company: string | null;
}

export interface Connection {
  id: number;
  requester: RecruiterBrief;
  recipient: RecruiterBrief;
  status: ConnectionStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionSuggestion {
  recruiter: RecruiterBrief;
  mutual_connections_count: number;
  common_skills: string[];
  score: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Messages
// ═══════════════════════════════════════════════════════════════════════════════

export interface MessageThread {
  id: number;
  subject: string;
  job: number | null;
  application: number | null;
  last_message: string | null;
  participant_count: number;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  thread_id: number;
  sender: { id: number; full_name: string; avatar_url: string | null };
  content: string;
  attachments: Record<string, unknown>[];
  is_system_message: boolean;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Social – Reviews, Followers, Connections
// ═══════════════════════════════════════════════════════════════════════════════

export interface Review {
  id: number;
  company: CompanyBrief;
  recruiter: { id: number; full_name: string; avatar_url: string | null } | null;
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
  recruiter: number;
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

export interface AdminStats {
  total_users: number;
  total_jobs: number;
  total_applications: number;
  total_companies: number;
  new_users?: number;
  new_jobs?: number;
  active_jobs?: number;
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI Matching
// ═══════════════════════════════════════════════════════════════════════════════

export interface MatchingScore {
  id: number;
  job: { id: number; title: string; slug: string; company_name: string };
  recruiter: { id: number; full_name: string; avatar_url: string | null };
  overall_score: number;
  skill_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  salary_match_score: number;
  calculated_at: string;
  is_valid: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Assessment
// ═══════════════════════════════════════════════════════════════════════════════

export interface AssessmentTest {
  id: number;
  title: string;
  slug: string;
  category: { id: number; name: string } | null;
  test_type: 'skill' | 'personality' | 'aptitude' | 'language' | 'technical';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  max_retakes: number;
  retake_wait_days: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
}

export interface AssessmentQuestion {
  id: number;
  test_id: number;
  question_type: 'multiple_choice' | 'text_input' | 'code_editor';
  points: number;
  question_data: Record<string, unknown>; // JSON structure based on type
}

export interface TestResult {
  id: number;
  assessment_test: { id: number; title: string; test_type: string; passing_score: number; difficulty_level: string };
  score: number;
  percentage_score: number;
  passed: boolean;
  time_taken_minutes: number;
  certificate_url: string | null;
  detailed_results: Record<string, unknown> | null;
  started_at: string;
  completed_at: string;
}

export interface JobRequiredTest {
  test_id: number;
  test_title: string;
  test_type: string;
  is_required: boolean;
  minimum_score: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Blog
// ═══════════════════════════════════════════════════════════════════════════════

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author: number;
  author_name: string;
  category: BlogCategory | null;
  tags: BlogTag[];
  summary: string | null;
  content: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Campaigns
// ═══════════════════════════════════════════════════════════════════════════════

export interface Campaign {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  budget: number | null;
  job_count: number;
  created_at: string;
}

export interface CampaignDetail extends Campaign {
  description: string | null;
  jobs: JobListItem[];
  updated_at: string;
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
  max_jobs: number;
  max_featured_jobs: number;
  max_cv_views: number;
  can_export_cv: boolean;
  has_ai_matching: boolean;
  has_priority_support: boolean;
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
  created_at: string;
  updated_at: string;
}

export interface BillingTransaction {
  id: string; // Transaction code
  subscription: number;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  vnpay_txn_ref?: string;
  payment_url?: string;
  description?: string;
  subscription_name?: string;
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
  payment_method: PaymentMethod;
}


