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

The frontend uses HTTP-only cookie authentication through the Flask API.
Keep browser requests same-origin unless the target API explicitly allows
cross-origin credentialed requests.

Production backend:

```text
NEXT_PUBLIC_API_BASE_URL=
API_PROXY_ORIGIN=http://server2careers.pravarontechnologies.com
```

Leave `NEXT_PUBLIC_API_BASE_URL` unset in production so browser requests use the
same-origin `/api/v1` path. The Next.js route handler at `/api/v1/*` proxies
those requests to `API_PROXY_ORIGIN` from the server side.
