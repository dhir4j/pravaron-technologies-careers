# Pravaron Technologies Careers Frontend

Next.js frontend for the Pravaron Technologies Careers Phase 1 Flask API.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Run the backend at `http://localhost:5000` and open `http://localhost:3000`.
Keep both local services on the same hostname so the HTTP-only authentication
cookie remains first-party.

Seeded development admin:

- Email: `careers@pravarontechnologies.com`
- Password: `ChangeMe123`

The frontend uses HTTP-only cookie authentication through the Flask API. Configure
`NEXT_PUBLIC_API_BASE_URL` for staging and production.

Production backend:

```text
NEXT_PUBLIC_API_BASE_URL=
```

Leave `NEXT_PUBLIC_API_BASE_URL` unset in production so browser requests use the
same-origin `/api/v1` path. Next.js rewrites those requests to the PythonAnywhere
backend from the server side.
