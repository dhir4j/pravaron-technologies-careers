export type Role =
  | "candidate"
  | "super_admin"
  | "people_ops_admin"
  | "hiring_manager"
  | "technical_reviewer"
  | "read_only_reviewer";

export interface Profile {
  phone?: string;
  current_city?: string;
  state?: string;
  country?: string;
  preferred_work_location?: string;
  current_role?: string;
  total_experience_years?: number;
  current_company?: string;
  notice_period?: string;
  current_compensation?: string;
  expected_compensation?: string;
  skills?: string[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  personal_website_url?: string;
  metadata?: Record<string, unknown>;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_verified: boolean;
  profile?: Profile;
  created_at?: string;
}

export interface ApplicationQuestion {
  id?: string;
  label?: string;
  question?: string;
  type?: string;
  required?: boolean;
  options?: string[];
}

export interface JobContentSection {
  id: string;
  title: string;
  content: string;
}

export interface Job {
  id: string;
  public_code: string;
  title: string;
  slug: string;
  department?: string;
  employment_type: string;
  experience_level?: string;
  openings: number;
  location?: string;
  workplace_model: string;
  salary_display: string;
  min_salary?: number;
  max_salary?: number;
  currency?: string;
  role_summary: string;
  responsibilities?: string;
  required_skills: string[];
  preferred_skills: string[];
  education_preference?: string;
  experience_requirement?: string;
  content_sections: JobContentSection[];
  application_status_text?: string;
  application_questions: ApplicationQuestion[];
  application_deadline?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  version: number;
  scan_status: string;
  created_at: string;
}

export interface TimelineEvent {
  event_type: string;
  status?: string;
  previous_status?: string;
  new_status?: string;
  note?: string;
  visible_to_candidate?: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  job: Job;
  resume?: Resume;
  cover_message?: string;
  answers?: Record<string, unknown>;
  source?: string;
  candidate_status: string;
  internal_status?: string;
  withdrawn_at?: string;
  created_at: string;
  updated_at: string;
  candidate?: User;
  timeline?: TimelineEvent[];
  events?: TimelineEvent[];
  notes?: Array<{ id: string; author_id: string; body: string; created_at: string }>;
}

export interface Notification {
  id: string;
  application_id?: string;
  notification_type: string;
  subject: string;
  message: string;
  channel: string;
  delivery_status: string;
  read_at?: string;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  candidate_id: string;
  interviewer_id?: string;
  interview_type: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  meeting_mode: string;
  meeting_link?: string;
  physical_location?: string;
  candidate_instructions?: string;
  status: string;
}

export interface AdminMetrics {
  open_jobs: number;
  active_applications: number;
  new_applications_today: number;
  awaiting_review: number;
  shortlisted: number;
  interviews_scheduled: number;
  offers_released: number;
  hires_completed: number;
}
