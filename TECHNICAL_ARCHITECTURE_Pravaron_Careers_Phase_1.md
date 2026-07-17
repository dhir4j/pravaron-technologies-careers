# Pravaron Careers — Technical Architecture & Implementation Specification

**Product:** Pravaron Careers  
**Company:** Pravaron Technologies  
**Document type:** Technical Design Document / Engineering Specification  
**Version:** 1.0  
**Target release:** Phase 1  
**Primary domain:** `careers.pravarontechnologies.com`  
**Promotional redirect:** `workat.pravarontechnologies.com`  
**Frontend:** Next.js + TypeScript  
**Backend:** Flask + Python  
**Database:** PostgreSQL  
**Backend deployment:** PythonAnywhere  
**Frontend deployment:** Vercel recommended; static export on PythonAnywhere supported with limitations  
**Source strategy:** Extract and reuse the existing applicant-panel code previously embedded in `pravarontechnologies.com`

---

# 1. Purpose

This document defines the complete technical architecture, repository structure, database design, API contracts, authentication model, deployment process, security controls, migration strategy, testing strategy, and implementation standards for Phase 1 of Pravaron Careers.

It translates the Phase 1 product requirements into an engineering-ready plan.

The system will provide:

- A public careers website
- Public job and internship listings
- Candidate registration and login
- Candidate profiles and secure resume uploads
- Job applications
- Applicant status tracking
- Candidate email and dashboard notifications
- Admin job management
- Admin applicant tracking
- Reviewer assignment and scorecards
- Basic interview scheduling
- Audit logging
- Basic recruitment analytics

Advanced AI screening, assessments, proctoring, and AI interviews are outside Phase 1, but the architecture must support adding them later.

---

# 2. Existing System Context

A basic applicant panel already exists inside the main `pravarontechnologies.com` Next.js website.

The existing implementation includes:

- Applicant dashboard at `/dashboard`
- Applicant and admin role checks
- NextAuth-based session handling
- Application list
- Available jobs list
- Direct application action
- Application status badges
- Notifications
- Applicant profile summary
- Next.js API routes for jobs, applications, and notifications
- Middleware-based route protection
- Existing visual styles, typography, and responsive patterns

The existing code must be reused where practical, but it must not be copied blindly.

## 2.1 What should be reused

Reuse:

- Visual design tokens
- Manrope and Inter typography setup
- Applicant dashboard layouts
- Status badge components
- Empty-state components
- Job cards
- Application cards
- Notification cards
- Responsive layout patterns
- Existing Tailwind classes where maintainable
- Existing TypeScript interfaces as migration references
- Existing applicant/admin navigation patterns
- Existing form and button components
- Existing loading and error-state patterns

## 2.2 What must be replaced or refactored

Replace or refactor:

- Next.js API routes
- Direct database access from the Next.js application
- NextAuth-specific backend assumptions
- Session-derived role logic tied only to NextAuth
- `alert()`-based feedback
- One-click application submission without a structured application form
- Simplistic application status model
- Notification refresh based only on full page reload
- Hardcoded status labels and colors
- Any tightly coupled imports from the main company website
- Main-site-specific header, footer, and route assumptions
- Public assets or environment variables that belong to the main website

The new architecture will use Next.js strictly as the frontend application and Flask as the authoritative backend API.

---

# 3. Architecture Decision Summary

## 3.1 Recommended production architecture

```text
Candidate/Admin Browser
          |
          | HTTPS
          v
careers.pravarontechnologies.com
Next.js Frontend on Vercel
          |
          | HTTPS REST API
          v
api-careers.pravarontechnologies.com
Flask API on PythonAnywhere
          |
          +----------------------+
          |                      |
          v                      v
Managed PostgreSQL         Private File Storage
                          (S3-compatible preferred)
          |
          v
Transactional Email Provider
```

## 3.2 Why split frontend and backend

PythonAnywhere is designed primarily for Python web applications and WSGI/ASGI deployments. It does not provide a native Node.js production runtime suitable for a full Next.js server.

Therefore:

- Flask should run on PythonAnywhere.
- Next.js should run on Vercel.
- PostgreSQL should run on a supported PostgreSQL service.
- Resume files should be stored privately in object storage.
- Email should be sent through a transactional email provider.

This is the recommended architecture.

## 3.3 Full PythonAnywhere fallback

If the entire public site must be served through PythonAnywhere, Next.js can be built as a static export.

In that mode:

- Use `output: "export"` in Next.js.
- Do not use Next.js server actions.
- Do not use Next.js API routes.
- Do not use server-only dynamic rendering.
- Do not use middleware that requires a Node runtime.
- Client-side routing and Flask API calls remain supported.
- Static output is uploaded to PythonAnywhere and configured through static file mappings.
- Dynamic job SEO is weaker unless pages are generated at build time.
- Every new job may require rebuilding the frontend to produce a dedicated static HTML page.
- Authentication is fully client-side against Flask.
- Secure route access must always be enforced by Flask, not only by the frontend.

This fallback is acceptable for an MVP but is not the recommended long-term setup.

---

# 4. Technology Stack

## 4.1 Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Zustand only for small client-side global state
- Axios or a typed Fetch wrapper
- date-fns
- DOMPurify when rendering trusted rich content is unavoidable
- Lucide icons
- Vitest
- React Testing Library
- Playwright

## 4.2 Backend

- Python
- Flask
- Flask-SQLAlchemy
- SQLAlchemy 2.x
- Flask-Migrate
- Alembic
- Flask-JWT-Extended or custom secure token service
- Flask-CORS
- Marshmallow or Pydantic for validation and serialization
- psycopg
- Gunicorn for non-PythonAnywhere local/staging deployments
- bcrypt or Argon2 password hashing
- itsdangerous for signed verification/reset tokens
- Flask-Limiter
- structlog or standard JSON logging
- Sentry SDK
- boto3 for S3-compatible storage
- email provider SDK or HTTPS API client
- python-magic for file-type inspection where supported
- ClamAV integration or external malware scan service where available

## 4.3 Database

- PostgreSQL
- UUID primary keys recommended
- UTC timestamps
- JSONB only for flexible metadata
- Foreign keys and database constraints
- Indexed search and filtering fields
- Soft deletion only where operationally required

## 4.4 Infrastructure

- PythonAnywhere for Flask
- Vercel for Next.js, recommended
- Managed PostgreSQL
- S3-compatible object storage
- Transactional email service
- DNS hosted through the current domain provider
- GitHub for source control
- GitHub Actions for CI
- Sentry or equivalent for error monitoring
- Uptime monitoring for frontend and backend

---

# 5. Repository Strategy

## 5.1 Recommended monorepo

```text
pravaron-careers/
├── apps/
│   ├── web/                     # Next.js frontend
│   └── api/                     # Flask backend
├── packages/
│   ├── ui/                      # Optional reusable frontend UI package
│   ├── config/                  # Shared lint/format config
│   └── contracts/               # OpenAPI-generated TS types or schemas
├── docs/
│   ├── PRD_Pravaron_Careers_Phase_1.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── MIGRATION.md
├── scripts/
│   ├── export-existing-ui.sh
│   ├── seed-development-data.py
│   └── backup-database.sh
├── .github/
│   └── workflows/
├── .env.example
├── Makefile
└── README.md
```

## 5.2 Simpler two-repository alternative

```text
pravaron-careers-web
pravaron-careers-api
```

A monorepo is recommended initially because:

- One team owns both applications.
- API contract changes can be coordinated.
- Documentation stays together.
- CI can validate frontend and backend together.
- Reusable migration artifacts remain in one place.

