# Proofi AI — Version 1 Technical Document

---

## 1. Product Overview

Proofi AI is a certificate showcase platform. Users create an account, upload their professional certificates, and get a public shareable URL where anyone can view their certificates without logging in.

---

## 2. Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Frontend | Next.js (React) | UI, pages, public profiles |
| Backend | Next.js API Routes | Auth, CRUD operations, business logic |
| Database | Supabase (PostgreSQL) | Users, certificates, slugs |
| Auth | Supabase Auth | Email/password + Google OAuth |
| File Storage | Supabase Storage | Certificate image uploads |
| ORM | Prisma | Type-safe database queries and schema management |
| Deployment | Vercel | Hosting, auto-deploy from GitHub |
| Version Control | GitHub | Source code repository |

All services are free tier. No credit card required for any of them.

---

## 3. Project Structure

```
proofi/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── [slug]/
│   │   └── page.tsx           ← public profile page
│   ├── api/
│   │   ├── auth/
│   │   ├── certificates/
│   │   └── profile/
│   ├── layout.tsx
│   └── page.tsx               ← landing page
├── components/
│   ├── ui/
│   ├── CertificateCard.tsx
│   ├── CertificateForm.tsx
│   └── PublicProfile.tsx
├── lib/
│   ├── supabase.ts
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
└── types/
    └── index.ts
```

---

## 4. Database Schema

### Users table

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  bio           String?
  avatarUrl     String?
  slug          String        @unique
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  certificates  Certificate[]
}
```

### Certificates table

```prisma
model Certificate {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  name            String
  issuer          String
  issuedAt        DateTime
  expiresAt       DateTime?
  domain          String
  credentialId    String?
  imageUrl        String?
  isPublic        Boolean   @default(true)
  verifyStatus    String    @default("self_reported")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

Notes:
- `slug` is the user's custom public URL identifier (e.g. proofi.ai/johndoe)
- `expiresAt` is optional
- `credentialId` is optional — used for future verification feature
- `isPublic` controls visibility on the public profile
- `verifyStatus` defaults to "self_reported" — built in now for future use, not shown in V1 UI
- `domain` stores the field/domain of the certificate (e.g. "Software Engineering")

---

## 5. Pages

### 5.1 Landing Page — /

Purpose: Introduce the product and convert visitors to sign up.

Content:
- Hero section with headline and subheadline
- Embedded live example of a public profile (use a demo account)
- Features section (short, 3 to 4 key features)
- Single CTA button: "Get started free" → goes to /signup

### 5.2 Sign Up — /signup

Fields:
- Full name
- Email address
- Password
- OR: "Continue with Google" button (Google OAuth via Supabase Auth)

On success: redirect to /dashboard

### 5.3 Log In — /login

Fields:
- Email address
- Password
- OR: "Continue with Google" button

On success: redirect to /dashboard

### 5.4 Dashboard — /dashboard (protected route)

This is the main authenticated screen. It has two parts.

Left / top section — Profile panel:
- Shows the user's public URL with a one-click copy button
- Profile photo upload
- Name (editable)
- Short bio (editable, max 160 characters)
- Custom slug (editable, validates uniqueness in real time)
- Save button

Main section — Certificates panel:
- "Add certificate" button → opens the certificate form (modal or side panel)
- List of all uploaded certificates as cards
- Each card shows: certificate name, issuer, domain badge, issued date, expiry (if set), visibility toggle (public/hidden), edit button, delete button

### 5.5 Public Profile — /[slug]

This is the view-only page anyone can access without logging in.

Content:
- User's name, photo, and bio at the top
- "Last updated" timestamp
- Domain filter tabs (e.g. All, Software Engineering, Machine Learning) — only shows domains that the user has at least one public certificate in
- Certificate cards — only shows certificates where isPublic is true
- Each card shows: certificate image (if uploaded), certificate name, issuer, domain badge, issued date, expiry (if set)
- No edit controls, no login required

---

## 6. Certificate Form Fields

Shown when user clicks "Add certificate" or "Edit" on an existing one.

| Field | Type | Required |
|---|---|---|
| Certificate name | Text input | Yes |
| Issuer / company | Text input | Yes |
| Date issued | Date picker | Yes |
| Expiry date | Date picker | No |
| Domain | Dropdown + custom option | Yes |
| Certificate image | File upload (image) | No |
| Credential ID | Text input | No |

Default domain options in the dropdown:
- Software Engineering
- Machine Learning
- Artificial Intelligence
- Business Analytics
- Data Science
- Cybersecurity
- Cloud Computing
- Other (custom — user types their own)

---

## 7. API Routes

### Auth
- Handled entirely by Supabase Auth SDK — no custom auth routes needed

### Certificates
- `GET /api/certificates` — get all certificates for the logged-in user
- `POST /api/certificates` — create a new certificate
- `PUT /api/certificates/[id]` — update a certificate
- `DELETE /api/certificates/[id]` — delete a certificate
- `PATCH /api/certificates/[id]/visibility` — toggle isPublic true/false

### Profile
- `GET /api/profile` — get the logged-in user's profile
- `PUT /api/profile` — update name, bio, slug, avatarUrl
- `GET /api/profile/check-slug?slug=xyz` — check if a slug is available (used for real-time validation)

### Public
- `GET /api/public/[slug]` — get public profile + public certificates for a given slug (used by the public profile page)

---

## 8. File Storage

Supabase Storage is used for two things:
- Certificate images — bucket: `certificates`
- User avatars — bucket: `avatars`

Both buckets are public read (anyone can view the image URL). Only the authenticated user can upload to their own folder.

File path pattern for certificates: `certificates/{userId}/{certificateId}.{ext}`
File path pattern for avatars: `avatars/{userId}/avatar.{ext}`

Accepted image formats: JPG, PNG, WebP
Max file size: 5MB per file

---

## 9. Authentication Flow

Supabase Auth handles all of this. The Next.js app uses the Supabase JS client.

Sign up with email:
1. User submits name, email, password
2. Supabase creates auth user and sends confirmation email
3. On confirm, app creates a User record in the database via Prisma with a default slug generated from their name
4. Redirect to dashboard

Sign up with Google:
1. User clicks "Continue with Google"
2. Supabase OAuth redirect to Google
3. On return, app checks if a User record exists for that email
4. If not, creates one with a default slug
5. Redirect to dashboard

Session management: Supabase handles JWT tokens and session refresh automatically via the JS client.

Protected routes: Any route under /dashboard checks for an active Supabase session. If none, redirect to /login.

---

## 10. Slug Rules

- Minimum 3 characters, maximum 30 characters
- Allowed characters: letters, numbers, hyphens
- No spaces
- Must be unique across all users
- Default slug is auto-generated from the user's name on signup (e.g. "John Doe" → "john-doe", and if taken → "john-doe-2")
- User can change their slug at any time from the dashboard

---

## 11. Key UI Rules

- The dashboard must show the public URL with a copy button at the top, always visible
- Visibility toggle on each certificate card must be instant (optimistic UI update)
- The slug field on the dashboard must validate in real time (debounced API call to check availability)
- The public profile page must be fully usable without JavaScript (SSR via Next.js)
- Domain filter on the public profile only shows domains that have at least one visible certificate
- Mobile responsive — both dashboard and public profile must work on mobile

---

## 12. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

---

## 13. Out of Scope for V1

These are intentionally excluded from V1 and should not be built now:

- Certificate verification with issuers
- Custom domain support (e.g. linking your own domain name)
- Analytics on profile views
- PDF export of profile
- Multiple profile themes
- Social sharing buttons
- Email notifications
- Admin dashboard
- Paid plans or billing
