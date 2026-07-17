# Product Requirements Document (PRD)

# Pravaron Careers — Phase 1

**Product:** Pravaron Careers  
**Company:** Pravaron Technologies  
**Primary domain:** `careers.pravarontechnologies.com`  
**Promotional redirect:** `workat.pravarontechnologies.com`  
**Document version:** 1.0  
**Phase:** Phase 1 — Careers Portal and Applicant Tracking System  
**Status:** Ready for product design and development  

---

## 1. Product Overview

Pravaron Careers is a public careers portal and internal applicant tracking system for Pravaron Technologies.

The platform will allow Pravaron Technologies to publish open positions and internship opportunities, promote hiring campaigns, collect structured applications, manage candidates through a defined recruitment workflow, and communicate hiring updates through both email and an applicant dashboard.

Phase 1 will focus on creating a reliable, secure, and user-friendly recruitment system before introducing advanced AI resume analysis, aptitude assessments, anti-cheating systems, or AI-led interviews.

---

## 2. Product Vision

Create a complete hiring platform where:

- Candidates can discover opportunities and apply easily.
- Applicants can track every application from submission to final decision.
- Administrators can manage jobs, candidates, statuses, interviews, and communication.
- Every important change is recorded and communicated automatically.
- The system is designed to support AI-assisted recruitment in later versions.
- Pravaron Technologies owns the complete candidate experience and hiring data.

---

## 3. Phase 1 Objective

The primary objective of Phase 1 is:

> Launch a professional careers website and applicant tracking system that enables Pravaron Technologies to publish jobs, collect applications, review candidates, manage recruitment stages, and send automatic status updates.

Phase 1 must be usable for real hiring campaigns immediately after launch.

---

## 4. Goals

### 4.1 Business Goals

- Build a direct recruitment channel owned by Pravaron Technologies.
- Reduce dependency on third-party job portals.
- Create a professional employer brand.
- Collect structured candidate data.
- Centralize applications, notes, communication, and decisions.
- Reduce repetitive recruitment administration.
- Track which promotional channels generate applicants.
- Build a foundation for future AI recruitment features.

### 4.2 Candidate Goals

- Find relevant jobs and internships quickly.
- Understand each role before applying.
- Submit an application without unnecessary complexity.
- Receive immediate confirmation after applying.
- Track application status transparently.
- Receive email notifications when meaningful changes occur.
- Manage profile, resume, and applications from one dashboard.
- Withdraw an application when required.

### 4.3 Admin Goals

- Create and manage job postings.
- Review and filter applications.
- Move candidates through recruitment stages.
- Add internal notes and reviewer feedback.
- Send status-based email notifications.
- Assign applications to relevant reviewers.
- View recruitment activity and basic analytics.
- Maintain a complete audit trail.

---

## 5. Non-Goals for Phase 1

The following features are explicitly outside the initial Phase 1 scope:

- AI-based automatic candidate rejection
- AI resume scoring
- AI interview system
- Aptitude examination engine
- Coding assessment environment
- Webcam proctoring
- Eye-tracking or gaze detection
- Anti-cheating AI
- Employee onboarding after hiring
- Payroll management
- Offer-letter e-signatures
- Third-party job board syndication
- LinkedIn Easy Apply integration
- Native Android or iOS application
- Multi-company recruitment SaaS
- Public candidate profile marketplace

The architecture should allow these features to be added later without requiring a complete rewrite.

---

## 6. Target Users

### 6.1 Public Visitor

A person visiting the careers website without an account.

They can:

- View the careers landing page.
- Browse open jobs and internships.
- Search and filter opportunities.
- View complete job descriptions.
- Begin an application.
- Register or log in.

### 6.2 Candidate

A registered applicant interested in working with Pravaron Technologies.

They can:

- Create and manage a profile.
- Upload a resume.
- Apply for jobs and internships.
- Answer role-specific questions.
- Track application status.
- View application history.
- Receive notifications.
- Withdraw an application.
- Update permitted information.

### 6.3 People & Operations Admin

The primary recruitment administrator.

They can:

- Create, edit, publish, pause, and close jobs.
- Review all applications.
- Update candidate statuses.
- Add notes.
- Assign reviewers.
- Schedule interviews.
- Send communications.
- Manage templates.
- View basic reports.

### 6.4 Technical Reviewer

A team member reviewing candidates for assigned technical roles.

They can:

- View assigned applications.
- View resumes and portfolio links.
- Add private notes.
- Submit review decisions.
- Complete structured scorecards.
- Recommend shortlist or rejection.
- Cannot manage system settings or unrelated candidates.

### 6.5 Super Admin

Initially the CEO/CTO or authorized administrator.

They can:

- Access all modules.
- Manage admin users and roles.
- Configure hiring stages.
- Manage email templates.
- View audit logs.
- Override statuses.
- Manage data retention and system settings.

---

## 7. Product Branding and Domain Structure

### 7.1 Public Product Name

**Pravaron Careers**

### 7.2 Recommended Domain

`careers.pravarontechnologies.com`

### 7.3 Promotional Redirect