---

# 6. Frontend Directory Structure

```text
apps/web/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── jobs/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── internships/
│   │   │   └── page.tsx
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   └── terms/
│   │       └── page.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── candidate/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── profile/
│   │   ├── applications/
│   │   │   └── [applicationId]/
│   │   ├── notifications/
│   │   └── settings/
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── candidates/
│   │   ├── interviews/
│   │   ├── templates/
│   │   ├── users/
│   │   ├── analytics/
│   │   └── audit-logs/
│   ├── apply/
│   │   └── [jobId]/
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── auth/
│   ├── candidate/
│   ├── admin/
│   ├── jobs/
│   ├── applications/
│   ├── notifications/
│   ├── interviews/
│   ├── forms/
│   ├── layout/
│   └── ui/
├── hooks/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   ├── query-client.ts
│   ├── constants.ts
│   └── utils.ts
├── types/
├── public/
├── tests/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

# 7. Backend Directory Structure

```text
apps/api/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── extensions.py
│   ├── errors.py
│   ├── logging.py
│   ├── middleware.py
│   ├── models/
│   │   ├── user.py
│   │   ├── candidate.py
│   │   ├── resume.py
│   │   ├── job.py
│   │   ├── application.py
│   │   ├── review.py
│   │   ├── interview.py
│   │   ├── notification.py
│   │   ├── consent.py
│   │   └── audit.py
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── job_service.py
│   │   ├── application_service.py
│   │   ├── notification_service.py
│   │   ├── email_service.py
│   │   ├── resume_service.py
│   │   ├── interview_service.py
│   │   ├── audit_service.py
│   │   └── analytics_service.py
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── public/
│   │       ├── candidate/
│   │       └── admin/
│   ├── templates/
│   │   └── email/
│   └── utils/
├── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── factories/
├── scripts/
├── wsgi.py
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── pytest.ini
└── .env.example
```

---

# 8. Flask Application Factory

Use an application factory.

```python
# app/__init__.py

from flask import Flask

from app.config import get_config
from app.extensions import cors, db, jwt, limiter, migrate
from app.api.v1 import register_v1_blueprints
from app.errors import register_error_handlers


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ALLOWED_ORIGINS"],
                "supports_credentials": True,
            }
        },
    )

    register_v1_blueprints(app)
    register_error_handlers(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}, 200

    return app
```

```python
# wsgi.py

from app import create_app

application = create_app("production")
```

PythonAnywhere's WSGI configuration should import `application`.

---

# 9. Environment Configuration

## 9.1 Backend environment variables

```env
APP_ENV=production
SECRET_KEY=
JWT_SECRET_KEY=
DATABASE_URL=
FRONTEND_URL=https://careers.pravarontechnologies.com
CORS_ALLOWED_ORIGINS=https://careers.pravarontechnologies.com
COOKIE_DOMAIN=.pravarontechnologies.com
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=14

EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM_NAME=Pravaron Careers
EMAIL_FROM_ADDRESS=careers@pravarontechnologies.com
EMAIL_REPLY_TO=careers@pravarontechnologies.com

STORAGE_PROVIDER=s3
S3_ENDPOINT_URL=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
SIGNED_URL_EXPIRY_SECONDS=300

SENTRY_DSN=
LOG_LEVEL=INFO

MAX_RESUME_SIZE_MB=8
ALLOWED_RESUME_EXTENSIONS=pdf,docx
DATA_ENCRYPTION_KEY=
```

## 9.2 Frontend environment variables

```env
NEXT_PUBLIC_APP_URL=https://careers.pravarontechnologies.com
NEXT_PUBLIC_API_BASE_URL=https://api-careers.pravarontechnologies.com/api/v1
NEXT_PUBLIC_COMPANY_SITE_URL=https://pravarontechnologies.com
NEXT_PUBLIC_SUPPORT_EMAIL=careers@pravarontechnologies.com
NEXT_PUBLIC_SENTRY_DSN=
```

Never expose backend secrets through `NEXT_PUBLIC_` variables.

---

# 10. Authentication Architecture

## 10.1 Decision

Replace NextAuth as the authoritative authentication backend.

Use Flask-issued access and refresh tokens with secure cookies.

Recommended token model:

- Short-lived access token: 15 minutes
- Rotating refresh token: 14 days
- Access token stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie
- Refresh token stored in a separate `HttpOnly`, `Secure`, `SameSite=Lax` cookie
- Refresh token record stored as a hash in PostgreSQL
- CSRF token required for state-changing requests
- Session revocation supported
- Admin sessions can use a shorter idle timeout

## 10.2 Why not localStorage

Do not store authentication tokens in localStorage because browser-injected scripts can read them.

## 10.3 Login flow

```text
1. Candidate submits email and password.
2. Flask rate-limits the request.
3. Flask normalizes the email.
4. Flask loads the user.
5. Flask verifies the password hash.
6. Flask checks account status and email verification.
7. Flask creates an access token.
8. Flask creates a rotating refresh token.
9. Flask stores the refresh-token hash and session metadata.
10. Flask sets secure cookies.
11. Flask returns user profile and permissions.
12. Next.js stores only non-sensitive user state in memory.
```

## 10.4 Frontend auth bootstrap

On application load:

```text
GET /api/v1/auth/me
```

The frontend receives:

```json
{
  "user": {
    "id": "uuid",
    "email": "candidate@example.com",
    "full_name": "Candidate Name",
    "role": "candidate",
    "permissions": []
  }
}
```

## 10.5 Route protection

Frontend route guards improve UX but do not provide security.

Every Flask endpoint must independently enforce:

- Authentication
- Role
- Permission
- Resource ownership

## 10.6 Role model

Roles:

- `candidate`
- `super_admin`
- `people_ops_admin`
- `hiring_manager`
- `technical_reviewer`
- `read_only_reviewer`

Use permission checks instead of large role-specific condition blocks.

---

# 11. Password and Account Security

- Use Argon2id where available.
- Minimum password length: 10 characters recommended.
- Reject commonly breached passwords where practical.
- Normalize email addresses to lowercase.
- Do not reveal whether an email exists during password recovery.
- Verification tokens expire.
- Reset tokens are single-use.
- Refresh tokens rotate after use.
- Reuse of a revoked refresh token revokes the session family.
- Admin accounts require MFA.
- Account status values:
  - `pending_verification`
  - `active`
  - `locked`
  - `disabled`
  - `deleted`

---

# 12. Database Conventions

## 12.1 Primary keys

Use UUIDs.

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

## 12.2 Timestamps

Every mutable table should include:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Use UTC in the database and convert in the UI.

## 12.3 Naming

- PostgreSQL: snake_case
- Python models: snake_case columns
- API JSON: snake_case for consistency with Flask
- TypeScript types can retain snake_case or be mapped centrally

## 12.4 Enumerations

Prefer PostgreSQL check constraints or reference tables over uncontrolled strings.

## 12.5 Transactions

Critical operations must be transactional:

- Application submission
- Status change and notification creation
- Interview scheduling and notification creation
- Candidate deletion or anonymization
- Job closure and affected-candidate notification jobs

---

# 13. Core Database Schema

## 13.1 Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'pending_verification',
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_check CHECK (
        role IN (
            'candidate',
            'super_admin',
            'people_ops_admin',
            'hiring_manager',
            'technical_reviewer',
            'read_only_reviewer'
        )
    )
);
```

## 13.2 Auth sessions

