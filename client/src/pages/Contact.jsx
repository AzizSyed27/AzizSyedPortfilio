import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Section } from "../components/Section";
import { HeroBand } from "../components/HeroBand";
import { ContactBeacon } from "../components/ContactBeacon";
import { useActions } from "../intents/actions";
import { BIO } from "../content/bio";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function ContactDetails() {
  const actions = useActions();
  const [copied, setCopied] = useState(null);

  const copy = async (text, key) => {
    const ok = await actions.copyField(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    }
  };

  return (
    <div>
      <div className="contact-detail">
        <div className="label">Email</div>
        <div className="value" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={`mailto:${BIO.email}`} data-cursor="hover">{BIO.email}</a>
          <button className="btn ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => copy(BIO.email, "email")}>
            {copied === "email" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="contact-detail">
        <div className="label">Where</div>
        <div className="value">{BIO.location} · Canada</div>
      </div>
      <div className="contact-detail">
        <div className="label">Online</div>
        <div className="value" style={{ display: "flex", gap: 18, fontSize: 18, flexWrap: "wrap" }}>
          <button onClick={() => actions.openLink(BIO.github)} data-cursor="hover" style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>github</button>
          <button onClick={() => actions.openLink(BIO.linkedin)} data-cursor="hover" style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>linkedin</button>
          <button onClick={() => actions.openLink("https://azizsyed.ca")} data-cursor="hover" style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>azizsyed.ca</button>
        </div>
      </div>
      <div style={{ marginTop: 32, padding: 18, border: "0.5px dashed var(--line-strong)", borderRadius: 8 }}>
        <div className="eyebrow" style={{ marginBottom: 8, color: "var(--accent)" }}>↑ COMING SOON</div>
        <div style={{ fontFamily: "var(--f-display)", fontSize: 22, lineHeight: 1.2 }}>
          Hand-tracking mode lets you navigate this whole site without touching the keyboard.
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const formRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus("error");
      setError("Email service is not configured yet (missing VITE_EMAILJS_* env vars). Use the email/phone links instead.");
      return;
    }
    try {
      setStatus("sending");
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, { publicKey: PUBLIC_KEY });
      setStatus("sent");
      formRef.current.reset();
    } catch (err) {
      setStatus("error");
      setError(err?.text || err?.message || "Could not send right now. Please try again or email me directly.");
    }
  };

  return (
    <div className="page-enter">
      <Section num="05" label="Contact · /reach-out">
        <HeroBand right={<ContactBeacon />}>
          <h2 className="display rv" data-d="0.05" style={{ fontSize: "clamp(48px, 7vw, 116px)", marginBottom: 28 }}>
            Let's <em>talk</em>.
          </h2>
          <p className="lede rv" data-d="0.16" style={{ marginBottom: 0 }}>
            Roles, freelance, collaborations, hand-tracking nerdery —
            whatever it is, I'd love to hear about it. Fastest reply is
            email or LinkedIn.
          </p>
        </HeroBand>

        <div className="contact-grid" style={{ marginTop: 8 }}>
          <form ref={formRef} className="contact-form" onSubmit={onSubmit}>
            <div className="contact-field">
              <label htmlFor="cf-name">01 · Name</label>
              <input id="cf-name" name="from_name" type="text" placeholder="Your name" required />
            </div>
            <div className="contact-field">
              <label htmlFor="cf-email">02 · Email</label>
              <input id="cf-email" name="reply_to" type="email" placeholder="hi@yourdomain.com" required />
            </div>
            <div className="contact-field">
              <label htmlFor="cf-message">03 · What's on your mind</label>
              <textarea id="cf-message" name="message" rows="4" placeholder="A few sentences is plenty…" required minLength={10} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button type="submit" className="btn" data-cursor="hover" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : <>Send <span className="arr">→</span></>}
              </button>
              {status === "sent" && (
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  · Message sent. I'll reply within a day.
                </span>
              )}
              {status === "error" && (
                <span className="eyebrow" style={{ color: "var(--accent)" }}>
                  · {error}
                </span>
              )}
            </div>
          </form>

          <ContactDetails />
        </div>
      </Section>
    </div>
  );
}
