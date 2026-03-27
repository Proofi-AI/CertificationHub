# Proofi AI — Intelligent Features Technical Document
### Non-LLM, Zero API Key Features — Claude Code Developer Reference

---

## Important Instructions for Claude Code

Before building anything, read the entire existing codebase thoroughly. Match the existing design system exactly — same Tailwind classes, same card styles, same border radius, same color variables, same spacing, same dark/light mode behavior, same font weights, same animation patterns. Every feature in this document must feel like it was always part of the app, not bolted on.

All features in this document are 100% algorithmic. No external API calls. No LLM. No AI services. No new environment variables. Everything runs on pure JavaScript/TypeScript logic derived from the certificate data already in the database.

All features must be fully mobile responsive. Use your experience and judgment as a developer to make every component genuinely mobile friendly at 375px, 768px, and 1280px. Do not just make it technically responsive — make it feel great on mobile.

All features must work for any category of certificate from any field in the world. The logic must not assume tech, engineering, or IT certificates. It must work equally well for medical certifications, culinary arts, legal credentials, fitness training, financial licenses, language proficiency, project management, HR, real estate, aviation, maritime, teaching, arts, music, sports coaching, safety training, and every other field. Build every data map and every piece of logic with this universal breadth in mind.

---

## Feature 1: Profile Completeness Score

### Overview

A visual progress indicator that scores how complete and professional a user's Proofi profile is. Shown on the dashboard. Updates in real time as the user makes changes. Drives engagement by giving users specific, actionable steps to improve their profile.

### Scoring Logic

Calculate a score out of 100 using the following weighted criteria. Derive all values from existing data — no new database fields needed except `goal` which is stored in localStorage.

| Criterion | Points | How to check |
|---|---|---|
| Has a profile photo uploaded | 15 | avatarUrl is not null and not empty |
| Has a bio written | 10 | bio is not null and length is 10 characters or more |
| Has a custom slug set | 5 | slug does not match the auto-generated default pattern (e.g. does not end in a number) |
| Has at least 1 certificate | 15 | certificates.length >= 1 |
| Has at least 3 certificates | 10 | certificates.length >= 3 |
| Has at least 1 certificate with an image uploaded | 10 | at least one certificate has a non-null imageUrl |
| Has at least 1 certificate with a credential ID | 10 | at least one certificate has a non-null credentialId |
| Has certificates in 2 or more domains | 10 | unique domains count >= 2 |
| Has at least 1 public certificate | 10 | at least one certificate has isPublic = true |
| Has set an annual goal | 5 | localStorage key "proofi_annual_goal" exists and is a number greater than 0 |

Total possible: 100 points.

### Score Tier Labels

| Score range | Label | Color |
|---|---|---|
| 0 to 29 | Just getting started | Amber |
| 30 to 59 | Building up | Blue |
| 60 to 84 | Looking strong | Violet |
| 85 to 100 | Profile pro | Green |

### UI Specification

Location: Top of the dashboard, above the statistics cards, inside its own card component.

Layout:
- Left side: circular progress ring showing the score percentage. Inside the ring, show the numeric score (e.g. "72") in large bold text and "/ 100" in small muted text below it
- Right side: the tier label as a colored pill badge, a single sentence summary (e.g. "Your profile is looking strong. A few more steps to reach Profile Pro."), and a vertical list of up to 3 incomplete criteria shown as actionable checklist items with a circle icon
- Each checklist item is clickable. Clicking it scrolls the user to the relevant section of the dashboard or opens the settings page depending on what needs fixing
- Completed criteria are shown with a filled checkmark and muted text. Incomplete ones are shown with an empty circle and primary text
- Show only the 3 highest-value incomplete criteria, not all of them, to avoid overwhelming the user
- Animate the progress ring filling up on page load using a CSS transition

Mobile: Stack the ring above the text content. Keep the ring smaller on mobile (80px diameter vs 100px on desktop).

---

## Feature 2: Certificate Strength Indicator

### Overview

Each individual certificate card gets a small strength indicator showing how complete and credible that specific certificate entry is. This is per-card, not per-profile. It motivates users to fill in all optional fields.

### Strength Scoring Per Certificate

Score each certificate out of 5 points:

| Criterion | Points |
|---|---|
| Has a certificate image or PDF uploaded | 2 |
| Has a credential ID filled in | 1 |
| Has a specific issue date (not just a year) | 1 |
| Has an expiry date set OR "no expiry" explicitly checked | 1 |

Total possible: 5 points.

### Strength Levels

| Score | Label | Visual |
|---|---|---|
| 5 | Complete | Solid green bar, full width |
| 3 to 4 | Good | Blue bar, 70% width |
| 1 to 2 | Basic | Amber bar, 40% width |
| 0 | Incomplete | Red bar, 15% width |

### UI Specification

Location: Inside each certificate card, at the very bottom of the card, below the dates row.

Layout:
- A thin horizontal bar (4px height, full card width, rounded) that fills proportionally and uses the color from the strength level table above
- On hover of the bar, show a tooltip listing exactly which fields are missing. For example: "Add a credential ID and an expiry date to complete this certificate"
- On mobile, the tooltip appears as a small popover below the bar on tap, dismissible by tapping elsewhere
- The bar must respect the card's domain accent color system — do not override the domain color bar at the top. The strength bar sits at the bottom and is a separate element

Do not show the label text ("Complete", "Good", etc.) on the card itself. Only show it in the tooltip to keep the card clean.

---

## Feature 3: Smart Certificate Warnings and Insights

### Overview