```sql
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    token_family_id UUID NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.3 Candidate profiles

```sql
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(160) NOT NULL,
    phone VARCHAR(30),
    current_city VARCHAR(120),
    state VARCHAR(120),
    country VARCHAR(120),
    preferred_location VARCHAR(160),
    current_role VARCHAR(160),
    current_company VARCHAR(160),
    total_experience_months INTEGER,
    notice_period_days INTEGER,
    current_compensation NUMERIC(14, 2),
    expected_compensation NUMERIC(14, 2),
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    website_url TEXT,
    profile_completion_percent SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.4 Candidate resumes

```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    original_file_name TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    mime_type VARCHAR(120) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    malware_scan_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    malware_scan_reference TEXT,
    version INTEGER NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT resumes_scan_check CHECK (
        malware_scan_status IN ('pending', 'clean', 'infected', 'failed')
    )
);
```

## 13.5 Jobs

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_code VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    department VARCHAR(120) NOT NULL,
    employment_type VARCHAR(40) NOT NULL,
    experience_level VARCHAR(40),
    workplace_model VARCHAR(30),
    location VARCHAR(180),
    openings INTEGER NOT NULL DEFAULT 1,
    salary_min NUMERIC(14, 2),
    salary_max NUMERIC(14, 2),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    show_salary BOOLEAN NOT NULL DEFAULT FALSE,
    summary TEXT NOT NULL,
    responsibilities TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    preferred_skills TEXT,
    education_preference TEXT,
    experience_requirement TEXT,
    selection_process TEXT,
    application_deadline TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    job_owner_id UUID REFERENCES users(id),
    published_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.6 Job questions

```sql
CREATE TABLE job_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    options JSONB,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_eligibility_question BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.7 Applications

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_code VARCHAR(40) NOT NULL UNIQUE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id),
    job_id UUID NOT NULL REFERENCES jobs(id),
    resume_id UUID NOT NULL REFERENCES resumes(id),
    internal_status VARCHAR(50) NOT NULL DEFAULT 'new',
    candidate_status VARCHAR(50) NOT NULL DEFAULT 'application_submitted',
    source VARCHAR(80),
    utm_data JSONB,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(candidate_id, job_id)
);
```

The unique constraint can be changed later if repeat applications to reopened jobs are required. In that case, introduce a `job_requisition_version` or an `is_active` partial unique index.

## 13.8 Application answers

```sql
CREATE TABLE application_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    job_question_id UUID NOT NULL REFERENCES job_questions(id),
    answer_text TEXT,
    answer_json JSONB,
    file_storage_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id, job_question_id)
);
```

## 13.9 Status history

```sql
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_internal_status VARCHAR(50),
    new_internal_status VARCHAR(50) NOT NULL,
    previous_candidate_status VARCHAR(50),
    new_candidate_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    internal_note TEXT,
    candidate_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.10 Application notes

```sql
CREATE TABLE application_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.11 Reviewer assignments

```sql
CREATE TABLE review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(application_id, reviewer_id)
);
```

## 13.12 Scorecards

```sql
CREATE TABLE review_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    ratings JSONB NOT NULL,
    recommendation VARCHAR(30) NOT NULL,
    comment TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id, reviewer_id)
);
```

## 13.13 Interviews

```sql
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    interview_type VARCHAR(60) NOT NULL,
    interviewer_id UUID REFERENCES users(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    meeting_mode VARCHAR(30) NOT NULL,
    meeting_link TEXT,
    physical_location TEXT,
    candidate_instructions TEXT,
    internal_instructions TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT interviews_time_check CHECK (end_at > start_at)
);
```

## 13.14 Notifications

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    notification_type VARCHAR(80) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    template_version VARCHAR(40),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    provider_message_id TEXT,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(180) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.15 Consent records

```sql
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    consent_type VARCHAR(60) NOT NULL,
    consent_version VARCHAR(40) NOT NULL,
    accepted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 13.16 Audit logs

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(120) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id UUID,
    previous_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 14. Database Indexes

At minimum:

```sql
CREATE INDEX idx_jobs_status_published_at
    ON jobs(status, published_at DESC);

CREATE INDEX idx_jobs_department
    ON jobs(department);

CREATE INDEX idx_applications_job_status
    ON applications(job_id, internal_status);

CREATE INDEX idx_applications_candidate
    ON applications(candidate_id, submitted_at DESC);

CREATE INDEX idx_applications_submitted
    ON applications(submitted_at DESC);

