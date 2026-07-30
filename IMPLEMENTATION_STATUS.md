# Pravaron Careers — Implementation Status

_Last updated: 2026-07-24_

---

## Summary

| Phase | Description | Status | Completion |
|-------|-------------|--------|------------|
| Phase 1 | Core ATS (Jobs, Applications, Pipeline, Auth) | ✅ Complete | ~95% |
| Phase 2 | Enhanced AI & Candidate Search | ✅ Complete | ~90% |
| Phase 3 | Online Assessment Platform | ✅ Complete | ~85% |
| Phase 4 | AI Proctoring & Secure Assessments | ✅ Complete | ~80% |
| Phase 5 | AI-Assisted First-Round Interviews | ✅ Complete | ~85% |

---

## Phase 1 — Core ATS

### ✅ Implemented
- **Authentication**: Register, login, JWT HttpOnly cookies, email verification, password reset
- **Job Management**: CRUD for job listings, slugs, application deadline, published/draft/closed states
- **Application Pipeline**: Kanban-style status tracking (Applied → Shortlisted → Interview → Offer → Hired)
- **Candidate Portal**: Apply for jobs, view application status, timeline events
- **Admin Portal**: Review applications, change status, add notes, download resumes
- **Application Detail (Admin)**: AI analysis (DeepSeek), timeline, notes, scoring, offer letter, assessment assignment, AI interview quick-link
- **Reviewer Dashboard**: Assignable reviewer role, filtered view of assigned applications
- **Notifications**: In-app + email for application submitted, status change, interview scheduled
- **Email Service**: SMTP (Gmail), HTML templates for all core events
- **Offer Letters**: Create, edit, send (admin side); model stores status, compensation, joining date
- **Inconsistency Detection**: DeepSeek compares resume fields vs application answers, flags discrepancies
- **Interview Scheduling (traditional)**: Date/time, mode (video/in-person), meeting link, candidate instructions
- **Interview Feedback**: Structured scores (technical, communication, problem-solving, cultural fit), recommendation

### ⚠️ Pending / Partial
- **Full-text resume search** - backend route exists but frontend search uses basic field filters only
- **Notification preferences** - implemented for status, interview, offer, and digest settings; backend now respects email opt-outs
- **Full-text resume search** - backend route exists but frontend search uses basic field filters only

---

## Phase 2 — Enhanced AI & Search

### ✅ Implemented
- **Candidate Directory** (`/admin/candidates`) — browse all registered candidates with profiles
- **Advanced Search** (`/admin/candidates` → "Search & Duplicates" tab) — keyword search, skill filters, AI score filter, track filter
- **Duplicate Detection** — AI-powered similarity check across name/email patterns
- **Inconsistency Flags** — DeepSeek flags conflicts between resume and application answers; shown on application detail with severity badges

### ⚠️ Pending / Partial
- **Semantic search** — current search is keyword-based (SQL ILIKE); vector similarity search not implemented
- **Duplicate merge workflow** — duplicates are detected and listed but there is no merge/consolidate action

---

## Phase 3 — Online Assessment Platform

### ✅ Implemented
- **Assessment CRUD** (`/admin/assessments`) — create, edit, archive assessments with title, type, time limit, pass score, instructions
- **Question Builder** (`/admin/assessments/<id>`) — MCQ, multi-select, text, code (Monaco Editor), file upload; marks per question; order management
- **Assessment Assignment** — assign to specific application(s) from admin assessment page OR from application detail sidebar
- **Candidate Assessment List** (`/candidate/assessments`) — shows assigned assessments with status, marks, time limit, pass criteria
- **Timed Assessment Taking** (`/candidate/assessments/<attemptId>`) — countdown timer, question navigation dots, auto-submit on expiry, debounced auto-save
- **Monaco Code Editor** — lazy-loaded, multi-language, syntax highlighting, vs-dark theme
- **Auto-grading** — MCQ and multi-select graded automatically on submit; percentage + pass/fail computed
- **Manual Grading** (`/admin/assessments/attempts/<id>`) — per-question manual marks entry, grader notes
- **Results View** (`/admin/assessments/<id>/results`) — table of all attempts with scores and pass/fail status

### ⚠️ Pending / Partial
- **AI-assisted text/code grading** — open-ended questions require fully manual grading; no AI rubric evaluation via DeepSeek
- **Question bank / reuse** — questions are per-assessment; no shared pool
- **Assignment + grading email notifications** — no email sent when assessment is assigned to or graded for a candidate

---

## Phase 4 — AI Proctoring & Secure Assessments

