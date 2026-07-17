# pravaron-technologies-careers

Full-stack careers platform for Pravaron Technologies. The project includes a
public careers experience, applicant workflows, an administration panel, and a
public openings feed for integration with `pravarontechnologies.com`.

## Project structure

- `frontend/`: Next.js and TypeScript application
- `backend/`: Flask API and applicant tracking services
- `PRD_Pravaron_Careers_Phase_1.md`: product requirements
- `TECHNICAL_ARCHITECTURE_Pravaron_Careers_Phase_1.md`: technical architecture

## Local development

Start the backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
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

## Corporate website integration

Published openings are available from:

```text
GET /api/v1/public/openings
```

The response includes a stable job ID, SEO-friendly slug, and direct careers
URL for each opening.

## Configuration

Copy the provided `.env.example` files and set production secrets outside the
repository. SQLite is the development default; the SQLAlchemy configuration is
designed to support a later PostgreSQL connection through `DATABASE_URL`.
