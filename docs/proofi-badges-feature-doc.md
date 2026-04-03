# Proofi AI — Badges Feature Technical Document
### Version 2 Feature — Claude Code Developer Reference

---

## Critical Instructions for Claude Code

Read the entire existing codebase thoroughly before writing a single line of code. Every new component, every new page section, every new piece of UI must match the existing design system exactly — same Tailwind classes, same card styles, same color variables, same dark/light mode behavior, same animation patterns, same border radius, same font weights. This feature must feel like it was always part of the app.

All features must be fully mobile responsive. The layout must work perfectly at 375px, 768px, and 1280px. Use your experience as a developer to make every component genuinely great on mobile, not just technically responsive.

Do not break any existing functionality. Certificates, dashboard, settings, public profile, auth, and all existing features must continue to work exactly as before. This is purely additive.

---

## 1. Database Schema Changes

Add the following to `prisma/schema.prisma`. Do not modify any existing models.

```prisma
model Badge {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title               String
  issuingOrganization String
  description         String?
  issuedAt            DateTime
  expiresAt           DateTime?
  credentialId        String?
  credentialUrl       String?
  imageUrl            String?
  domain              String?
  isPublic            Boolean   @default(true)
  sortOrder           Int?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model CustomOrganization {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime @default(now())
}
```

Also add the reverse relations to the existing User model:

```prisma
badges               Badge[]
customOrganizations  CustomOrganization[]
```

After updating the schema run:

```bash
npx prisma migrate dev --name add_badges_and_custom_organizations
npx prisma generate
```

---

## 2. API Routes

Create the following new API routes. Follow the exact same patterns used in the existing certificate API routes.

### Badges CRUD

**`app/api/badges/route.ts`**
- `GET` — fetch all badges for the logged-in user, ordered by sortOrder then createdAt descending
- `POST` — create a new badge

**`app/api/badges/[id]/route.ts`**
- `GET` — fetch a single badge by ID
- `PUT` — update a badge
- `DELETE` — delete a badge, also delete its image from Supabase Storage if one exists

**`app/api/badges/[id]/visibility/route.ts`**
- `PATCH` — toggle isPublic true/false for a badge

### Custom Organizations CRUD

**`app/api/organizations/route.ts`**
- `GET` — fetch all custom organizations for the logged-in user
- `POST` — create a new custom organization

**`app/api/organizations/[id]/route.ts`**
- `DELETE` — delete a custom organization by ID. After deleting, find all badges by this user where `issuingOrganization` matches the deleted organization name and set their `issuingOrganization` to an empty string `""`

### Credly Import

**`app/api/badges/credly/route.ts`**
- `POST` — accepts a Credly badge URL in the request body
- Extracts the badge slug from the URL
- Fetches badge data from the Credly public API: `https://api.credly.com/v1/obi/v2/badges/{badge_slug}`
- Returns extracted fields: title, issuing organization name, description, issued date, expiry date, image URL, credential URL
- Handle errors gracefully: if the URL is invalid, not a Credly URL, or the API call fails, return a clear error message

Credly URL formats to handle:
```
https://www.credly.com/badges/{slug}
https://www.credly.com/badges/{slug}/public_url
https://credly.com/badges/{slug}
```

No API key is needed for the Credly public badge API.

### Public Profile Badges

**`app/api/public/[slug]/route.ts`**
Update the existing public profile API route to also return the user's public badges alongside their public certificates. Return them as a separate `badges` array in the response.

---

## 3. Supabase Storage

Create a new storage bucket called `badges` with public read access. Follow the exact same configuration as the existing `certificates` bucket.

File path pattern: `badges/{userId}/{badgeId}.{ext}`

Accepted formats: JPG, PNG, WebP, SVG
Max file size: 5MB

In the badge form, after image upload apply the same `compressImage` utility from `lib/compressImage.ts` that is already used for certificate images. SVG files bypass compression since they are vector format.

---

