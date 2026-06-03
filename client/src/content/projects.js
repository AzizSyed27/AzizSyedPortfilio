// Featured projects — TODO: user will supply real copy + screenshots for
// MyE46, ASL Hand Coach, HiddenHooks. PxP copy + screenshot already real.

export const FEATURED_PROJECTS = [
  {
    id: "pxp",
    num: "P/01",
    title: "Projects by the Projects",
    url: "ProjectsXProjects.ca",
    desc: "Full-stack nonprofit platform serving 125+ subscribers — donations, content, and supporter newsletters.",
    tags: ["React", "Spring Boot", "PostgreSQL", "Stripe", "Cloudflare"],
    image: "/assets/project-pics/pxp-img.png",
    stats: [
      { v: "$50K+", l: "in donations" },
      { v: "99.6%", l: "payment success" },
    ],
    layers: [
      { label: "React + Vite SPA",       desc: "Public pages, donation flows, supporter signups." },
      { label: "Spring Boot REST API",   desc: "Content, media, subscriptions, payment intents." },
      { label: "Stripe Checkout",        desc: "PCI-safe donation processing, webhook reconciliation." },
      { label: "PostgreSQL + Flyway",    desc: "Versioned migrations, role-aware data access." },
      { label: "Cloudflare R2 + Brevo",  desc: "Image hosting + transactional email." },
    ],
  },
  {
    id: "mye46",
    num: "P/02",
    title: "MyE46",
    url: "MyE46.app",
    desc: "Agentic 3D car configurator. Plain-English mods, live budget-aware build updates, real-time part swapping.",
    tags: ["React Three Fiber", "Three.js", "Express", "Gemini API", "Zustand"],
    placeholder: true,
    stats: [
      { v: "600+", l: "users week one" },
      { v: "15-30%", l: "GPU under load" },
    ],
    layers: [
      { label: "R3F scene",         desc: "WebGL car model with swappable parts." },
      { label: "Agent",             desc: "Plain-English mod requests → diffs in scene." },
      { label: "Pricing engine",    desc: "Live budget calc per part swap." },
      { label: "Express backend",   desc: "Persistence + share links." },
      { label: "Adaptive renderer", desc: "LOD/quality scales with load." },
    ],
  },
  {
    id: "asl",
    num: "P/03",
    title: "ASL Hand Coach",
    url: "ASLHandCoach.ca",
    desc: "Browser-based ASL trainer. Live camera input, 21 hand keypoints, sub-200ms ML inference.",
    tags: ["React", "TypeScript", "MediaPipe", "CNN", "Tailwind"],
    placeholder: true,
    stats: [
      { v: "90%", l: "recognition accuracy" },
      { v: "36", l: "signs A–Z, 0–9" },
    ],
    layers: [
      { label: "Camera",      desc: "getUserMedia stream, mirrored canvas." },
      { label: "MediaPipe",   desc: "Palm detector + 21-point landmark regression." },
      { label: "Feature ext.",desc: "Joint angles, normalized, per-frame." },
      { label: "CNN classifier", desc: "Sub-200ms inference, 36 sign classes." },
      { label: "Coaching UI", desc: "Progress, drills, accuracy feedback." },
    ],
  },
  {
    id: "hooks",
    num: "P/04",
    title: "HiddenHooks",
    url: "HiddenHooks.ca",
    desc: "PostGIS engine ranking 100K+ Ontario water bodies. Geospatial ETL across 9 open-data sources, graph inference for fish presence.",
    tags: ["FastAPI", "PostGIS", "NetworkX", "Next.js", "Mapbox GL"],
    placeholder: true,
    stats: [
      { v: "3GB+", l: "geospatial data" },
      { v: "100K+", l: "water bodies" },
    ],
    layers: [
      { label: "Map UI",       desc: "Next.js + Mapbox GL, ranked overlays." },
      { label: "FastAPI",      desc: "Query API + spatial filters." },
      { label: "PostGIS",      desc: "GiST + KNN indexes over 100k water bodies." },
      { label: "ETL pipeline", desc: "Shapefile/CSV/GeoTIFF across 9 sources." },
      { label: "Graph engine", desc: "NetworkX inference for fish presence." },
    ],
  },
];

export const PROJECTS_BY_ID = Object.fromEntries(FEATURED_PROJECTS.map((p) => [p.id, p]));

export const ARCHIVE_PROJECTS = [
  { num: "05", title: "GymNet",      tags: "React · Spring Boot · PostgreSQL · Flyway", note: "Gym ops + member + admin dashboards",  extra: "Role-based dashboards for members, trainers, and admins, with Flyway-versioned schema migrations." },
  { num: "06", title: "DineSmart",   tags: "Angular · Spring Boot · MongoDB · GraphQL", note: "Restaurant management, Apollo Server", extra: "Menu, orders, and table management served over a GraphQL API with Apollo Server." },
  { num: "07", title: "MovieShare",  tags: "ASP.NET Core · AWS EC2 · S3 · CloudFront · RDS", note: "Cloud movie streaming on AWS CI/CD", extra: "Streaming pipeline on EC2 + S3 + CloudFront with an automated CI/CD release to AWS." },
  { num: "08", title: "CommConnect", tags: "Next.js · React MFEs · Apollo Federation · Gemini", note: "Community platform with AI RAG assistant", extra: "Federated micro-frontends with a Gemini-powered RAG assistant answering community questions." },
];