A contextual insights panel on the dashboard that analyzes the user's certificate portfolio and surfaces relevant observations. Entirely rule-based. No LLM. Uses a comprehensive hardcoded knowledge map covering all professional fields worldwide.

### The Domain Relationship Map

This is the core of this feature. Build a comprehensive `domainRelationships` map in a dedicated file at `lib/domainMap.ts`. The map covers every professional field broadly. Below is the required structure and a representative sample. Claude Code must expand this map to be as comprehensive as possible covering all professional fields.

```typescript
// lib/domainMap.ts

export interface DomainRelationship {
  complementary: string[]   // domains that pair well with this one
  progressionPath: string[] // natural next steps from this domain
  keywords: string[]        // keywords to match against certificate names and issuers
}

export const domainMap: Record<string, DomainRelationship> = {

  // Technology fields
  "software engineering": {
    complementary: ["cloud computing", "cybersecurity", "devops", "agile & project management"],
    progressionPath: ["solutions architecture", "engineering management", "devops"],
    keywords: ["software", "developer", "programming", "coding", "engineer", "development", "web", "mobile", "backend", "frontend", "fullstack"]
  },
  "cloud computing": {
    complementary: ["devops", "cybersecurity", "software engineering", "networking"],
    progressionPath: ["solutions architecture", "cloud security", "site reliability engineering"],
    keywords: ["cloud", "aws", "azure", "gcp", "google cloud", "infrastructure", "serverless", "kubernetes", "terraform"]
  },
  "cybersecurity": {
    complementary: ["networking", "cloud computing", "ethical hacking", "risk management"],
    progressionPath: ["security architecture", "penetration testing", "CISO track"],
    keywords: ["security", "cyber", "comptia", "cissp", "ceh", "penetration", "ethical hacking", "soc", "siem", "firewall"]
  },
  "data science": {
    complementary: ["machine learning", "statistics", "cloud computing", "data engineering"],
    progressionPath: ["machine learning engineering", "AI research", "data leadership"],
    keywords: ["data science", "data analyst", "analytics", "python", "r programming", "statistics", "pandas", "jupyter"]
  },
  "machine learning": {
    complementary: ["data science", "cloud computing", "mathematics", "software engineering"],
    progressionPath: ["AI engineering", "MLOps", "AI research"],
    keywords: ["machine learning", "deep learning", "neural", "tensorflow", "pytorch", "nlp", "computer vision", "ai"]
  },

  // Business and management fields
  "project management": {
    complementary: ["agile", "leadership", "risk management", "business analysis"],
    progressionPath: ["program management", "portfolio management", "PMO leadership"],
    keywords: ["project management", "pmp", "prince2", "capm", "project manager", "pmbok"]
  },
  "agile": {
    complementary: ["project management", "software engineering", "scrum", "product management"],
    progressionPath: ["agile coaching", "scaled agile", "product leadership"],
    keywords: ["agile", "scrum", "kanban", "sprint", "safe", "scrum master", "csm", "psm", "retrospective"]
  },
  "business analysis": {
    complementary: ["project management", "data analytics", "product management", "finance"],
    progressionPath: ["senior business analyst", "product ownership", "business architecture"],
    keywords: ["business analysis", "business analyst", "ba", "cbap", "requirements", "process improvement", "iiba"]
  },
  "human resources": {
    complementary: ["leadership", "organizational development", "employment law", "payroll"],
    progressionPath: ["HR business partner", "people operations", "CHRO track"],
    keywords: ["human resources", "hr", "shrm", "cipd", "talent", "recruitment", "people management", "payroll", "hrm"]
  },
  "marketing": {
    complementary: ["digital marketing", "data analytics", "social media", "content strategy"],
    progressionPath: ["marketing management", "brand strategy", "CMO track"],
    keywords: ["marketing", "digital marketing", "seo", "sem", "google ads", "facebook ads", "content", "brand", "hubspot"]
  },
  "finance": {
    complementary: ["accounting", "risk management", "investment", "financial planning"],
    progressionPath: ["financial management", "CFO track", "investment banking"],
    keywords: ["finance", "financial", "cfa", "cfp", "investment", "portfolio", "financial planning", "treasury", "banking"]
  },
  "accounting": {
    complementary: ["finance", "taxation", "audit", "financial reporting"],
    progressionPath: ["senior accountant", "controller", "CFO track"],
    keywords: ["accounting", "accountant", "cpa", "cma", "acca", "quickbooks", "audit", "bookkeeping", "tax", "gaap"]
  },

  // Healthcare and medical fields
  "healthcare": {
    complementary: ["clinical skills", "patient care", "medical terminology", "health informatics"],
    progressionPath: ["clinical leadership", "healthcare administration", "specialized practice"],
    keywords: ["healthcare", "health", "medical", "clinical", "patient", "hospital", "nursing", "physician", "allied health"]
  },
  "nursing": {
    complementary: ["patient care", "clinical skills", "pharmacology", "emergency care"],
    progressionPath: ["advanced practice nursing", "nurse practitioner", "nursing leadership"],
    keywords: ["nursing", "nurse", "rn", "lpn", "nclex", "clinical nursing", "patient care", "bls", "acls"]
  },
  "first aid & safety": {
    complementary: ["occupational health", "emergency response", "workplace safety"],
    progressionPath: ["paramedic", "emergency medical technician", "occupational health officer"],
    keywords: ["first aid", "cpr", "bls", "acls", "aed", "emergency", "red cross", "st john", "lifesaving", "resuscitation"]
  },
  "mental health": {
    complementary: ["counselling", "psychology", "social work", "mindfulness"],
    progressionPath: ["licensed therapist", "clinical psychologist", "mental health leadership"],
    keywords: ["mental health", "counselling", "counseling", "psychology", "therapy", "psychotherapy", "mindfulness", "cbt", "social work"]
  },
  "nutrition": {
    complementary: ["fitness", "health coaching", "food safety", "sports science"],
    progressionPath: ["registered dietitian", "clinical nutritionist", "sports nutritionist"],
    keywords: ["nutrition", "dietitian", "dietetics", "nutritionist", "food science", "dietary", "wellness", "health coaching"]
  },

  // Fitness and sports fields
  "fitness & personal training": {
    complementary: ["nutrition", "sports science", "first aid & safety", "health coaching"],
    progressionPath: ["strength and conditioning", "sports performance", "fitness management"],
    keywords: ["personal training", "fitness", "pt", "gym instructor", "ace", "nasm", "reps", "strength", "conditioning", "exercise science"]
  },
  "sports coaching": {
    complementary: ["sports science", "fitness & personal training", "leadership", "sports psychology"],
    progressionPath: ["head coach", "sports director", "performance director"],
    keywords: ["coaching", "sports coach", "athletics", "football", "soccer", "basketball", "tennis", "swimming", "cricket", "rugby"]
  },

  // Education and teaching
  "teaching & education": {
    complementary: ["curriculum design", "educational technology", "leadership", "special education"],
    progressionPath: ["senior teacher", "department head", "school leadership"],
    keywords: ["teaching", "teacher", "education", "pgce", "qts", "pedagogy", "curriculum", "instructional design", "e-learning"]
  },
  "training & facilitation": {
    complementary: ["instructional design", "coaching", "leadership", "public speaking"],
    progressionPath: ["learning and development manager", "chief learning officer"],
    keywords: ["training", "facilitation", "facilitator", "l&d", "learning development", "corporate training", "workshop", "atd", "cplp"]
  },

  // Legal and compliance fields
  "legal": {
    complementary: ["compliance", "risk management", "contract management", "employment law"],
    progressionPath: ["senior lawyer", "legal counsel", "general counsel"],
    keywords: ["legal", "law", "lawyer", "attorney", "solicitor", "barrister", "paralegal", "compliance", "contract", "llb", "llm"]
  },
  "compliance": {
    complementary: ["risk management", "legal", "audit", "data privacy"],
    progressionPath: ["compliance manager", "chief compliance officer"],
    keywords: ["compliance", "regulatory", "gdpr", "iso", "audit", "risk", "governance", "aml", "kyc", "crcm"]
  },

  // Creative and design fields
  "graphic design": {
    complementary: ["ui ux design", "photography", "branding", "digital marketing"],
    progressionPath: ["senior designer", "art director", "creative director"],
    keywords: ["graphic design", "design", "adobe", "photoshop", "illustrator", "indesign", "visual design", "branding", "typography"]
  },
  "ui ux design": {
    complementary: ["graphic design", "product management", "user research", "software engineering"],
    progressionPath: ["senior UX designer", "product designer", "design lead"],
    keywords: ["ux", "ui", "user experience", "user interface", "figma", "sketch", "prototyping", "wireframing", "usability", "interaction design"]
  },
  "photography": {
    complementary: ["graphic design", "video production", "digital marketing", "social media"],
    progressionPath: ["commercial photographer", "art director", "creative director"],
    keywords: ["photography", "photographer", "lightroom", "photoshop", "camera", "portrait", "commercial photography", "photo editing"]
  },
  "video production": {
    complementary: ["photography", "graphic design", "social media", "digital marketing"],
    progressionPath: ["senior video producer", "creative director", "broadcast manager"],
    keywords: ["video", "videography", "premiere", "final cut", "after effects", "cinematography", "editing", "broadcast", "production"]
  },

  // Culinary and hospitality
  "culinary arts": {
    complementary: ["food safety", "nutrition", "hospitality management", "pastry arts"],
    progressionPath: ["sous chef", "head chef", "executive chef"],
    keywords: ["culinary", "chef", "cooking", "kitchen", "gastronomy", "cuisine", "culinary arts", "food preparation", "cordon bleu"]
  },
  "food safety": {
    complementary: ["culinary arts", "hospitality management", "nutrition", "health & safety"],
    progressionPath: ["food safety manager", "environmental health officer"],
    keywords: ["food safety", "haccp", "food hygiene", "servsafe", "food handler", "food manager", "sanitation", "fssai"]
  },
  "hospitality management": {
    complementary: ["culinary arts", "customer service", "business management", "tourism"],
    progressionPath: ["hotel manager", "operations director", "hospitality director"],
    keywords: ["hospitality", "hotel", "tourism", "resort", "front office", "housekeeping", "revenue management", "f&b"]
  },

  // Languages
  "language proficiency": {
    complementary: ["business communication", "translation", "international business", "teaching & education"],
    progressionPath: ["advanced fluency", "professional interpreter", "language teacher"],
    keywords: ["english", "french", "spanish", "german", "mandarin", "japanese", "arabic", "ielts", "toefl", "delf", "goethe", "jlpt", "hsk", "language", "proficiency", "fluency", "bilingual"]
  },

  // Real estate and property
  "real estate": {
    complementary: ["finance", "legal", "property management", "investment"],
    progressionPath: ["senior agent", "broker", "real estate director"],
    keywords: ["real estate", "property", "realtor", "agent", "broker", "mortgage", "valuation", "surveying", "rics", "cips"]
  },

  // Supply chain and logistics
  "supply chain": {
    complementary: ["logistics", "operations management", "procurement", "data analytics"],
    progressionPath: ["supply chain manager", "operations director", "chief operations officer"],
    keywords: ["supply chain", "logistics", "procurement", "inventory", "warehousing", "apics", "cpim", "cscp", "lean", "six sigma"]
  },
  "lean & six sigma": {
    complementary: ["operations management", "quality management", "project management", "supply chain"],
    progressionPath: ["black belt", "master black belt", "continuous improvement director"],
    keywords: ["lean", "six sigma", "yellow belt", "green belt", "black belt", "kaizen", "5s", "process improvement", "dmaic", "waste reduction"]
  },

  // Aviation and maritime
  "aviation": {
    complementary: ["safety management", "navigation", "meteorology", "aircraft maintenance"],
    progressionPath: ["commercial pilot", "airline transport pilot", "flight operations manager"],
    keywords: ["aviation", "pilot", "flight", "aircraft", "atpl", "ppl", "cpl", "drone", "uav", "air traffic", "faa", "easa", "icao"]
  },
  "maritime": {
    complementary: ["navigation", "safety management", "engineering", "logistics"],
    progressionPath: ["chief officer", "captain", "marine superintendent"],
    keywords: ["maritime", "marine", "nautical", "seafarer", "stcw", "navigation", "vessel", "ship", "sailing", "port"]
  },

  // Environmental and sustainability
  "sustainability": {
    complementary: ["environmental management", "energy management", "green building", "corporate governance"],
    progressionPath: ["sustainability manager", "chief sustainability officer"],
    keywords: ["sustainability", "environment", "green", "carbon", "iso 14001", "leed", "breeam", "esg", "climate", "renewable energy"]
  },

  // Quality management
  "quality management": {
    complementary: ["lean & six sigma", "compliance", "operations management", "audit"],
    progressionPath: ["quality manager", "quality director", "chief quality officer"],
    keywords: ["quality", "iso 9001", "iso", "qms", "quality management", "auditor", "irca", "cqa", "asq", "total quality"]
  },

  // Music and performing arts
  "music": {
    complementary: ["music production", "performing arts", "audio engineering", "music theory"],
    progressionPath: ["professional musician", "music teacher", "music director"],
    keywords: ["music", "guitar", "piano", "violin", "drums", "abrsm", "trinity", "music theory", "grade", "conservatory", "berklee"]
  },

  // Health and safety
  "health & safety": {
    complementary: ["compliance", "occupational health", "risk management", "environmental management"],
    progressionPath: ["health and safety manager", "HSE director"],
    keywords: ["health and safety", "hse", "nebosh", "iosh", "osha", "risk assessment", "occupational health", "safety officer", "workplace safety"]
  },
}
```

