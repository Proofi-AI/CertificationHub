export interface CertRecommendation {
  name: string;
  issuer: string;
  domain: string;
  triggerDomains: string[];
  triggerKeywords: string[];
  reason: string;
  level: "beginner" | "intermediate" | "advanced";
  free: boolean;
}

export const recommendationsDb: CertRecommendation[] = [

  // ── Technology ──────────────────────────────────────────────────────────
  { name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", domain: "Cloud Computing",
    triggerDomains: ["software engineering", "cloud computing", "devops", "data science"],
    triggerKeywords: ["aws", "cloud", "developer", "backend", "infrastructure", "devops"],
    reason: "The most widely recognized cloud certification, valuable for any technical role.",
    level: "intermediate", free: false },

  { name: "Google Cloud Professional Data Engineer", issuer: "Google Cloud", domain: "Cloud Computing",
    triggerDomains: ["data science", "machine learning", "cloud computing", "artificial intelligence"],
    triggerKeywords: ["data", "gcp", "google cloud", "bigquery", "analytics", "data science"],
    reason: "Validates cloud data skills which pair directly with your data background.",
    level: "advanced", free: false },

  { name: "Microsoft Azure Fundamentals (AZ-900)", issuer: "Microsoft", domain: "Cloud Computing",
    triggerDomains: ["software engineering", "cloud computing", "it support", "business analytics"],
    triggerKeywords: ["azure", "microsoft", "cloud", "office 365", "m365"],
    reason: "Entry-level Azure certification that opens the Microsoft cloud path.",
    level: "beginner", free: false },

  { name: "CompTIA Security+", issuer: "CompTIA", domain: "Cybersecurity",
    triggerDomains: ["networking", "software engineering", "cloud computing", "it support"],
    triggerKeywords: ["network", "security", "it", "sysadmin", "infrastructure", "comptia"],
    reason: "The most recognized entry-level security certification, opens doors in any technical field.",
    level: "beginner", free: false },

  { name: "Certified Kubernetes Administrator (CKA)", issuer: "Cloud Native Computing Foundation", domain: "DevOps",
    triggerDomains: ["devops", "cloud computing", "software engineering"],
    triggerKeywords: ["kubernetes", "docker", "containers", "devops", "cloud", "k8s"],
    reason: "Container orchestration is now a core skill for cloud-native development.",
    level: "advanced", free: false },

  { name: "Google Data Analytics Certificate", issuer: "Google / Coursera", domain: "Data Science",
    triggerDomains: ["data science", "business analytics", "marketing", "finance", "operations management"],
    triggerKeywords: ["data", "analytics", "excel", "spreadsheet", "reporting", "tableau", "sql"],
    reason: "Practical, job-ready data analytics credential from Google, widely respected by employers.",
    level: "beginner", free: false },

  { name: "CompTIA A+", issuer: "CompTIA", domain: "IT Support",
    triggerDomains: ["it support", "networking", "cybersecurity", "software engineering"],
    triggerKeywords: ["it", "hardware", "support", "helpdesk", "windows", "tech support"],
    reason: "The most recognized entry-level IT certification for hardware and software fundamentals.",
    level: "beginner", free: false },

  { name: "TensorFlow Developer Certificate", issuer: "Google", domain: "Machine Learning",
    triggerDomains: ["machine learning", "artificial intelligence", "data science", "software engineering"],
    triggerKeywords: ["tensorflow", "machine learning", "deep learning", "python", "ai", "neural"],
    reason: "Google's official credential for applying TensorFlow in real-world ML projects.",
    level: "intermediate", free: false },

  { name: "HashiCorp Terraform Associate", issuer: "HashiCorp", domain: "DevOps",
    triggerDomains: ["devops", "cloud computing", "software engineering"],
    triggerKeywords: ["terraform", "infrastructure", "iac", "cloud", "devops", "ansible"],
    reason: "Infrastructure as code is now a standard skill across cloud and DevOps roles.",
    level: "intermediate", free: false },

  { name: "CISSP (Certified Information Systems Security Professional)", issuer: "ISC²", domain: "Cybersecurity",
    triggerDomains: ["cybersecurity", "cloud computing", "compliance", "risk management"],
    triggerKeywords: ["security", "cissp", "information security", "cyber", "soc", "risk"],
    reason: "The gold standard cybersecurity certification recognized globally across all industries.",
    level: "advanced", free: false },

  { name: "Google UX Design Certificate", issuer: "Google / Coursera", domain: "UI UX Design",
    triggerDomains: ["graphic design", "ui ux design", "product management", "software engineering"],
    triggerKeywords: ["design", "ux", "ui", "figma", "user experience", "product design", "wireframe"],
    reason: "Practical, portfolio-focused UX credential from Google, widely respected by employers.",
    level: "beginner", free: false },

  // ── Project Management ──────────────────────────────────────────────────
  { name: "PMP (Project Management Professional)", issuer: "Project Management Institute", domain: "Project Management",
    triggerDomains: ["project management", "agile", "business analysis", "engineering management", "leadership"],
    triggerKeywords: ["project", "manager", "lead", "management", "coordinator", "pmp"],
    reason: "The gold standard project management certification recognized globally across all industries.",
    level: "advanced", free: false },

  { name: "PRINCE2 Foundation", issuer: "AXELOS / PeopleCert", domain: "Project Management",
    triggerDomains: ["project management", "business analysis", "agile", "leadership"],
    triggerKeywords: ["project", "prince", "management", "prince2"],
    reason: "Widely required in UK and European organizations for structured project management.",
    level: "beginner", free: false },

  { name: "Certified ScrumMaster (CSM)", issuer: "Scrum Alliance", domain: "Agile",
    triggerDomains: ["agile", "project management", "software engineering", "product management"],
    triggerKeywords: ["scrum", "agile", "sprint", "product owner", "backlog", "kanban"],
    reason: "Scrum is the dominant agile framework — this certification is practical and immediately applicable.",
    level: "beginner", free: false },

  { name: "PMI-ACP (Agile Certified Practitioner)", issuer: "Project Management Institute", domain: "Agile",
    triggerDomains: ["agile", "project management", "software engineering"],
    triggerKeywords: ["agile", "scrum", "kanban", "safe", "project management", "pmi"],
    reason: "Broad agile certification covering multiple frameworks beyond Scrum.",
    level: "intermediate", free: false },

  { name: "CBAP (Certified Business Analysis Professional)", issuer: "IIBA", domain: "Business Analysis",
    triggerDomains: ["business analysis", "project management", "product management", "data analytics"],
    triggerKeywords: ["business analysis", "requirements", "cbap", "process improvement", "ba"],
    reason: "The premier business analysis certification recognized internationally.",
    level: "advanced", free: false },

  // ── Finance & Accounting ────────────────────────────────────────────────
  { name: "CFA Level 1", issuer: "CFA Institute", domain: "Finance",
    triggerDomains: ["finance", "investment", "accounting", "economics", "business analytics"],
    triggerKeywords: ["finance", "investment", "financial", "portfolio", "equity", "analyst", "cfa"],
    reason: "The CFA designation is the most respected credential in investment and financial analysis.",
    level: "advanced", free: false },

  { name: "ACCA (Association of Chartered Certified Accountants)", issuer: "ACCA Global", domain: "Accounting",
    triggerDomains: ["accounting", "finance", "audit"],
    triggerKeywords: ["accounting", "accountant", "audit", "financial reporting", "tax", "acca"],
    reason: "Globally recognized accounting qualification accepted in over 180 countries.",
    level: "intermediate", free: false },

  { name: "Certified Financial Planner (CFP)", issuer: "CFP Board", domain: "Finance",
    triggerDomains: ["finance", "accounting", "wealth management", "insurance"],
    triggerKeywords: ["financial planning", "wealth", "retirement", "insurance", "estate planning", "cfp"],
    reason: "The standard credential for personal financial advisors and planners.",
    level: "advanced", free: false },

  { name: "Certified Management Accountant (CMA)", issuer: "IMA", domain: "Accounting",
    triggerDomains: ["accounting", "finance", "operations management", "business analytics"],
    triggerKeywords: ["management accounting", "cma", "cost accounting", "budgeting", "financial analysis"],
    reason: "Bridges accounting with strategic management, valued in corporate finance roles.",
    level: "intermediate", free: false },

  { name: "FRM (Financial Risk Manager)", issuer: "GARP", domain: "Risk Management",
    triggerDomains: ["finance", "risk management", "investment", "compliance"],
    triggerKeywords: ["risk", "financial risk", "frm", "market risk", "credit risk", "derivatives"],
    reason: "The leading certification for financial risk professionals worldwide.",
    level: "advanced", free: false },

  // ── Human Resources ─────────────────────────────────────────────────────
  { name: "SHRM-CP", issuer: "Society for Human Resource Management", domain: "Human Resources",
    triggerDomains: ["human resources", "organizational development", "training & facilitation"],
    triggerKeywords: ["hr", "human resources", "people", "talent", "recruitment", "shrm"],
    reason: "The most widely held HR certification globally, recognized by employers across all industries.",
    level: "intermediate", free: false },

  { name: "CIPD Level 5 Associate Diploma in People Management", issuer: "CIPD", domain: "Human Resources",
    triggerDomains: ["human resources", "organizational development", "leadership"],
    triggerKeywords: ["hr", "cipd", "people management", "talent", "employee relations"],
    reason: "The benchmark HR qualification for practitioners in the UK and internationally.",
    level: "intermediate", free: false },

  // ── Healthcare ──────────────────────────────────────────────────────────
  { name: "BLS (Basic Life Support)", issuer: "American Heart Association", domain: "First Aid & Safety",
    triggerDomains: ["healthcare", "nursing", "fitness & personal training", "teaching & education", "social work"],
    triggerKeywords: ["health", "care", "nurse", "medical", "fitness", "trainer", "teacher", "childcare"],
    reason: "A foundational life-saving credential recommended for anyone working with people.",
    level: "beginner", free: false },

  { name: "NEBOSH General Certificate in Occupational Health and Safety", issuer: "NEBOSH", domain: "Health & Safety",
    triggerDomains: ["health & safety", "operations management", "construction", "manufacturing", "occupational health"],
    triggerKeywords: ["safety", "hse", "risk", "osha", "health and safety", "workplace", "nebosh"],
    reason: "The most recognized health and safety qualification across UK and international industries.",
    level: "intermediate", free: false },

  { name: "Mental Health First Aid (MHFA)", issuer: "Mental Health First Aid England", domain: "Mental Health",
    triggerDomains: ["mental health", "human resources", "teaching & education", "coaching", "social work"],
    triggerKeywords: ["mental health", "wellbeing", "hr", "support", "welfare", "counselling"],
    reason: "Enables you to identify and respond to signs of mental illness in any workplace.",
    level: "beginner", free: false },

  // ── Marketing ──────────────────────────────────────────────────────────
  { name: "Google Analytics 4 Certification", issuer: "Google", domain: "Marketing",
    triggerDomains: ["marketing", "digital marketing", "data analytics", "e-commerce"],
    triggerKeywords: ["marketing", "analytics", "google", "digital", "seo", "ads", "ga4"],
    reason: "Free, widely recognized, and immediately applicable to any marketing role.",
    level: "beginner", free: true },

  { name: "HubSpot Content Marketing Certification", issuer: "HubSpot Academy", domain: "Marketing",
    triggerDomains: ["marketing", "content strategy", "social media", "digital marketing"],
    triggerKeywords: ["content", "marketing", "inbound", "hubspot", "blog", "social media"],
    reason: "Free certification from a leading platform covering content strategy fundamentals.",
    level: "beginner", free: true },

  { name: "Meta Social Media Marketing Certificate", issuer: "Meta / Coursera", domain: "Digital Marketing",
    triggerDomains: ["marketing", "digital marketing", "social media", "entrepreneurship"],
    triggerKeywords: ["social media", "facebook", "instagram", "meta", "ads", "digital marketing"],
    reason: "Practical credential covering Meta's advertising ecosystem used by billions.",
    level: "beginner", free: false },

  { name: "Google Ads Search Certification", issuer: "Google", domain: "Digital Marketing",
    triggerDomains: ["marketing", "digital marketing", "sales", "e-commerce"],
    triggerKeywords: ["google ads", "ppc", "search ads", "sem", "paid search", "adwords"],
    reason: "Free certification that validates paid search skills directly applicable to client campaigns.",
    level: "beginner", free: true },

  // ── Language ────────────────────────────────────────────────────────────
  { name: "IELTS Academic", issuer: "British Council / IDP", domain: "Language Proficiency",
    triggerDomains: ["language proficiency", "teaching & education", "international business"],
    triggerKeywords: ["english", "language", "communication", "ielts", "toefl"],
    reason: "Universally recognized English proficiency test for academic and professional purposes.",
    level: "intermediate", free: false },

  { name: "TOEFL iBT", issuer: "ETS", domain: "Language Proficiency",
    triggerDomains: ["language proficiency", "teaching & education", "international business"],
    triggerKeywords: ["english", "toefl", "language", "academic english"],
    reason: "Widely accepted English language certification for academic and professional settings.",
    level: "intermediate", free: false },

  // ── Lean, Six Sigma & Quality ───────────────────────────────────────────
  { name: "Lean Six Sigma Green Belt", issuer: "ASQ / IASSC", domain: "Lean & Six Sigma",
    triggerDomains: ["operations management", "supply chain", "manufacturing", "quality management", "lean & six sigma"],
    triggerKeywords: ["lean", "process", "quality", "operations", "efficiency", "manufacturing", "six sigma"],
    reason: "Highly valued in operations, manufacturing, and any process-driven environment.",
    level: "intermediate", free: false },

  { name: "ISO 9001 Internal Auditor", issuer: "CQI / IRCA", domain: "Quality Management",
    triggerDomains: ["quality management", "compliance", "operations management", "manufacturing"],
    triggerKeywords: ["quality", "iso", "audit", "compliance", "management system", "qms"],
    reason: "Practical qualification for anyone involved in quality systems and auditing.",
    level: "beginner", free: false },

  { name: "Lean Six Sigma Black Belt", issuer: "ASQ / IASSC", domain: "Lean & Six Sigma",
    triggerDomains: ["lean & six sigma", "operations management", "manufacturing", "quality management"],
    triggerKeywords: ["lean", "six sigma", "green belt", "black belt", "process improvement"],
    reason: "Advanced lean credential for leading large-scale process improvement projects.",
    level: "advanced", free: false },

  // ── Sustainability ──────────────────────────────────────────────────────
  { name: "LEED Green Associate", issuer: "US Green Building Council", domain: "Sustainability",
    triggerDomains: ["sustainability", "architecture", "construction", "environmental management", "real estate"],
    triggerKeywords: ["green", "sustainability", "leed", "environment", "building", "energy"],
    reason: "The entry-level credential for sustainability in the built environment.",
    level: "beginner", free: false },

  { name: "ISO 14001 Environmental Management Lead Auditor", issuer: "CQI / IRCA", domain: "Environmental Management",
    triggerDomains: ["sustainability", "environmental management", "compliance", "operations management"],
    triggerKeywords: ["environmental", "iso 14001", "sustainability", "ems", "green"],
    reason: "Recognized credential for managing and auditing environmental management systems.",
    level: "intermediate", free: false },

  // ── Culinary & Food ─────────────────────────────────────────────────────
  { name: "HACCP Food Safety Level 3", issuer: "Highfield / RSPH", domain: "Food Safety",
    triggerDomains: ["culinary arts", "hospitality management", "food safety", "nutrition"],
    triggerKeywords: ["food", "kitchen", "chef", "catering", "hygiene", "restaurant", "haccp"],
    reason: "Required or strongly recommended for anyone working with food professionally.",
    level: "beginner", free: false },

  { name: "City & Guilds Level 2 Award in Food Safety in Catering", issuer: "City & Guilds", domain: "Food Safety",
    triggerDomains: ["culinary arts", "hospitality management", "food safety"],
    triggerKeywords: ["food safety", "food hygiene", "catering", "kitchen", "chef"],
    reason: "A standard food safety qualification widely required in the catering industry.",
    level: "beginner", free: false },

  // ── Supply Chain ───────────────────────────────────────────────────────
  { name: "APICS CPIM (Certified in Planning and Inventory Management)", issuer: "APICS / ASCM", domain: "Supply Chain",
    triggerDomains: ["supply chain", "logistics", "operations management", "procurement", "manufacturing"],
    triggerKeywords: ["supply chain", "logistics", "inventory", "procurement", "operations", "warehouse", "apics"],
    reason: "The premier operations and inventory management certification worldwide.",
    level: "intermediate", free: false },

  { name: "CIPS Foundation Award in Procurement and Supply", issuer: "CIPS", domain: "Procurement",
    triggerDomains: ["procurement", "supply chain", "operations management"],
    triggerKeywords: ["procurement", "purchasing", "supply chain", "cips", "buying"],
    reason: "Entry-level procurement qualification from the Chartered Institute of Procurement and Supply.",
    level: "beginner", free: false },

  // ── Design ────────────────────────────────────────────────────────────
  { name: "Adobe Certified Professional – Photoshop", issuer: "Adobe", domain: "Graphic Design",
    triggerDomains: ["graphic design", "photography", "video production", "digital marketing"],
    triggerKeywords: ["photoshop", "design", "adobe", "photo editing", "visual design"],
    reason: "Adobe's official credential validating professional-level Photoshop skills.",
    level: "intermediate", free: false },

  { name: "Figma Professional Certification", issuer: "Figma", domain: "UI UX Design",
    triggerDomains: ["ui ux design", "graphic design", "product management", "software engineering"],
    triggerKeywords: ["figma", "ux", "ui", "design", "prototyping", "wireframe"],
    reason: "Industry-standard tool certification for UI/UX designers used by top product teams.",
    level: "intermediate", free: false },

  // ── Real Estate ────────────────────────────────────────────────────────
  { name: "RICS Associate (AssocRICS)", issuer: "Royal Institution of Chartered Surveyors", domain: "Real Estate",
    triggerDomains: ["real estate", "property management", "construction", "valuation"],
    triggerKeywords: ["property", "real estate", "surveying", "valuation", "rics", "estate agent"],
    reason: "The internationally recognized standard for property and construction professionals.",
    level: "intermediate", free: false },

  // ── Teaching ───────────────────────────────────────────────────────────
  { name: "CELTA (Certificate in English Language Teaching to Adults)", issuer: "Cambridge Assessment English", domain: "Teaching & Education",
    triggerDomains: ["teaching & education", "language proficiency", "training & facilitation"],
    triggerKeywords: ["teaching", "english", "elt", "celta", "esl", "language teaching", "tefl"],
    reason: "The most recognized qualification for teaching English to adults worldwide.",
    level: "beginner", free: false },

  { name: "Level 3 Award in Education and Training (AET)", issuer: "City & Guilds / PTLLS", domain: "Training & Facilitation",
    triggerDomains: ["training & facilitation", "teaching & education", "instructional design"],
    triggerKeywords: ["training", "teaching", "facilitation", "aet", "ptlls", "education"],
    reason: "The entry-level UK teaching qualification for anyone delivering training or education.",
    level: "beginner", free: false },

  // ── Coaching ──────────────────────────────────────────────────────────
  { name: "ICF Associate Certified Coach (ACC)", issuer: "International Coaching Federation", domain: "Coaching",
    triggerDomains: ["coaching", "leadership", "human resources", "training & facilitation", "sports coaching"],
    triggerKeywords: ["coaching", "life coaching", "executive coaching", "icf", "coach", "mentor"],
    reason: "The most recognized coaching credential worldwide, accepted by employers and clients globally.",
    level: "intermediate", free: false },

  // ── Aviation ──────────────────────────────────────────────────────────
  { name: "Private Pilot Licence (PPL)", issuer: "FAA / CAA / EASA", domain: "Aviation",
    triggerDomains: ["aviation"],
    triggerKeywords: ["pilot", "flight", "aviation", "aircraft", "ppl", "flying"],
    reason: "Foundation qualification for all aspiring pilots.",
    level: "beginner", free: false },

  // ── Entrepreneurship ──────────────────────────────────────────────────
  { name: "Google Project Management Certificate", issuer: "Google / Coursera", domain: "Project Management",
    triggerDomains: ["entrepreneurship", "project management", "business analysis", "leadership"],
    triggerKeywords: ["project management", "startup", "business", "management", "planning"],
    reason: "Practical project management credential ideal for founders and managers at any stage.",
    level: "beginner", free: false },

  // ── General/Widely Applicable (fallback for new users) ─────────────────
  { name: "Google IT Support Professional Certificate", issuer: "Google / Coursera", domain: "IT Support",
    triggerDomains: [],
    triggerKeywords: [],
    reason: "One of the most popular entry-level tech credentials — a great starting point for any professional.",
    level: "beginner", free: false },

  { name: "LinkedIn Learning – Becoming a Manager", issuer: "LinkedIn Learning", domain: "Leadership",
    triggerDomains: [],
    triggerKeywords: [],
    reason: "Foundational leadership skills applicable across every industry and career path.",
    level: "beginner", free: false },

  { name: "Coursera – Learning How to Learn", issuer: "McMaster University / Coursera", domain: "Personal Development",
    triggerDomains: [],
    triggerKeywords: [],
    reason: "The most enrolled online course in history — improves learning across every field.",
    level: "beginner", free: true },

  { name: "Microsoft Office Specialist (MOS) – Excel Expert", issuer: "Microsoft", domain: "Business Analytics",
    triggerDomains: [],
    triggerKeywords: [],
    reason: "Excel mastery is valuable in virtually every profession.",
    level: "beginner", free: false },

  { name: "CompTIA Project+ Certification", issuer: "CompTIA", domain: "Project Management",
    triggerDomains: [],
    triggerKeywords: [],
    reason: "Vendor-neutral project management certification suitable for any industry.",
    level: "beginner", free: false },
];