`workat.pravarontechnologies.com`

The promotional domain should redirect to:

`careers.pravarontechnologies.com/jobs`

### 7.4 Core Routes

```text
/
 /jobs
 /jobs/[slug]
 /internships
 /apply/[job-id]
 /login
 /register
 /forgot-password
 /verify-email
 /candidate
 /candidate/profile
 /candidate/applications
 /candidate/applications/[application-id]
 /candidate/notifications
 /candidate/settings
 /admin
 /admin/jobs
 /admin/jobs/new
 /admin/jobs/[job-id]
 /admin/applications
 /admin/applications/[application-id]
 /admin/candidates
 /admin/interviews
 /admin/templates
 /admin/users
 /admin/settings
 /privacy
 /terms
```

---

## 8. Public Careers Website

### 8.1 Careers Landing Page

The landing page must communicate:

- Who Pravaron Technologies is.
- What the company is building.
- Why candidates should join.
- Available jobs and internships.
- The hiring process.
- Work location and workplace model.
- A clear call to action.

### 8.2 Suggested Hero Copy

# Build the Future of Intelligent Systems

Join Pravaron Technologies and work on agentic AI, automation, intelligent products, and systems designed to transform how businesses operate.

Primary CTA:

**Explore Open Roles**

Secondary CTA:

**View Internships**

### 8.3 Landing Page Sections

- Hero section
- About Pravaron Technologies
- What we are building
- Why join Pravaron
- Open positions
- Internship opportunities
- Hiring process
- Work culture and values
- Frequently asked questions
- Final call to action
- Footer with privacy and contact links

### 8.4 Job Search and Filters

Candidates should be able to filter jobs by:

- Department
- Employment type
- Experience level
- Location
- Workplace model
- Job category
- Internship or full-time
- Status: open roles only

### 8.5 Search Engine Requirements

Each published job must have:

- Unique page title
- Meta description
- Canonical URL
- Open Graph metadata
- Structured job posting data
- Indexable content
- Human-readable slug

Example:

`careers.pravarontechnologies.com/jobs/frontend-engineer-react-nextjs`

---

## 9. Job Management

### 9.1 Job Fields

Each job record must support:

- Internal job ID
- Public job code
- Job title
- URL slug
- Department
- Employment type
- Experience level
- Number of openings
- Location
- Workplace model
- Salary display preference
- Minimum salary
- Maximum salary
- Currency
- Role summary
- Responsibilities
- Required skills
- Preferred skills
- Education preference
- Experience requirement
- Application questions
- Selection process
- Application deadline
- Publishing date
- Job owner
- Assigned reviewers
- Job status
- Created by
- Created at
- Updated at

### 9.2 Job Statuses

- Draft
- Scheduled
- Published
- Paused
- Closed
- Archived

### 9.3 Admin Job Actions

Admins must be able to:

- Create a new job.
- Save a draft.
- Preview a job.
- Publish immediately.
- Schedule publication.
- Edit published jobs.
- Pause new applications.
- Reopen a paused job.
- Close a job.
- Archive a job.
- Duplicate an existing job.
- Assign reviewers.
- View applications for a job.
- Copy the public sharing link.

### 9.4 Application Questions

Admins can create custom questions with these types:

- Short text
- Long text
- Single select
- Multi-select
- Yes or no
- Number
- Date
- URL
- File upload

Each question can be:

- Required or optional
- Visible to candidate
- Marked as an eligibility question
- Assigned an internal label

Automatic rejection based on an answer is not part of Phase 1.

---

## 10. Candidate Authentication

### 10.1 Registration

Candidates can register using:

- Email address
- Password
- Full name

Required registration flow:

1. Candidate enters name, email, and password.
2. System creates an unverified account.
3. Verification email is sent.
4. Candidate verifies the email.
5. Candidate can complete profile and apply.

### 10.2 Login

Candidates can log in using email and password.

### 10.3 Password Requirements

- Minimum 8 characters
- At least one letter
- At least one number
- Passwords stored only as secure hashes
- Rate limiting on login attempts

### 10.4 Password Recovery

The system must support:

- Forgot-password request
- Time-limited reset link
- Password reset confirmation
- Revocation of used or expired reset tokens

### 10.5 Session Security

- Secure HTTP-only cookies
- SameSite protection
- Session expiration
- Logout from current session
- Logout from all sessions
- Suspicious-login rate limiting

### 10.6 Future Authentication

The design should allow Google and LinkedIn authentication later, but these integrations are not required for the first launch.

---

## 11. Candidate Profile

### 11.1 Personal Information

- Full name
- Email
- Phone number
- Current city
- State
- Country
- Preferred work location
- Work authorization question where required
- Profile photograph optional and excluded from initial reviewer view by default

### 11.2 Professional Information

- Current role
- Total experience
- Current company
- Notice period
- Current compensation optional
- Expected compensation optional
- Skills
- LinkedIn URL
- GitHub URL
- Portfolio URL
- Personal website URL

### 11.3 Education

Candidates can add multiple education records:

- Institution
- Qualification
- Field of study
- Start year
- End year
- Current study status
- Grade optional

