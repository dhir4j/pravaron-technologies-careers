# Pravaron Careers - Five-Phase System Roadmap

## Phase 1 - Careers Portal and Applicant Tracking System

Build the complete foundation for publishing jobs and managing candidates.

### Core features

- Public careers website
- Job and internship listings
- Candidate registration and login
- Candidate profile and resume upload
- Structured application forms
- Applicant dashboard
- Application status timeline
- Email and in-platform notifications
- Admin recruitment dashboard
- Job creation and management
- Candidate search and filters
- Internal notes
- Reviewer assignment
- Interview scheduling
- Role-based access control
- Recruitment analytics
- Audit logs

### Hiring workflow

Applied -> Under Review -> Shortlisted -> Interview -> Final Review -> Offer -> Hired/Rejected

### Immediate objective

Finish Phase 1 end-to-end before expanding assessment and interview automation. Real applications collected through Phase 1 provide the workflows and data needed for the later AI and assessment phases.

## Phase 2 - AI Resume Analysis and Recruitment Assistant


### Core features

- Resume parsing
- Candidate profile extraction
- Skills and experience identification
- Job requirement matching
- Evidence-based candidate summaries
- Missing-skill detection
- Resume and application inconsistency flags
- Suggested interview questions
- Semantic candidate search
- Duplicate-candidate detection
- AI-assisted candidate prioritization
- Human approval before shortlist or rejection
- AI model, prompt, and decision audit logs

### Objective

Reduce manual resume-review time while keeping hiring decisions transparent and human-controlled.

## Phase 3 - Online Assessment Platform

### Assessment types

- Quantitative aptitude
- Logical reasoning
- Verbal reasoning
- Technical multiple-choice questions
- Coding assessments
- Frontend assignments
- Backend assignments
- AI/ML practical tasks
- UI/UX design assignments
- HR and operations scenarios

### Objective

Conduct the first screening round internally instead of relying on external assessment platforms.

## Phase 4 - Secure Assessment and AI Proctoring

### Integrity controls

- Full-screen monitoring
- Tab-switch detection
- Window-focus tracking
- Copy-and-paste logging
- Multiple-login prevention
- Device and IP tracking
- Question randomization
- Automatic network recovery
- Code-paste detection
- Suspicious activity timeline
- Candidate identity verification
- Camera and microphone checks
- No-face detection
- Multiple-face detection
- Candidate leaving frame
- Additional person detection
- Mobile phone detection
- Camera-disabled alerts

### Important rule

AI should only create review flags. It must not automatically decide that a candidate cheated. A human reviewer must inspect flagged events before making a decision.

## Phase 5 - AI-Assisted First-Round Interview

### Interview flow

1. Candidate receives an interview invitation.
2. Candidate verifies identity and permissions.
3. AI asks standardized role-specific questions.
4. AI generates follow-up questions based on responses.
5. Answers are recorded and transcribed.
6. AI prepares an evidence-based interview summary.
7. A human interviewer reviews the complete response.
8. The hiring team makes the final decision.

### AI must not evaluate

- Facial attractiveness
- Accent
- Voice pitch
- Eye contact
- Facial expressions
- Emotion predictions
- Cultural communication style
- Disability-related behaviour

## Current next task

Complete Phase 1 workflow coverage and harden the admin application process around real email applications, job matching, resume extraction, and human-reviewed AI analysis.
