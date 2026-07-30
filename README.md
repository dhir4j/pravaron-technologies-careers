# pravaron-technologies-careers

Full-stack careers platform for Pravaron Technologies. The project includes a
public careers experience, applicant workflows, an administration panel, and a
public openings feed for integration with `pravarontechnologies.com`.

## ⭐ Phase 1 Status: 80% Complete

**The platform is functional and ready for pilot hiring campaigns!**

careers@example.com

### ✅ What's Working
- Complete hiring workflow (post jobs → receive applications → review → hire)
- Email notifications with professional HTML templates
- AI-powered resume analysis (DeepSeek integration)
- Email application ingestion
- Privacy Policy & Terms of Service pages
- Email verification workflow
- Rate limiting on authentication endpoints
- Role-based access control
- Audit logging

### ⏳ In Progress
See `PHASE_1_AUDIT.md` for detailed completion status and `PHASE_1_COMPLETION_SUMMARY.md` for implementation roadmap.

## Project structure

- `frontend/`: Next.js and TypeScript application
- `backend/`: Flask API and applicant tracking services
- `PRD_Pravaron_Careers_Phase_1.md`: product requirements
- `TECHNICAL_ARCHITECTURE_Pravaron_Careers_Phase_1.md`: technical architecture
- `PHASE_1_AUDIT.md`: detailed feature audit
- `EMAIL_SETUP.md`: email configuration guide

## Local development

Start the backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask --app app:create_app init-db
flask --app app:create_app seed-dev
flask --app app:create_app run --debug
```

Start the frontend in a second terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and expects the API at
`http://localhost:5000/api/v1` by default.

## Admin Credentials

Create admin users with `backend/create_admin.py` and keep production credentials only in the deployment environment.

## Email Configuration

The platform uses SMTP for sending emails. Configuration is in `backend/.env`:

```env
SMTP_HOST=smtp.zoho.in
SMTP_PORT=587
SMTP_USER=mailbox@example.com
FROM_EMAIL=careers@example.com
FROM_NAME=Pravaron Careers
```

See `EMAIL_SETUP.md` for detailed configuration and testing instructions.

## Testing Email

```bash
cd backend
python test_email.py
```

## Corporate website integration

Published openings are available from:

```text
GET /api/v1/public/openings
```

The response includes a stable job ID, SEO-friendly slug, and direct careers
URL for each opening.

## Key Features

### Public Careers Site
- Job search and filtering
- Job detail pages with SEO
- Mobile-responsive design
- Privacy Policy & Terms of Service

### Candidate Experience
- Registration and email verification
- Profile management with resume upload
- Application submission
- Status tracking with timeline
- Email + in-app notifications
- Application withdrawal

### Admin Features
- Job creation and management
- Application review with AI analysis
- Status updates with email notifications
- Internal notes
- Interview scheduling
- User and role management
- Audit logging

### Advanced Features
- AI resume analysis (DeepSeek)
- Email application ingestion
- Job matching algorithms
- Location priority logic (Delhi NCR)
- Graduate-year tracking
- Rate limiting

## Documentation

- `README.md` - This file (setup and overview)
- `PRD_Pravaron_Careers_Phase_1.md` - Complete product requirements
- `TECHNICAL_ARCHITECTURE_Pravaron_Careers_Phase_1.md` - System architecture
- `PHASE_ROADMAP.md` - 5-phase development plan
- `JOB_DESCRIPTIONS.md` - Role definitions and hiring criteria
- `EMAIL_SETUP.md` - Email service configuration
- `PHASE_1_AUDIT.md` - Detailed implementation audit
- `PHASE_1_COMPLETION_SUMMARY.md` - Completion roadmap
- `IMPLEMENTATION_STATUS.md` - Quick reference status

## Configuration

Copy the provided `.env.example` files and set production secrets outside the
repository. SQLite is the development default; the SQLAlchemy configuration is
designed to support a later PostgreSQL connection through `DATABASE_URL`.

## Technology Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons

### Backend
- Flask 3.0
- SQLAlchemy
- SQLite (dev) / PostgreSQL (production)
- Flask-Limiter (rate limiting)
- Flask-Mail (email)
- DeepSeek API (AI analysis)

## Production Deployment Checklist

Before deploying to production:

1. ✅ Change default admin password
2. ✅ Set strong `SECRET_KEY` in environment
3. ✅ Configure production SMTP credentials
4. ✅ Set `CAREERS_PUBLIC_URL` to production domain
5. ⏳ Set up PostgreSQL database
6. ⏳ Configure Redis for sessions (recommended)
7. ⏳ Enable HTTPS (required)
8. ⏳ Set up monitoring and error tracking
9. ⏳ Configure database backups
10. ⏳ Review and update Privacy Policy with legal counsel

## License

Proprietary - Pravaron Technologies Pvt. Ltd.

## Contact

For questions or support:
- Email: careers@example.com
- Location: O-621, Block-A, EON Fairfox, Sector-140A, Noida, India
