import trunorthShot from "../assets/project-pics/trunorth.png";
import eastwaveShot from "../assets/project-pics/eastwave.png";

export const CAPABILITIES = [
  {
    num: "C/01",
    title: "Full-stack engineering",
    desc: "Comfortable end-to-end — UIs, APIs, databases, deploys. I like understanding how the whole thing fits together.",
    tags: ["React", "Angular", "Next.js", "Spring Boot", "Express", "FastAPI", ".NET Core", "REST", "GraphQL"],
    story: "Shipped a nonprofit platform end-to-end — React, Spring Boot, PostgreSQL, Stripe — now live to 125+ subscribers and $50K+ raised.",
  },
  {
    num: "C/02",
    title: "AI agents & automation",
    desc: "Multi-agent pipelines, RAG, SSE streaming. I shipped a 3-agent debug pipeline catching 150+ production bugs.",
    tags: ["Gemini API", "Agent pipelines", "RAG", "SSE", "LLM tool use"],
    story: "A 3-agent debug pipeline I built caught 150+ production defects before they ever reached a user.",
  },
  {
    num: "C/03",
    title: "Computer vision",
    desc: "Real-time ML inference in the browser. Built ASL Hand Coach: CNN palm detector + landmark regression at sub-200ms.",
    tags: ["MediaPipe", "CNN palm detection", "21-keypoint regression", "WebGL"],
    story: "ASL Hand Coach reads 36 signs at 90% accuracy with sub-200ms inference — all in the browser, no install.",
  },
  {
    num: "C/04",
    title: "Cloud & DevOps",
    desc: "Deployed across AWS, Azure, Cloudflare. CI/CD pipelines, containerization, observable releases.",
    tags: ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    story: "Turned a manual, afternoon-long release into a one-click deploy across AWS, Azure, and Cloudflare.",
  },
  {
    num: "C/05",
    title: "Geospatial & data",
    desc: "PostGIS, spatial indexes, ETL across shapefile/CSV/GeoTIFF. Graph inference with NetworkX over 100K+ entities.",
    tags: ["PostGIS", "GiST + KNN indexes", "GeoPandas", "NetworkX"],
    story: "Indexed 100,000+ Ontario water bodies into a ranked map that answers 'where are the fish' in milliseconds.",
  },
  {
    num: "C/06",
    title: "3D & real-time graphics",
    desc: "React Three Fiber, adaptive rendering. Cut GPU usage from 90% to 15-30% under 200 concurrent users.",
    tags: ["Three.js", "React Three Fiber", "Adaptive LOD", "WebGL"],
    story: "Dropped GPU load from 90% to 15–30% under 200 concurrent users with adaptive rendering.",
  },
];

export const CLIENTS = [
  {
    id: "C/trunorth",
    initial: "T",
    name: "Tru North Couriers",
    url: "https://trunorthcouriers.onrender.com/",
    image: trunorthShot,
    role: "Courier & logistics site — quoting, booking, live tracking",
    desc: "Marketing + booking site for a Toronto courier (since 2016): medical, same-day, e-commerce fulfilment, and cross-border services, with real-time package tracking and a three-step quote-to-delivery flow.",
    metric: "99.2%",
    metricL: "on-time rate",
    story: "Gave a GTA courier a real booking + live-tracking site fronting 10,000+ deliveries at a 99.2% on-time rate.",
  },
  {
    id: "C/eastwave",
    initial: "E",
    name: "East Wave Collision Consultants",
    url: "https://east-wave-collision-consultantcy.vercel.app/",
    image: eastwaveShot,
    role: "Collision-consultancy site — claim & settlement guidance",
    desc: "Lead-generating marketing site for a collision consultancy that guides GTA drivers through every step after an accident — arranging a rental, managing the insurance claim, and advocating for a fair settlement.",
    story: "Built a clean, conversion-focused site that turns post-accident searches into consultation calls.",
  },
  {
    id: "C/01",
    initial: "A",
    name: "Able I.T Solutions",
    role: "AI ticket-triage agent + technical support workflows",
    desc: "Built an AI agent that ranks support tickets by severity with auto-synopses. Eliminated ~2 hrs of manual triage per shift.",
    metric: "92%",
    metricL: "resolution rate",
    story: "Ranked tickets by severity with auto-synopses, clearing ~2 hours of manual triage every shift.",
  },
  {
    id: "C/02",
    initial: "R",
    name: "Remedy's Rx Pharmacy",
    role: "Legacy POS modernization · inventory automation",
    desc: "Refactored Angular POS workflow, cutting checkout from 5 to 3 steps. Automated weekly inventory reconciliation in Python + SQL.",
    metric: "25%",
    metricL: "faster checkout",
    story: "Trimmed checkout from 5 steps to 3 and automated weekly inventory reconciliation in Python + SQL.",
  },
];

// Home-page "Client work / freelance" showcase — the two live freelance builds,
// shown as browser-chrome screenshot cards. Hand mode turns these into armed
// "pinch to open" targets that surface an in-page focus preview; mouse opens the
// live site. Per-card `accent` is the client's brand colour (inline --cw-accent).
export const HOME_CLIENTS = [
  {
    id: "CW/01",
    shot: eastwaveShot,
    name: "East Wave Collision Consultants",
    sector: "Collision claims · GTA",
    desc: "Full marketing site for a Toronto collision-claims firm — booking flow, multilingual copy, and a conversion-focused hero.",
    tags: ["Angular", "TypeScript", "Django", "REST API", "CI/CD"],
    accent: "#13B6C4",
    url: "https://east-wave-collision-consultantcy.vercel.app/",
  },
  {
    id: "CW/02",
    shot: trunorthShot,
    name: "Tru North Couriers",
    sector: "Logistics · Same-day delivery",
    desc: "Courier platform front-end — live tracking, quote requests, and client-story sections for a GTA-wide delivery service.",
    tags: ["React", "Next.js", "TypeScript", "Azure", "Microservices"],
    accent: "#C8341F",
    url: "https://trunorthcouriers.onrender.com/",
  },
];