Claude Code must extend this map further to cover as many additional fields as possible, using the same structure. The broader the map, the more useful the insights engine becomes.

### Insight Generation Logic

Create a utility function `generateInsights(certificates: Certificate[]): Insight[]` in `lib/insightEngine.ts`.

```typescript
interface Insight {
  type: "strength" | "suggestion" | "warning" | "milestone"
  message: string
  priority: number  // 1 = highest, 3 = lowest
}
```

Rules for generating insights (apply all that are relevant, return the top 4 by priority):

**Strength insights (positive observations):**
- User has certificates in 3 or more domains → "Your portfolio spans multiple fields — that versatility stands out to employers and collaborators."
- User has 5 or more certificates → "A portfolio of [X] certificates shows serious commitment to continuous learning."
- User has certificates with credential IDs → "Certificates with credential IDs add verifiability to your profile."
- All public certificates have images → "Every public certificate has a visual — your profile looks professional and complete."
- User has a certificate less than 60 days old → "You recently added a new certification — great momentum."

**Suggestion insights (actionable recommendations):**
- User has certificates in only one domain → "Your profile focuses on one area. Adding a complementary field makes it more well-rounded."
- User has certificates with no images → "Certificates without images are less engaging. Upload the certificate file to improve your profile."
- User has certificates with no credential ID → "Adding credential IDs to your certificates makes them more credible and verifiable."
- User has more than 3 private certificates → "You have [X] hidden certificates. Consider making more public so visitors see your full profile."
- User has certificates expiring within 90 days → "Some certificates are expiring soon. Renew them to keep your profile current."
- User has no bio set → "Adding a bio helps visitors understand who you are and what you do."
- User has no profile photo → "A profile photo makes your profile significantly more trustworthy."