### ✅ Implemented
- **Fullscreen enforcement** — requests fullscreen on start; `fullscreen_exit` logged on exit
- **Tab-switch detection** — `visibilitychange` → `tab_switch` (high severity) logged to backend
- **Focus loss detection** — `window.blur` → `focus_loss` (medium severity) logged
- **Copy/paste detection** — `copy`, `cut`, `paste` events → `copy_paste` (medium) logged
- **Face detection** — face-api.js SsdMobilenetv1; checks every 2s; logs `face_not_detected` (medium) or `multiple_faces` (high); `camera_disabled` (high) if camera denied
- **Live camera preview** — 140×105 feed shown bottom-right during assessment
- **Violation overlay** — 4-second visual warning on each infraction
- **Proctoring event log** — all events stored in `ProctoringEvent` table with severity, timestamp, metadata
- **Admin proctoring review** (`/admin/assessments/attempts/<id>`) — chronological event timeline, severity badges, per-event reviewer notes, mark-reviewed button
- **face-api.js models** — SsdMobilenetv1 shards in `frontend/public/face-api-models/`

### ⚠️ Pending / Partial
- **Multiple-login prevention** — no concurrent-session check across different IPs/browsers
- **Mobile phone detection** — detecting a phone in the camera frame is not yet implemented
- **Monaco code paste detection** — paste events inside Monaco Editor not yet wired to proctoring
- **Auto-escalation thresholds** — no automatic admin alert when violation count exceeds a limit
- **Network recovery** — no retry logic if proctoring event POST fails

---

## Phase 5 — AI-Assisted First-Round Interviews

### ✅ Implemented
- **AI Interview Scheduling** (`/admin/interviews/ai`) — schedule for shortlisted applicant; select from dropdown (name, role, email)
- **Email Invitation** — candidate receives branded HTML email with direct link to start interview; triggered via `notification_service.send_ai_interview_invitation`
- **Candidate Interview List** (`/candidate/interviews/ai`) — cards with status, question count, start/continue/view buttons
- **Identity Check** — camera permission request and live preview before starting
- **AI Question Generation** — DeepSeek generates 5–7 questions (opening, technical, behavioral, situational, closing) from role and candidate profile
- **Web Speech API transcription** — live speech-to-text with interim + final transcripts; textarea fallback when unsupported
- **Follow-up questions** — DeepSeek generates contextual follow-ups after short behavioral/situational answers
- **AI Summary on completion** — DeepSeek produces overall summary, scores (communication, technical, problem-solving, cultural fit), and recommendation rationale
- **Admin review** (`/admin/interviews/ai/<id>`) — full Q&A transcript, AI summary, score grid, human recommendation + notes form
- **Tab-switch flagging** — tab switches counted and shown in interview header; logged for reviewer

### ⚠️ Pending / Partial
- **Candidate identity verification** — camera is opened but no face-match against ID document
- **Audio recording** — Web Speech API provides transcript only; MediaRecorder audio upload not implemented
- **Candidate result visibility** — candidates cannot see reviewer decision or AI scores after completion
- **Follow-up depth limiting** — no explicit max-follow-up cap (bounded implicitly by server logic)

---

## Security Checklist (vs Roadmap)

| Requirement | Status | Notes |
|------------|--------|-------|
| JWT HttpOnly cookies | ✅ | Implemented and enforced |
| Role-based access control | ✅ | `@require_roles(*ADMIN_ROLES)` decorators |
| Rate limiting | ✅ | flask-limiter on auth routes |
| CSRF protection | ✅ | SameSite=Strict cookie |
| Email verification | ✅ | Token-based, expiring |
| Password reset | ✅ | Expiring token |
| Fullscreen enforcement | ✅ | Proctoring monitor |
| Tab/focus detection | ✅ | Proctoring monitor |
| Face detection (AI) | ✅ | face-api.js SsdMobilenetv1 |
| Copy-paste detection | ✅ | Logged, visual warning shown |
| Multiple-login prevention | ❌ | Not implemented |
| Mobile phone detection | ❌ | Not implemented |
| Code-paste detection (Monaco) | ❌ | Not implemented |
| Auto-escalation on violations | ❌ | Not implemented |

---

## Known Bugs / Outstanding Issues

1. **Candidate offer response** — no route for candidates to accept/decline offer letters
2. **Assessment assignment emails** — no email when admin assigns an assessment
3. **Grading notifications** — no email when assessment is graded
4. **AI follow-up logic** — follow-ups triggered on answer length (<300 chars), not response quality
5. **Violation score aggregation** — proctoring events stored but no weighted total computed on session

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript 5.7, custom CSS |
| Backend | Flask 3.0, SQLAlchemy 2.0, PostgreSQL |
| AI | DeepSeek API (`deepseek-v4-flash`) |
| Face detection | face-api.js SsdMobilenetv1 |
| Speech | Web Speech API (SpeechRecognition) |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Auth | JWT in HttpOnly cookies |
| Email | SMTP (Gmail) via Python `smtplib` |

