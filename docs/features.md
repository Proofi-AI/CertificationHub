# Proofi AI — Feature List

A complete inventory of all features implemented in the product, from core functionality to small UI details.

---

## Authentication & Accounts

### Email & Password Sign Up
Users can create an account with their email address and a password (minimum 6 characters). A verification email is sent after sign up.

### Email Verification
After signing up, a confirmation link is sent to the user's email. Clicking it verifies the account and redirects to the dashboard.

### Email & Password Login
Existing users can log in with their registered email and password, with clear error messages for invalid credentials.

### Google OAuth (Sign In / Sign Up)
Users can sign up or log in using their Google account with one click. OAuth callback and session handling are fully managed.

### Auto User Record Creation
On first login (via any method), a database record is automatically created for the user — including a generated profile slug derived from their name or email.

### Protected Routes
The dashboard and settings pages are fully protected — unauthenticated users are redirected to the login page automatically.

### Sign Out
A sign out button clears the Supabase session and redirects the user to the landing page.

---

## Dashboard

### Main Dashboard Layout
A full-screen dashboard with a sticky top navbar, background gradient glows, and a clean certificate grid area — no sidebars.

### Navbar with Quick Actions
The top navigation bar shows the Proofi AI logo, a "View Profile" link, a settings link, a theme toggle, the user's avatar with initials fallback, and a sign out button.

### Statistics Cards
Four summary cards at the top of the certificates section showing: Total certificates, Public certificates, Private certificates, and number of unique Domains.

### Certificate Search
A real-time search input that filters certificates by name or issuer as the user types.

### Domain Filter Dropdown
A dropdown to filter certificates by a specific domain category. Only shown when the user has certificates in 2 or more domains.

---

## Certificate Management

### Add Certificate
A modal form to add a new certificate with fields for name, issuer, issue date, expiry date, domain, credential ID, and file upload.

### Edit Certificate
Each certificate card has an Edit button that opens the same modal pre-filled with the certificate's existing data for updating.

### Delete Certificate
A Delete button on each card with a two-step confirmation (click once to reveal Confirm/Cancel) to prevent accidental deletion.

### Certificate Domains
Certificates are categorized into predefined domains: Software Engineering, Machine Learning, AI, Data Analytics, Data Science, Cybersecurity, Cloud Computing, and Other.

### Custom Domain Name
When selecting "Other" as the domain, a custom text input appears so users can enter any domain name they want.

### Expiry Date Toggle
An optional expiry date field on the certificate form. A "No expiry" checkbox lets users mark certificates that don't expire.

### Credential ID Field
An optional field to store the certificate's credential ID or license number, displayed on the public profile card.

### Public / Private Toggle
Each certificate card has a sliding toggle switch to instantly make a certificate public (visible on the public profile) or private (hidden from public view).

---

## File Uploads & Storage

### Image Upload for Certificates
Certificates support image uploads in JPG, PNG, or WebP format (max 5 MB). Images are stored in Supabase Storage and served via public URL.

### PDF Upload for Certificates
Certificates can also be uploaded as PDF files. PDFs are stored in Supabase Storage alongside images.

### PDF Preview in Cards
When a certificate is a PDF, the card displays a live iframe preview of the PDF instead of a placeholder icon.

### Image Preview in Cards
Image certificates display a cropped thumbnail preview in the card, with a subtle zoom-in hover effect.

### Avatar Upload
Users can upload a profile photo (JPG, PNG, or WebP, max 5 MB) in the Settings page. Hovering the avatar shows an upload icon overlay.

### File Replace / Remove
In the certificate form, after uploading a file, users can see the preview and choose to replace or remove it before saving.

---

## Certificate Card UI

### Domain Accent Bar
Each card has a 3px gradient bar at the top in a color unique to that domain, giving instant visual categorisation.

### Domain Color Badges
The domain label on each card is shown as a pill badge with a background, text color, and border that are distinct per domain.

### Hover Lift & Glow Effect
Certificate cards subtly rise with a `translateY` on hover, with a colored glow shadow matching the card's domain accent color.

### Issued & Expiry Dates
Each card shows the issue date and either the expiry date or "No expiry" below the certificate name and issuer.

---

## Certificate Lightbox (Full-Size Viewer)

### Full-Screen Image Viewer
Clicking a certificate image opens a full-screen lightbox overlay to view the certificate at full resolution.

### PDF Viewer
PDF certificates open in the lightbox as an embedded PDF viewer.

### Zoom In / Out
Zoom controls (+/−) and a percentage display allow users to zoom in and out on the certificate.

### Pan / Drag
When zoomed in, the certificate can be dragged/panned to see different parts of it.

### Scroll-to-Zoom
Mouse scroll wheel zooms the certificate in or out in the lightbox.

### Keyboard Shortcuts
The lightbox supports keyboard shortcuts: `+`/`-` to zoom, `0` to reset zoom, and `Esc` to close.