**Warning insights:**
- User has expired certificates that are still public → "You have expired certificates visible on your public profile. Consider hiding or renewing them."
- User has a certificate older than 5 years with no newer certificate in the same domain → "Some of your certificates are aging. Consider refreshing your credentials in those areas."

**Milestone insights:**
- Exactly 1 certificate → "You added your first certificate — the journey begins here."
- Exactly 5 certificates → "5 certificates in your portfolio — you are building something impressive."
- Exactly 10 certificates → "10 certificates. That is a serious commitment to professional growth."
- Exactly 25 certificates → "25 certificates. Your profile is extraordinary."

### UI Specification

Location: Below the statistics cards on the dashboard, above the certificate grid.

Layout:
- A card titled "Portfolio insights" with a subtle lightning bolt or sparkles icon in the title (SVG, not emoji)
- Display up to 4 insight items in a clean list
- Each insight has a left-side colored vertical accent bar (green for strength, blue for suggestion, amber for warning, violet for milestone), an icon, and the message text
- Animate each insight item sliding in on mount with a staggered delay (50ms between each item)
- If the user has zero certificates, show a single friendly empty state message instead: "Add your first certificate to unlock portfolio insights."

Mobile: Full width card, same layout. Stack naturally.

---

## Feature 4: Keyword-Based Next Certificate Recommender

### Overview