### 11.4 Employment History

Candidates can add multiple experience records:

- Organization
- Job title
- Start date
- End date
- Currently working flag
- Responsibilities
- Achievements

### 11.5 Resume

- PDF and DOCX allowed
- Configurable maximum file size
- Resume versioning
- Uploaded file must be private
- Malware scan required
- Signed URL required for authorized access
- Candidate can replace resume before application review begins
- Existing submitted applications retain the resume version used during submission

---

## 12. Application Flow

### 12.1 Application Steps

1. Candidate opens a job page.
2. Candidate selects **Apply Now**.
3. Candidate registers or logs in.
4. Candidate completes required profile fields.
5. Candidate selects or uploads a resume.
6. Candidate answers job-specific questions.
7. Candidate reviews application.
8. Candidate accepts declarations and privacy notice.
9. Candidate submits application.
10. System creates the application.
11. Confirmation email is sent.
12. Application appears in the candidate dashboard.

### 12.2 Application Validation

Before submission, the system must verify:

- Candidate email is verified.
- Required profile fields are complete.
- Resume exists.
- Required questions are answered.
- Job is accepting applications.
- Application deadline has not passed.
- Candidate has not already submitted an active application for the same job.
- Required declarations are accepted.

### 12.3 Application Declaration

Suggested declaration:

> I confirm that the information provided in this application is accurate to the best of my knowledge. I understand that Pravaron Technologies may use this information for recruitment purposes in accordance with its candidate privacy notice.

### 12.4 Duplicate Applications

A candidate must not submit multiple active applications for the same job using the same account.

Admins can identify possible duplicate candidates using:

- Email
- Phone number
- Resume file hash
- Similar name and profile data

Phase 1 should flag possible duplicates without automatically deleting or merging them.

---

## 13. Application Status Workflow

### 13.1 Candidate-Facing Statuses

- Application Submitted
- Under Initial Review
- Shortlisted
- Interview Scheduled
- Interview Completed
- Final Review
- Offer Released
- Hired
- Not Selected
- Application Withdrawn
- Position On Hold
- Position Closed

### 13.2 Internal Statuses

Internal statuses may include:

- New
- Assigned for Review
- More Information Required
- HR Review
- Technical Review
- Manager Review
- Shortlisted
- Interview Pending
- Interview Scheduled
- Interview Completed
- Decision Pending
- Offer Approval
- Offer Sent
- Hired
- Rejected
- Withdrawn
- On Hold

Internal statuses must map to suitable candidate-facing statuses.

### 13.3 Default Workflow

```text
Application Submitted
        ↓
Under Initial Review
        ↓
Shortlisted
        ↓
Interview Scheduled
        ↓
Interview Completed
        ↓
Final Review
        ↓
Offer Released
        ↓
Hired
```

Alternative outcomes:

```text
Under Initial Review → Not Selected
Shortlisted → Not Selected
Interview Completed → Not Selected
Any active stage → Application Withdrawn
Any active stage → Position On Hold
Any active stage → Position Closed
```

### 13.4 Status Change Requirements

Whenever an authorized admin changes a candidate-facing status:

- Record the previous status.
- Record the new status.
- Record the admin user.
- Record the timestamp.
- Allow an internal note.
- Generate a candidate dashboard notification.
- Send an email when configured.
- Add the event to the application timeline.

### 13.5 Rejection Reason

The admin must select an internal rejection reason:

- Skills mismatch
- Experience mismatch
- Location or availability mismatch
- Compensation mismatch
- Role closed
- Stronger candidate selected
- Incomplete application
- Candidate unresponsive
- Interview outcome
- Other

The internal reason must not automatically appear in the candidate email.

---

## 14. Candidate Dashboard

### 14.1 Dashboard Overview

The candidate dashboard must show:

- Welcome message
- Active applications
- Latest application status
- Pending actions
- Upcoming interviews
- Recent notifications
- Profile completion
- Recommended open jobs, optional

### 14.2 Applications Page

For each application, display:

- Job title
- Job code
- Application date
- Current status
- Last updated date
- Next required action
- View details button
- Withdraw button when allowed

### 14.3 Application Detail Page

The page must show:

- Job summary
- Application ID
- Submitted information
- Resume used
- Candidate-facing timeline
- Current status explanation
- Interview details
- Messages or requests
- Withdrawal action
- Support contact

### 14.4 Candidate Timeline

Example:

```text
Application Submitted — 20 July 2026
Under Initial Review — 22 July 2026
Shortlisted — 25 July 2026
Interview Scheduled — 27 July 2026
```

The timeline should not reveal internal notes, ratings, or reviewer identities.

### 14.5 Withdrawal

Candidates can withdraw an active application.

The system must:

- Ask for confirmation.
- Allow an optional reason.
- Change status to Application Withdrawn.
- Notify assigned admins.
- Send withdrawal confirmation.
- Prevent further recruitment actions unless reopened by an admin.

---

## 15. Admin Dashboard

### 15.1 Dashboard Metrics

Display:

- Total open jobs
- Total active applications
- New applications today
- Applications awaiting review
- Shortlisted candidates
- Interviews scheduled
- Offers released
- Hires completed
- Applications by job
- Applications by source
- Average time to first review

### 15.2 Recruitment Work Queue

The admin dashboard should include:

- New applications
- Candidates awaiting review
- Candidates waiting too long in a stage
- Pending interview scheduling
- Missing candidate information
- Upcoming interviews
- Recently withdrawn applications

### 15.3 Application Table

Columns:

- Candidate name
- Job title
- Application date
- Current status
- Experience
- Location
- Assigned reviewer
- Last activity
- Source
- Actions

Filters:

- Job
- Department
- Status
- Experience
- Location
- Source
- Application date
- Assigned reviewer
- Search by name, email, skill, or application ID

### 15.4 Candidate Application View

The admin application page must include:

- Candidate profile
- Resume viewer or secure download
- Job details
- Application answers
- Portfolio links
- Status control
- Internal notes
- Assigned reviewers
- Candidate communication history
- Interview history
- Activity timeline
- Possible duplicate warning
- Rejection action
- Talent pool option placeholder for future use

### 15.5 Internal Notes

Notes must support:

- Plain text
- Author
- Timestamp
- Edit history
- Visibility limited to authorized admins and reviewers
- Optional mention of another reviewer

Candidates must never see internal notes.

---

## 16. Reviewer Workflow

### 16.1 Assignment

An admin can assign one or more reviewers to:

- A job
- An individual application

### 16.2 Reviewer Actions

A reviewer can:

- View assigned applications.
- Open the submitted resume.
- View answers and portfolio links.
- Add private notes.
- Complete a review scorecard.
- Recommend shortlist.
- Recommend rejection.
- Request more information through an admin.

### 16.3 Basic Review Scorecard

Default scorecard fields:

- Relevant skills
- Relevant experience
- Project evidence
- Problem-solving evidence
- Communication quality
- Role fit
- Overall recommendation

Rating scale:

- 1 — Does not meet requirement
- 2 — Partially meets requirement
- 3 — Meets requirement
- 4 — Strongly meets requirement
- 5 — Exceptional

Every final recommendation should require a written comment.

---

## 17. Interview Scheduling

Interview scheduling is included as a basic Phase 1 feature.

### 17.1 Interview Fields

- Interview type
- Candidate
- Application
- Assigned interviewer
- Date
- Start time
- End time
- Time zone
- Meeting mode
- Meeting link
- Physical location
- Candidate instructions
- Internal instructions
- Status
- Reminder settings

### 17.2 Interview Types

- HR Introduction
- Technical Interview
- Portfolio Review
- Practical Assignment Discussion
- Final Interview
- Other

### 17.3 Interview Statuses

- Draft
- Invitation Sent
- Confirmed
- Rescheduled
- Completed
- Cancelled
- Candidate Did Not Attend
- Interviewer Did Not Attend

### 17.4 Candidate Experience

Candidates must be able to:

- View interview details.
- Confirm attendance.
- Request rescheduling.
- Add the event to their calendar using an ICS file or supported integration.
- Receive email reminders.

### 17.5 Calendar Integration

Direct Google Calendar integration can be added after the basic scheduling flow. Phase 1 must at minimum support calendar invitation files and meeting links.

---

## 18. Notifications

### 18.1 Notification Channels

Phase 1 supports:

- Email
- In-platform notification center

### 18.2 Candidate Notification Events

- Account verification
- Password reset
- Application submitted
- Application status changed
- Additional information requested
- Interview invitation
- Interview updated
- Interview reminder
- Interview cancelled
- Application rejected
- Offer released
- Application withdrawn
- Position closed
- Account security alert

### 18.3 Admin Notification Events

- New application received
- Candidate withdrew application
- Candidate submitted requested information
- Interview reschedule requested
- Application waiting beyond configured threshold
- Email delivery failed

### 18.4 Notification Record

Each notification must record:

- Recipient
- Notification type
- Subject
- Message template version
- Related application
- Delivery channel
- Delivery status
- Sent timestamp
- Read timestamp
- Failure reason
- Retry count

### 18.5 Email Delivery Requirements

- Use a transactional email provider.
- Process emails through a background queue.
- Retry transient failures.
- Record delivery failure.
- Prevent duplicate sending.
- Support HTML and plain-text versions.
- Use consistent Pravaron Careers branding.
- Include a secure link to the relevant dashboard page.

### 18.6 Recommended Sender

```text
Display name: Pravaron Careers
Email: careers@pravarontechnologies.com
Reply-to: careers@pravarontechnologies.com
```

---

## 19. Email Templates

Phase 1 must include editable templates for:

- Verify your email
- Application received
- Application under review
- Candidate shortlisted
- Additional information required
- Interview invitation
- Interview rescheduled
- Interview reminder
- Interview cancelled
- Application not selected
- Offer released
- Application withdrawn
- Position closed

### 19.1 Template Variables

Supported variables should include:

```text
{{candidate_name}}
{{job_title}}
{{job_code}}
{{application_id}}
{{application_status}}
{{application_url}}
{{interview_date}}
{{interview_time}}
{{interview_timezone}}
{{meeting_link}}
{{company_name}}
{{careers_url}}
{{support_email}}
```

---

## 20. Application Source Tracking

Every application should store its acquisition source.

Supported sources:

- Direct
- LinkedIn
- X
- Instagram
- Facebook
- Employee referral
- College
- Job portal
- Email campaign
- QR code
- Other

Use UTM parameters:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

The system should retain the first known source associated with the application.

---

## 21. Basic Analytics

Phase 1 analytics should include:

- Total applications
- Applications by job
- Applications by date
- Applications by source
- Applications by status
- Stage conversion
- Rejection count
- Withdrawal count
- Average time to first review
- Average time in stage
- Interview scheduled count
- Offer count
- Hire count

Export to CSV should be available only to authorized admins.

---

## 22. Privacy and Consent

### 22.1 Required Candidate Notice

Before application submission, candidates must be informed:

- What information is collected
- Why it is collected
- Who may access it
- How it is used in recruitment
- How long it may be retained
- How to request correction or deletion
- Contact details for privacy requests
- Whether AI is currently used

For Phase 1, the notice should state that advanced AI-based candidate evaluation is not active unless such functionality is actually enabled.

### 22.2 Consent Records

The system must store:

- Consent version
- Consent text reference
- Candidate ID
- Application ID
- Timestamp
- IP address
- User agent

### 22.3 Future Opportunity Consent

Use a separate optional checkbox:

> I agree that Pravaron Technologies may retain my profile and contact me about suitable future opportunities.

This must not be mandatory for the current application.

### 22.4 Candidate Rights

Candidates should be able to:

- Update profile information.
- Request correction.
- Request deletion.
- Withdraw applications.
- Download a summary of submitted application information.
- Contact the company regarding privacy.

### 22.5 Data Retention

Retention periods must be configurable.

Suggested initial policy:

- Active application data: retained during recruitment.
- Rejected or closed applications: retained for a configured period.
- Future opportunity profiles: retained only with separate consent.
- Deleted accounts: removed or anonymized subject to legal and operational requirements.
- Audit and security logs: retained according to internal security policy.

Final retention rules should be reviewed by an appropriate Indian legal or compliance professional.

---

## 23. Role-Based Access Control

### 23.1 Roles

- Super Admin
- People & Operations Admin
- Hiring Manager
- Technical Reviewer
- Read-Only Reviewer

### 23.2 Permission Categories

- View jobs
- Manage jobs
- Publish jobs
- View all candidates
- View assigned candidates
- Download resumes
- Add notes
- Change status
- Schedule interviews
- Send communication
- Manage email templates
- Export data
- Manage users
- View audit logs
- Manage system settings

### 23.3 Security Principle

Use least-privilege access.

A reviewer should see only candidates assigned to them or roles they are authorized to review.

---

## 24. Audit Logs

The system must log sensitive and recruitment-related actions.

Log events include:

- Admin login
- Failed admin login
- Candidate profile viewed
- Resume viewed or downloaded
- Job created or edited
- Job published, paused, or closed
- Application status changed
- Internal note created or edited
- Reviewer assigned
- Interview created or changed
- Email sent
- Candidate exported
- User role changed
- Candidate data deleted
- Consent changed

Each audit record must include:

- Actor
- Action
- Target type
- Target ID
- Previous value where relevant
- New value where relevant
- Timestamp
- IP address
- User agent

Audit logs must not be editable through the application interface.

---

## 25. Security Requirements

### 25.1 General Security

- HTTPS required everywhere.
- Secure password hashing.
- CSRF protection.
- XSS prevention.
- SQL injection protection.
- Input validation.
- Output encoding.
- Rate limiting.
- Secure session handling.
- Content Security Policy.
- Dependency vulnerability scanning.
- Environment secret management.
- Separate development, staging, and production environments.

### 25.2 Admin Security

- Two-factor authentication required for Super Admin.
- Two-factor authentication recommended for all admin accounts.
- Strong password policy.
- Session timeout.
- Login activity tracking.
- Account lockout or throttling after repeated failed attempts.

### 25.3 File Security

- Private object storage.
- No public resume URLs.
- Signed time-limited access URLs.
- File type validation.
- MIME type verification.
- File size limit.
- Malware scan.
- Randomized storage key.
- Download activity logging.

### 25.4 Data Security

- Encryption in transit.
- Encryption at rest where supported.
- Database backups.
- Backup restoration testing.
- Restricted production database access.
- Sensitive-field masking in logs.
- No resume or personal data in application logs.

---

## 26. Accessibility

The public and candidate-facing platform should target WCAG 2.1 AA practices.

Requirements:

- Keyboard navigation
- Visible focus states
- Form labels
- Accessible validation errors
- Sufficient contrast
- Screen-reader-friendly status changes
- Semantic HTML
- Alternative text for meaningful images
- Reduced-motion support
- No essential information communicated by color alone

---

## 27. Responsive Design

The system must work across:

- Desktop
- Laptop
- Tablet
- Mobile browser

