// Featured projects. Each carries the data the handoff exploded view renders
// as floating fragments: preview (screenshot or fallback), stats (metrics),
// tags (stack), arch (request-path nodes), and caseStudy (narrative).
//
// Screenshots are Vite-bundled assets — import them, don't reference a
// public/ URL string. Projects without a real screenshot omit preview.image
// and render the designed "Drop … screenshot" fallback. To add one: drop the
// file in src/assets/project-pics/, import it here, set preview.image.
import pxpShot from "../assets/project-pics/pxp-img.png";
import mye46Shot from "../assets/project-pics/mye46.png";
import aslShot from "../assets/project-pics/aslDemo.png";
import hooksShot from "../assets/project-pics/hiddenhook_demo.png";
import gymnetShot from "../assets/project-pics/gymnet.png";
import dineSmartShot from "../assets/project-pics/dine-smart.png";
import movieShareShot from "../assets/project-pics/MovieShare-AzizSyed.png";
import commConnectShot from "../assets/project-pics/community-portal.png";
import portfolioShot from "../assets/project-pics/portfolioPic.png";
import homeboundShot from "../assets/project-pics/homebound_demo.png";
import internHubShot from "../assets/project-pics/internhub_demo.png";
import morseBridgeShot from "../assets/project-pics/morsebridge_demo.png";

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
    preview: { image: mye46Shot, metaLeft: "RENDER · R3F SCENE", dims: "1920×1080" },
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
    preview: { image: aslShot, metaLeft: "CAM 01 · 21 KEYPOINTS", dims: "640×480" },
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
    preview: { image: hooksShot, metaLeft: "MAP · MAPBOX GL", dims: "1920×1080" },
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