CREATE INDEX idx_status_history_application
    ON application_status_history(application_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread
    ON notifications(recipient_user_id, read_at, created_at DESC);

CREATE INDEX idx_interviews_start
    ON interviews(start_at);

CREATE INDEX idx_audit_target
    ON audit_logs(target_type, target_id, created_at DESC);

CREATE INDEX idx_auth_sessions_user
    ON auth_sessions(user_id, expires_at);
```

Use PostgreSQL full-text search or trigram indexes only after basic search requirements are confirmed.

---

# 15. API Design Standards

## 15.1 Base URL

```text
https://api-careers.pravarontechnologies.com/api/v1
```

## 15.2 Response envelope

Success:

```json
{
  "data": {},
  "meta": {},
  "request_id": "uuid"
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "fields": {
      "email": ["Enter a valid email address."]
    }
  },
  "request_id": "uuid"
}
```

## 15.3 HTTP semantics

- `200 OK`: successful read or update
- `201 Created`: resource created
- `204 No Content`: successful action with no body
- `400 Bad Request`: malformed request
- `401 Unauthorized`: authentication required
- `403 Forbidden`: permission denied
- `404 Not Found`: resource not found
- `409 Conflict`: duplicate application or invalid state transition
- `413 Payload Too Large`: resume too large
- `415 Unsupported Media Type`: unsupported file
- `422 Unprocessable Entity`: field validation
- `429 Too Many Requests`: rate limit
- `500 Internal Server Error`: unexpected failure

## 15.4 Pagination

```text
?page=1&page_size=25
```

Response metadata:

```json
{
  "meta": {
    "page": 1,
    "page_size": 25,
    "total": 138,
    "total_pages": 6
  }
}
```

Maximum page size: 100.

## 15.5 Idempotency

Require an idempotency key for:

- Application submission
- Status-change notification jobs
- Interview creation
- Bulk messages

Header:

```text
Idempotency-Key: uuid
```

---

# 16. API Endpoints

## 16.1 Authentication

```text
POST   /auth/register
POST   /auth/verify-email
POST   /auth/resend-verification
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
POST   /auth/change-password
```

## 16.2 Public jobs

```text
GET    /public/jobs
GET    /public/jobs/{slug}
GET    /public/departments
GET    /public/job-filters
```

Filters:

```text
search
department
employment_type
experience_level
location
workplace_model
is_internship
page
page_size
```

## 16.3 Candidate profile

```text
GET    /candidate/profile
PUT    /candidate/profile
GET    /candidate/profile/completion
POST   /candidate/education
PUT    /candidate/education/{id}
DELETE /candidate/education/{id}
POST   /candidate/employment
PUT    /candidate/employment/{id}
DELETE /candidate/employment/{id}
PUT    /candidate/skills
```

## 16.4 Resumes

```text
GET    /candidate/resumes
POST   /candidate/resumes
POST   /candidate/resumes/{id}/make-current
DELETE /candidate/resumes/{id}
```

Resume deletion must fail when the resume is referenced by an active application unless archival logic is implemented.

## 16.5 Candidate applications

```text
GET    /candidate/applications
POST   /candidate/applications
GET    /candidate/applications/{id}
POST   /candidate/applications/{id}/withdraw
GET    /candidate/applications/{id}/timeline
```

## 16.6 Candidate notifications

```text
GET    /candidate/notifications
GET    /candidate/notifications/unread-count
POST   /candidate/notifications/{id}/read
POST   /candidate/notifications/read-all
```

## 16.7 Candidate interviews

```text
GET    /candidate/interviews
GET    /candidate/interviews/{id}
POST   /candidate/interviews/{id}/confirm
POST   /candidate/interviews/{id}/request-reschedule
GET    /candidate/interviews/{id}/calendar.ics
```

## 16.8 Admin jobs

```text
GET    /admin/jobs
POST   /admin/jobs
GET    /admin/jobs/{id}
PUT    /admin/jobs/{id}
POST   /admin/jobs/{id}/publish
POST   /admin/jobs/{id}/pause
POST   /admin/jobs/{id}/reopen
POST   /admin/jobs/{id}/close
POST   /admin/jobs/{id}/archive
POST   /admin/jobs/{id}/duplicate
GET    /admin/jobs/{id}/applications
```

## 16.9 Admin applications

```text
GET    /admin/applications
GET    /admin/applications/{id}
POST   /admin/applications/{id}/status
POST   /admin/applications/{id}/notes
PUT    /admin/applications/{id}/notes/{note_id}
POST   /admin/applications/{id}/assign-reviewer
DELETE /admin/applications/{id}/reviewers/{reviewer_id}
POST   /admin/applications/{id}/request-information
POST   /admin/applications/{id}/reject
GET    /admin/applications/{id}/audit
```

## 16.10 Admin reviews

```text
GET    /admin/reviews/assigned
POST   /admin/applications/{id}/scorecard
GET    /admin/applications/{id}/scorecards
```

## 16.11 Admin interviews

```text
GET    /admin/interviews
POST   /admin/interviews
GET    /admin/interviews/{id}
PUT    /admin/interviews/{id}
POST   /admin/interviews/{id}/send-invitation
POST   /admin/interviews/{id}/cancel
POST   /admin/interviews/{id}/complete
```

## 16.12 Admin notifications and templates

```text
GET    /admin/email-templates
GET    /admin/email-templates/{id}
PUT    /admin/email-templates/{id}
POST   /admin/email-templates/{id}/preview
POST   /admin/email-templates/{id}/test
GET    /admin/notifications/failed
POST   /admin/notifications/{id}/retry
```

## 16.13 Admin analytics

```text
GET    /admin/analytics/summary
GET    /admin/analytics/applications-over-time
GET    /admin/analytics/by-source
GET    /admin/analytics/by-status
GET    /admin/analytics/time-to-review
GET    /admin/analytics/export.csv
```

---

# 17. Application Submission Transaction

Application submission must be executed in a database transaction.

```text
1. Verify authenticated candidate.
2. Lock or recheck job availability.
3. Validate deadline and status.
4. Validate profile completion.
5. Validate resume ownership and scan status.
6. Validate all required answers.
7. Check duplicate application constraint.
8. Create application.
9. Create application answers.
10. Create initial status-history record.
11. Create candidate notification.
12. Create admin notification.
13. Store consent records.
14. Commit transaction.
15. Queue confirmation emails.
16. Return application data.
```

Email sending must occur after commit.

Never roll back a successfully submitted application merely because the email provider is unavailable.

---

# 18. Application Status State Machine

Do not allow arbitrary status transitions.

## 18.1 Candidate statuses

```text
application_submitted
under_initial_review
shortlisted
interview_scheduled
interview_completed
final_review
offer_released
hired
not_selected
application_withdrawn
position_on_hold
position_closed
```

## 18.2 Example transition map

```python
ALLOWED_CANDIDATE_TRANSITIONS = {
    "application_submitted": {
        "under_initial_review",
        "not_selected",
        "application_withdrawn",
        "position_on_hold",
        "position_closed",
    },
    "under_initial_review": {
        "shortlisted",
        "not_selected",
        "application_withdrawn",
        "position_on_hold",
        "position_closed",
    },
    "shortlisted": {
        "interview_scheduled",
        "not_selected",
        "application_withdrawn",
        "position_on_hold",
        "position_closed",
    },
    "interview_scheduled": {
        "interview_completed",
        "not_selected",
        "application_withdrawn",
        "position_on_hold",
        "position_closed",
    },
    "interview_completed": {
        "final_review",
        "not_selected",
        "application_withdrawn",
    },
    "final_review": {
        "offer_released",
        "not_selected",
    },
    "offer_released": {
        "hired",
        "not_selected",
    },
}
```

Candidate withdrawal is permitted only before a final terminal status.

## 18.3 Status side effects

A status change may trigger:

- Timeline entry
- Candidate notification
- Candidate email
- Admin notification
- Interview workflow
- Analytics event
- Audit log

Implement side effects through a service layer rather than directly inside route handlers.

---

# 19. Resume Upload Architecture

## 19.1 Recommended storage

Do not store resume binary data in PostgreSQL.

Use private object storage.

Storage key format:

```text
resumes/{candidate_uuid}/{resume_uuid}/{random_uuid}.pdf
```

Do not use the candidate's email or original filename in the storage path.

## 19.2 Upload flow

Simple MVP flow:

```text
1. Browser uploads file to Flask.
2. Flask validates content length.
3. Flask validates extension.
4. Flask inspects MIME type and file signature.
5. Flask calculates SHA-256.
6. Flask uploads to private object storage.
7. Flask creates resume record.
8. Malware scan runs.
9. Resume becomes usable only when scan status is clean.
```

Future scalable flow:

```text
1. Flask creates presigned upload request.
2. Browser uploads directly to object storage.
3. Browser confirms upload.
4. Flask validates object metadata.
5. Scan job starts.
```

## 19.3 Allowed types

Phase 1:

- PDF
- DOCX

Do not accept executable files, archives, macro-enabled Office files, or image-only resume formats unless explicitly required.

## 19.4 Access

Admins request:

```text
GET /admin/applications/{id}/resume-url
```

Flask:

- Verifies permission
- Logs access
- Returns a signed URL valid for a short duration

---

# 20. Email Architecture

## 20.1 Sender

```text
Pravaron Careers <careers@pravarontechnologies.com>
```

## 20.2 Domain records

Configure:

- SPF
- DKIM
- DMARC
- Custom return path where supported

## 20.3 Delivery model on PythonAnywhere

Do not send emails directly inside HTTP request handlers.

Preferred order:

1. Create notification record in PostgreSQL.
2. Commit business transaction.
3. Schedule email processing.
4. Worker sends email.
5. Worker updates delivery status.

## 20.4 PythonAnywhere worker options

PythonAnywhere deployments may use:

- Always-on task on an eligible paid plan
- Scheduled task with short intervals for non-immediate messages
- Provider API call inline after commit only as an initial MVP fallback
- External queue/worker service if volume grows

For status-change emails, an always-on task is preferred.

## 20.5 Outbox pattern

Use a database-backed outbox.

```text
notifications.delivery_status = pending
```

Worker query:

```sql
SELECT *
FROM notifications
WHERE channel = 'email'
  AND delivery_status IN ('pending', 'retry')
  AND retry_count < 5
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 50;
```

Retry schedule:

- Attempt 1: immediate
- Attempt 2: 1 minute
- Attempt 3: 5 minutes
- Attempt 4: 30 minutes
- Attempt 5: 2 hours

## 20.6 Idempotency

Every email event must have a deterministic idempotency key.

Example:

```text
application:{application_id}:status:{status_history_id}:email
```

---

# 21. Notification Center

Phase 1 does not require WebSockets.

Use:

- TanStack Query cache
- Refetch after mutations
- Poll unread count every 60 seconds while the candidate dashboard is active
- Refetch on browser focus

This is compatible with PythonAnywhere's standard Flask WSGI deployment.

Future real-time updates can use an external push service or an ASGI deployment when justified.

---

# 22. Frontend Data Layer

## 22.1 API client

Create one typed client.

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
```