## 4. Dashboard Layout — Tab System

### Tab structure

Convert the main dashboard content area into a tabbed layout with two tabs: Certificates and Badges.

The right panel (calendar, streak, activity heatmap, annual goal, velocity badge, expiry alerts) must remain completely static and always visible regardless of which tab is active. It never changes, never re-renders, and never scrolls away when switching tabs. It is fixed to the right side at all times.

The left content area switches between the Certificates tab content and the Badges tab content when the user clicks the tabs.

### Tab component specification

Place the tab switcher at the very top of the left content area, above the statistics cards.

Desktop layout:
- Two tab buttons side by side: "Certificates" on the left, "Badges" on the right
- The active tab has a solid violet underline border and full opacity text
- The inactive tab has muted text and no underline
- Tab buttons are left-aligned, not centered, matching the existing dashboard heading style
- A badge count pill sits inside the Badges tab label showing the total badge count (e.g. "Badges 12") using the same pill style as domain badges throughout the app
- Switching tabs has a smooth fade transition on the content area (opacity 0 to 1, 150ms)

Mobile layout:
- On mobile the right panel (calendar/streaks) stacks below both tabs
- The tab switcher stays at the top of the page as a sticky element below the navbar
- Both tabs are full width on mobile, equal size, centered text
- Switching tabs scrolls the user back to the top of the content area automatically

### URL state

Reflect the active tab in the URL query parameter so direct links and browser back navigation work correctly:
- Certificates tab: `/dashboard?tab=certificates` (default, also works with no query param)
- Badges tab: `/dashboard?tab=badges`

Use `useSearchParams` and `useRouter` from Next.js to manage this without a full page reload.

---

## 5. Badges Tab — Statistics Cards

Show four statistics cards at the top of the Badges tab, identical in style to the existing certificate statistics cards:

| Card | Value | Icon |
|---|---|---|
| Total | Total badge count | same style as certificates total card |
| Public | Count where isPublic is true | same style as certificates public card |
| Private | Count where isPublic is false | same style as certificates private card |
| Organizations | Count of unique issuingOrganization values | same style as certificates domains card |

---

## 6. Badges Tab — Search, Filter, Sort

Place a search and sort bar below the statistics cards, identical in style and behavior to the existing certificate search and sort bar.

Search: real-time filter by badge title or issuing organization as the user types. Debounced at 300ms.

Sort options — use the exact same sort dropdown that exists for certificates with these options:
- Most recent (default) — sort by issuedAt descending
- Oldest first — sort by issuedAt ascending
- Alphabetical — sort by title A to Z
- Organization — sort by issuingOrganization A to Z

Filter dropdown: filter by issuingOrganization. Populate the dropdown dynamically from the user's actual badge organizations. Show "All" as the default option.

---

## 7. Badge Card Component

Create `components/BadgeCard.tsx`.

The badge card must be similar in structure to the existing certificate card but sized appropriately for badges which are typically square or near-square graphics. Use a slightly smaller card width than certificate cards. Show 4 badge cards per row on desktop, 2 per row on tablet, 1 per row on mobile.

Badge card content top to bottom:
- Badge image: square image area at the top of the card. If the badge image is a circular badge graphic (common with Credly badges), display it with a subtle circular treatment. If no image is uploaded, show a placeholder with the organization's initials on a violet gradient background
- Organization name: small muted text above the badge title
- Badge title: bold text, max 2 lines with text overflow ellipsis
- Description: optional, max 2 lines, small muted text
- Issue date and expiry date (or "No expiry") in the same style as certificate cards
- Credential ID if present, in small muted text
- Domain badge pill if domain is set, using the same domain color system as certificates
- Bottom row: visibility toggle switch (same as certificate cards) on the right, edit icon button and delete icon button on the left

The visibility toggle must be an optimistic UI update — flip the toggle instantly in the UI, then sync to the API in the background.

