# Certification Hub — Tech Stack

> All choices are free and open source. Target monthly cost at v1 launch: $0.

---

## Frontend

| Layer | Choice | License |
|---|---|---|
| Framework | Next.js (React) | MIT |
| Language | TypeScript | Apache 2.0 |
| Styling | Tailwind CSS | MIT |
| Component Library | shadcn/ui | MIT |
| PDF Viewer | react-pdf | MIT |
| Image Zoom | react-medium-image-zoom | MIT |

---

## Authentication

| Layer | Choice | License |
|---|---|---|
| Auth Library | NextAuth.js (Auth.js v5) | ISC |

Supports LinkedIn OAuth, Apple Sign-In, and email/password with email verification.
LinkedIn and Apple developer app registration is free.

---

## Database

| Layer | Choice | License |
|---|---|---|
| Database | PostgreSQL | PostgreSQL License |
| Hosting | Supabase (free tier — 500 MB, 2 projects) | Apache 2.0 |
| ORM | Prisma | Apache 2.0 |
| Validation | Zod | MIT |

---

## File Storage

| Layer | Choice | License |
|---|---|---|
| Storage | Supabase Storage (free tier — 1 GB) | Apache 2.0 |
| Upload Handling | Next.js API Routes + Supabase SDK | Free |

Supabase Storage provides per-user access keys and encryption at rest on the free tier.
Supported formats: PDF, JPG, PNG. Max file size: 25 MB (enforced at upload).

---

## Email & Notifications

| Layer | Choice | License |
|---|---|---|
| Email Library | Nodemailer | MIT |
| SMTP Provider | Gmail SMTP (free — up to 500 emails/day) | Free |
| Email Templates | React Email | MIT |

Used for: email verification on signup, expiry alerts at 90 / 30 / 7 days before expiry.

---

## Scheduled Jobs

| Layer | Choice | License |
|---|---|---|
| Scheduler | node-cron | MIT |

Runs inside the Next.js server. Triggers daily expiry checks and queues alert emails.

---

## Hosting & Deployment

| Layer | Choice | Free Tier |
|---|---|---|
| App Hosting | Vercel | Unlimited personal projects, SSR supported |
| Alternative | Railway | Free starter tier (container-based) |

Vercel is the primary target. Public profile pages use SSR for SEO as required.

---

## Monitoring & Analytics

| Layer | Choice | License |
|---|---|---|
| Error Tracking | GlitchTip | MIT |
| Analytics | Umami | MIT |

Both are open source and GDPR-compliant. Can be self-hosted or used on free cloud tiers.

---

## Architecture Overview

```
User
 └── Vercel (Next.js + SSR)
      ├── NextAuth.js       — Auth (LinkedIn, Apple, Email/Password)
      ├── Supabase Postgres — Primary database (via Prisma)
      ├── Supabase Storage  — File uploads (PDF, JPG, PNG)
      ├── Nodemailer        — Transactional email via Gmail SMTP
      ├── node-cron         — Scheduled expiry alert jobs
      └── Umami             — Privacy-friendly analytics
```

---

## Search Strategy

- **v1:** PostgreSQL full-text search — sufficient for filtering by category, issuer, date range, and expiry status. No additional infrastructure needed.
- **v2 (if needed):** Meilisearch (open source, MIT) if search performance becomes a bottleneck at scale.

---

## Out of Scope for v1

The following were considered but deferred to keep the stack simple and $0:

- Native mobile apps
- Third-party API integrations (LinkedIn sync, LMS connectors)
- Blockchain credential anchoring
- Employer-facing search
