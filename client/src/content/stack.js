// Tech → projects, inverted from the real project list.
// c = category: lang | fw | cloud | concept

export const TECHS = [
  { n: "TypeScript", c: "lang", p: ["MyE46", "HiddenHooks", "GymNet", "ASL Hand Coach", "Tru North Couriers", "EWCC"] },
  { n: "JavaScript", c: "lang", p: ["Projects by the Projects", "DineSmart", "Portfolio"] },
  { n: "Python",     c: "lang", p: ["HiddenHooks", "InternHub", "Homebound", "EWCC", "DineSmart", "Portfolio"] },
  { n: "Java",       c: "lang", p: ["GymNet", "Projects by the Projects", "DineSmart"] },
  { n: "C#",         c: "lang", p: ["MovieShare"] },
  { n: "SQL",        c: "lang", p: ["Tru North Couriers"] },
  { n: "Bash",       c: "lang", p: ["InternHub"] },

  { n: "React",                 c: "fw", p: ["MyE46", "HiddenHooks", "GymNet", "ASL Hand Coach", "Projects by the Projects", "Tru North Couriers", "Portfolio"] },
  { n: "Next.js",               c: "fw", p: ["HiddenHooks", "Tru North Couriers"] },
  { n: "Angular",               c: "fw", p: ["EWCC", "DineSmart"] },
  { n: "Node.js",               c: "fw", p: ["MyE46", "HiddenHooks", "GymNet", "ASL Hand Coach", "Projects by the Projects", "Portfolio"] },
  { n: "Express",               c: "fw", p: ["MyE46"] },
  { n: "Spring Boot",           c: "fw", p: ["GymNet", "Projects by the Projects", "DineSmart"] },
  { n: "Flask",                 c: "fw", p: ["Homebound"] },
  { n: "FastAPI",               c: "fw", p: ["HiddenHooks", "Homebound", "DineSmart"] },
  { n: "Django",                c: "fw", p: ["EWCC"] },
  { n: ".NET",                  c: "fw", p: ["MovieShare"] },
  { n: "Three.js / R3F",        c: "fw", p: ["MyE46", "Tru North Couriers"] },
  { n: "MediaPipe",             c: "fw", p: ["ASL Hand Coach", "Portfolio"] },
  { n: "scikit-learn / XGBoost",c: "fw", p: ["Homebound"] },
  { n: "SwiftUI",               c: "fw", p: ["MorseBridge"] },

  { n: "PostgreSQL", c: "cloud", p: ["HiddenHooks", "GymNet"] },
  { n: "PostGIS",    c: "cloud", p: ["HiddenHooks"] },
  { n: "MongoDB",    c: "cloud", p: ["EWCC", "DineSmart"] },
  { n: "Docker",     c: "cloud", p: ["HiddenHooks", "GymNet", "Projects by the Projects"] },
  { n: "AWS",        c: "cloud", p: ["Projects by the Projects", "MovieShare"] },
  { n: "Azure",      c: "cloud", p: ["Homebound", "Tru North Couriers"] },
  { n: "Cloudflare", c: "cloud", p: ["Projects by the Projects"] },
  { n: "CI/CD",      c: "cloud", p: ["HiddenHooks", "Projects by the Projects", "EWCC", "MovieShare"] },
  { n: "Git",        c: "cloud", p: ["MyE46", "DineSmart"] },
  { n: "Jira",       c: "cloud", p: ["Tru North Couriers"] },
  { n: "Linux/Unix", c: "cloud", p: ["InternHub"] },
  { n: "Stripe",     c: "cloud", p: ["Projects by the Projects"] },

  { n: "AI agents",        c: "concept", p: ["MyE46", "HiddenHooks", "Portfolio"] },
  { n: "Machine Learning", c: "concept", p: ["HiddenHooks", "ASL Hand Coach", "Homebound", "Portfolio"] },
  { n: "Computer Vision",  c: "concept", p: ["ASL Hand Coach", "Portfolio"] },
  { n: "REST API",         c: "concept", p: ["GymNet", "Projects by the Projects", "Tru North Couriers", "EWCC", "DineSmart"] },
  { n: "Microservices",    c: "concept", p: ["Tru North Couriers"] },
  { n: "Concurrency",      c: "concept", p: ["MyE46", "Projects by the Projects"] },
  { n: "OAuth2",           c: "concept", p: ["Projects by the Projects"] },
  { n: "JWT Auth",         c: "concept", p: ["DineSmart"] },
  { n: "Kerberos Auth",    c: "concept", p: ["MovieShare"] },
];

export const CATEGORIES = {
  lang:    { label: "Languages",    anchor: { x: 0.23, y: 0.30 } },
  fw:      { label: "Frameworks",   anchor: { x: 0.73, y: 0.28 } },
  cloud:   { label: "Cloud / Data", anchor: { x: 0.26, y: 0.74 } },
  concept: { label: "Concepts",     anchor: { x: 0.73, y: 0.72 } },
};

export const CAT_ORDER = ["lang", "fw", "cloud", "concept"];