```typescript
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
  );

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.message ?? "The request failed.",
      body?.error?.fields,
    );
  }

  return body.data as T;
}
```

File uploads must not set JSON `Content-Type`.

## 22.2 Query keys

```typescript
export const queryKeys = {
  currentUser: ["auth", "me"] as const,
  publicJobs: (filters: object) => ["public-jobs", filters] as const,
  candidateApplications: ["candidate", "applications"] as const,
  candidateApplication: (id: string) =>
    ["candidate", "applications", id] as const,
  candidateNotifications: ["candidate", "notifications"] as const,
  adminApplications: (filters: object) =>
    ["admin", "applications", filters] as const,
};
```

## 22.3 Forms

Use:

- React Hook Form
- Zod
- Server validation as authoritative
- Field-level API errors mapped back to forms
- Autosave only where specifically required
- Explicit submit for job applications

---

# 23. Frontend Authentication UX

Create an `AuthProvider` that calls `/auth/me`.

States:

- `loading`
- `authenticated`
- `unauthenticated`

Protected layouts should:

- Display a loading shell during bootstrap
- Redirect unauthenticated users to `/login?returnTo=...`
- Redirect candidates away from admin routes
- Redirect admin users away from candidate-only routes where appropriate

Again, Flask must enforce authorization independently.

---

# 24. Existing Applicant Panel Migration Map

## 24.1 Existing `/dashboard`

Move to:

```text
/candidate
```

Reuse:

- Header
- Statistics cards
- Applications list
- Jobs list
- Notification cards

Refactor into smaller components:

```text
CandidateDashboardHeader
CandidateSummaryCards
RecentApplications
OpenJobsPreview
NotificationPreview
```

## 24.2 Existing application API

Existing:

```text
GET /api/applications
POST /api/applications
```

New:

```text
GET  Flask /api/v1/candidate/applications
POST Flask /api/v1/candidate/applications
```

The new POST request must include:

- `job_id`
- `resume_id`
- `answers`
- `consents`
- `source`
- `utm_data`

## 24.3 Existing jobs API

Existing:

```text
GET /api/jobs
```

New:

```text
GET /api/v1/public/jobs
GET /api/v1/public/jobs/{slug}
```

## 24.4 Existing notifications API

Existing:

```text
GET /api/notifications
```

New:

```text
GET  /api/v1/candidate/notifications
POST /api/v1/candidate/notifications/{id}/read
POST /api/v1/candidate/notifications/read-all
```

## 24.5 Existing session data

Existing UI reads:

```typescript
session.user.name
session.user.email
session.user.role
```

New UI reads:

```typescript
const { user } = useAuth();
user.full_name;
user.email;
user.role;
```

## 24.6 Existing styles

Preserve initially:

```text
Primary pink: #C7546D
Headings: Manrope
Body: Inter
Rounded cards
Subtle borders
Responsive grid
```

Move tokens into CSS variables:

```css
:root {
  --color-brand-500: #c7546d;
  --color-brand-600: #a63f56;
  --color-brand-100: #e8b4c0;
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
}
```

Do not make the public careers website visually isolated from the main Pravaron brand.

---

# 25. UI Component Specification

## 25.1 Core components

```text
Button
Input
Textarea
Select
MultiSelect
Checkbox
RadioGroup
DatePicker
FileUpload
Badge
Card
Dialog
Drawer
DropdownMenu
Table
Pagination
Tabs
Toast
Alert
Skeleton
EmptyState
ErrorState
ConfirmDialog
Timeline
StatCard
FilterBar
```

## 25.2 Status badge

Use a mapping object, not inline conditions.

```typescript
const candidateStatusConfig = {
  application_submitted: {
    label: "Application Submitted",
    tone: "blue",
  },
  under_initial_review: {
    label: "Under Initial Review",
    tone: "amber",
  },
  shortlisted: {
    label: "Shortlisted",
    tone: "purple",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    tone: "indigo",
  },
  hired: {
    label: "Hired",
    tone: "green",
  },
  not_selected: {
    label: "Not Selected",
    tone: "red",
  },
};
```

## 25.3 Feedback

Replace browser `alert()` calls with:

- Toast for successful lightweight actions
- Inline validation for forms
- Confirmation modal for destructive actions
- Dedicated error state for failed page loads

---

# 26. Admin Search and Filtering

Server-side filtering is required.

Example request:

```text
GET /admin/applications
  ?job_id=...
  &status=under_initial_review
  &reviewer_id=...
  &source=linkedin
  &search=react
  &submitted_from=2026-07-01
  &submitted_to=2026-07-31
  &page=1
  &page_size=25
  &sort=-submitted_at
```

Never download all applicants to the browser and filter client-side.

---

# 27. Rich Text Handling

Job descriptions may use structured fields or sanitized Markdown.

Recommended Phase 1:

- Store Markdown source.
- Render through a restricted Markdown renderer.
- Disable raw HTML.
- Sanitize generated HTML.
- Enforce a limited formatting set.

Do not store arbitrary HTML from admins without sanitization.

---

# 28. Audit Logging

Audit logging should be centralized.

```python
audit_service.record(
    actor=current_user,
    action="application.status_changed",
    target_type="application",
    target_id=application.id,
    previous_value={"candidate_status": old_status},
    new_value={"candidate_status": new_status},
    request=request,
)
```

Never place:

- Passwords
- Tokens
- Resume contents
- Full sensitive candidate data

inside audit values.

---

# 29. Logging and Observability

## 29.1 Request IDs

Generate or accept:

```text
X-Request-ID
```

Return it in every response.

## 29.2 Structured logs

Log fields:

- Timestamp
- Level
- Environment
- Request ID
- Route
- Method
- Status code
- Duration
- User ID when available
- Error type

## 29.3 Monitoring

Track:

- API error rate
- API latency
- Login failures
- Resume upload failures
- Email queue depth
- Email delivery failures
- Application submission failures
- Database connection failures
- Worker heartbeat
- Storage failures

---

# 30. CORS and Cookie Configuration

Recommended domains:

```text
Frontend: https://careers.pravarontechnologies.com
Backend:  https://api-careers.pravarontechnologies.com
```

Backend CORS:

```python
CORS_ALLOWED_ORIGINS = [
    "https://careers.pravarontechnologies.com",
]
```

Use:

- `supports_credentials=True`
- Exact origins
- No wildcard with credentials
- Limited allowed methods
- Limited headers

Cookies:

```text
Secure=true
HttpOnly=true
SameSite=Lax
Path=/
Domain=.pravarontechnologies.com
```

Because frontend and API are subdomains of the same registrable domain, `SameSite=Lax` should be sufficient for normal first-party use.

---

# 31. CSRF Protection

When cookie-based auth is used, protect state-changing requests.

Recommended double-submit pattern:

- Flask sets a readable CSRF cookie.
- Frontend sends its value in `X-CSRF-Token`.
- Flask verifies cookie and header values.
- Refresh and login flows follow explicit rules.

Protect:

- POST
- PUT
- PATCH
- DELETE

---

# 32. Rate Limiting

Suggested defaults:

```text
POST /auth/login:
5 per minute per IP
20 per hour per email/IP combination

POST /auth/register:
5 per hour per IP

POST /auth/forgot-password:
5 per hour per IP
3 per hour per normalized email

POST /candidate/resumes:
10 per hour per user

POST /candidate/applications:
10 per hour per user

Public jobs:
120 per minute per IP

Admin endpoints:
300 per minute per authenticated user
```

Use CAPTCHA only after suspicious behavior or repeated abuse, not for every candidate by default.

---

# 33. Privacy and Sensitive Data

Classify data:

## 33.1 High sensitivity

- Resume files
- Address
- Phone
- Compensation
- Interview notes
- Internal rejection reasons
- Authentication tokens

## 33.2 Moderate sensitivity

- Candidate name
- Email
- Employment history
- Education
- Portfolio links
- Application answers

## 33.3 Public

- Published job descriptions
- Careers content
- Department names

Controls:

- Least privilege
- Private storage
- Audit access
- Short signed URLs
- Mask sensitive fields in logs
- Separate consent for talent-pool retention
- Configurable retention and anonymization

---

# 34. Candidate Deletion and Anonymization

A deletion workflow should:

1. Verify the candidate's identity.
2. Check legal or operational retention requirements.
3. Revoke active sessions.
4. Delete or anonymize profile data.
5. Delete private resumes where permitted.
6. Anonymize application records required for aggregate analytics.
7. Retain minimal audit entries without unnecessary personal data.
8. Record deletion completion.

Recommended anonymized values:

```text
full_name = "Deleted Candidate"
email = generated non-deliverable value
phone = null
links = null
resume = deleted
```

---

# 35. Interview Scheduling

Phase 1 can use an internally managed schedule.

## 35.1 ICS generation

Flask generates an `.ics` file containing:

- UID
- DTSTART
- DTEND
- SUMMARY
- DESCRIPTION
- LOCATION
- URL
- Organizer
- Candidate email

## 35.2 Time zones

- Store timestamps in UTC.
- Store the intended IANA zone separately.
- Display candidate-local time where possible.
- Always show the named zone in emails.

## 35.3 Rescheduling

A candidate submits a request, not a direct update.

```text
requested_times
reason
created_at
status
```

Admin accepts and updates the interview.

---

# 36. Basic Analytics Implementation

Phase 1 can compute analytics directly from PostgreSQL.

Examples:

## Applications by source

```sql
SELECT COALESCE(source, 'direct') AS source, COUNT(*)
FROM applications
GROUP BY COALESCE(source, 'direct')
ORDER BY COUNT(*) DESC;
```

## Time to first review

```sql
SELECT AVG(first_review_at - submitted_at)
FROM (
    SELECT
        a.id,
        a.submitted_at,
        MIN(h.created_at) AS first_review_at
    FROM applications a
    JOIN application_status_history h
      ON h.application_id = a.id
    WHERE h.new_candidate_status = 'under_initial_review'
    GROUP BY a.id, a.submitted_at
) x;
```

Cache expensive dashboard queries briefly if needed.

---

# 37. PythonAnywhere Deployment

## 37.1 Recommended PythonAnywhere plan

Use a paid plan that supports:

- Custom domains
- HTTPS
- Sufficient web worker capacity
- External network access required by email/storage providers
- Always-on tasks if using a persistent email worker
- PostgreSQL or external PostgreSQL connectivity appropriate to the selected plan

Verify current plan limits before production launch.

## 37.2 Backend directory

Example:

```text
/home/<pythonanywhere_username>/pravaron-careers-api
```

## 37.3 Virtual environment

```bash
cd /home/<pythonanywhere_username>/pravaron-careers-api
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Use a Python version currently supported by the chosen PythonAnywhere system image.

## 37.4 WSGI file

PythonAnywhere WSGI configuration:

```python
import os
import sys

project_home = "/home/<pythonanywhere_username>/pravaron-careers-api"

if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ.setdefault("APP_ENV", "production")

from wsgi import application
```

## 37.5 Environment variables

Do not commit `.env`.

Options:

- Set variables in a protected PythonAnywhere configuration mechanism.
- Load a server-only file outside the repository.
- Restrict file permissions.

Example:

```bash
chmod 600 /home/<username>/.pravaron-careers.env
```

## 37.6 Database migrations

```bash
cd /home/<username>/pravaron-careers-api
source .venv/bin/activate
export FLASK_APP=wsgi.py
flask db upgrade
```

Always back up the database before production migrations.

## 37.7 Static files

Flask API should not serve the Next.js frontend in the recommended split architecture.

It may serve:

- OpenAPI documentation assets if enabled
- Small backend-only static files
- Health endpoints

PythonAnywhere static mappings can map:

```text
/static/ -> /home/<username>/pravaron-careers-api/app/static/
```

## 37.8 Custom domain

Recommended backend custom domain:

```text
api-careers.pravarontechnologies.com
```

Create the DNS record required by PythonAnywhere, configure the custom domain in the web app, and enable HTTPS.

## 37.9 Deployment workflow

Initial manual deployment:

```bash
cd /home/<username>/pravaron-careers-api
git pull origin main
source .venv/bin/activate
pip install -r requirements.txt
flask db upgrade
```

Then reload the PythonAnywhere web app.

Automated deployment should be added only after access controls and rollback procedures are established.

## 37.10 Worker process

For an always-on email worker:

```bash
cd /home/<username>/pravaron-careers-api
source .venv/bin/activate
python -m app.workers.notification_worker
```

The worker should:

- Sleep when no work is available
- Recover from transient exceptions
- Emit heartbeat logs
- Handle graceful termination
- Use database row locks
- Never process the same notification concurrently

## 37.11 Scheduled maintenance tasks

Use scheduled tasks for:

- Expired-session cleanup
- Expired-token cleanup
- Data-retention cleanup
- Daily recruitment summaries
- Failed-email retry sweep
- Database backup orchestration where supported

---

# 38. Next.js Deployment

## 38.1 Recommended: Vercel

Project root:

```text
apps/web
```

Set:

```env
NEXT_PUBLIC_API_BASE_URL=https://api-careers.pravarontechnologies.com/api/v1
```

Custom domain:

```text
careers.pravarontechnologies.com
```

Benefits:

- Native Next.js runtime
- Dynamic rendering
- Better job SEO
- Preview deployments
- Simple CI
- Edge/CDN delivery

## 38.2 PythonAnywhere static export fallback

`next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

Build:

```bash
npm ci
npm run build
```

Static output:

```text
apps/web/out/
```

Upload to:

```text
/home/<username>/pravaron-careers-web/out
```

Configure PythonAnywhere static mapping:

```text
/ -> /home/<username>/pravaron-careers-web/out/
```

Important limitations:

- No Next.js API routes
- No server actions
- No middleware
- No dynamic SSR
- Dynamic routes require `generateStaticParams`
- Newly published jobs may not have static detail pages until rebuild
- Authentication protection is UX-only in the frontend
- Flask remains the security boundary

For a recruitment platform with frequently created jobs, Vercel is significantly better.

---

# 39. DNS Plan

Recommended DNS:

```text
careers.pravarontechnologies.com
    -> Vercel frontend

api-careers.pravarontechnologies.com
    -> PythonAnywhere Flask API

workat.pravarontechnologies.com
    -> Redirect to careers.pravarontechnologies.com/jobs
```

Optional:

```text
apply.pravarontechnologies.com
    -> Redirect to careers.pravarontechnologies.com/jobs
```

