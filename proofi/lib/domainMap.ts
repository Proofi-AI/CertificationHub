export interface DomainRelationship {
  complementary: string[];    // domains that pair well
  progressionPath: string[];  // natural next steps
  keywords: string[];         // keywords to match cert names/issuers
}

export const domainMap: Record<string, DomainRelationship> = {

  // ── Technology ──────────────────────────────────────────────────────────
  "software engineering": {
    complementary: ["cloud computing", "cybersecurity", "devops", "agile & project management", "ui ux design"],
    progressionPath: ["solutions architecture", "engineering management", "devops"],
    keywords: ["software", "developer", "programming", "coding", "engineer", "development", "web", "mobile", "backend", "frontend", "fullstack", "react", "angular", "vue", "node", "java", "python", "typescript", "javascript"],
  },
  "cloud computing": {
    complementary: ["devops", "cybersecurity", "software engineering", "networking", "data science"],
    progressionPath: ["solutions architecture", "cloud security", "site reliability engineering"],
    keywords: ["cloud", "aws", "azure", "gcp", "google cloud", "infrastructure", "serverless", "kubernetes", "terraform", "s3", "ec2", "lambda", "azure devops"],
  },
  "cybersecurity": {
    complementary: ["networking", "cloud computing", "ethical hacking", "risk management", "compliance"],
    progressionPath: ["security architecture", "penetration testing", "CISO track"],
    keywords: ["security", "cyber", "comptia", "cissp", "ceh", "penetration", "ethical hacking", "soc", "siem", "firewall", "vulnerability", "threat", "infosec", "oscp"],
  },
  "data science": {
    complementary: ["machine learning", "statistics", "cloud computing", "data engineering", "business analytics"],
    progressionPath: ["machine learning engineering", "AI research", "data leadership"],
    keywords: ["data science", "data analyst", "analytics", "python", "r programming", "statistics", "pandas", "jupyter", "tableau", "power bi", "sql", "data analysis"],
  },
  "machine learning": {
    complementary: ["data science", "cloud computing", "mathematics", "software engineering", "artificial intelligence"],
    progressionPath: ["AI engineering", "MLOps", "AI research"],
    keywords: ["machine learning", "deep learning", "neural", "tensorflow", "pytorch", "nlp", "computer vision", "ai", "artificial intelligence", "llm", "generative ai", "mlops"],
  },
  "artificial intelligence": {
    complementary: ["machine learning", "data science", "software engineering", "cloud computing"],
    progressionPath: ["AI research", "AI product management", "ML engineering lead"],
    keywords: ["artificial intelligence", "ai", "generative ai", "llm", "gpt", "nlp", "deep learning", "neural network", "openai", "anthropic"],
  },
  "devops": {
    complementary: ["cloud computing", "software engineering", "cybersecurity", "site reliability engineering"],
    progressionPath: ["platform engineering", "site reliability engineer", "cloud architect"],
    keywords: ["devops", "docker", "kubernetes", "jenkins", "ci/cd", "pipeline", "ansible", "terraform", "helm", "github actions", "gitlab", "continuous integration", "continuous deployment"],
  },
  "networking": {
    complementary: ["cybersecurity", "cloud computing", "systems administration", "devops"],
    progressionPath: ["network architect", "cybersecurity specialist", "cloud networking"],
    keywords: ["networking", "cisco", "ccna", "ccnp", "ccie", "network", "tcp/ip", "routing", "switching", "firewall", "vpn", "juniper", "network+", "comptia network"],
  },
  "database administration": {
    complementary: ["cloud computing", "data science", "software engineering", "devops"],
    progressionPath: ["data architect", "data engineering lead", "database manager"],
    keywords: ["database", "sql", "mysql", "postgresql", "oracle", "mongodb", "dba", "nosql", "redis", "elasticsearch", "data warehouse", "snowflake"],
  },
  "it support": {
    complementary: ["networking", "cybersecurity", "cloud computing", "systems administration"],
    progressionPath: ["systems administrator", "network engineer", "cybersecurity analyst"],
    keywords: ["it support", "helpdesk", "help desk", "comptia a+", "itil", "service desk", "technical support", "hardware", "troubleshooting", "windows server"],
  },
  "business analytics": {
    complementary: ["data science", "finance", "project management", "marketing"],
    progressionPath: ["senior analyst", "data science", "business intelligence lead"],
    keywords: ["business analytics", "business intelligence", "bi", "tableau", "power bi", "qlik", "excel", "analytics", "reporting", "kpi", "dashboard"],
  },

  // ── Business & Management ────────────────────────────────────────────────
  "project management": {
    complementary: ["agile", "leadership", "risk management", "business analysis"],
    progressionPath: ["program management", "portfolio management", "PMO leadership"],
    keywords: ["project management", "pmp", "prince2", "capm", "project manager", "pmbok", "project coordination", "project planning"],
  },
  "agile": {
    complementary: ["project management", "software engineering", "scrum", "product management"],
    progressionPath: ["agile coaching", "scaled agile", "product leadership"],
    keywords: ["agile", "scrum", "kanban", "sprint", "safe", "scrum master", "csm", "psm", "retrospective", "product owner", "backlog"],
  },
  "business analysis": {
    complementary: ["project management", "data analytics", "product management", "finance"],
    progressionPath: ["senior business analyst", "product ownership", "business architecture"],
    keywords: ["business analysis", "business analyst", "ba", "cbap", "requirements", "process improvement", "iiba", "use cases", "user stories"],
  },
  "human resources": {
    complementary: ["leadership", "organizational development", "employment law", "payroll", "training & facilitation"],
    progressionPath: ["HR business partner", "people operations", "CHRO track"],
    keywords: ["human resources", "hr", "shrm", "cipd", "talent", "recruitment", "people management", "payroll", "hrm", "employee relations", "compensation"],
  },
  "marketing": {
    complementary: ["digital marketing", "data analytics", "social media", "content strategy", "graphic design"],
    progressionPath: ["marketing management", "brand strategy", "CMO track"],
    keywords: ["marketing", "digital marketing", "seo", "sem", "google ads", "facebook ads", "content", "brand", "hubspot", "inbound marketing", "email marketing"],
  },
  "digital marketing": {
    complementary: ["marketing", "social media", "data analytics", "content strategy", "graphic design"],
    progressionPath: ["digital marketing manager", "growth lead", "CMO track"],
    keywords: ["digital marketing", "seo", "ppc", "google analytics", "social media marketing", "email marketing", "content marketing", "conversion", "cro", "facebook", "instagram"],
  },
  "finance": {
    complementary: ["accounting", "risk management", "investment", "financial planning", "data analytics"],
    progressionPath: ["financial management", "CFO track", "investment banking"],
    keywords: ["finance", "financial", "cfa", "cfp", "investment", "portfolio", "financial planning", "treasury", "banking", "equity", "fixed income", "derivatives"],
  },
  "accounting": {
    complementary: ["finance", "taxation", "audit", "financial reporting"],
    progressionPath: ["senior accountant", "controller", "CFO track"],
    keywords: ["accounting", "accountant", "cpa", "cma", "acca", "quickbooks", "audit", "bookkeeping", "tax", "gaap", "ifrs", "financial reporting", "xero"],
  },
  "risk management": {
    complementary: ["compliance", "finance", "project management", "legal", "cybersecurity"],
    progressionPath: ["chief risk officer", "enterprise risk manager", "risk director"],
    keywords: ["risk management", "risk", "crm", "risk assessment", "enterprise risk", "frm", "prmia", "risk analyst", "risk officer", "iso 31000"],
  },
  "product management": {
    complementary: ["agile", "ui ux design", "data science", "business analysis", "marketing"],
    progressionPath: ["senior product manager", "head of product", "CPO track"],
    keywords: ["product management", "product manager", "product owner", "roadmap", "product strategy", "product development", "saas", "product analytics"],
  },
  "leadership": {
    complementary: ["project management", "human resources", "coaching", "organizational development"],
    progressionPath: ["senior leader", "director", "C-suite"],
    keywords: ["leadership", "management", "executive", "team lead", "team management", "strategic leadership", "organizational leadership", "emotional intelligence", "coaching"],
  },
  "entrepreneurship": {
    complementary: ["business analysis", "finance", "marketing", "leadership", "product management"],
    progressionPath: ["startup founder", "serial entrepreneur", "business consultant"],
    keywords: ["entrepreneurship", "startup", "business development", "venture", "founding", "entrepreneur", "small business", "business owner"],
  },
  "sales": {
    complementary: ["marketing", "customer service", "business development", "digital marketing"],
    progressionPath: ["account executive", "sales manager", "VP of sales"],
    keywords: ["sales", "crm", "salesforce", "account management", "business development", "b2b", "b2c", "closing", "pipeline", "revenue"],
  },
  "customer service": {
    complementary: ["sales", "marketing", "communication", "leadership"],
    progressionPath: ["customer success manager", "service director", "customer experience lead"],
    keywords: ["customer service", "customer support", "crm", "zendesk", "customer success", "helpdesk", "client relations", "service excellence"],
  },

  // ── Healthcare ──────────────────────────────────────────────────────────
  "healthcare": {
    complementary: ["clinical skills", "patient care", "medical terminology", "health informatics"],
    progressionPath: ["clinical leadership", "healthcare administration", "specialized practice"],
    keywords: ["healthcare", "health", "medical", "clinical", "patient", "hospital", "nursing", "physician", "allied health", "paramedic"],
  },
  "nursing": {
    complementary: ["patient care", "clinical skills", "pharmacology", "emergency care", "first aid & safety"],
    progressionPath: ["advanced practice nursing", "nurse practitioner", "nursing leadership"],
    keywords: ["nursing", "nurse", "rn", "lpn", "nclex", "clinical nursing", "patient care", "bls", "acls", "critical care"],
  },
  "first aid & safety": {
    complementary: ["occupational health", "emergency response", "workplace safety", "nursing", "fitness & personal training"],
    progressionPath: ["paramedic", "emergency medical technician", "occupational health officer"],
    keywords: ["first aid", "cpr", "bls", "acls", "aed", "emergency", "red cross", "st john", "lifesaving", "resuscitation", "first responder"],
  },
  "mental health": {
    complementary: ["counselling", "psychology", "social work", "mindfulness", "coaching"],
    progressionPath: ["licensed therapist", "clinical psychologist", "mental health leadership"],
    keywords: ["mental health", "counselling", "counseling", "psychology", "therapy", "psychotherapy", "mindfulness", "cbt", "social work", "wellbeing", "wellness"],
  },
  "nutrition": {
    complementary: ["fitness & personal training", "health coaching", "food safety", "sports science", "nursing"],
    progressionPath: ["registered dietitian", "clinical nutritionist", "sports nutritionist"],
    keywords: ["nutrition", "dietitian", "dietetics", "nutritionist", "food science", "dietary", "wellness", "health coaching", "macros", "calorie"],
  },
  "pharmacy": {
    complementary: ["healthcare", "pharmacology", "chemistry", "compliance"],
    progressionPath: ["clinical pharmacist", "pharmacy manager", "pharmaceutical scientist"],
    keywords: ["pharmacy", "pharmacist", "pharmacology", "pharmaceutical", "dispensing", "medication", "drug", "rx", "compounding"],
  },
  "physiotherapy": {
    complementary: ["sports science", "fitness & personal training", "anatomy", "rehabilitation"],
    progressionPath: ["senior physiotherapist", "clinical lead", "sports physiotherapist"],
    keywords: ["physiotherapy", "physical therapy", "physio", "rehabilitation", "musculoskeletal", "sports injury", "manual therapy", "exercise therapy"],
  },
  "social work": {
    complementary: ["mental health", "counselling", "child development", "community development"],
    progressionPath: ["senior social worker", "social work supervisor", "director of social services"],
    keywords: ["social work", "social worker", "child welfare", "community", "case management", "vulnerable adults", "safeguarding", "social care"],
  },

  // ── Fitness & Sports ────────────────────────────────────────────────────
  "fitness & personal training": {
    complementary: ["nutrition", "sports science", "first aid & safety", "health coaching", "physiotherapy"],
    progressionPath: ["strength and conditioning", "sports performance", "fitness management"],
    keywords: ["personal training", "fitness", "pt", "gym instructor", "ace", "nasm", "reps", "strength", "conditioning", "exercise science", "personal trainer"],
  },
  "sports coaching": {
    complementary: ["sports science", "fitness & personal training", "leadership", "sports psychology"],
    progressionPath: ["head coach", "sports director", "performance director"],
    keywords: ["coaching", "sports coach", "athletics", "football", "soccer", "basketball", "tennis", "swimming", "cricket", "rugby", "track and field"],
  },
  "sports science": {
    complementary: ["fitness & personal training", "nutrition", "physiotherapy", "sports coaching"],
    progressionPath: ["sports scientist", "performance analyst", "research scientist"],
    keywords: ["sports science", "exercise physiology", "biomechanics", "sports performance", "sport and exercise", "physical performance"],
  },

  // ── Education ───────────────────────────────────────────────────────────
  "teaching & education": {
    complementary: ["curriculum design", "educational technology", "leadership", "special education", "language proficiency"],
    progressionPath: ["senior teacher", "department head", "school leadership"],
    keywords: ["teaching", "teacher", "education", "pgce", "qts", "pedagogy", "curriculum", "instructional design", "e-learning", "classroom", "school"],
  },
  "training & facilitation": {
    complementary: ["instructional design", "coaching", "leadership", "public speaking", "teaching & education"],
    progressionPath: ["learning and development manager", "chief learning officer"],
    keywords: ["training", "facilitation", "facilitator", "l&d", "learning development", "corporate training", "workshop", "atd", "cplp", "trainer"],
  },
  "instructional design": {
    complementary: ["teaching & education", "training & facilitation", "educational technology", "graphic design"],
    progressionPath: ["senior instructional designer", "learning experience designer", "L&D director"],
    keywords: ["instructional design", "curriculum design", "e-learning", "articulate", "storyline", "lms", "learning management", "course design"],
  },
  "early childhood education": {
    complementary: ["teaching & education", "child development", "social work", "special education"],
    progressionPath: ["lead teacher", "nursery manager", "early years specialist"],
    keywords: ["early childhood", "childcare", "nursery", "preschool", "kindergarten", "eyfs", "child development", "play-based learning"],
  },

  // ── Legal & Compliance ──────────────────────────────────────────────────
  "legal": {
    complementary: ["compliance", "risk management", "contract management", "employment law", "finance"],
    progressionPath: ["senior lawyer", "legal counsel", "general counsel"],
    keywords: ["legal", "law", "lawyer", "attorney", "solicitor", "barrister", "paralegal", "compliance", "contract", "llb", "llm", "jurisprudence"],
  },
  "compliance": {
    complementary: ["risk management", "legal", "audit", "data privacy", "cybersecurity"],
    progressionPath: ["compliance manager", "chief compliance officer"],
    keywords: ["compliance", "regulatory", "gdpr", "iso", "audit", "risk", "governance", "aml", "kyc", "crcm", "regulatory affairs"],
  },
  "data privacy": {
    complementary: ["compliance", "legal", "cybersecurity", "gdpr", "information security"],
    progressionPath: ["data protection officer", "privacy counsel", "chief privacy officer"],
    keywords: ["data privacy", "gdpr", "ccpa", "data protection", "privacy", "dpo", "data governance", "pii", "personal data"],
  },

  // ── Creative & Design ───────────────────────────────────────────────────
  "graphic design": {
    complementary: ["ui ux design", "photography", "branding", "digital marketing", "video production"],
    progressionPath: ["senior designer", "art director", "creative director"],
    keywords: ["graphic design", "design", "adobe", "photoshop", "illustrator", "indesign", "visual design", "branding", "typography", "logo", "print design"],
  },
  "ui ux design": {
    complementary: ["graphic design", "product management", "user research", "software engineering", "digital marketing"],
    progressionPath: ["senior UX designer", "product designer", "design lead"],
    keywords: ["ux", "ui", "user experience", "user interface", "figma", "sketch", "prototyping", "wireframing", "usability", "interaction design", "design thinking"],
  },
  "photography": {
    complementary: ["graphic design", "video production", "digital marketing", "social media", "visual arts"],
    progressionPath: ["commercial photographer", "art director", "creative director"],
    keywords: ["photography", "photographer", "lightroom", "photoshop", "camera", "portrait", "commercial photography", "photo editing", "drone photography"],
  },
  "video production": {
    complementary: ["photography", "graphic design", "social media", "digital marketing", "audio engineering"],
    progressionPath: ["senior video producer", "creative director", "broadcast manager"],
    keywords: ["video", "videography", "premiere", "final cut", "after effects", "cinematography", "editing", "broadcast", "production", "film", "youtube"],
  },
  "fashion design": {
    complementary: ["graphic design", "textile design", "fashion marketing", "retail management"],
    progressionPath: ["senior designer", "design director", "creative director"],
    keywords: ["fashion design", "fashion", "textiles", "garment", "pattern", "styling", "couture", "fashion illustration"],
  },
  "interior design": {
    complementary: ["architecture", "graphic design", "sustainability", "project management"],
    progressionPath: ["senior interior designer", "design director", "interior architect"],
    keywords: ["interior design", "interior", "space planning", "furniture", "3d visualization", "autocad", "revit", "archicad", "staging"],
  },
  "architecture": {
    complementary: ["interior design", "sustainability", "engineering", "project management", "construction"],
    progressionPath: ["senior architect", "principal architect", "design director"],
    keywords: ["architecture", "architect", "autocad", "revit", "bim", "building", "structural", "urban planning", "arb", "riba"],
  },

  // ── Culinary & Hospitality ──────────────────────────────────────────────
  "culinary arts": {
    complementary: ["food safety", "nutrition", "hospitality management", "pastry arts", "food science"],
    progressionPath: ["sous chef", "head chef", "executive chef"],
    keywords: ["culinary", "chef", "cooking", "kitchen", "gastronomy", "cuisine", "culinary arts", "food preparation", "cordon bleu", "patisserie"],
  },
  "food safety": {
    complementary: ["culinary arts", "hospitality management", "nutrition", "health & safety", "supply chain"],
    progressionPath: ["food safety manager", "environmental health officer"],
    keywords: ["food safety", "haccp", "food hygiene", "servsafe", "food handler", "food manager", "sanitation", "fssai", "level 2 food", "level 3 food"],
  },
  "hospitality management": {
    complementary: ["culinary arts", "customer service", "business management", "tourism", "marketing"],
    progressionPath: ["hotel manager", "operations director", "hospitality director"],
    keywords: ["hospitality", "hotel", "tourism", "resort", "front office", "housekeeping", "revenue management", "f&b", "event management", "accommodation"],
  },
  "event management": {
    complementary: ["hospitality management", "marketing", "project management", "public relations"],
    progressionPath: ["senior event manager", "events director", "experience director"],
    keywords: ["event management", "events", "event planner", "conference", "wedding", "corporate events", "exhibition", "festival management"],
  },
  "tourism": {
    complementary: ["hospitality management", "customer service", "language proficiency", "marketing"],
    progressionPath: ["travel manager", "tourism director", "destination manager"],
    keywords: ["tourism", "travel", "tour guide", "travel agent", "destination management", "eco-tourism", "iata", "travel management"],
  },

  // ── Languages ───────────────────────────────────────────────────────────
  "language proficiency": {
    complementary: ["business communication", "translation", "international business", "teaching & education", "tourism"],
    progressionPath: ["advanced fluency", "professional interpreter", "language teacher"],
    keywords: ["english", "french", "spanish", "german", "mandarin", "japanese", "arabic", "ielts", "toefl", "delf", "goethe", "jlpt", "hsk", "language", "proficiency", "fluency", "bilingual", "multilingual", "translation"],
  },
  "translation & interpretation": {
    complementary: ["language proficiency", "international business", "legal", "teaching & education"],
    progressionPath: ["senior translator", "conference interpreter", "language director"],
    keywords: ["translation", "interpretation", "interpreter", "translator", "localization", "ciol", "iti", "simultaneous interpretation", "sworn translation"],
  },

  // ── Real Estate & Property ──────────────────────────────────────────────
  "real estate": {
    complementary: ["finance", "legal", "property management", "investment", "construction"],
    progressionPath: ["senior agent", "broker", "real estate director"],
    keywords: ["real estate", "property", "realtor", "agent", "broker", "mortgage", "valuation", "surveying", "rics", "cips", "estate agent", "letting agent"],
  },
  "construction": {
    complementary: ["architecture", "project management", "health & safety", "engineering", "sustainability"],
    progressionPath: ["site manager", "construction manager", "project director"],
    keywords: ["construction", "building", "civil engineering", "site management", "quantity surveying", "ciob", "smsts", "cscs", "scaffolding", "structural"],
  },

  // ── Supply Chain & Operations ───────────────────────────────────────────
  "supply chain": {
    complementary: ["logistics", "operations management", "procurement", "data analytics", "lean & six sigma"],
    progressionPath: ["supply chain manager", "operations director", "chief operations officer"],
    keywords: ["supply chain", "logistics", "procurement", "inventory", "warehousing", "apics", "cpim", "cscp", "lean", "six sigma", "demand planning"],
  },
  "lean & six sigma": {
    complementary: ["operations management", "quality management", "project management", "supply chain", "manufacturing"],
    progressionPath: ["black belt", "master black belt", "continuous improvement director"],
    keywords: ["lean", "six sigma", "yellow belt", "green belt", "black belt", "kaizen", "5s", "process improvement", "dmaic", "waste reduction", "value stream"],
  },
  "operations management": {
    complementary: ["lean & six sigma", "supply chain", "project management", "quality management", "finance"],
    progressionPath: ["operations manager", "operations director", "COO track"],
    keywords: ["operations management", "operations", "operations manager", "process management", "efficiency", "business operations", "workflow"],
  },
  "procurement": {
    complementary: ["supply chain", "legal", "finance", "operations management", "compliance"],
    progressionPath: ["procurement manager", "head of procurement", "chief procurement officer"],
    keywords: ["procurement", "purchasing", "cips", "buying", "sourcing", "vendor management", "contract management", "supply chain"],
  },
  "manufacturing": {
    complementary: ["lean & six sigma", "quality management", "operations management", "engineering", "health & safety"],
    progressionPath: ["production manager", "manufacturing director", "plant manager"],
    keywords: ["manufacturing", "production", "automotive", "industrial engineering", "factory", "assembly", "cnc", "automation", "industry 4.0"],
  },

  // ── Aviation & Maritime ─────────────────────────────────────────────────
  "aviation": {
    complementary: ["safety management", "navigation", "meteorology", "aircraft maintenance", "operations management"],
    progressionPath: ["commercial pilot", "airline transport pilot", "flight operations manager"],
    keywords: ["aviation", "pilot", "flight", "aircraft", "atpl", "ppl", "cpl", "drone", "uav", "air traffic", "faa", "easa", "icao", "cabin crew"],
  },
  "maritime": {
    complementary: ["navigation", "safety management", "engineering", "logistics", "operations management"],
    progressionPath: ["chief officer", "captain", "marine superintendent"],
    keywords: ["maritime", "marine", "nautical", "seafarer", "stcw", "navigation", "vessel", "ship", "sailing", "port", "merchant navy", "offshore"],
  },

  // ── Environmental & Sustainability ──────────────────────────────────────
  "sustainability": {
    complementary: ["environmental management", "energy management", "green building", "corporate governance", "compliance"],
    progressionPath: ["sustainability manager", "chief sustainability officer"],
    keywords: ["sustainability", "environment", "green", "carbon", "iso 14001", "leed", "breeam", "esg", "climate", "renewable energy", "net zero", "carbon footprint"],
  },
  "environmental management": {
    complementary: ["sustainability", "compliance", "health & safety", "energy management"],
    progressionPath: ["environmental manager", "EHS director"],
    keywords: ["environmental management", "environment", "ems", "iso 14001", "environmental impact", "ecology", "environmental audit", "conservation"],
  },
  "energy management": {
    complementary: ["sustainability", "engineering", "environmental management", "operations management"],
    progressionPath: ["energy manager", "energy consultant", "chief energy officer"],
    keywords: ["energy management", "energy", "renewable", "solar", "wind", "iema", "aee", "energy audit", "carbon reduction", "smart grid"],
  },

  // ── Quality Management ──────────────────────────────────────────────────
  "quality management": {
    complementary: ["lean & six sigma", "compliance", "operations management", "audit", "manufacturing"],
    progressionPath: ["quality manager", "quality director", "chief quality officer"],
    keywords: ["quality", "iso 9001", "iso", "qms", "quality management", "auditor", "irca", "cqa", "asq", "total quality", "quality assurance", "qa"],
  },
  "audit": {
    complementary: ["compliance", "finance", "accounting", "risk management", "quality management"],
    progressionPath: ["senior auditor", "audit manager", "chief audit executive"],
    keywords: ["audit", "auditing", "internal audit", "external audit", "cia", "cisa", "cpa", "financial audit", "it audit", "sox"],
  },

  // ── Health & Safety ─────────────────────────────────────────────────────
  "health & safety": {
    complementary: ["compliance", "occupational health", "risk management", "environmental management", "construction"],
    progressionPath: ["health and safety manager", "HSE director"],
    keywords: ["health and safety", "hse", "nebosh", "iosh", "osha", "risk assessment", "occupational health", "safety officer", "workplace safety", "ehs"],
  },
  "occupational health": {
    complementary: ["health & safety", "nursing", "mental health", "ergonomics"],
    progressionPath: ["occupational health manager", "chief occupational health officer"],
    keywords: ["occupational health", "workplace health", "ohsas", "iso 45001", "occupational safety", "health surveillance", "fit for work"],
  },

  // ── Music & Performing Arts ─────────────────────────────────────────────
  "music": {
    complementary: ["music production", "performing arts", "audio engineering", "music theory", "teaching & education"],
    progressionPath: ["professional musician", "music teacher", "music director"],
    keywords: ["music", "guitar", "piano", "violin", "drums", "abrsm", "trinity", "music theory", "grade", "conservatory", "berklee", "singing", "voice"],
  },
  "music production": {
    complementary: ["music", "audio engineering", "video production", "digital media"],
    progressionPath: ["music producer", "audio engineer", "sound director"],
    keywords: ["music production", "ableton", "logic pro", "fl studio", "pro tools", "daw", "mixing", "mastering", "sound design", "beatmaking"],
  },
  "audio engineering": {
    complementary: ["music production", "music", "video production", "broadcasting"],
    progressionPath: ["senior audio engineer", "studio manager", "post-production director"],
    keywords: ["audio engineering", "sound engineering", "mixing", "mastering", "pro tools", "studio", "live sound", "broadcast audio", "acoustics"],
  },
  "performing arts": {
    complementary: ["music", "drama", "dance", "public speaking", "media & communications"],
    progressionPath: ["professional performer", "arts director", "drama teacher"],
    keywords: ["performing arts", "theatre", "drama", "acting", "dance", "ballet", "contemporary dance", "stage management", "directing"],
  },

  // ── Media & Communications ──────────────────────────────────────────────
  "public relations": {
    complementary: ["marketing", "social media", "media & communications", "digital marketing", "writing"],
    progressionPath: ["PR manager", "communications director", "CMO track"],
    keywords: ["public relations", "pr", "communications", "press release", "media relations", "reputation management", "cipr", "prca", "crisis communications"],
  },
  "journalism": {
    complementary: ["media & communications", "public relations", "writing", "photography", "video production"],
    progressionPath: ["senior journalist", "editor", "media director"],
    keywords: ["journalism", "journalist", "reporting", "news", "broadcast journalism", "print media", "editorial", "media studies", "nctj"],
  },
  "writing & communication": {
    complementary: ["marketing", "public relations", "journalism", "training & facilitation"],
    progressionPath: ["senior writer", "content director", "communications lead"],
    keywords: ["writing", "copywriting", "content writing", "technical writing", "business writing", "communication", "editing", "proofreading"],
  },

  // ── Finance Specializations ─────────────────────────────────────────────
  "investment": {
    complementary: ["finance", "accounting", "risk management", "real estate", "economics"],
    progressionPath: ["fund manager", "investment director", "chief investment officer"],
    keywords: ["investment", "investing", "portfolio management", "equity", "hedge fund", "private equity", "venture capital", "asset management", "cfa"],
  },
  "insurance": {
    complementary: ["risk management", "finance", "actuarial science", "legal"],
    progressionPath: ["insurance underwriter", "actuary", "insurance director"],
    keywords: ["insurance", "underwriting", "actuary", "claims", "life insurance", "general insurance", "reinsurance", "actuarial"],
  },

  // ── Science & Research ──────────────────────────────────────────────────
  "chemistry": {
    complementary: ["pharmaceutical", "food science", "environmental management", "laboratory science"],
    progressionPath: ["senior chemist", "research scientist", "R&D director"],
    keywords: ["chemistry", "chemical", "laboratory", "analytical chemistry", "organic chemistry", "biochemistry", "pharmaceutical chemistry"],
  },
  "laboratory science": {
    complementary: ["healthcare", "chemistry", "data science", "research", "pharmacy"],
    progressionPath: ["senior lab scientist", "laboratory manager", "research director"],
    keywords: ["laboratory", "lab", "biomedical science", "microbiology", "pathology", "clinical laboratory", "medical laboratory"],
  },

  // ── Personal Development ─────────────────────────────────────────────────
  "coaching": {
    complementary: ["leadership", "human resources", "mental health", "training & facilitation", "sports coaching"],
    progressionPath: ["master coach", "executive coach", "coaching director"],
    keywords: ["coaching", "life coaching", "executive coaching", "business coaching", "icf", "nlp", "personal development", "mentor"],
  },
  "mindfulness & wellness": {
    complementary: ["mental health", "coaching", "fitness & personal training", "nutrition"],
    progressionPath: ["mindfulness teacher", "wellness director", "wellbeing consultant"],
    keywords: ["mindfulness", "meditation", "wellness", "yoga", "wellbeing", "resilience", "stress management", "mindfulness-based"],
  },

  // ── Engineering ─────────────────────────────────────────────────────────
  "mechanical engineering": {
    complementary: ["manufacturing", "lean & six sigma", "quality management", "energy management", "electrical engineering"],
    progressionPath: ["senior mechanical engineer", "chief engineer", "engineering director"],
    keywords: ["mechanical engineering", "mechanical", "cad", "solidworks", "autocad", "manufacturing", "thermodynamics", "fluid mechanics", "machine design"],
  },
  "electrical engineering": {
    complementary: ["mechanical engineering", "renewable energy", "automation", "electronics", "safety"],
    progressionPath: ["senior electrical engineer", "chief engineer", "engineering director"],
    keywords: ["electrical engineering", "electrical", "circuit design", "plc", "automation", "power systems", "hvac", "building services"],
  },
  "civil engineering": {
    complementary: ["architecture", "construction", "environmental management", "project management", "surveying"],
    progressionPath: ["senior civil engineer", "project director", "engineering director"],
    keywords: ["civil engineering", "civil", "structural", "geotechnical", "transportation", "highways", "bridges", "drainage", "iceq", "ice"],
  },
};
