export const LOG_ENTRIES = [
  { date: "2026.05.21", tag: "shipped", title: "HiddenHooks v0.4",         body: "Ranking model now incorporates 9th open-data source (provincial bathymetry). Top-100 rankings shift modestly; tail of long-tail water bodies improves a lot." },
  { date: "2026.05.14", tag: "built",   title: "Hand-Coach drill mode",    body: "Added per-letter drill: target letter, 5-rep streak, scored accuracy. Average attempt time drops from 9s to 3.4s." },
  { date: "2026.05.02", tag: "shipped", title: "MyE46 sharing links",      body: "Builds are now URL-encoded; share any config without an account. Adopted base64url + crc32 to keep links short and tamper-evident." },
  { date: "2026.04.27", tag: "learned", title: "Why my radar was lying",   body: "Initial sweep period was 8s; real reactions land in 1.2s. Tightened to 7s and decoupled blip selection from sweep tick. Felt better immediately." },
  { date: "2026.04.18", tag: "broke",   title: "Stripe webhook 502",       body: "Render's free tier idle-sleeps. Webhooks were retrying every 15s into a cold start, hammering 502s. Moved to starter; cold starts gone." },
  { date: "2026.04.05", tag: "shipped", title: "PxP supporter newsletter", body: "Brevo SMTP wired up; first edition went to 125 subscribers with a 64% open rate, 11% click-through." },
  { date: "2026.03.28", tag: "built",   title: "Constellation stack view", body: "Replaced the static tech-stack chips with a force-directed constellation. Grab-throw with springy walls. Took two evenings — worth it." },
  { date: "2026.03.15", tag: "learned", title: "Adaptive LOD groundwork",  body: "Reading gl.info per-frame is cheap; reacting to it well isn't. Smoothed over 60-frame window before downgrading quality." },
];