Candidate application flows must be fully usable on mobile.

The admin dashboard may be optimized for desktop but must remain functionally accessible on tablet.

---

## 28. Performance Requirements

Targets for public pages:

- Core content visible quickly on average mobile networks.
- Optimized images and fonts.
- Server-rendered or statically generated job pages.
- Pagination for large job and application lists.
- Background processing for emails and file operations.
- No blocking resume processing during application submission.

Suggested service targets:

- Public page p95 response time below 1 second excluding large assets.
- Authenticated API p95 below 800 milliseconds for normal operations.
- Application submission completes within 3 seconds excluding file upload time.
- Email jobs queued within 5 seconds after relevant events.

---

## 29. Reliability Requirements

- Graceful handling of email-provider failures.
- Automatic retry for queued jobs.
- Idempotent application submission.
- Protection from duplicate status emails.
- Resume upload recovery or clear retry flow.
- Database backups.
- Error monitoring.
- Uptime monitoring.
- Admin-visible failed notification queue.

---

## 30. Suggested Technology Architecture

### 30.1 Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Reusable component system
- React Hook Form
- Zod validation
- TanStack Query where required

### 30.2 Backend

Recommended options:

- FastAPI with Python, or
- NestJS with TypeScript

Suggested components:

- REST API
- Background worker
- Notification service
- File service
- Audit logging service
- Authentication service

### 30.3 Database

- PostgreSQL

### 30.4 Queue and Cache

- Redis
- Celery, RQ, BullMQ, or equivalent worker framework

### 30.5 File Storage

- S3-compatible private object storage
- Signed URLs
- Malware scanning pipeline

### 30.6 Email

- Transactional email provider
- Domain authentication with SPF, DKIM, and DMARC
- Delivery event webhooks where supported

### 30.7 Hosting

Possible structure:

```text
Frontend: Vercel or managed container
Backend: Managed container or virtual server
Database: Managed PostgreSQL
Redis: Managed Redis
Files: S3-compatible object storage
Monitoring: Error tracking and uptime monitoring
```

---

## 31. High-Level Data Model

### 31.1 User

```text
id
email
password_hash
email_verified_at
user_type
status
last_login_at
created_at
updated_at
```

### 31.2 Candidate Profile

```text
id
user_id
full_name
phone
city
state
country
preferred_location
current_role
current_company
total_experience_months
notice_period_days
current_compensation
expected_compensation
linkedin_url
github_url
portfolio_url
website_url
created_at
updated_at
```

### 31.3 Resume

```text
id
candidate_id
file_name
storage_key
mime_type
file_size
file_hash
malware_scan_status
version
uploaded_at
```

### 31.4 Education

```text
id
candidate_id
institution
qualification
field_of_study
start_year
end_year
currently_studying
grade
```

### 31.5 Employment

```text
id
candidate_id
organization
job_title
start_date
end_date
currently_working
description
```

### 31.6 Skill

```text
id
name
normalized_name
```

### 31.7 Candidate Skill

```text
candidate_id
skill_id
self_reported_level
```

### 31.8 Job

```text
id
job_code
title
slug
department
employment_type
experience_level
location
workplace_model
openings
salary_min
salary_max
currency
show_salary
summary
responsibilities
required_skills
preferred_skills
selection_process
application_deadline
status
job_owner_id
published_at
created_by
created_at
updated_at
```

### 31.9 Job Question

```text
id
job_id
question
question_type
is_required
is_eligibility_question
display_order
options
```

### 31.10 Application

```text
id
application_code
candidate_id
job_id
resume_id
internal_status
candidate_status
source
utm_data
submitted_at
last_status_changed_at
withdrawn_at
created_at
updated_at
```

### 31.11 Application Answer

```text
id
application_id
job_question_id
answer_text
answer_json
file_id
```

### 31.12 Application Status History

```text
id
application_id
previous_internal_status
new_internal_status
previous_candidate_status
new_candidate_status
changed_by
internal_note
candidate_message
created_at
```

### 31.13 Application Note

```text
id
application_id
author_id
note
created_at
updated_at
```

### 31.14 Review Assignment

```text
id
application_id
reviewer_id
assigned_by
status
assigned_at
completed_at
```

### 31.15 Scorecard

```text
id
application_id
reviewer_id
ratings
recommendation
comment
submitted_at
```

### 31.16 Interview

```text
id
application_id
interview_type
interviewer_id
start_at
end_at
timezone
meeting_mode
meeting_link
location
candidate_instructions
internal_instructions
status
created_by
created_at
updated_at
```

### 31.17 Notification

```text
id
recipient_user_id
application_id
notification_type
channel
subject
body
template_version
delivery_status
sent_at
read_at
failure_reason
retry_count
created_at
```

### 31.18 Consent Record

```text
id
candidate_id
application_id
consent_type
consent_version
accepted
ip_address
user_agent
created_at
```

### 31.19 Audit Log

```text
id
actor_id
action
target_type
target_id
previous_value
new_value
ip_address
user_agent
created_at
```

---

## 32. API Requirements

Suggested API groups:

```text
/api/v1/auth
/api/v1/public/jobs
/api/v1/candidate/profile
/api/v1/candidate/resumes
/api/v1/candidate/applications
/api/v1/candidate/notifications
/api/v1/admin/jobs
/api/v1/admin/applications
/api/v1/admin/candidates
/api/v1/admin/reviewers
/api/v1/admin/interviews
/api/v1/admin/templates
/api/v1/admin/analytics
/api/v1/admin/users
/api/v1/admin/audit-logs
```

### 32.1 Example Public Endpoints

```text
GET    /api/v1/public/jobs
GET    /api/v1/public/jobs/{slug}
GET    /api/v1/public/departments
```

### 32.2 Authentication Endpoints

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/session
```

### 32.3 Candidate Endpoints

```text
GET    /api/v1/candidate/profile
PUT    /api/v1/candidate/profile
POST   /api/v1/candidate/resumes
GET    /api/v1/candidate/resumes
GET    /api/v1/candidate/applications
POST   /api/v1/candidate/applications
GET    /api/v1/candidate/applications/{id}
POST   /api/v1/candidate/applications/{id}/withdraw
GET    /api/v1/candidate/notifications
POST   /api/v1/candidate/notifications/{id}/read
```

### 32.4 Admin Endpoints

```text
GET    /api/v1/admin/jobs
POST   /api/v1/admin/jobs
GET    /api/v1/admin/jobs/{id}
PUT    /api/v1/admin/jobs/{id}
POST   /api/v1/admin/jobs/{id}/publish
POST   /api/v1/admin/jobs/{id}/pause
POST   /api/v1/admin/jobs/{id}/close

GET    /api/v1/admin/applications
GET    /api/v1/admin/applications/{id}
POST   /api/v1/admin/applications/{id}/status
POST   /api/v1/admin/applications/{id}/notes
POST   /api/v1/admin/applications/{id}/assign-reviewer
POST   /api/v1/admin/applications/{id}/reject

