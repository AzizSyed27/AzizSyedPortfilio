import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Section } from "../components/Section";
import { useActions } from "../intents/actions";
import { useContact } from "../intents/ContactContext";
import { useHandPipeline } from "../hand/HandPipelineProvider";
import { BIO } from "../content/bio";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const SpeechRec =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const SPEECH_SUPPORTED = !!SpeechRec;

const FIELDS = [
  { id: "name", name: "from_name", label: "01 · Name", type: "input" },
  { id: "email", name: "reply_to", label: "02 · Email", type: "input" },
  { id: "message", name: "message", label: "03 · What's on your mind", type: "area" },
];

const LINKS = [
  { key: "github", label: "github", url: BIO.github },
  { key: "linkedin", label: "linkedin", url: BIO.linkedin },
  { key: "portfolio", label: "azizsyed.ca", url: "https://azizsyed.ca" },
];

// Hand-mode Contact: speak to fill, flick to send, pinch-hold to copy/open.
// Controlled inputs so both speech AND keyboard write (keyboard always works).
export function ContactHand() {
  const { registerHandlers } = useContact();
  const { flashNotice } = useHandPipeline();
  useActions(); // ensure intent layer is mounted in this subtree

  const [vals, setVals] = useState({ name: "", email: "", message: "" });
  const [listening, setListening] = useState(null); // field id currently capturing
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const formRef = useRef(null);
  const recogRef = useRef(null);
  const listeningRef = useRef(null);
  const baseRef = useRef(""); // field value at the moment speech started (append to it)

  const stopSpeech = () => {
    listeningRef.current = null;
    setListening(null);
    setInterim("");
    try { recogRef.current?.stop(); } catch { /* already stopped */ }
  };

  const startSpeech = (field) => {
    if (!SPEECH_SUPPORTED) return;
    if (!recogRef.current) {
      const r = new SpeechRec();
      r.lang = "en-US";
      r.interimResults = true;
      r.continuous = true;
      r.onresult = (e) => {
        let finalTxt = "";
        let interimTxt = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalTxt += t;
          else interimTxt += t;
        }
        const fid = listeningRef.current;
        if (!fid) return;
        if (finalTxt) {
          baseRef.current = (baseRef.current ? baseRef.current + " " : "") + finalTxt.trim();
          setVals((v) => ({ ...v, [fid]: baseRef.current }));
          setInterim("");
        } else {
          setInterim(interimTxt);
        }
      };
      r.onend = () => { if (listeningRef.current) stopSpeech(); };
      r.onerror = () => stopSpeech();
      recogRef.current = r;
    }
    baseRef.current = vals[field] ?? "";
    listeningRef.current = field;
    setListening(field);
    setInterim("");
    try { recogRef.current.start(); } catch { /* start() throws if already running — ignore */ }
  };

  const doSend = async () => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus("error");
      setError("Email service isn't configured — use the email/links on the right.");
      return;
    }
    try {
      setStatus("sending");
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, { publicKey: PUBLIC_KEY });
      setStatus("sent");
      setVals({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err?.text || err?.message || "Couldn't send — try the email link instead.");
    }
  };

  // Gesture seam: flick-send + pinch-on-field reach these via the intent layer.
  useEffect(() => {
    registerHandlers({
      submit: () => {
        const form = formRef.current;
        if (!form) return;
        if (!form.checkValidity()) {
          form.reportValidity?.();
          flashNotice("Fill in name, email and a message first.");
          return;
        }
        doSend();
      },
      toggleField: (field) => {
        if (!SPEECH_SUPPORTED) return;
        if (listeningRef.current === field) stopSpeech();
        else startSpeech(field);
      },
    });
    return () => registerHandlers({ submit: null, toggleField: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { try { recogRef.current?.abort(); } catch { /* noop */ } }, []);

  return (
    <div className={`page-enter contact-hand${status === "sending" || status === "sent" ? " sending" : ""}`}>
      <Section num="05" label="Hand mode · /reach-out">
        <h2 className="display" style={{ fontSize: "clamp(48px, 7vw, 116px)", marginBottom: 16 }}>
          Let's <em>talk</em>.
        </h2>
        <p className="lede" style={{ marginBottom: 40 }}>
          {SPEECH_SUPPORTED
            ? "Speak to fill a field, flick to send, pinch to copy. No keyboard required."
            : "Type to fill a field, flick to send, pinch to copy. (Voice needs Chrome or Edge.)"}
        </p>

        <div className="contact-grid">
          <form ref={formRef} className="contact-form" onSubmit={(e) => { e.preventDefault(); }}>
            {FIELDS.map((f) => (
              <div key={f.id} className={`field${listening === f.id ? " is-listening" : ""}`}>
                <div className="field-head">
                  <label htmlFor={`chf-${f.id}`}>{f.label}</label>
                  {SPEECH_SUPPORTED && listening === f.id && (
                    <span className="listening">
                      <span className="rec" /> Listening
                      <span className="wave"><i /><i /><i /><i /><i /><i /></span>
                    </span>
                  )}
                </div>
                {f.type === "area" ? (
                  <textarea
                    id={`chf-${f.id}`} name={f.name} className="field-box" rows="4"
                    data-cursor="hover" data-hand-field={f.id}
                    required minLength={10} placeholder="A few sentences is plenty…"
                    value={vals[f.id] + (listening === f.id && interim ? ` ${interim}` : "")}
                    onChange={(e) => setVals((v) => ({ ...v, [f.id]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={`chf-${f.id}`} name={f.name} className="field-box"
                    type={f.id === "email" ? "email" : "text"}
                    data-cursor="hover" data-hand-field={f.id} required
                    placeholder={f.id === "email" ? "you@domain.com" : "Your name"}
                    value={vals[f.id] + (listening === f.id && interim ? ` ${interim}` : "")}
                    onChange={(e) => setVals((v) => ({ ...v, [f.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <div className="send-bay" data-cursor="hover" data-hand-send="1" aria-label="Send message zone">
              <div className="launch-zone">
                <div className="trail"><span /><span /><span /><span /></div>
                <div className="msg-puck"><span className="pk-dot" /> MSG</div>
              </div>
              <div className="launch-btn">
                <button type="button" className="lb-main" data-cursor="hover" data-hand-send="1" onClick={doSend}>
                  Flick to launch <span className="lb-arrow">↑</span>
                </button>
                <span className="lb-sub">
                  {status === "sending" ? "sending…"
                    : status === "sent" ? "message away ✓"
                    : status === "error" ? error
                    : "flick up · or pinch the button"}
                </span>
              </div>
            </div>
            {SPEECH_SUPPORTED && (
              <div className="speech-note">Voice uses your browser's recognition — Chrome sends audio to Google to transcribe.</div>
            )}
          </form>

          <div>
            <div className="detail">
              <div className="d-label">Email</div>
              <div className="d-row">
                <button className="d-value" data-cursor="hover" data-hand-copy={BIO.email} onClick={() => { actionsCopy(BIO.email, flashNotice); }}>
                  {BIO.email}
                </button>
                <span className="pinch-tag"><span className="pinch-glyph" /> Pinch to copy</span>
              </div>
            </div>
            <div className="detail">
              <div className="d-label">Phone</div>
              <div className="d-row">
                <button className="d-value" data-cursor="hover" data-hand-copy={BIO.phone} onClick={() => { actionsCopy(BIO.phone, flashNotice); }}>
                  {BIO.phone}
                </button>
                <span className="pinch-tag"><span className="pinch-glyph" /> Pinch to copy</span>
              </div>
            </div>
            <div className="detail">
              <div className="d-label">Where</div>
              <div className="d-row"><span className="d-value">{BIO.location} · Canada</span></div>
            </div>
            <div className="detail">
              <div className="d-label">Online</div>
              <div className="d-row">
                <div className="links">
                  {LINKS.map((l) => (
                    <div key={l.key} className="link-row">
                      <a href={l.url} data-cursor="hover" data-hand-open={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
                      <span className="pinch-tag"><span className="pinch-glyph" /> Pinch to open</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// Mouse-click fallback for the copy buttons (pinch-hold path is handled by the
// cursor); shows the same confirmation toast.
async function actionsCopy(text, flashNotice) {
  try {
    await navigator.clipboard.writeText(text);
    flashNotice(`Copied · ${text}`);
  } catch { /* clipboard blocked — ignore */ }
}