A recommendations panel that suggests specific, named certifications the user should consider next, based on their existing certificate domains and names. Entirely hardcoded. No LLM. Uses a comprehensive recommendations database covering all professional fields.

### Recommendations Database

Create `lib/recommendationsDb.ts`. This is a large, flat array of recommendation objects. Build it to be as comprehensive as possible covering all professional fields worldwide.

```typescript
// lib/recommendationsDb.ts

export interface CertRecommendation {
  name: string          // the specific certification name
  issuer: string        // who provides it
  domain: string        // which domain it belongs to
  triggerDomains: string[]  // show this recommendation if user has certs in any of these domains
  triggerKeywords: string[] // show if any of user's cert names/issuers contain these keywords
  reason: string        // one sentence explaining why this is recommended
  level: "beginner" | "intermediate" | "advanced"
  free: boolean         // whether the cert is free to obtain
}

export const recommendationsDb: CertRecommendation[] = [

  // Technology recommendations
  { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", domain: "cloud computing",
    triggerDomains: ["software engineering", "cloud computing", "devops"],
    triggerKeywords: ["aws", "cloud", "developer", "backend", "infrastructure"],
    reason: "The most widely recognized cloud certification, valuable for any technical role.",
    level: "intermediate", free: false },

  { name: "Google Cloud Professional Data Engineer", issuer: "Google Cloud", domain: "cloud computing",
    triggerDomains: ["data science", "machine learning", "cloud computing"],
    triggerKeywords: ["data", "gcp", "google cloud", "bigquery", "analytics"],
    reason: "Validates cloud data skills which pair directly with your data background.",
    level: "advanced", free: false },

  { name: "CompTIA Security+", issuer: "CompTIA", domain: "cybersecurity",
    triggerDomains: ["networking", "software engineering", "cloud computing", "it support"],
    triggerKeywords: ["network", "security", "it", "sysadmin", "infrastructure"],
    reason: "The most recognized entry-level security certification, opens doors in any technical field.",
    level: "beginner", free: false },

  { name: "Certified Kubernetes Administrator (CKA)", issuer: "Cloud Native Computing Foundation", domain: "devops",
    triggerDomains: ["devops", "cloud computing", "software engineering"],
    triggerKeywords: ["kubernetes", "docker", "containers", "devops", "cloud"],
    reason: "Container orchestration is now a core skill for cloud-native development.",
    level: "advanced", free: false },

  // Project management recommendations
  { name: "PMP (Project Management Professional)", issuer: "Project Management Institute", domain: "project management",
    triggerDomains: ["project management", "agile", "business analysis", "engineering management"],
    triggerKeywords: ["project", "manager", "lead", "management", "coordinator"],
    reason: "The gold standard project management certification recognized globally across all industries.",
    level: "advanced", free: false },

  { name: "PRINCE2 Foundation", issuer: "AXELOS", domain: "project management",
    triggerDomains: ["project management", "business analysis", "agile"],
    triggerKeywords: ["project", "prince", "management"],
    reason: "Widely required in UK and European organizations for structured project management.",
    level: "beginner", free: false },

  { name: "Certified ScrumMaster (CSM)", issuer: "Scrum Alliance", domain: "agile",
    triggerDomains: ["agile", "project management", "software engineering", "product management"],
    triggerKeywords: ["scrum", "agile", "sprint", "product owner", "backlog"],
    reason: "Scrum is the dominant agile framework — this certification is practical and immediately applicable.",
    level: "beginner", free: false },

  // Finance and accounting recommendations
  { name: "CFA Level 1", issuer: "CFA Institute", domain: "finance",
    triggerDomains: ["finance", "investment", "accounting", "economics"],
    triggerKeywords: ["finance", "investment", "financial", "portfolio", "equity", "analyst"],
    reason: "The CFA designation is the most respected credential in investment and financial analysis.",
    level: "advanced", free: false },

  { name: "ACCA (Association of Chartered Certified Accountants)", issuer: "ACCA Global", domain: "accounting",
    triggerDomains: ["accounting", "finance", "audit"],
    triggerKeywords: ["accounting", "accountant", "audit", "financial reporting", "tax"],
    reason: "Globally recognized accounting qualification accepted in over 180 countries.",
    level: "intermediate", free: false },

  { name: "Certified Financial Planner (CFP)", issuer: "CFP Board", domain: "finance",
    triggerDomains: ["finance", "accounting", "wealth management"],
    triggerKeywords: ["financial planning", "wealth", "retirement", "insurance", "estate planning"],
    reason: "The standard credential for personal financial advisors and planners.",
    level: "advanced", free: false },

  // HR recommendations
  { name: "SHRM-CP", issuer: "Society for Human Resource Management", domain: "human resources",
    triggerDomains: ["human resources", "organizational development", "training & facilitation"],
    triggerKeywords: ["hr", "human resources", "people", "talent", "recruitment"],
    reason: "The most widely held HR certification globally, recognized by employers across all industries.",
    level: "intermediate", free: false },

  { name: "CIPD Level 5", issuer: "Chartered Institute of Personnel and Development", domain: "human resources",
    triggerDomains: ["human resources", "organizational development", "leadership"],
    triggerKeywords: ["hr", "cipd", "people management", "talent", "employee relations"],
    reason: "The benchmark HR qualification for practitioners in the UK and internationally.",
    level: "intermediate", free: false },

  // Healthcare recommendations
  { name: "BLS (Basic Life Support)", issuer: "American Heart Association", domain: "first aid & safety",
    triggerDomains: ["healthcare", "nursing", "fitness & personal training", "teaching & education", "childcare"],
    triggerKeywords: ["health", "care", "nurse", "medical", "fitness", "trainer", "teacher"],
    reason: "A foundational life-saving credential recommended for anyone working with people.",
    level: "beginner", free: false },

  { name: "NEBOSH General Certificate", issuer: "NEBOSH", domain: "health & safety",
    triggerDomains: ["health & safety", "operations management", "construction", "manufacturing"],
    triggerKeywords: ["safety", "hse", "risk", "osha", "health and safety", "workplace"],
    reason: "The most recognized health and safety qualification across UK and international industries.",
    level: "intermediate", free: false },

  // Marketing recommendations
  { name: "Google Analytics Certification", issuer: "Google", domain: "marketing",
    triggerDomains: ["marketing", "digital marketing", "data analytics", "e-commerce"],
    triggerKeywords: ["marketing", "analytics", "google", "digital", "seo", "ads"],
    reason: "Free, widely recognized, and immediately applicable to any marketing role.",
    level: "beginner", free: true },

  { name: "HubSpot Content Marketing Certification", issuer: "HubSpot Academy", domain: "marketing",
    triggerDomains: ["marketing", "content strategy", "social media"],
    triggerKeywords: ["content", "marketing", "inbound", "hubspot", "blog", "social media"],
    reason: "Free certification from a leading platform covering content strategy fundamentals.",
    level: "beginner", free: true },

  // Language recommendations
  { name: "IELTS Academic", issuer: "British Council / IDP", domain: "language proficiency",
    triggerDomains: ["language proficiency", "teaching & education", "international business"],
    triggerKeywords: ["english", "language", "communication", "ielts", "toefl"],
    reason: "Universally recognized English proficiency test for academic and professional purposes.",
    level: "intermediate", free: false },

  // Lean and quality recommendations
  { name: "Lean Six Sigma Green Belt", issuer: "ASQ / IASSC", domain: "lean & six sigma",
    triggerDomains: ["operations management", "supply chain", "manufacturing", "quality management", "lean & six sigma"],
    triggerKeywords: ["lean", "process", "quality", "operations", "efficiency", "manufacturing"],
    reason: "Highly valued in operations, manufacturing, and any process-driven environment.",
    level: "intermediate", free: false },

  { name: "ISO 9001 Internal Auditor", issuer: "CQI / IRCA", domain: "quality management",
    triggerDomains: ["quality management", "compliance", "operations management"],
    triggerKeywords: ["quality", "iso", "audit", "compliance", "management system"],
    reason: "Practical qualification for anyone involved in quality systems and auditing.",
    level: "beginner", free: false },

  // Sustainability recommendations
  { name: "LEED Green Associate", issuer: "US Green Building Council", domain: "sustainability",
    triggerDomains: ["sustainability", "architecture", "construction", "environmental management"],
    triggerKeywords: ["green", "sustainability", "leed", "environment", "building", "energy"],
    reason: "The entry-level credential for sustainability in the built environment.",
    level: "beginner", free: false },

  // Culinary recommendations
  { name: "HACCP Food Safety Certification", issuer: "Highfield / RSPH", domain: "food safety",
    triggerDomains: ["culinary arts", "hospitality management", "food safety", "nutrition"],
    triggerKeywords: ["food", "kitchen", "chef", "catering", "hygiene", "restaurant"],
    reason: "Required or strongly recommended for anyone working with food professionally.",
    level: "beginner", free: false },

  // Supply chain recommendations
  { name: "APICS CPIM", issuer: "APICS / ASCM", domain: "supply chain",
    triggerDomains: ["supply chain", "logistics", "operations management", "procurement"],
    triggerKeywords: ["supply chain", "logistics", "inventory", "procurement", "operations", "warehouse"],
    reason: "The premier operations and inventory management certification worldwide.",
    level: "intermediate", free: false },

  // Design recommendations
  { name: "Google UX Design Certificate", issuer: "Google / Coursera", domain: "ui ux design",
    triggerDomains: ["graphic design", "ui ux design", "product management", "software engineering"],
    triggerKeywords: ["design", "ux", "ui", "figma", "user experience", "product design"],
    reason: "Practical, portfolio-focused UX credential from Google, widely respected by employers.",
    level: "beginner", free: false },

  // Real estate recommendations
  { name: "RICS Associate (AssocRICS)", issuer: "Royal Institution of Chartered Surveyors", domain: "real estate",
    triggerDomains: ["real estate", "property management", "construction", "valuation"],
    triggerKeywords: ["property", "real estate", "surveying", "valuation", "rics", "estate agent"],
    reason: "The internationally recognized standard for property and construction professionals.",
    level: "intermediate", free: false },

]
```