Delete confirmation: same two-step confirmation pattern as certificate cards (click Delete to reveal Confirm/Cancel).

If a `credentialUrl` is set, show a small external link icon on the card that opens the URL in a new tab. Style it as a subtle icon button in the top right corner of the card.

Apply the same certificate strength bar concept from the intelligent features document at the bottom of each badge card, scored as follows:

| Criterion | Points |
|---|---|
| Has badge image uploaded | 2 |
| Has credential ID | 1 |
| Has credential URL | 1 |
| Has description | 1 |

---

## 8. Add / Edit Badge Modal

Create `components/BadgeForm.tsx`. Follow the exact same modal pattern, animation, and layout as the existing certificate form modal.

### Credly import section

At the very top of the modal, before any form fields, add a Credly import section:

```
┌─────────────────────────────────────────────────────┐
│  Import from Credly                                  │
│  Paste your Credly badge URL to auto-fill the form  │
│  ┌──────────────────────────────────┐ [Import]      │
│  │ https://www.credly.com/badges/…  │               │
└─────────────────────────────────────────────────────┘
```

Behavior:
- User pastes a Credly badge URL into the input and clicks Import
- Show a loading spinner inside the Import button while the API call runs
- On success: auto-populate title, issuing organization, description, issue date, expiry date, image URL, and credential URL fields with the extracted data
- Show a green success message: "Badge details imported from Credly. Review and save."
- On failure: show an amber warning: "Could not import from this URL. Please fill in the details manually."
- After import, all fields remain editable so the user can adjust anything

Separate the Credly import section from the manual form fields with a divider labeled "or fill in manually".

### Form fields in order

**1. Badge image upload**

File upload area at the top, same style as the certificate file upload. Accepts JPG, PNG, WebP, SVG up to 5MB. Shows a preview after upload. For SVG files, render them as an `<img>` tag. Include a remove button to clear the uploaded image.

**2. Badge title** (required)
Text input. Placeholder: "e.g. AWS Certified Solutions Architect"

**3. Issuing organization** (required)
Custom dropdown component — see Section 9 below for full specification.

**4. Description** (optional)
Textarea, max 300 characters, with a live character counter. Placeholder: "What did you earn this badge for?"

**5. Issue date** (required)
Date picker. Same style as the certificate issue date field.

**6. Expiration date** (optional)
Date picker with a "No expiry" checkbox. Same behavior as the certificate expiry date field. When "No expiry" is checked, the date picker is disabled and hidden.

**7. Credential ID** (optional)
Text input. Placeholder: "Badge ID or license number"

**8. Credential URL** (optional)
URL input. Placeholder: "https://www.credly.com/badges/..."
Validate that the value is a valid URL format if filled in. Show an error if it is not a valid URL.

**9. Domain** (optional)
Same domain dropdown as the certificate form with all the same options and custom option behavior.

**Validation:**
- Title and issuing organization are required
- Issue date is required
- Show inline validation errors in the same style as the certificate form
- Disable the Save button while any required field is empty

---

## 9. Issuing Organization Dropdown — Full Specification

This is a custom dropdown component. Create it at `components/OrganizationDropdown.tsx`.

### Default organization list

The following organizations are hardcoded as defaults and cannot be deleted by the user:

```typescript
export const DEFAULT_ORGANIZATIONS = [
  "Amazon Web Services (AWS)",
  "Microsoft",
  "Google",
  "Meta",
  "LinkedIn Learning",
  "Coursera",
  "Udemy",
  "edX",
  "Cisco",
  "CompTIA",
  "PMI (Project Management Institute)",
  "Scrum Alliance",
  "Salesforce",
  "HubSpot Academy",
  "IBM",
  "Oracle",
  "Adobe",
  "Atlassian",
  "HashiCorp",
  "Docker",
  "Kubernetes (CNCF)",
  "GitHub",
  "GitLab",
  "Credly",
  "Holopin",
  "Pluralsight",
  "A Cloud Guru",
  "Linux Foundation",
  "Databricks",
  "Snowflake",
  "Tableau",
  "Splunk",
  "Palo Alto Networks",
  "Fortinet",
  "ISACA",
  "ISC2",
  "EC-Council",
  "AXELOS (PRINCE2 / ITIL)",
  "PeopleCert",
  "Six Sigma Council",
  "ASQ",
  "HRCI",
  "SHRM",
  "CFA Institute",
  "ACCA",
  "Chartered Institute of Marketing",
  "BCS (British Computer Society)",
  "Autodesk",
  "Unity",
  "Unreal Engine (Epic Games)",
  "Sketch",
  "Figma",
  "Canva",
]
```