Do not point both the frontend and backend to the same hostname unless a reverse proxy is intentionally configured.

---

# 40. Development Environments

## 40.1 Local frontend

```bash
cd apps/web
npm install
npm run dev
```

## 40.2 Local backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
flask db upgrade
flask run --debug --port 5000
```

## 40.3 Local PostgreSQL

Use Docker Compose:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: pravaron_careers
      POSTGRES_USER: pravaron
      POSTGRES_PASSWORD: local-password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 40.4 Local origins

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

Development CORS must permit only known local origins.

---

# 41. Dependency Files

## 41.1 Backend requirements

Example:

```text
Flask
Flask-Cors
Flask-JWT-Extended
Flask-Limiter
Flask-Migrate
Flask-SQLAlchemy
SQLAlchemy
alembic
psycopg[binary]
argon2-cffi
itsdangerous
marshmallow
boto3
requests
python-dotenv
sentry-sdk[flask]
structlog
gunicorn
```

Pin exact versions after initial compatibility testing.

## 41.2 Frontend dependencies

Example:

```json
{
  "dependencies": {
    "@hookform/resolvers": "...",
    "@tanstack/react-query": "...",
    "date-fns": "...",
    "lucide-react": "...",
    "next": "...",
    "react": "...",
    "react-dom": "...",
    "react-hook-form": "...",
    "zod": "..."
  }
}
```

Use lockfiles and automated dependency alerts.

---

# 42. Migration Plan from Main Website

## 42.1 Inventory

Before moving code:

- Identify every applicant-panel file.
- Identify imported UI components.
- Identify imported CSS and font configuration.
- Identify NextAuth configuration.
- Identify API routes.
- Identify database models or ORM definitions.
- Identify middleware.
- Identify email logic.
- Identify environment variables.
- Identify static assets.
- Identify company-site-specific dependencies.

## 42.2 Extract frontend

1. Copy the applicant dashboard into the new Next.js app.
2. Rename `/dashboard` to `/candidate`.
3. Extract reusable components.
4. Remove direct NextAuth imports.
5. Replace Next.js API calls with Flask API client calls.
6. Replace session reads with `useAuth()`.
7. Replace browser alerts with UI feedback.
8. Add structured application pages.
9. Add profile editing and resume management.
10. Add notification read actions.
11. Add error and loading boundaries.

## 42.3 Extract backend behavior

For each old Next.js API route:

1. Document request and response.
2. Identify database tables used.
3. Reimplement in Flask service/repository layers.
4. Add validation.
5. Add permission checks.
6. Add audit logging.
7. Add tests.
8. Switch the frontend endpoint.
9. Remove the old route only after verification.

## 42.4 Data migration

If production applicant data already exists:

- Freeze schema changes during migration.
- Export users, jobs, applications, and notifications.
- Map old IDs to new UUIDs.
- Normalize status strings.
- Preserve original timestamps.
- Deduplicate users.
- Hash or migrate passwords only when technically and cryptographically compatible.
- Otherwise require password resets.
- Validate row counts.
- Validate sample records.
- Preserve consent evidence where available.
- Record migration audit logs.

## 42.5 Cutover

1. Deploy Flask API.
2. Deploy new frontend to staging.
3. Import staging data.
4. Run end-to-end tests.
5. Configure production DNS.
6. Put old application route into maintenance/read-only mode.
7. Run final data migration.
8. Switch links on the main website.
9. Redirect old routes.
10. Monitor errors and submissions.
11. Keep rollback instructions available.

---

# 43. Main Website Integration

The main company website should not host the application system after separation.

It should contain:

- Careers link in navigation
- Careers CTA
- Open-role previews if desired
- Redirect to `careers.pravarontechnologies.com`
- Employer-branding content

Old routes should use permanent redirects after migration:

```text
pravarontechnologies.com/dashboard
    -> careers.pravarontechnologies.com/candidate

pravarontechnologies.com/jobs
    -> careers.pravarontechnologies.com/jobs
```

Do not maintain two active application systems.

---

# 44. Testing Strategy

## 44.1 Backend unit tests

Test:

- Status state machine
- Permission checks
- Email template rendering
- Application validation
- Duplicate application detection
- Resume validation
- Consent handling
- Token expiry and rotation
- Analytics queries

## 44.2 Backend integration tests

Use a real PostgreSQL test database.

Test:

- Registration and verification
- Login and refresh
- Application submission transaction
- Status change side effects
- Interview scheduling
- Notification outbox
- Resume ownership
- Role access
- Audit-log creation

## 44.3 Frontend component tests

Test:

- Forms
- Status badges
- Empty states
- Application timeline
- Protected route behavior
- Admin filter controls
- Notification read state

## 44.4 End-to-end tests

Playwright flows:

### Candidate

```text
Register
Verify account
Complete profile
Upload resume
Browse jobs
Apply
Receive application in dashboard
View status change
Mark notification read
Withdraw application
```

### Admin

```text
Login
Create job
Publish job
View application
Assign reviewer
Change status
Schedule interview
Reject candidate
View audit history
```

### Reviewer

```text
Login
See assigned candidate only
Open resume
Submit scorecard
Recommend shortlist
Cannot change unrelated applications
```

---

# 45. Security Testing

Mandatory cases:

- IDOR against candidate application IDs
- IDOR against resume IDs
- Reviewer accessing unassigned candidate
- Candidate accessing admin APIs
- Missing CSRF token
- Expired access token
- Reused refresh token
- Malicious resume filename
- Fake MIME type
- Oversized upload
- HTML/script injection in job content
- SQL injection payloads
- Brute-force login
- Duplicate application race condition
- Email template injection
- Unauthorized CSV export
- Audit-log tampering attempts

---

# 46. CI/CD

## 46.1 Pull-request pipeline

Frontend:

```text
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Backend:

```text
pip install -r requirements-dev.txt
ruff check .
mypy app
pytest
flask db check
```

## 46.2 Production safeguards

- Require code review.
- Block merge when tests fail.
- Scan dependencies.
- Scan secrets.
- Build frontend preview.
- Run migration checks.
- Tag releases.
- Record deployment commit.

## 46.3 PythonAnywhere deployment

Because PythonAnywhere may not provide a native GitHub deployment target, use one of:

- Controlled manual deployment
- PythonAnywhere API-based reload from a protected CI job
- SSH-based deployment where supported by the plan

Never expose PythonAnywhere API tokens in repository code or build logs.

---

# 47. Backup and Recovery

## 47.1 Database

- Daily automated backup
- Weekly retention
- Monthly archival backup
- Encryption
- Restore test at regular intervals

## 47.2 Files

- Object storage versioning if supported
- Lifecycle policy
- Access logging
- Backup or replication according to provider capability

## 47.3 Recovery goals

Initial MVP targets:

```text
RPO: 24 hours maximum
RTO: 4 hours target
```

Improve after application volume grows.

---

# 48. Error Handling

Backend route handlers should raise typed domain errors.

Example codes:

```text
AUTH_INVALID_CREDENTIALS
AUTH_EMAIL_NOT_VERIFIED
AUTH_ACCOUNT_LOCKED
JOB_NOT_OPEN
JOB_DEADLINE_PASSED
APPLICATION_ALREADY_EXISTS
PROFILE_INCOMPLETE
RESUME_NOT_CLEAN
INVALID_STATUS_TRANSITION
PERMISSION_DENIED
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
NOTIFICATION_DELIVERY_FAILED
```

Frontend must map each code to understandable UI text.

Do not expose Python tracebacks or SQL errors.

---

# 49. Accessibility