Claude Code must significantly expand this database to cover as many professional fields and specific named certifications as possible, following the same structure.

### Matching Logic

Create a utility function `getRecommendations(certificates: Certificate[]): CertRecommendation[]` in `lib/recommendationEngine.ts`.

Algorithm:
1. Extract the user's domains from their certificates as a lowercase array
2. Extract all certificate names and issuer names as a single lowercase string for keyword matching
3. For each entry in `recommendationsDb`, check if the user already has a certificate whose name closely matches it (if yes, exclude it — do not recommend what they already have)
4. Score each recommendation: +2 if any triggerDomain matches user's domains, +1 for each triggerKeyword found in user's certificate names or issuers
5. Sort by score descending
6. Return the top 5 recommendations with a score above 0

If the user has zero certificates, return 5 general beginner-level recommendations that are widely applicable across all fields.

### UI Specification

Location: A standalone card on the dashboard, below the insights panel, above the certificate grid.

Layout:
- Card title: "Recommended next certifications" with a small compass or target icon
- Each recommendation shown as a row with: certification name in bold, issuer in muted text, domain badge pill, level badge (Beginner / Intermediate / Advanced) in a separate pill, and the reason text in smaller muted text below
- If the certification is free, show a green "Free" badge next to the level
- Show exactly 5 recommendations at a time
- A "Refresh suggestions" button at the bottom of the card that rotates to show the next set of recommendations (cycle through all matches)
- If zero recommendations match, show: "Add more certificates to unlock personalized recommendations."