### Dropdown behavior

The dropdown is a searchable custom select component, not a native HTML select.

When the user clicks the field:
- A dropdown panel opens below the input
- A search input at the top of the panel lets the user type to filter the list
- The full list of default organizations shows, sorted alphabetically
- Below the default organizations, any custom organizations the user has added are shown with a small "Custom" label and a delete icon next to each one
- The very last item in the list is always "Add custom organization..." styled differently (violet text, plus icon) — this never disappears from the list

When the user clicks "Add custom organization...":
- A modal opens with a single text input: "Organization name"
- A Save button and a Cancel button
- Validation: name must be at least 2 characters and must not already exist in the list (case insensitive check)
- On save: call `POST /api/organizations` to save to the database, add it to the dropdown list, and automatically select it as the current value
- Close the modal

When the user clicks the delete icon on a custom organization:
- A confirmation modal opens: "Delete [Organization Name]? All badges using this organization will have their organization field cleared. This cannot be undone."
- Two buttons: "Delete" (red) and "Cancel"
- On confirm: call `DELETE /api/organizations/{id}`, remove from the dropdown list
- If the currently selected value in any open badge form matches the deleted organization, clear that field to empty

Custom organizations are stored in the `CustomOrganization` table and fetched from `GET /api/organizations` when the dropdown mounts. Merge them with the hardcoded default list for display.

Default organizations cannot have a delete icon. They are permanent.

---

## 10. Public Profile — Badges Display

This section is intentionally designed to be visually stunning and impressive. Use your full creative judgment as a developer to implement this. The goal is that when someone opens a public profile with badges, they are immediately struck by how professional and distinctive it looks.

### Profile header update

In the public profile header, update the credential count line to show both certificates and badges:

```
12 certificates  ·  8 badges
```

Both numbers are shown as separate pill badges with different colors — violet for certificates, cyan/teal for badges — so they are visually distinct at a glance.

### Badges section placement

The badges section appears between the profile header and the certificate grid. It only renders if the user has at least one public badge.

Section heading: "Badges & Credentials" with a subtle verified checkmark icon.

### Hexagonal badge wall

Display public badges in an interlocking hexagonal grid layout. This is the signature visual treatment for this feature.

Implementation approach:
- Each badge is displayed inside a hexagon shape created with CSS clip-path: `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`
- The hexagon contains the badge image, scaled to fill the shape
- If no image, show the organization initials on a violet gradient background inside the hexagon
- Hexagons are arranged in an offset grid: odd rows are shifted right by half a hexagon width to create the interlocking pattern
- Each hexagon has a subtle violet border glow on hover
- Hexagon size: 90px on desktop, 70px on tablet, 60px on mobile

On hover of any hexagon:
- The hexagon scales up slightly (transform: scale(1.08)) with a smooth transition
- A tooltip appears above the hexagon showing: badge title, organization name, and issue date
- A verified checkmark icon appears if the badge has a credentialUrl

On click of any hexagon:
- Open a badge detail lightbox/modal (see below)

Show a maximum of 24 badges in the hexagonal wall. If the user has more than 24 public badges, show a "View all X badges" button below the wall that expands to show all of them.

### Pinned / featured badges