POST   /api/v1/admin/interviews
PUT    /api/v1/admin/interviews/{id}
POST   /api/v1/admin/interviews/{id}/cancel
```

---

## 33. User Stories

### 33.1 Candidate Stories

- As a visitor, I want to browse open positions without creating an account.
- As a candidate, I want to register and verify my email.
- As a candidate, I want to create one reusable profile.
- As a candidate, I want to upload my resume securely.
- As a candidate, I want to apply for a role using my saved profile.
- As a candidate, I want to receive confirmation after submission.
- As a candidate, I want to see my current application status.
- As a candidate, I want to receive email updates when my status changes.
- As a candidate, I want to view scheduled interviews.
- As a candidate, I want to withdraw my application.
- As a candidate, I want to know how my data will be used.

### 33.2 Admin Stories

- As an admin, I want to publish a job without developer assistance.
- As an admin, I want to review all candidates for a job.
- As an admin, I want to filter candidates by status and experience.
- As an admin, I want to assign a technical reviewer.
- As an admin, I want to change an application status.
- As an admin, I want candidate notifications to be sent automatically.
- As an admin, I want to add internal notes.
- As an admin, I want to schedule an interview.
- As an admin, I want to understand where applications came from.
- As an admin, I want a record of every recruitment action.

### 33.3 Reviewer Stories

- As a reviewer, I want to see only applications assigned to me.
- As a reviewer, I want to review the resume and project links.
- As a reviewer, I want to submit a structured scorecard.
- As a reviewer, I want to recommend shortlist or rejection.
- As a reviewer, I want my comments to remain private from candidates.

---

## 34. Acceptance Criteria

### 34.1 Public Job Discovery

- Published jobs appear on the jobs page.
- Draft, paused, closed, and archived jobs are not presented as open.
- A job page displays all required role information.
- Job search and filters work correctly.
- Job URLs are shareable and readable.

### 34.2 Candidate Account

- Candidate can register with email and password.
- Verification email is sent.
- Unverified candidate cannot submit an application.
- Candidate can log in after verification.
- Candidate can reset a forgotten password.
- Candidate can log out securely.

### 34.3 Profile and Resume

- Candidate can create and update a profile.
- Required profile fields are validated.
- Candidate can upload an allowed resume.
- Unauthorized users cannot access resume files.
- Resume malware scan status is recorded.
- Submitted application retains the selected resume version.

### 34.4 Application Submission

- Candidate can apply to an open job.
- Required questions must be answered.
- Candidate cannot submit the same job application twice.
- Successful submission creates an application ID.
- Confirmation email is queued.
- Application appears in candidate dashboard.
- Admin can see the new application.

### 34.5 Status Management

- Authorized admin can change application status.
- Status history is recorded.
- Candidate dashboard reflects the new status.
- Configured email notification is sent.
- Internal notes remain hidden from candidate.
- Unauthorized reviewer cannot change status.

### 34.6 Interview Scheduling

- Admin can schedule an interview.
- Candidate receives interview email.
- Interview appears in candidate dashboard.
- Admin can reschedule or cancel.
- Candidate receives updated details.
- All changes are added to the audit trail.

### 34.7 Security

- Resume files are private.
- Admin permissions are enforced.
- Sensitive actions are logged.
- Login attempts are rate-limited.
- Passwords are never stored in plain text.
- Production traffic uses HTTPS.

---

## 35. Success Metrics

The first release should track:

### Adoption

- Number of published jobs
- Number of registered candidates
- Number of completed applications
- Application completion rate

### Candidate Experience

- Application abandonment rate
- Average time to complete an application
- Email delivery success rate
- Candidate login rate after applying
- Withdrawal rate

### Recruitment Operations

- Time to first review
- Number of applications awaiting review
- Average time spent in each stage
- Interview scheduling time
- Offer and hire counts
- Applications per source

### Reliability

- Application submission failure rate
- Email failure rate
- Resume upload failure rate
- Authentication failure rate
- Platform uptime

---

## 36. Release Plan

### Milestone 1 — Foundation

- Project setup
- Environments
- Database
- Authentication
- Role-based access
- Base design system
- Email infrastructure
- File storage

### Milestone 2 — Public Careers Portal

- Landing page
- Jobs listing
- Job detail pages
- Search and filters
- Internship section
- SEO metadata

### Milestone 3 — Candidate Application System

- Registration and login
- Candidate profile
- Resume upload
- Application flow
- Application confirmation
- Candidate dashboard
- Withdrawal

### Milestone 4 — Admin ATS

- Admin dashboard
- Job management
- Application table
- Candidate detail view
- Notes
- Reviewer assignment
- Status workflow
- Audit logs

### Milestone 5 — Communication and Interviews

- Email templates
- Notification center
- Interview scheduling
- Reminders
- Candidate timelines
- Delivery logging

### Milestone 6 — QA and Launch

- Functional testing
- Permission testing
- Security checks
- Accessibility testing
- Responsive testing
- Backup verification
- Production deployment
- Monitoring setup
- Initial job publication

---

## 37. Testing Requirements

### 37.1 Functional Testing

- Registration
- Verification
- Login
- Password reset
- Job publishing
- Application submission
- Status updates
- Email notifications
- Interview scheduling
- Withdrawal
- Role permissions

### 37.2 Security Testing

- Unauthorized resume access
- IDOR checks
- XSS attempts
- SQL injection attempts
- CSRF checks
- Login brute-force resistance
- File upload validation
- Admin permission bypass attempts

### 37.3 Responsive Testing

Test on:

- Current Chrome
- Current Firefox
- Current Safari
- Current Edge
- Android Chrome
- iOS Safari

### 37.4 Email Testing

- HTML rendering
- Plain-text fallback
- Correct template variables
- Broken link checks
- Duplicate-send prevention
- Bounce handling
- Retry behavior

---

## 38. Launch Checklist

- Careers domain configured
- Promotional redirect configured
- SSL enabled
- SPF configured
- DKIM configured
- DMARC configured
- Careers email mailbox configured
- Privacy notice published
- Terms page published
- Candidate support email active
- Admin accounts created
- Two-factor authentication enabled
- Job templates created
- Email templates approved
- First positions published
- Application flow tested end to end
- Resume storage verified
- Backups enabled
- Monitoring enabled
- Error alerts configured
- Audit logging verified

---

## 39. Future Roadmap

### Phase 1.1

- Google login
- LinkedIn login
- Google Calendar integration
- Talent pools
- Employee referrals
- Bulk candidate actions
- More advanced analytics
- Candidate feedback survey
- Custom recruitment pipelines per job

### Phase 2

- Resume parsing
- Evidence-based AI candidate summaries
- Requirement matching
- Suggested interview questions
- Semantic candidate search
- Human-reviewed AI recommendations
- Duplicate candidate intelligence
- AI action audit logs

### Phase 3

- Aptitude testing
- Technical quizzes
- Coding assessments
- Question banks
- Randomization
- Basic integrity monitoring
- Assessment analytics

### Phase 4

- AI-assisted first-round interviews
- Text, audio, and video responses
- Transcription
- Adaptive follow-up questions
- Human-reviewed competency summaries
- Transparent proctoring controls
- Accessibility accommodations

---

## 40. Final Phase 1 Definition

Phase 1 is complete when Pravaron Technologies can:

1. Publish a job or internship.
2. Share the job publicly.
3. Allow a candidate to register and apply.
4. Store the resume and application securely.
5. Review the candidate from an admin dashboard.
6. Assign the application to a reviewer.
7. Move the application through hiring stages.
8. Notify the candidate through email and dashboard.
9. Schedule and update an interview.
10. Record every important action in an audit trail.
11. View basic recruitment analytics.
12. Operate the complete initial hiring process without relying on spreadsheets.

---

## 41. Product Contact

**Company:** Pravaron Technologies  
**Product:** Pravaron Careers  
**Careers domain:** `careers.pravarontechnologies.com`  
**Promotional domain:** `workat.pravarontechnologies.com`  
**General email:** `contact@pravarontechnologies.com`  
**Recommended recruitment email:** `careers@pravarontechnologies.com`
