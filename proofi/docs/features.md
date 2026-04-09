# Proofi AI — Feature Log

## Version 2

### Badges System
- Full **Badges** tab in dashboard alongside Certificates
- Add, edit, and delete badges with image upload
- Badge fields: title, issuing organization, domain, issue/expiry dates, credential ID/URL, description, visibility, featured
- **Featured badges** displayed in a Trophy Shelf at the top of the public profile
- **Hex badge wall** — non-featured badges rendered in a honeycomb grid layout
- Filter badges by organization inside the dashboard
- Sort badges: Most Recent, Oldest First, Alphabetical, Custom Order, Custom Organization (grouped), Custom Domain (grouped)

### Badge Imports
- **Credly import** — paste a Credly badge URL to auto-fill all badge fields including image
- **LeetCode import** — fetch LeetCode badges directly from a username
- **GitHub import** — fetch GitHub achievement badges from a username

### Certificate Enhancements
- **PDF certificate support** — PDFs are converted to JPEG preview on upload via PDF.js; both the original PDF and the JPEG preview are stored
- **AI auto-fill** — paste a credential ID or URL and AI fills in certificate name, issuer, domain, and dates automatically
- **AI description generator** — one-click description generation based on the certificate name and issuer
- **Certificate verification** — AI-assisted verification status on uploaded certificates
- Certificate form field renamed from "Issuer / Company" to **Issuing Organization**

### Shared Organization System
- Certificates and badges share the same **custom organization pool** (`CustomOrganization` model)
- The organization dropdown (type-to-search + add new) is used in both the badge form and the certificate form
- Deleting a custom organization clears it from all associated certificates and badges automatically

### Advanced Sorting — Grouped Views

#### Badges
- **Custom Organization** sort — groups badges by issuing organization; drag group cards to reorder organizations; drag badges within a group to reorder individually
- **Custom Domain** sort — groups badges by domain; same drag-to-reorder for both groups and individual badges

#### Certificates
- **Custom Domain** sort — groups certificates by domain with drag-to-reorder at both group and item level
- **Custom Organization** sort (formerly "Custom Issuer") — groups certificates by issuing organization with the same drag behavior

Group orders are persisted to the user profile (`badgeGroupOrder`, `badgeDomainGroupOrder`, `certGroupOrder`, `certIssuerGroupOrder`) and reflected immediately on the public profile.

### Mobile Drag & Drop
- **Long-press to drag** — on mobile, drag mode activates after a 450 ms hold (prevents accidental drags during normal scroll)
- Haptic feedback (`navigator.vibrate(40)`) fires when drag mode activates
- Moving the finger more than 10 px before the long-press timer fires cancels drag intent and allows normal scrolling
- Scroll is locked via a non-passive `touchmove` listener only while drag is active
- Long-press drag works for: org group cards, domain group cards, issuer group cards, individual badges within org groups, individual badges within domain groups, individual certificates within domain groups, individual certificates within issuer groups

### Public Profile — Filter UI
- **Domain dropdown** and **Issuer dropdown** — two compact pill buttons always on one line (no horizontal scroll)
- Each dropdown shows the active selection inline with a domain color dot or org initials avatar
- Clicking a domain dropdown option scopes the issuer list to only organizations that have content in that domain
- Issuer filter resets to "All" only if the currently selected issuer has no items in the newly selected domain (smart reset)
- **AND-combined filtering** — domain and issuer filters apply simultaneously
- **Clear** button appears only when at least one filter is active

### Public Profile — Sort Order Reflected
- Badge domain group order (`badgeDomainGroupOrder`) takes priority over org group order when sorting the badge wall
- Certificate issuer group order (`certIssuerGroupOrder`) takes priority over domain group order when sorting the certificate grid

### UI / UX Refinements
- **Aesthetic scrollbar** — custom 4 px violet gradient scrollbar (`#7c3aed → #8b5cf6 → #a78bfa`) with glow on hover; Firefox gets `scrollbar-color` flat violet
- Search placeholder unified across badges and certificates: **"Search by name or issuing organization…"**
- Sort option labels standardized: "Custom Organization" and "Custom Domain" in both panels
- **iOS auto-zoom fix** — all text inputs forced to `font-size: 16px` on mobile (≤ 767 px) to prevent Safari from zooming when an input is focused; zoom no longer carries over to the dashboard after sign-in

---

## Version 1

### Core Profile
- User profile with name, bio, avatar, custom slug, and public URL (`/[slug]`)
- Light / dark theme toggle (persisted per user, respected on public profile)
- Profile view counter
- Security questions for account recovery

### Certificates
- Add, edit, and delete certificates
- Certificate fields: name, issuer, domain, issue date, expiry date, credential ID, description, image upload, visibility, featured
- Domain tagging with color-coded accent bars
- Pinned / featured certificates displayed in a horizontal shelf on the public profile
- Sort certificates: Most Recent, Oldest First, Strongest First, By Domain (A–Z), Expiring Soon, A–Z, Custom Order, Custom Domain

### Public Profile
- Shareable public profile page at `/:slug`
- Featured badges trophy shelf + hex badge wall
- Pinned certificates shelf + certificate grid
- Domain filter tabs (All + each domain)
- Footer CTA to create a profile

### Dashboard
- Responsive dashboard with Certificates and Badges tabs
- Inline search with 300 ms debounce
- Sort control with mobile bottom-sheet picker
- Drag-to-reorder (desktop) with save button

### Authentication
- Email + password sign-in and sign-up
- Google OAuth
- Email verification flow
- Forgot password / reset password
- Security questions fallback reset
- Separate development and production Supabase projects with auto-migration on deploy

### Admin
- Admin flag on User model
- Feature flags accessible only to admins