If the user has any badges marked as featured (add an `isFeatured Boolean @default(false)` field to the Badge model), show up to 3 featured badges above the hexagonal wall in a larger "trophy shelf" format.

Each featured badge is displayed as a larger card (approximately 2x the size of a wall hexagon) with:
- The badge image in a prominent circular frame with a golden/amber ring border
- Badge title in bold below
- Organization name in muted text
- A "Featured" label in the top corner

The trophy shelf sits in a row of up to 3 items, centered on the page.

In the dashboard badge cards, add a "Pin to profile" star icon button that toggles `isFeatured`. If the user tries to feature a 4th badge while 3 are already featured, show a message: "You can only feature up to 3 badges. Unpin one first."

### Verified badge indicator

Any badge with a non-empty `credentialUrl` gets a small teal verified checkmark badge overlaid on the bottom-right corner of its hexagon in the wall. This is a small circle with a checkmark icon, using the same green/teal color as the verified indicators elsewhere in the app.

### Badge detail lightbox

When a user clicks any badge in the hexagonal wall or the trophy shelf, open a full-screen modal overlay (same lightbox pattern as the existing certificate lightbox) showing:

- Badge image large and centered (circular frame for circular badge images)
- Badge title in large bold text
- Issuing organization with their logo if recognizable, otherwise just the name
- Date issued and expiry date or "No expiry"
- Description if present
- Credential ID if present
- A prominent "Verify credential" button if credentialUrl is present — this opens the URL in a new tab. Style this button in teal/green to emphasize the verified nature
- A "Share this badge" button that copies a direct link to this badge on the user's profile to the clipboard

### Domain integration

The existing domain filter tabs on the public profile must include badges in their filtering. When a visitor selects a domain tab, they see both certificates and badges that match that domain. Badges appear in their hexagonal section filtered, certificates appear in the grid filtered.

If a domain has only badges and no certificates (or vice versa), that domain tab still appears and shows only the relevant content type.

### Animation on load

When the public profile loads:
- The profile header fades in first (0ms delay)
- The trophy shelf featured badges pop in with a scale animation, staggered 100ms apart (200ms delay)
- The hexagonal badge wall tiles animate in from the center outward, each hexagon scaling from 0 to 1 with a staggered delay of 30ms per badge
- The certificate grid fades in below (after badges complete)

Wrap all animations in `@media (prefers-reduced-motion: no-preference)` to respect accessibility preferences.

### Mobile public profile

On mobile:
- The hexagonal grid becomes a 3-column grid of circles instead of hexagons (simpler to implement reliably on small screens, still visually distinct)
- The trophy shelf stacks vertically, 1 per row
- The badge detail lightbox becomes a full-screen bottom sheet on mobile
- Tooltips on hover become tap-to-show on mobile

---

## 11. File Structure for New Code

```
prisma/
└── schema.prisma                          ← updated with Badge and CustomOrganization models

app/
├── api/
│   ├── badges/
│   │   ├── route.ts                       ← GET all, POST create
│   │   ├── [id]/
│   │   │   ├── route.ts                   ← GET, PUT, DELETE
│   │   │   └── visibility/route.ts        ← PATCH toggle
│   │   └── credly/route.ts                ← POST Credly import
│   └── organizations/
│       ├── route.ts                       ← GET all, POST create
│       └── [id]/route.ts                  ← DELETE
└── dashboard/
    └── page.tsx                           ← updated with tab system

components/
├── BadgeCard.tsx                          ← badge card for dashboard
├── BadgeForm.tsx                          ← add/edit badge modal
├── BadgeWall.tsx                          ← hexagonal grid for public profile
├── BadgeLightbox.tsx                      ← full screen badge viewer
├── BadgeTrophyShelf.tsx                   ← featured badges display
├── OrganizationDropdown.tsx               ← custom organization dropdown
└── DashboardTabs.tsx                      ← tab switcher component

lib/
├── defaultOrganizations.ts               ← hardcoded default organizations list
└── smartCrop.ts                          ← pure canvas-based smart crop utility (no AI)
```