// Archive projects — the same rich shape as featured so each opens the exploded
// view (registered in PROJECTS_BY_ID below). `note` is the compact row subtitle;
// `tags` is an array (the row joins it). `stats` is optional — included only
// where a real number exists, omitted otherwise (the exploded view hides the
// metrics panel when absent).
export const ARCHIVE_PROJECTS = [
  {
    id: "gymnet",
    num: "P/05",
    title: "GymNet",
    url: "github.com/AzizSyed27",
    note: "Gym ops + member + admin dashboards",
    desc: "Gym operations platform with role-based dashboards for members, trainers, and admins over a Spring Boot API.",
    tags: ["React", "Spring Boot", "PostgreSQL", "Flyway"],
    preview: { image: gymnetShot, metaLeft: "DASHBOARD · ADMIN", dims: "1920×1080" },
    arch: [
      { label: "CLIENT", sub: "React SPA" },
      { label: "API", sub: "Spring Boot" },
      { label: "DB", sub: "PostgreSQL" },
      { label: "MIGRATE", sub: "Flyway" },
    ],
    caseStudy: {
      title: "Run the gym from one panel.",
      body: [
        "GymNet gives members, trainers, and admins their own ",
        { b: "role-based dashboards" },
        " over a Spring Boot API, with the schema kept honest by ",
        { b: "Flyway-versioned migrations" },
        " so every environment stays in lockstep.",
      ],
    },
  },
  {
    id: "dinesmart",
    num: "P/06",
    title: "DineSmart",
    url: "github.com/AzizSyed27",
    note: "Restaurant management, Apollo Server",
    desc: "Restaurant management app — menu, orders, and tables served over a GraphQL API with Apollo Server.",
    tags: ["Angular", "Spring Boot", "MongoDB", "GraphQL"],
    preview: { image: dineSmartShot, metaLeft: "ORDERS · GRAPHQL", dims: "1920×1080" },
    arch: [
      { label: "CLIENT", sub: "Angular" },
      { label: "API", sub: "Spring Boot" },
      { label: "GRAPHQL", sub: "Apollo" },
      { label: "DB", sub: "MongoDB" },
    ],
    caseStudy: {
      title: "The whole floor, one query away.",
      body: [
        "DineSmart handles ",
        { b: "menu, orders, and table management" },
        " through a single GraphQL API on Apollo Server, so the Angular front-end pulls exactly the data each view needs from MongoDB — nothing more.",
      ],
    },
  },
  {
    id: "movieshare",
    num: "P/07",
    title: "MovieShare",
    url: "github.com/AzizSyed27",
    note: "Cloud movie streaming on AWS CI/CD",
    desc: "Cloud movie-streaming app deployed across AWS with an automated CI/CD release pipeline.",
    tags: ["ASP.NET Core", "AWS EC2", "S3", "CloudFront", "RDS"],
    preview: { image: movieShareShot, metaLeft: "STREAM · CLOUDFRONT", dims: "1920×1080" },
    arch: [
      { label: "APP", sub: "ASP.NET Core" },
      { label: "COMPUTE", sub: "EC2" },
      { label: "DELIVERY", sub: "S3 + CloudFront" },
      { label: "DB", sub: "RDS" },
    ],
    caseStudy: {
      title: "Streaming, shipped to the cloud.",
      body: [
        "MovieShare runs an ASP.NET Core app on EC2 with media on ",
        { b: "S3 behind CloudFront" },
        " and data in RDS — released through an ",
        { b: "automated CI/CD pipeline" },
        " so a push lands in production without hand-holding.",
      ],
    },
  },
  {
    id: "commconnect",
    num: "P/08",
    title: "CommConnect",
    url: "github.com/AzizSyed27",
    note: "Community platform with AI RAG assistant",
    desc: "Community platform built from federated micro-frontends with a Gemini-powered RAG assistant.",
    tags: ["Next.js", "React MFEs", "Apollo Federation", "Gemini"],
    preview: { image: commConnectShot, metaLeft: "PORTAL · RAG", dims: "1920×1080" },
    arch: [
      { label: "SHELL", sub: "Next.js" },
      { label: "MFEs", sub: "React" },
      { label: "FEDERATE", sub: "Apollo" },
      { label: "ASSISTANT", sub: "Gemini RAG" },
    ],
    caseStudy: {
      title: "Many teams, one community portal.",
      body: [
        "CommConnect composes independent ",
        { b: "React micro-frontends" },
        " behind an Apollo Federation gateway, with a ",
        { b: "Gemini-powered RAG assistant" },
        " answering community questions from the platform's own content.",
      ],
    },
  },
  {
    id: "internhub",
    num: "P/09",
    title: "InternHub",
    url: "github.com/AzizSyed27/InternHub",
    note: "Internship tracker + LinkedIn outreach automation",
    desc: "Python automation suite that monitors internship postings across 30+ sources and drafts AI-personalized LinkedIn outreach.",
    tags: ["Python", "Playwright", "Claude API", "Gmail SMTP"],
    preview: { image: internHubShot, metaLeft: "AUTOMATION · CLI", dims: "terminal" },
    stats: [
      { v: "30+", l: "Job sources monitored" },
      { v: "35+", l: "Target companies" },
    ],
    arch: [
      { label: "SCRAPE", sub: "Greenhouse · Workday" },
      { label: "DEDUP", sub: "JSON store" },
      { label: "NOTIFY", sub: "Gmail SMTP" },
      { label: "CONNECT", sub: "LinkedIn · Claude" },
    ],
    caseStudy: {
      title: "Never miss a posting again.",
      body: [
        "InternHub polls ",
        { b: "30+ job sources every 5 minutes" },
        " — Greenhouse/Lever/Workday APIs plus Playwright scrapers — dedupes against a local store, and emails new listings. A second pipeline finds the right people and drafts ",
        { b: "Claude-personalized connection notes" },
        " for manual outreach.",
      ],
    },
  },
  {
    id: "homebound",
    num: "P/10",
    title: "Homebound",
    url: "github.com/AzizSyed27/Homebound",
    note: "ML predictor for stolen-bike recovery",
    desc: "Supervised ML pipeline estimating the odds a stolen Toronto bike is recovered, served through a Flask API + web UI.",
    tags: ["Python", "scikit-learn", "Flask", "XGBoost"],
    preview: { image: homeboundShot, metaLeft: "MODEL · /predict", dims: "1920×1080" },
    stats: [
      { v: "37.9K", l: "Theft records" },
      { v: "3", l: "Calibrated classifiers" },
    ],
    arch: [
      { label: "DATA", sub: "37.9K records" },
      { label: "FEATURES", sub: "engineering" },
      { label: "MODEL", sub: "RF · calibrated" },
      { label: "API", sub: "Flask /predict" },
    ],
    caseStudy: {
      title: "Will this bike come home?",
      body: [
        "Homebound trains three classifiers on ",
        { b: "~37,900 Toronto Police theft records" },
        " — handling a severe 99%-not-recovered imbalance with calibration and careful feature engineering — then serves live probabilities through a ",
        { b: "Flask /predict API" },
        " and an interactive web UI.",
      ],
    },
  },
  {
    id: "morsebridge",
    num: "P/11",
    title: "MorseBridge",
    url: "github.com/AzizSyed27/MorseBridge",
    note: "Offline SwiftUI Morse-code tutor",
    desc: "Offline SwiftUI app that teaches Morse code through sound, light, haptics, and speech.",
    tags: ["Swift", "SwiftUI", "iOS"],
    preview: { image: morseBridgeShot, metaLeft: "iOS · OFFLINE", dims: "1170×2532" },
    stats: [
      { v: "4", l: "Sense channels" },
      { v: "Offline", l: "Runs on-device" },
    ],
    arch: [
      { label: "INPUT", sub: "key / tap" },
      { label: "CORE", sub: "lesson logic" },
      { label: "PLAYBACK", sub: "tone + flash" },
      { label: "SENSE", sub: "haptics + TTS" },
    ],
    caseStudy: {
      title: "Feel the dots and dashes.",
      body: [
        "MorseBridge teaches Morse through ",
        { b: "four senses at once" },
        " — audio tone, screen flash, haptic taps, and speech synthesis — in a modular SwiftUI app that works ",
        { b: "entirely offline" },
        ", no account or network required.",
      ],
    },
  },
  {
    id: "portfolio",
    num: "P/12",
    title: "Aziz's Portfolio",
    url: "azizsyed.ca",
    note: "This site — React + hand-tracking control",
    desc: "This portfolio — a React 19 SPA with a 3D gallery and an optional webcam hand-control layer.",
    tags: ["React 19", "Vite", "R3F / three", "MediaPipe"],
    preview: { image: portfolioShot, metaLeft: "SPA · HAND MODE", dims: "1920×1080" },
    stats: [
      { v: "9", l: "Color themes" },
      { v: "6", l: "Routes" },
    ],
    arch: [
      { label: "SPA", sub: "React 19" },
      { label: "3D", sub: "R3F / three" },
      { label: "HAND", sub: "MediaPipe" },
      { label: "DEPLOY", sub: "Render" },
    ],
    caseStudy: {
      title: "A portfolio you can steer with your hands.",
      body: [
        "The site you're on: a React 19 + Vite SPA with a ",
        { b: "3D gallery and an exploded project view" },
        " (this one), plus an optional ",
        { b: "MediaPipe hand-tracking layer" },
        " that drives every interaction through the same action layer as mouse and keyboard.",
      ],
    },
  },
];

// Every project (featured + archive) is resolvable by id so the exploded view
// can open any of them.
export const PROJECTS_BY_ID = Object.fromEntries(
  [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS].map((p) => [p.id, p]),
);
