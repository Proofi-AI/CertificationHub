---
name: Proofi AI Project Overview
description: Tech stack, file structure, known issues, and build order for the CertificationHub/Proofi AI project
type: project
---

# Proofi AI — CertificationHub

**Location:** `/Users/kishankumarz/Documents/[06] Projects/CertificationHub/proofi/`

**Tech stack:** Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4, Prisma (PostgreSQL via Supabase), Supabase Auth, browser-image-compression, pdfjs-dist, @google/generative-ai

**Key structure:**
- `app/(dashboard)/dashboard/page.tsx` — SSR dashboard (fetches certs + badges)
- `app/(auth)/` — login, signup, forgot/reset password
- `app/[slug]/page.tsx` — public profile page
- `components/dashboard/` — DashboardShell, DashboardClient, CertificatesPanel, BadgesPanel, DashboardTabs, CertificateCard, CertificateFormModal, ActivityPanel, etc.
- `components/public/PublicProfile.tsx` — public profile with hex badge wall
- `components/BadgeCard.tsx`, `BadgeForm.tsx`, `BadgeWall.tsx`, `BadgeTrophyShelf.tsx`, `BadgeLightbox.tsx`, `OrganizationDropdown.tsx`
- `lib/smartCrop.ts` — canvas-based badge auto-crop utility
- `lib/defaultOrganizations.ts` — hardcoded org list for badge form
- `lib/utils/storage.ts` — Supabase upload helpers (certificates, avatars, badges)
- `prisma/schema.prisma` — User, Certificate, Badge, CustomOrganization, Feedback models

**Known pre-existing build issue:** `lib/utils/pdfToImage.ts` fails to resolve `pdfjs-dist` in Turbopack. Not caused by badges feature. Does not affect runtime (dynamic import).

**Supabase project:** vlmadvdfijmftoyfcunf.supabase.co
**Storage buckets:** `certificates`, `avatars`, `badges` (all public read)

**Badges feature (added 2026-04-03):**
- Dashboard tabs: Certificates | Badges (URL param: `?tab=badges`)
- Badge CRUD: `/api/badges/*`, `/api/organizations/*`, `/api/badges/credly`
- Public profile: hexagonal badge wall + trophy shelf for featured badges
- isFeatured: up to 3 pinned badges shown in trophy shelf

**Why:** V2 feature for digital badges (Credly import, hex wall public profile)
**How to apply:** When touching dashboard or public profile, be aware of the dual-tab layout and that both Certificate and Badge data are loaded server-side on the dashboard page.
