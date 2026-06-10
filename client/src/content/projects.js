// Featured projects. Each carries the data the handoff exploded view renders
// as floating fragments: preview (screenshot or fallback), stats (metrics),
// tags (stack), arch (request-path nodes), and caseStudy (narrative).
//
// Screenshots are Vite-bundled assets — import them, don't reference a
// public/ URL string. Projects without a real screenshot omit preview.image
// and render the designed "Drop … screenshot" fallback. To add one: drop the
// file in src/assets/project-pics/, import it here, set preview.image.
import pxpShot from "../assets/project-pics/pxp-img.png";

export const FEATURED_PROJECTS = [
  {
    id: "pxp",
    num: "P/01",
    title: "Projects by the Projects",
    url: "ProjectsXProjects.ca",
    desc: "Full-stack nonprofit platform serving 125+ subscribers — donations, content, and supporter newsletters.",
    tags: ["React", "Spring Boot", "PostgreSQL", "Stripe", "Cloudflare"],
    preview: { image: pxpShot, metaLeft: "DONOR PORTAL · LIVE", dims: "1920×1080" },
    stats: [
      { v: "$50K+", l: "Donations processed" },
      { v: "99.6%", l: "Payment success rate" },
    ],
    arch: [
      { label: "CLIENT", sub: "React SPA" },
      { label: "API", sub: "Spring Boot" },
      { label: "DB", sub: "PostgreSQL" },
      { label: "PAY", sub: "Stripe" },
    ],
    caseStudy: {
      title: "A platform that pays it forward.",
      body: [
        "Projects by the Projects is a full-stack nonprofit platform I built and run as CTO. It handles ",
        { b: "donations, content, and supporter newsletters" },
        " for 125+ subscribers, with Stripe checkout behind a Spring Boot API. Quietly in production, it has processed ",
        { b: "$50K+ in donations" },
        " at a 99.6% payment success rate.",
      ],
    },
  },
  {
    id: "mye46",
    num: "P/02",
    title: "MyE46",
    url: "MyE46.app",
    desc: "Agentic 3D car configurator. Plain-English mods, live budget-aware build updates, real-time part swapping.",
    tags: ["React Three Fiber", "Three.js", "Express", "Gemini API", "Zustand"],
    preview: { metaLeft: "RENDER · R3F SCENE", dims: "1920×1080" },
    stats: [
      { v: "600+", l: "Users week one" },
      { v: "15–30%", l: "GPU under load" },
    ],
    arch: [
      { label: "CLIENT", sub: "R3F canvas" },
      { label: "STATE", sub: "Zustand" },
      { label: "API", sub: "Express" },
      { label: "AGENT", sub: "Gemini" },
    ],
    caseStudy: {
      title: "Talk to your build.",
      body: [
        "MyE46 turns plain-English requests into live 3D mods. I built an ",
        { b: "agentic layer over a React Three Fiber scene" },
        " that swaps parts, tracks a running budget, and re-renders in real time. The hard part wasn't the AI — it was keeping the GPU calm: adaptive LOD dropped load from ",
        { b: "90% to 15–30%" },
        " under 200 concurrent users.",
      ],
    },
  },
  {
    id: "asl",
    num: "P/03",
    title: "ASL Hand Coach",
    url: "ASLHandCoach.ca",
    desc: "Browser-based ASL trainer. Live camera input, 21 hand keypoints, sub-200ms ML inference.",
    tags: ["React", "TypeScript", "MediaPipe", "CNN", "Tailwind"],
    preview: { metaLeft: "CAM 01 · 21 KEYPOINTS", dims: "640×480" },
    stats: [
      { v: "90%", l: "Recognition accuracy" },
      { v: "<200ms", l: "Inference / frame" },
    ],
    arch: [
      { label: "CAMERA", sub: "getUserMedia" },
      { label: "DETECT", sub: "CNN palm" },
      { label: "LANDMARK", sub: "21 keypoints" },
      { label: "CLASSIFY", sub: "A–Z · 0–9" },
    ],
    caseStudy: {
      title: "Learn to sign, in the browser.",
      body: [
        "ASL Hand Coach is a browser-based ASL trainer with ",
        { b: "no install and no upload" },
        " — everything runs on-device. A CNN palm detector feeds a 21-keypoint landmark regressor, classifying ",
        { b: "36 signs at 90% accuracy" },
        " with sub-200ms inference. It's also the seed of the hand-tracking nav I'm adding to this site.",
      ],
    },
  },
  {
    id: "hooks",
    num: "P/04",
    title: "HiddenHooks",
    url: "HiddenHooks.ca",
    desc: "PostGIS engine ranking 100K+ Ontario water bodies. Geospatial ETL across 9 open-data sources, graph inference for fish presence.",
    tags: ["FastAPI", "PostGIS", "NetworkX", "Next.js", "Mapbox GL"],
    preview: { metaLeft: "MAP · MAPBOX GL", dims: "1920×1080" },
    stats: [
      { v: "100K+", l: "Water bodies ranked" },
      { v: "3GB+", l: "Geospatial data" },
    ],
    arch: [
      { label: "SOURCES", sub: "9 datasets" },
      { label: "ETL", sub: "GeoPandas" },
      { label: "POSTGIS", sub: "GiST + KNN" },
      { label: "GRAPH", sub: "NetworkX" },
    ],
    caseStudy: {
      title: "Where are the fish, exactly?",
      body: [
        "HiddenHooks is a geospatial engine ranking ",
        { b: "100,000+ Ontario water bodies" },
        " by likely fish presence. I built a spatial ETL across 9 open-data sources into PostGIS (",
        { b: "3GB+" },
        "), then ran graph inference with NetworkX to propagate species likelihood across connected waterways — served to a Mapbox front-end via FastAPI.",
      ],
    },
  },
];

export const PROJECTS_BY_ID = Object.fromEntries(FEATURED_PROJECTS.map((p) => [p.id, p]));

export const ARCHIVE_PROJECTS = [
  { num: "05", title: "GymNet",      tags: "React · Spring Boot · PostgreSQL · Flyway", note: "Gym ops + member + admin dashboards",  extra: "Role-based dashboards for members, trainers, and admins, with Flyway-versioned schema migrations." },
  { num: "06", title: "DineSmart",   tags: "Angular · Spring Boot · MongoDB · GraphQL", note: "Restaurant management, Apollo Server", extra: "Menu, orders, and table management served over a GraphQL API with Apollo Server." },
  { num: "07", title: "MovieShare",  tags: "ASP.NET Core · AWS EC2 · S3 · CloudFront · RDS", note: "Cloud movie streaming on AWS CI/CD", extra: "Streaming pipeline on EC2 + S3 + CloudFront with an automated CI/CD release to AWS." },
  { num: "08", title: "CommConnect", tags: "Next.js · React MFEs · Apollo Federation · Gemini", note: "Community platform with AI RAG assistant", extra: "Federated micro-frontends with a Gemini-powered RAG assistant answering community questions." },
];
