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