Mobile: Full width card. Each recommendation item stacks naturally. Domain and level badges wrap to a second line if needed.

---

## Feature 5: Domain Gap Detector

### Overview

Analyzes the user's certificate domains and surfaces specific, named domain gaps based on natural career path progressions. Shown as a compact section within the insights card or as a dedicated row on the dashboard.

### Gap Detection Logic

Create a utility function `detectGaps(certificates: Certificate[]): Gap[]` in `lib/gapDetector.ts`.

```typescript
interface Gap {
  missingDomain: string
  reason: string
  strength: "strong" | "moderate"  // how confident the suggestion is
}
```

Algorithm:
1. Get user's unique domains as lowercase array
2. For each domain the user has, look it up in the `domainMap`
3. For each `complementary` domain in the map entry, check if the user already has a certificate in that domain
4. If not, add it as a gap with strength "strong" if it appears as complementary in 2 or more of the user's domains, otherwise "moderate"
5. Deduplicate and sort: "strong" gaps first
6. Return up to 4 gaps

### UI Specification

Location: Inside the insights card as a collapsible "Domain gaps" section, triggered by a toggle button.

Layout:
- Title row: "Domain gaps" with a small arrow/chevron toggle
- When expanded, show each gap as a row: colored pill with the missing domain name, and the reason text
- Strong gaps have a more prominent style (slightly darker background on the pill)
- Maximum 4 gaps shown
- If no gaps detected (user has a very broad portfolio): show "Your portfolio covers a great range of domains — no obvious gaps detected."

---

## Feature 6: Auto-Sort Suggestions

### Overview

A one-click tool that lets users reorder their public-facing certificate grid using smart sorting strategies. The user picks a sort strategy and the dashboard reorders the certificate cards instantly. The chosen sort order is saved and applies to their public profile.

### Sort Strategies

Provide the following sort options:

| Strategy | Logic | Best for |
|---|---|---|
| Most recent first | Sort by issuedAt descending | Default recommended |
| Strongest first | Sort by certificate strength score descending (uses Feature 2 score) | Users who want most complete certs up front |
| Domain grouped | Group by domain alphabetically, then by date within each group | Users with many domains |
| Expiring soon first | Sort by expiresAt ascending (nulls last) | Users who want to highlight active certs |
| Alphabetical | Sort by certificate name A to Z | Users with credential IDs who want easy lookup |
| Custom order | Drag to reorder manually | Power users |

### Implementation Notes

- Store the active sort strategy in the database on the User record as a new field `sortStrategy: String @default("recent")`
- Apply the sort strategy on both the dashboard and the public profile page
- For "Custom order", add a `sortOrder: Int?` field to the Certificate model so each certificate has an explicit position number
- Drag and drop for custom order: use the existing drag library or implement with mouse/touch events. Keep it simple and reliable

### UI Specification

Location: A small sort control bar above the certificate grid, right-aligned, next to the existing search and filter controls.

Layout:
- A compact dropdown or segmented control labeled "Sort by" showing the current active strategy
- Changing the strategy reorders the grid with a smooth CSS transition (cards fade and reposition)
- A "Save order" button appears when the user changes the sort, which saves to the database
- For custom drag order, each card shows a subtle drag handle icon (6 dots) on hover at the top left corner

Mobile: The sort control collapses into a single icon button that opens a bottom sheet with the sort options listed as tappable rows.

---

## Feature 7: Smart Slug Suggestions

### Overview

When a user is editing their profile slug in settings, show 3 algorithmically generated slug suggestions below the input field as one-click options to apply.

### Slug Generation Algorithm

Create a utility function `generateSlugSuggestions(name: string, domains: string[]): string[]` in `lib/slugSuggester.ts`.

```typescript
function generateSlugSuggestions(name: string, domains: string[]): string[] {
  const suggestions: string[] = []
  const cleanName = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
  const nameParts = cleanName.split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts[nameParts.length - 1] || ""

  // Strategy 1: firstname-lastname
  if (firstName && lastName && firstName !== lastName) {
    suggestions.push(`${firstName}-${lastName}`)
  }

  // Strategy 2: firstname + top domain abbreviation
  if (firstName && domains.length > 0) {
    const domainAbbr = getDomainAbbreviation(domains[0])
    suggestions.push(`${firstName}-${domainAbbr}`)
  }

  // Strategy 3: full name initials + domain
  if (nameParts.length >= 2 && domains.length > 0) {
    const initials = nameParts.map(p => p[0]).join("")
    const domainAbbr = getDomainAbbreviation(domains[0])
    suggestions.push(`${initials}-${domainAbbr}`)
  }

  // Fallback if not enough parts
  if (suggestions.length < 3 && firstName) {
    suggestions.push(`${firstName}-pro`)
    suggestions.push(`${firstName}-certs`)
  }

  return suggestions.slice(0, 3).map(s =>
    s.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 30)
  )
}

function getDomainAbbreviation(domain: string): string {
  const abbreviations: Record<string, string> = {
    "software engineering": "dev",
    "machine learning": "ml",
    "artificial intelligence": "ai",
    "cloud computing": "cloud",
    "cybersecurity": "sec",
    "data science": "data",
    "project management": "pm",
    "agile": "agile",
    "human resources": "hr",
    "finance": "fin",
    "accounting": "acct",
    "marketing": "mktg",
    "healthcare": "health",
    "nursing": "rn",
    "fitness & personal training": "fit",
    "teaching & education": "edu",
    "legal": "legal",
    "graphic design": "design",
    "ui ux design": "ux",
    "culinary arts": "chef",
    "supply chain": "scm",
    "lean & six sigma": "lean",
    "quality management": "qa",
    "sustainability": "green",
    "aviation": "pilot",
    "maritime": "marine",
    "real estate": "re",
    "language proficiency": "lang",
    "music": "music",
    "photography": "photo",
    "sports coaching": "coach",
  }
  return abbreviations[domain.toLowerCase()] || domain.split(" ")[0].slice(0, 6)
}
```