---

## 12. Build Order

Build in this exact sequence to minimize risk and make testing easier at each step:

1. Database schema migration — add Badge and CustomOrganization models, run migration
2. API routes — badges CRUD, organizations CRUD, Credly import, update public profile route
3. `lib/smartCrop.ts` — build and test the smart crop utility in isolation
4. `OrganizationDropdown` component — build and test in isolation
5. `BadgeForm` modal — build with all fields, Credly import, smart crop pipeline, and file type handling
6. `BadgeCard` component — build the dashboard card
7. `DashboardTabs` component — add the tab switcher to the dashboard
8. Badges tab content — wire up statistics cards, search, sort, filter, and badge card grid
9. `BadgeWall` hexagonal component — build for public profile
10. `BadgeTrophyShelf` — featured badges on public profile
11. `BadgeLightbox` — badge detail viewer
12. Public profile integration — wire up all badge components with animations
13. Mobile testing pass — verify every new component at 375px, 768px, and 1280px

---

## 13. File Upload — All File Types Supported

### Accepted file types

The badge image upload field must accept all of the following file types with no restrictions beyond size:

- Images: JPG, JPEG, PNG, WebP, SVG, GIF, BMP, TIFF, AVIF, HEIC
- Documents: PDF
- Any other file the browser's file picker allows

Do not whitelist specific MIME types in the file input. Use `accept="*/*"` on the input element so the user can upload anything. Validate the file size client-side (max 5MB) and show a clear error if exceeded. Do not validate file type — accept everything.

### File handling by type

Apply the following logic based on the file type after the user selects a file:

```typescript
function getFileCategory(file: File): "image" | "svg" | "pdf" | "other" {
  if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) return "svg"
  if (file.type.startsWith("image/")) return "image"
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return "pdf"
  return "other"
}
```

| File category | Compression | Smart crop | Preview in form | Preview in card |
|---|---|---|---|---|
| Image (JPG, PNG, WebP, etc.) | Yes — compress to under 500KB using existing `compressImage` utility, AFTER smart crop | Yes — run smart crop first, then compress the result | Cropped image thumbnail | Cropped image thumbnail |
| SVG | No — SVGs are vector, compression is meaningless | No — SVGs are resolution-independent | SVG rendered as `<img>` tag | SVG rendered as `<img>` tag |
| PDF | No | No | PDF iframe preview same as existing certificate PDF preview | PDF iframe preview |
| Other | No | No | Generic file icon with filename | Generic file icon with filename |

### Supabase Storage upload

Upload all file types to the `badges` bucket regardless of type. Store the file exactly as received after any processing (crop, compress). The `imageUrl` field on the Badge model stores the public Supabase Storage URL for all file types, not just images.

---

## 14. Smart Crop — Auto-Detect Badge Area

### What this does

When a user uploads an image file (not SVG, not PDF), automatically detect the actual badge or content area within the image and crop away the surrounding empty space. This handles the case where a user takes a screenshot of a webpage and the badge is a small element surrounded by large amounts of white or transparent background.

This is entirely algorithmic using the browser Canvas API. No AI, no external service, no API calls. Pure pixel analysis.

### Implementation

Create a new utility file at `lib/smartCrop.ts`:

```typescript
export interface CropResult {
  croppedFile: File
  wasCropped: boolean
  originalDimensions: { width: number; height: number }
  croppedDimensions: { width: number; height: number }
}

const PADDING_PX = 12
const MIN_CROP_BENEFIT_PERCENT = 10
const SAMPLE_STEP = 2
const EDGE_TOLERANCE = 15

export async function smartCropBadge(file: File): Promise<CropResult> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          croppedDimensions: { width: img.naturalWidth, height: img.naturalHeight },
        })
        return
      }

      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data, width, height } = imageData

      const bgColor = detectBackgroundColor(data, width, height)

      const bounds = findContentBounds(data, width, height, bgColor, SAMPLE_STEP, EDGE_TOLERANCE)

      if (!bounds) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width, height },
          croppedDimensions: { width, height },
        })
        return
      }

      const cropX = Math.max(0, bounds.left - PADDING_PX)
      const cropY = Math.max(0, bounds.top - PADDING_PX)
      const cropW = Math.min(width, bounds.right + PADDING_PX) - cropX
      const cropH = Math.min(height, bounds.bottom + PADDING_PX) - cropY

      const cropAreaPercent = (cropW * cropH) / (width * height) * 100
      const savedPercent = 100 - cropAreaPercent

      if (savedPercent < MIN_CROP_BENEFIT_PERCENT) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width, height },
          croppedDimensions: { width, height },
        })
        return
      }

      const croppedCanvas = document.createElement("canvas")
      croppedCanvas.width = cropW
      croppedCanvas.height = cropH
      const croppedCtx = croppedCanvas.getContext("2d")

      if (!croppedCtx) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width, height },
          croppedDimensions: { width, height },
        })
        return
      }

      croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              croppedFile: file,
              wasCropped: false,
              originalDimensions: { width, height },
              croppedDimensions: { width, height },
            })
            return
          }

          const croppedFile = new File([blob], file.name, { type: "image/png" })

          resolve({
            croppedFile,
            wasCropped: true,
            originalDimensions: { width, height },
            croppedDimensions: { width: cropW, height: cropH },
          })
        },
        "image/png",
        0.95
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        croppedFile: file,
        wasCropped: false,
        originalDimensions: { width: 0, height: 0 },
        croppedDimensions: { width: 0, height: 0 },
      })
    }

    img.src = url
  })
}

interface BackgroundColor {
  r: number
  g: number
  b: number
  isTransparent: boolean
}

function detectBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): BackgroundColor {
  const corners = [
    getPixel(data, width, 0, 0),
    getPixel(data, width, width - 1, 0),
    getPixel(data, width, 0, height - 1),
    getPixel(data, width, width - 1, height - 1),
    getPixel(data, width, Math.floor(width / 2), 0),
    getPixel(data, width, 0, Math.floor(height / 2)),
    getPixel(data, width, width - 1, Math.floor(height / 2)),
    getPixel(data, width, Math.floor(width / 2), height - 1),
  ]

  const transparentCount = corners.filter((c) => c.a < 30).length
  if (transparentCount >= 5) {
    return { r: 0, g: 0, b: 0, isTransparent: true }
  }

  const opaque = corners.filter((c) => c.a >= 200)
  const avgR = Math.round(opaque.reduce((s, c) => s + c.r, 0) / opaque.length)
  const avgG = Math.round(opaque.reduce((s, c) => s + c.g, 0) / opaque.length)
  const avgB = Math.round(opaque.reduce((s, c) => s + c.b, 0) / opaque.length)

  return { r: avgR, g: avgG, b: avgB, isTransparent: false }
}

interface Bounds {
  top: number
  bottom: number
  left: number
  right: number
}

function findContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bg: BackgroundColor,
  step: number,
  tolerance: number
): Bounds | null {
  let top = height
  let bottom = 0
  let left = width
  let right = 0
  let found = false

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const pixel = getPixel(data, width, x, y)

      if (isBackground(pixel, bg, tolerance)) continue

      found = true
      if (y < top) top = y
      if (y > bottom) bottom = y
      if (x < left) left = x
      if (x > right) right = x
    }
  }

  if (!found) return null

  return { top, bottom, left, right }
}

function getPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } {
  const idx = (y * width + x) * 4
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3],
  }
}

function isBackground(
  pixel: { r: number; g: number; b: number; a: number },
  bg: BackgroundColor,
  tolerance: number
): boolean {
  if (pixel.a < 30) return true

  if (bg.isTransparent) return pixel.a < 30

  return (
    Math.abs(pixel.r - bg.r) <= tolerance &&
    Math.abs(pixel.g - bg.g) <= tolerance &&
    Math.abs(pixel.b - bg.b) <= tolerance &&
    pixel.a > 200
  )
}
```