### Open Original
For image certificates, a button in the lightbox opens the original file in a new browser tab.

---

## Public Profile

### Public Profile Page
Every user gets a public profile page at a custom URL (e.g., `proofihub.vercel.app/username`) that is accessible to anyone without logging in.

### Profile Header
The public profile shows the user's avatar (or initials), full name, bio, certificate count, and last-updated date.

### Public Certificate Grid
Only certificates marked as public are shown on the profile, displayed in a 3-column responsive grid.

### Domain Filter Tabs
Filter buttons on the public profile let visitors filter certificates by domain category.

### Certificate Cards on Public Profile
Public profile certificate cards match the dashboard cards exactly — same accent bars, domain badges, dates, credential IDs, and full-size viewer.

### "Create Your Profile" CTA
A prominent call-to-action on the public profile page invites non-users to create their own Proofi AI profile.

### SEO Metadata
The public profile page generates custom `<title>` and `<description>` meta tags based on the user's name and bio, making it discoverable in search engines.

### Light/Dark Mode on Public Profile
Visitors can toggle between light and dark mode on the public profile page using a sun/moon button in the navbar.

---

## Settings Page

### Dedicated Settings Page
Profile settings live on a separate `/settings` page (not a popup or sidebar), accessible via the Settings link in the navbar.

### Back Navigation
A back button in the settings header takes the user back to the dashboard.

### Full Name
Users can edit their display name, which appears on their public profile.

### Bio
A short bio field (up to 160 characters) with a live character counter. Shown on the public profile below the user's name.

### Public Profile URL Display
The settings page shows the user's full public profile URL in a styled box with a one-click Copy button (shows "Copied!" feedback).

### Profile URL Slug
Users can customise the URL slug of their public profile (e.g., change `/john-doe` to `/johnd`). The field validates format in real time.

### Real-Time Slug Availability Check
As the user types a new slug, the app checks availability against the database with a debounce and shows "Available" or "Already taken" feedback instantly.

### Avatar Section
A dedicated profile photo card in settings shows the current avatar and lets users click to upload a new one.

---

## Theme System

### Light / Dark Mode Toggle
A sun/moon icon button in the dashboard navbar switches between light and dark mode instantly.

### Theme Persistence
The selected theme (light or dark) is saved to `localStorage` so it persists across sessions and page reloads.

### Default Dark Mode
Dark mode is the default theme. The app renders in dark mode immediately on load to avoid a flash of the wrong theme.

### Dashboard-Only Theming
Light/dark mode applies only to authenticated pages (dashboard and settings). The landing page is always dark, by design.

### Default Public Profile Theme
In settings, users can choose whether their public profile URL defaults to light or dark mode for visitors. This preference is stored in the database.

### Public Profile Theme Toggle
Visitors viewing a public profile can still manually toggle between light and dark mode using the toggle in the public profile navbar.

---

## Landing Page

### Hero Section
A full-screen hero with a bold headline, gradient text, animated glowing blobs, and sign-up / sign-in call-to-action buttons.

### Feature Highlights Section
A section on the landing page describing the core value propositions of Proofi AI with icons and short descriptions.

### How It Works
A 3-step visual walkthrough explaining how to sign up, add certificates, and share the public profile.

### Social Proof / Testimonials
A section with sample user testimonials to build trust with prospective users.

### Final CTA Section
A full-width call-to-action section at the bottom of the landing page prompting visitors to create their free profile.

### Always-Dark Landing Page
The landing page uses a fixed dark theme regardless of any system or user theme preference — only the authenticated area supports light mode.

---

## UI / UX Details

### Responsive Design
All pages adapt to mobile, tablet, and desktop screen sizes using responsive Tailwind CSS grid and flex layouts.

### Sticky Navigation
The navbar on both the dashboard and public profile sticks to the top of the page while scrolling, with a frosted glass backdrop blur effect.

### Loading Spinners
All async actions (saving profile, uploading avatar, adding a certificate) show a spinning loader in the button to indicate progress.

### Error & Success Messages
All forms surface contextual success (green) and error (red) messages with icons directly below the form fields or above the save button.

### Password Visibility Toggle
The login and sign-up forms have an eye icon to show or hide the password field.

### Initials Fallback Avatar
When no profile photo has been uploaded, the avatar shows the user's initials on a violet gradient background — consistent across dashboard, settings, and public profile.

### Smooth Hover Transitions
Buttons, cards, and links have smooth colour and transform transitions on hover throughout the app.

### Confirmation Step for Destructive Actions
Deleting a certificate requires a two-step confirmation click (Delete → Confirm / Cancel) to prevent accidental data loss.

### Domain-Aware Color System
Every domain has a unique set of accent colours (gradient bar, badge, glow) applied consistently across dashboard cards and public profile cards.