Technical requirements:

- Semantic landmarks
- Label every input
- Associate errors using `aria-describedby`
- Manage focus after modal open/close
- Announce status changes
- Ensure keyboard access
- Provide visible focus
- Respect reduced motion
- Use accessible tables
- Do not rely on status color alone
- Make upload control keyboard accessible
- Ensure mobile touch targets are at least 44px

---

# 50. SEO

Public job pages should include JobPosting structured data.

Fields:

- Title
- Description
- Date posted
- Valid through
- Employment type
- Hiring organization
- Job location
- Applicant location requirements where remote
- Base salary when displayed

Do not expose unpublished or closed positions as active structured data.

Vercel-hosted Next.js is preferred because dynamic job pages can render server-side or revalidate after publication.

---

# 51. Performance

Frontend:

- Lazy-load admin-only modules
- Paginate application tables
- Use optimized images
- Avoid large client bundles
- Cache public jobs briefly
- Use skeletons
- Avoid repeated auth calls

Backend:

- Select only required columns
- Paginate
- Add indexes
- Avoid N+1 queries
- Use SQLAlchemy eager loading selectively
- Use connection pooling appropriate to PythonAnywhere/database limits
- Process email and malware scans outside request path

---

# 52. Phase 1 Implementation Order

## Sprint 0 — Extraction and foundation

- Create repositories
- Extract UI
- Establish design tokens
- Create Flask app factory
- Configure PostgreSQL
- Configure migrations
- Build auth model
- Configure environments
- Configure CI

## Sprint 1 — Public careers

- Careers landing page
- Job listing
- Job detail
- Filters
- Admin job CRUD
- Publish/pause/close lifecycle
- SEO

## Sprint 2 — Candidate accounts

- Registration
- Verification
- Login
- Password reset
- Candidate profile
- Education and employment
- Resume upload

## Sprint 3 — Applications

- Structured application form
- Job-specific questions
- Submission transaction
- Candidate dashboard
- Timeline
- Withdrawal
- Admin application table

## Sprint 4 — Recruitment workflow

- Status machine
- Status history
- Internal notes
- Reviewer assignments
- Scorecards
- Permissions
- Audit logs

## Sprint 5 — Notifications and interviews

- Email templates
- Outbox worker
- In-app notifications
- Interview scheduling
- ICS invitations
- Reminders
- Failed-delivery admin view

## Sprint 6 — Hardening and launch

- Security review
- Accessibility
- Performance
- Data migration
- Deployment
- DNS
- Monitoring
- Backups
- End-to-end validation

---

# 53. Definition of Done

A feature is complete only when:

- Functional requirements are implemented.
- Flask authorization is implemented.
- Validation exists on frontend and backend.
- Error handling is implemented.
- Audit logging is added where required.
- Unit/integration tests pass.
- Responsive behavior is verified.
- Accessibility basics are verified.
- Documentation is updated.
- No secrets are committed.
- Production configuration is defined.
- Monitoring is added for critical failures.

---

# 54. Key Engineering Decisions

1. Flask is the only authoritative backend.
2. PostgreSQL is the system of record.
3. Next.js API routes will not be used for business logic.
4. NextAuth will be removed from the new standalone system.
5. Authentication uses secure cookies and Flask-issued tokens.
6. Resume files are stored privately outside PostgreSQL.
7. Email delivery uses a durable outbox.
8. Application statuses use a controlled state machine.
9. Every sensitive admin action is audited.
10. Vercel is recommended for Next.js.
11. PythonAnywhere hosts the Flask backend.
12. Static Next.js hosting on PythonAnywhere is a fallback only.
13. Phase 1 uses polling/refetching instead of WebSockets.
14. AI features are intentionally separated into later services.
15. Existing applicant-panel code is reused at the component and UX level, not at the architectural-coupling level.

---

# 55. Future AI Readiness

Phase 2 should add AI through separate services and tables.

Future tables may include:

```text
resume_parse_jobs
resume_parse_results
candidate_requirement_evidence
ai_recommendations
ai_model_versions
ai_prompt_versions
ai_decision_overrides
```

Rules:

- Raw AI output must not overwrite candidate data.
- Every generated summary must reference source evidence.
- AI recommendations must be reviewable.
- Model and prompt versions must be recorded.
- Human overrides must be recorded.
- Protected or irrelevant personal attributes must not be used.
- Automatic rejection remains disabled unless separately approved and legally reviewed.

---

# 56. Production Launch Checklist

## Infrastructure

- [ ] Frontend domain configured
- [ ] API domain configured
- [ ] HTTPS active
- [ ] Production PostgreSQL configured
- [ ] Database backups configured
- [ ] Object storage configured
- [ ] Email provider configured
- [ ] SPF configured
- [ ] DKIM configured
- [ ] DMARC configured
- [ ] PythonAnywhere web app configured
- [ ] PythonAnywhere worker configured
- [ ] Monitoring configured
- [ ] Error alerts configured

## Application

- [ ] Admin account created
- [ ] MFA enabled for Super Admin
- [ ] Privacy page published
- [ ] Terms page published
- [ ] Consent version recorded
- [ ] Email templates approved
- [ ] Application workflow tested
- [ ] Status workflow tested
- [ ] Resume access tested
- [ ] Audit logging tested
- [ ] Permissions tested
- [ ] First job published
- [ ] Old routes redirected
- [ ] Main website careers links updated

## Security

- [ ] Secrets removed from source
- [ ] CORS restricted
- [ ] CSRF enabled
- [ ] Rate limiting enabled
- [ ] Secure cookies enabled
- [ ] File-size limits enabled
- [ ] MIME validation enabled
- [ ] Malware scanning enabled or documented fallback approved
- [ ] Dependency scans clean
- [ ] Restore procedure tested

---

# 57. Recommended Final Deployment Topology

```text
┌────────────────────────────────────────────────────────────┐
│                    Public Internet                         │
└────────────────────────────────────────────────────────────┘
                 │                              │
                 ▼                              ▼
┌────────────────────────────┐     ┌────────────────────────────┐
│ careers.pravaron...        │     │ api-careers.pravaron...    │
│ Next.js on Vercel          │────▶│ Flask on PythonAnywhere    │
│ Public + Candidate + Admin │ API │ Auth + Business Logic      │
└────────────────────────────┘     └──────────────┬─────────────┘
                                                  │
                   ┌──────────────────────────────┼───────────────┐
                   ▼                              ▼               ▼
        ┌────────────────────┐        ┌──────────────────┐  ┌──────────────┐
        │ PostgreSQL         │        │ Private Storage  │  │ Email API    │
        │ System of Record   │        │ Resumes          │  │ Notifications│
        └────────────────────┘        └──────────────────┘  └──────────────┘
```

This topology respects the selected Next.js, Flask, PostgreSQL, and PythonAnywhere stack while avoiding the operational limitations of trying to run a full Next.js server on a Python-focused hosting platform.

---

# 58. Engineering Handoff

Before development starts, the team should have:

- This technical specification
- Phase 1 PRD
- Existing applicant-panel source code
- Existing applicant-panel documentation
- Approved UI design direction
- Production/staging domain plan
- PythonAnywhere account and plan
- PostgreSQL provider decision
- Storage provider decision
- Email provider decision
- Privacy notice draft
- Initial job-status workflow
- Initial admin-role assignments

The first engineering task is not to rebuild the UI.

The first engineering task is to inventory and extract the existing code, define the API contract, and establish the Flask/PostgreSQL foundation so the reused frontend components connect to a stable standalone architecture.