### How the algorithm works (no AI)

The algorithm is pure pixel mathematics in 5 steps:

**Step 1 — Background color detection:** Sample 8 pixels from the corners and edges of the image. If more than half are transparent (alpha < 30), treat the background as transparent. Otherwise average their RGB values to get the background color. This handles white backgrounds, light gray backgrounds, dark backgrounds, and transparent PNG backgrounds.

**Step 2 — Content bounds scan:** Walk every pixel in the image (stepping by 2 pixels at a time for performance). For each pixel, check if it matches the background color within a tolerance of 15 RGB units. If it does not match, it is content. Track the topmost, bottommost, leftmost, and rightmost content pixels found.

**Step 3 — Benefit check:** Calculate what percentage of the image is inside the content bounding box. If cropping would save less than 10% of the image area, the image is already well-cropped and the original is returned unchanged.

**Step 4 — Crop and pad:** Crop the image to the content bounding box plus 12 pixels of padding on all sides so the badge does not touch the edges. Clamp to image boundaries so padding never goes out of bounds.

**Step 5 — Output:** Draw the cropped region onto a new canvas and export as PNG. Return the cropped file alongside metadata about what was done.

### Integration into the badge upload form

In `BadgeForm.tsx`, when a user selects an image file, run the following pipeline in order before uploading:

```typescript
import { smartCropBadge } from "@/lib/smartCrop"
import { compressImage } from "@/lib/compressImage"

const handleFileSelect = async (file: File) => {
  const category = getFileCategory(file)

  setIsProcessing(true)
  setProcessingMessage("Detecting badge area...")

  let fileToUpload = file

  if (category === "image") {
    const cropResult = await smartCropBadge(file)
    fileToUpload = cropResult.croppedFile

    if (cropResult.wasCropped) {
      setProcessingMessage("Optimising image...")
    }

    fileToUpload = await compressImage(fileToUpload)
  }

  setIsProcessing(false)
  setPreviewFile(fileToUpload)
  setPendingUpload(fileToUpload)
}
```

Show the processing state in the upload area as a small spinner with the current message text ("Detecting badge area..." then "Optimising image..."). Disable the form submit button during processing.

After processing, show the preview of the final cropped and compressed image. If the image was cropped, show a small informational note below the preview:

```
Badge area auto-detected and cropped. If this looks wrong, upload your image again.
```

If processing fails for any reason at any step, silently fall back to the original file and show no error message. The upload must never fail because of smart crop or compression.

### What smart crop does NOT do

Smart crop does not:
- Use any machine learning or AI model
- Make any API calls
- Understand what a badge looks like
- Segment objects or detect shapes

It simply finds the bounding box of pixels that do not match the background color. It works for any content on a uniform background — badges, logos, certificates, any graphic surrounded by whitespace or a solid color background.

### Cases where smart crop intentionally does nothing

- The image is a PDF — skip entirely
- The image is an SVG — skip entirely
- The image is any non-image file type — skip entirely
- The detected crop area saves less than 10% of the image — return original, it is already well-cropped
- The entire image is content with no clear background — return original
- Any error occurs during canvas processing — return original silently

---



- Match the existing design system exactly — read existing components before building new ones
- All new Supabase Storage operations must follow the same pattern as existing certificate storage operations
- Use `useMemo` for any computed values derived from the badge array (statistics counts, filtered lists, sorted lists)
- All loading states must show the existing spinner pattern used throughout the app
- All error states must use the existing error message style used throughout the app
- Dark mode and light mode must work perfectly for every new element
- No new npm packages unless absolutely necessary. If a new package is needed, state why before installing it
- Run `npm run build` after completing all steps and fix every error before pushing