### Availability Checking

Before showing a suggestion, check it against the existing slug availability API (`/api/profile/check-slug`). Only show suggestions that are available. If a suggestion is taken, append "-2" or "-3" until an available version is found (up to 3 attempts per suggestion).

### UI Specification

Location: Settings page, directly below the slug input field, above the existing availability indicator.

Layout:
- Label: "Suggestions" in small muted text
- Three pill buttons side by side, each showing one suggested slug prefixed with "/"
- Clicking a pill copies it into the slug input field and triggers the availability check
- Available suggestions have a subtle green dot indicator, unavailable ones are dimmed
- Animate the pills appearing with a short fade-in

Mobile: Pills wrap to a second row if they do not all fit on one line.

---

## Feature 8: Profile Analytics (View Counter)

### Overview

A simple, zero-dependency view counter for public profiles. Every time someone loads the public profile page, increment a counter in the database. Show the total view count on the dashboard. No external analytics service. No cookies. No tracking beyond a simple integer increment.

### Database Change

Add one field to the User model:

```prisma
profileViews  Int  @default(0)
```

### View Counting Logic

In the public profile page server component (`app/[slug]/page.tsx`), after fetching the user record, call a Supabase RPC or a Prisma raw query to atomically increment the `profileViews` counter:

```typescript
await prisma.user.update({
  where: { slug },
  data: { profileViews: { increment: 1 } }
})
```

Important: Do not count views from the profile owner themselves. Check the session in the public profile page and skip the increment if the viewer is the same user as the profile owner.

### UI Specification

Location: Dashboard, inside the profile panel card where the public URL is shown.

Layout:
- A single stat line below the URL display: an eye icon followed by "[X] profile views"
- If views are 0, show "No views yet — share your profile to get started"
- No graphs, no charts, no breakdowns in V1. Just the total count
- The count refreshes when the dashboard page loads

---

## General Implementation Rules for All Features

**Design consistency:**
- Read the existing component library thoroughly before building any new component
- Use the exact same Tailwind class patterns, card styles, border radius values, and color variables already in use
- Match the animation timing and easing curves already used in the app
- Dark and light mode must work perfectly for every new element
- Do not introduce any new dependencies or npm packages unless absolutely unavoidable

**Performance:**
- All feature logic runs on data already loaded in the dashboard
- No additional database queries per feature on the dashboard (except the view counter which runs on the public profile server side)
- Memoize heavy calculations (streak, heatmap, recommendations) using `useMemo`
- All calculations complete in under 10ms for a portfolio of up to 500 certificates

**No new environment variables:**
- None of these features require any API keys, secrets, or environment variables
- Everything runs in-process with existing data

**Mobile first:**
- Use your experience as a developer to make every component genuinely great on mobile
- Test mentally at 375px, 768px, and 1280px before finalizing any component
- Prefer bottom sheets over tooltips for interactive elements on mobile
- Ensure tap targets are at least 44px in height on mobile

**Do not break existing functionality:**
- The certificate grid, add/edit/delete flow, auth, settings, public profile, lightbox viewer, and all other existing features must continue to work exactly as before
- These features are purely additive
- Run through the critical user flows mentally after each feature is added to verify nothing is broken

---

## File Structure for New Code

```
lib/
├── domainMap.ts              ← domain relationship map (Feature 3)
├── insightEngine.ts          ← insight generation logic (Feature 3)
├── recommendationsDb.ts      ← certifications database (Feature 4)
├── recommendationEngine.ts   ← matching logic (Feature 4)
├── gapDetector.ts            ← gap detection logic (Feature 5)
├── slugSuggester.ts          ← slug generation (Feature 7)
└── certStrength.ts           ← per-certificate strength scoring (Feature 2)

components/
├── ProfileCompletenessCard.tsx      ← Feature 1
├── CertificateStrengthBar.tsx       ← Feature 2
├── InsightsCard.tsx                 ← Feature 3
├── RecommendationsCard.tsx          ← Feature 4
├── DomainGapsSection.tsx            ← Feature 5
├── SortControl.tsx                  ← Feature 6
└── SlugSuggestions.tsx              ← Feature 7
```

---

## Build Order

Build features in this sequence to minimize risk of conflicts:

1. `certStrength.ts` utility and `CertificateStrengthBar` — smallest change, lowest risk
2. `domainMap.ts` and `insightEngine.ts` and `InsightsCard` — core data layer
3. `ProfileCompletenessCard` — uses same data already computed
4. `recommendationsDb.ts` and `recommendationEngine.ts` and `RecommendationsCard` — standalone
5. `gapDetector.ts` and `DomainGapsSection` — builds on domain map already written
6. `SortControl` and sort logic — touches certificate ordering
7. `SlugSuggestions` — isolated to settings page
8. Profile view counter — touches public profile and database schema
