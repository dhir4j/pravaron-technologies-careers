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

export interface EmailApplicationAttachment {
  resume_id?: string;
  filename: string;
  content_type?: string;
  size_bytes?: number;
}

export interface EmailApplicationInfo {
  message_id: string;
  subject: string;
  from_name?: string;
  from_email?: string;
  sent_at?: string;
  imap_uid?: string;
  attachments?: EmailApplicationAttachment[];
}

export interface ApplicantDetail {
  id: string;
  application_id: string;
  candidate_id: string;
  resume_id?: string;
  source?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  current_city?: string;
  current_role?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  email_subject?: string;
  email_message_id?: string;
  email_sent_at?: string;
  resume_filename?: string;
  resume_content_type?: string;
  resume_size_bytes?: number;
  resume_text?: string | null;
  resume_text_length?: number;
  parsed_fields?: Record<string, unknown>;
  extraction_status: string;
  extraction_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateAnalysis {
  id: string;
  application_id: string;
  applicant_detail_id?: string;
  candidate_id: string;
  resume_id?: string;
  job_id: string;
  model: string;
  status: string;
  suitability_score?: number;
  confidence_score?: number;
  recommendation?: string;
  graduation_year?: number;
  recommended_track?: string;
  location_priority?: string;
  detected_location?: string;
  job_family?: string;
  headline?: string;
  summary?: string;
  experience_summary?: string;
  education_summary?: string;
  projects_summary?: string;
  skills?: string[];
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  strengths?: string[];
  concerns?: string[];
  project_highlights?: Array<{ name?: string; description?: string; technologies?: string[] }>;
  job_fit?: {
    matched_requirements?: string[];
    missing_or_unclear_requirements?: string[];
    fit_reasoning?: string;
    ai_suggested_suitability_score?: number;
    score_breakdown?: Record<string, { score?: number; max?: number; matched?: string[]; missing?: string[]; reasons?: string[]; priority?: string; detected_location?: string; years_detected?: number; has_project_section?: boolean }>;
  };
  interview_questions?: string[];
  usage?: Record<string, unknown>;
  error?: string;
  analyzed_at?: string;
  created_at?: string;
  updated_at?: string;
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
  email?: EmailApplicationInfo | null;
  applicant_detail?: ApplicantDetail | null;
  candidate_analysis?: CandidateAnalysis | null;
}

export interface ApplicationGroupMember {
  id: string;
  group_id: string;
  application_id: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  application_status?: string;
  added_by_id: string;
  created_at: string;
}

export interface ApplicationGroupEmail {
  id: string;
  group_id?: string;
  application_id?: string;
  candidate_id?: string;
  to_email: string;
  subject: string;
  purpose?: string;
  status_to_apply?: string;
  delivery_status: string;
  failure_reason?: string;
  sent_at?: string;
  created_at: string;
}

export interface ApplicationGroup {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_by_id: string;
  member_count: number;
  members?: ApplicationGroupMember[];
  emails?: ApplicationGroupEmail[];
  created_at: string;
  updated_at: string;
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

// Phase 1 completion
export interface InterviewFeedback {
  id: string;
  interview_id: string;
  reviewer_id: string;
  technical_score?: number;
  communication_score?: number;
  problem_solving_score?: number;
  cultural_fit_score?: number;
  overall_recommendation?: "Hire" | "Consider" | "Reject";
  strengths?: string;
  concerns?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OfferLetter {
  id: string;
  application_id: string;
  created_by_id: string;
  role_title: string;
  department?: string;
  joining_date?: string;
  compensation_details?: string;
  additional_terms?: string;
  status: "draft" | "sent" | "accepted" | "declined";
  sent_at?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

// Phase 2
export interface InconsistencyFlagItem {
  field: string;
  expected: string;
  found: string;
  severity: "low" | "medium" | "high";
  explanation: string;
}

export interface InconsistencyFlag {
  id: string;
  application_id: string;
  flags: InconsistencyFlagItem[];
  reviewed: boolean;
  reviewer_note?: string;
  detected_at: string;
  created_at: string;
}

// Phase 3 Ã¢â‚¬â€ Assessment Platform
export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_type: "mcq" | "multi_select" | "text" | "code" | "file_upload";
  content: string;
  options: string[];
  correct_answer?: unknown;
  explanation?: string;
  marks: number;
  order: number;
  time_limit_seconds?: number;
  code_template?: string;
  code_language?: string;
  created_at: string;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  assessment_type: "aptitude" | "technical" | "coding" | "assignment";
  job_id?: string;
  time_limit_minutes: number;
  max_attempts: number;
  pass_score: number;
  randomize_questions: boolean;
  instructions?: string;
  status: "draft" | "active" | "archived";
  created_by_id: string;
  question_count: number;
  total_marks: number;
  questions?: AssessmentQuestion[];
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  response?: unknown;
  is_correct?: boolean;
  auto_marks?: number;
  time_taken_seconds?: number;
  manual_marks?: number;
  reviewer_comment?: string;
  reviewed_by_id?: string;
  question?: AssessmentQuestion;
  created_at: string;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  application_id: string;
  candidate_id: string;
  status: "not_started" | "in_progress" | "submitted" | "timed_out" | "graded";
  started_at?: string;
  submitted_at?: string;
  expires_at?: string;
  auto_score?: number;
  max_auto_score?: number;
  manual_score?: number;
  final_score?: number;
  percentage?: number;
  is_passed?: boolean;
  graded_by_id?: string;
  graded_at?: string;
  grader_notes?: string;
  assessment?: Assessment;
  responses?: AssessmentResponse[];
  created_at: string;
  updated_at: string;
}

// Phase 4 Ã¢â‚¬â€ Proctoring
export interface ProctoringEvent {
  id: string;
  session_id: string;
  event_type: string;
  severity: "low" | "medium" | "high";
  description?: string;
  metadata?: Record<string, unknown>;
  reviewed: boolean;
  reviewer_note?: string;
  occurred_at: string;
}

export interface ProctoringSession {
  id: string;
  attempt_id: string;
  fullscreen_exits: number;
  tab_switches: number;
  focus_losses: number;
  copy_paste_events: number;
  face_not_detected_count: number;
  multiple_faces_count: number;
  mobile_detected_count: number;
  suspicious_total: number;
  device_info?: Record<string, unknown>;
  ip_address?: string;
  started_at?: string;
  ended_at?: string;
  events?: ProctoringEvent[];
  created_at: string;
}

// Phase 5 Ã¢â‚¬â€ AI Interview
export interface AIInterviewQuestionTemplate {
  id: string;
  job_id: string;
  job_title?: string;
  mode: "mcq" | "code";
  category: "aptitude" | "gk" | "technical" | string;
  content: string;
  options: string[];
  correct_answer?: string;
  marks: number;
  difficulty: string;
  is_active: boolean;
  order: number;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
}
export interface AIInterviewResponse {
  id: string;
  interview_id: string;
  question_id: string;
  response_text?: string;
  is_correct?: boolean;
  response_duration_seconds?: number;
  submitted_at: string;
  ai_quality_notes?: Record<string, unknown>;
}

export interface AIInterviewQuestion {
  id: string;
  interview_id: string;
  order: number;
  question_type: "aptitude" | "gk" | "technical" | "opening" | "behavioral" | "situational" | "followup" | "closing";
  category?: "aptitude" | "gk" | "technical" | string;
  content: string;
  context?: string;
  options?: string[];
  choices?: string[];
  correct_answer?: string;
  marks?: number;
  asked_at?: string;
  response?: AIInterviewResponse;
}

export interface AIInterview {
  id: string;
  application_id: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  status: "scheduled" | "identity_verified" | "in_progress" | "completed" | "reviewed";
  invitation_sent_at?: string;
  started_at?: string;
  completed_at?: string;
  total_duration_seconds?: number;
  mcq_config?: { total_questions?: number; time_limit_minutes?: number; composition?: Record<string, number>; role_family?: string };
  proctoring_summary?: Record<string, number>;
  security_events?: Array<{ id: string; event_type: string; severity: "low" | "medium" | "high"; description: string; metadata?: Record<string, unknown>; occurred_at: string }>;
  admin_messages?: Array<{ id: string; sender_id: string; sender_name: string; message: string; created_at: string }>;
  latest_frame_at?: string;
  latest_frame_data_url?: string;
  recording_available?: boolean;
  ai_summary?: {
    overall?: string;
    recommendation_rationale?: string;
    strengths?: string[];
    concerns?: string[];
    score_breakdown?: Record<string, { correct: number; total: number }>;
    proctoring_summary?: Record<string, number>;
    security_penalty?: number;
    completion_rate?: number;
    raw_percentage?: number;
    final_percentage?: number;
  };
  ai_scores?: {
    aptitude?: number;
    gk?: number;
    technical?: number;
    overall?: number;
    raw_overall?: number;
    security?: number;
    score_out_of_100?: number;
    security_penalty?: number;
    completion_rate?: number;
    communication?: number;
    problem_solving?: number;
    cultural_fit?: number;
  };
  reviewed_by_id?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  recommendation?: "Proceed" | "Hold" | "Reject";
  question_count: number;
  questions?: AIInterviewQuestion[];
  created_at: string;
  updated_at: string;
}
