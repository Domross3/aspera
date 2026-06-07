"use client";

/* ============================================================
   <AsperaLanding /> — pre-launch marketing page for Aspera.
   Warm-neutral monochrome, dark-first + warm-paper light. Self-contained:
   all tokens, the breathing orb, paper grain, scroll-reveal, and the beta
   email capture live here. No external UI kit. No hue but one reserved tone.

   Drop-in for Next.js 15 / React 19 (app router). The three font families
   (Quicksand, Hanken Grotesk, Geist Mono) are loaded route-scoped via
   next/font in app/page.tsx and exposed as --font-quicksand/-hanken/-geist-mono.
   ============================================================ */
import React, { useState, useEffect, useRef } from "react";

const AL_REDUCED =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/* ---- scoped stylesheet (tokens + base + motion + layout) ---- */
const AL_CSS = `
.aspera-landing {
  /* dark — default */
  --bg:#0a0a09; --surface:#141311; --elevated:#1d1b18;
  --text:#f2efe8; --text-2:#b4afa5; --muted:#76726b; --faint:#4b4844;
  --line:rgba(244,240,232,0.085); --line-2:rgba(244,240,232,0.16);
  --ring:#6c6962; --glow:#d7d2c6; --orb-a:#34322e; --orb-b:#16150f;
  --critical:#b8a489; --grain:0.045;
  --label-fg:#928d84;                 /* muted, nudged for AA on bg */
  --display:var(--font-quicksand), system-ui, sans-serif;
  --body:var(--font-hanken), system-ui, sans-serif;
  --mono:var(--font-geist-mono), ui-monospace, monospace;
  --r-soft:26px; --r-inst:10px;
  --maxw:1120px; --textw:660px;
  background:var(--bg); color:var(--text);
  font-family:var(--body); -webkit-font-smoothing:antialiased;
  position:relative; overflow-x:hidden; min-height:100dvh;
  transition:background .5s ease, color .5s ease;
}
.aspera-landing[data-theme="light"] {
  --bg:#ece9e1; --surface:#f4f1e9; --elevated:#fbf8f1;
  --text:#232019; --text-2:#57534a; --muted:#8d887d; --faint:#b6b1a5;
  --line:rgba(35,32,25,0.11); --line-2:rgba(35,32,25,0.2);
  --ring:#9d988e; --glow:#a39d8f; --orb-a:#dcd7cb; --orb-b:#f1eee6;
  --critical:#927752; --grain:0.05;
  --label-fg:#57534a;
}
.aspera-landing *,.aspera-landing *::before,.aspera-landing *::after{box-sizing:border-box;}
.aspera-landing ::selection{ background:var(--line-2); }

/* grain overlay — soft surfaces only */
.al-grain{ position:relative; }
.al-grain::after{
  content:""; position:absolute; inset:0; pointer-events:none; z-index:1;
  opacity:var(--grain); mix-blend-mode:overlay; border-radius:inherit;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* layout */
.al-wrap{ max-width:var(--maxw); margin:0 auto; padding:0 28px; }
.al-section{ padding:120px 0; }
.al-label{
  font-family:var(--mono); text-transform:uppercase; letter-spacing:0.14em;
  font-size:11.5px; font-weight:500; color:var(--label-fg);
}
.al-h2{
  font-family:var(--display); font-weight:500; letter-spacing:-0.01em; line-height:1.12;
  font-size:clamp(1.9rem,3.4vw,2.7rem); color:var(--text); margin:0; text-wrap:balance;
}
.al-body{
  font-family:var(--body); font-weight:400; line-height:1.62;
  font-size:clamp(1.02rem,1.5vw,1.18rem); color:var(--text-2); text-wrap:pretty;
}
.al-rule{ height:1px; background:var(--line); border:0; width:100%; }

/* reveal — transform only, opacity stays 1 (content never invisible) */
.al-reveal{ transform:translateY(10px); transition:transform .9s cubic-bezier(.22,.61,.36,1); }
.al-reveal.is-in{ transform:none; }

/* breathing motif */
@keyframes al-breathe{ 0%,100%{ transform:scale(.74);} 45%,55%{ transform:scale(1.06);} }
@keyframes al-breathe-glow{ 0%,100%{ opacity:.18;} 50%{ opacity:.6;} }
@keyframes al-breathe-ring{ 0%,100%{ transform:scale(.9); opacity:.45;} 50%{ transform:scale(1.12); opacity:.85;} }
@keyframes al-drift{ 0%,100%{ transform:translate(-50%,-50%);} 50%{ transform:translate(-30%,-66%);} }
.al-breathe{ animation:al-breathe 11s cubic-bezier(.45,0,.55,1) infinite; transform-origin:center; }
.al-breathe-glow{ animation:al-breathe-glow 11s cubic-bezier(.45,0,.55,1) infinite; }
.al-breathe-ring{ animation:al-breathe-ring 11s cubic-bezier(.45,0,.55,1) infinite; transform-origin:center; }

/* buttons + inputs */
.al-btn{
  font-family:var(--body); font-weight:600; font-size:15px; cursor:pointer;
  color:var(--bg); background:var(--text); border:1px solid var(--text);
  border-radius:var(--r-soft); padding:14px 26px; white-space:nowrap;
  transition:opacity .3s ease, transform .3s ease, background .3s ease;
}
.al-btn:hover{ opacity:.9; }
.al-btn:active{ transform:translateY(1px); }
.al-btn:disabled{ opacity:.55; cursor:default; }
.al-quiet{
  font-family:var(--mono); text-transform:uppercase; letter-spacing:0.12em; font-size:11.5px;
  background:none; border:0; color:var(--muted); cursor:pointer; padding:6px 2px;
  transition:color .3s ease;
}
.al-quiet:hover{ color:var(--text-2); }
.al-input{
  font-family:var(--body); font-size:15px; color:var(--text);
  background:var(--bg); border:1px solid var(--line-2); border-radius:var(--r-soft);
  padding:14px 18px; width:100%; transition:border-color .3s ease;
}
.al-input::placeholder{ color:var(--muted); }
.aspera-landing :focus-visible{ outline:2px solid var(--ring); outline-offset:3px; border-radius:6px; }
.al-input:focus-visible{ outline-offset:0; outline-color:var(--text-2); border-color:var(--text-2); }

/* theme toggle */
.al-toggle{
  position:fixed; top:18px; right:18px; z-index:50; display:flex; gap:2px;
  padding:3px; border-radius:999px; background:var(--surface);
  border:1px solid var(--line-2); backdrop-filter:blur(8px);
}
.al-toggle button{
  font-family:var(--mono); font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase;
  border:0; cursor:pointer; padding:7px 13px; border-radius:999px; color:var(--muted);
  background:transparent; transition:all .25s ease;
}
.al-toggle button[aria-pressed="true"]{ background:var(--text); color:var(--bg); }

@media (prefers-reduced-motion: reduce){
  .al-reveal{ transform:none !important; transition:none !important; }
  .al-breathe,.al-breathe-glow,.al-breathe-ring,.al-drift{ animation:none !important; }
}
@media (max-width:760px){
  .al-section{ padding:84px 0; }
  .al-wrap{ padding:0 22px; }
}
`;

/* inject stylesheet once */
function useAsperaStyles() {
  useEffect(() => {
    if (document.getElementById("aspera-landing-css")) return;
    const el = document.createElement("style");
    el.id = "aspera-landing-css";
    el.textContent = AL_CSS;
    document.head.appendChild(el);
  }, []);
}

/* ---- breathing orb (the signature motif) ---- */
export function Orb({ size = 200, ring = false, breathing = true, label }) {
  const anim = breathing && !AL_REDUCED;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className={anim ? "al-breathe-glow" : ""} style={{ position: "absolute",
        width: size * 1.18, height: size * 1.18, borderRadius: "50%", opacity: anim ? undefined : 0.4,
        background: "radial-gradient(circle, var(--glow) 0%, transparent 62%)" }} />
      {ring && (
        <svg className={anim ? "al-breathe-ring" : ""} width={size} height={size}
          viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, opacity: anim ? undefined : 0.6 }}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke="var(--ring)" strokeWidth="1" />
        </svg>
      )}
      <div className={anim ? "al-breathe" : ""} style={{ width: size * 0.78, height: size * 0.78,
        borderRadius: "50%", transform: anim ? undefined : "scale(0.92)",
        background: "radial-gradient(circle at 42% 36%, var(--orb-a), var(--orb-b) 78%)",
        boxShadow: "inset 0 2px 18px rgba(255,255,255,0.06), inset 0 -10px 30px rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {label && <span style={{ fontFamily: "var(--display)", fontWeight: 500, fontSize: size * 0.11,
          color: "var(--text)", opacity: 0.9 }}>{label}</span>}
      </div>
    </div>
  );
}

/* ---- scroll reveal ---- */
function Reveal({ children, delay = 0, style, className = "" }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(AL_REDUCED);
  useEffect(() => {
    if (AL_REDUCED) return;
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`al-reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}>{children}</div>
  );
}

/* ---- beta email capture (wired to /api/waitlist) ---- */
function EmailCapture({ cta = "Request a beta invite", onElevated = false }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot — real users never fill this
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);
  const [pending, setPending] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    if (!ok) { setErr(true); return; }
    setErr(false); setPending(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), company }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setDone(true);
      else setErr(true);
    } catch {
      setErr(true);
    } finally {
      setPending(false);
    }
  };
  if (done) {
    return (
      <div role="status" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px" }}>
        <Orb size={26} breathing={true} />
        <span className="al-body" style={{ fontSize: 15, color: "var(--text)" }}>
          You're in. We'll send an invite when the next group opens.
        </span>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate style={{ width: "100%", maxWidth: onElevated ? 460 : 440 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label htmlFor={`al-email-${onElevated ? "b" : "a"}`} style={{ position: "absolute", width: 1, height: 1,
          overflow: "hidden", clip: "rect(0 0 0 0)" }}>Email address</label>
        {/* honeypot: off-screen, not tab-reachable, hidden from AT */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={company} onChange={(e) => setCompany(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
        <input id={`al-email-${onElevated ? "b" : "a"}`} className="al-input" type="email" inputMode="email"
          autoComplete="email" placeholder="you@example.com" value={email} disabled={pending}
          aria-invalid={err} onChange={(e) => { setEmail(e.target.value); if (err) setErr(false); }}
          style={{ flex: "1 1 220px", background: onElevated ? "var(--surface)" : "var(--bg)" }} />
        <button className="al-btn" type="submit" disabled={pending}>{pending ? "Sending…" : cta}</button>
      </div>
      <div className="al-label" style={{ marginTop: 12, color: err ? "var(--critical)" : "var(--label-fg)",
        textTransform: err ? "none" : "uppercase", letterSpacing: err ? "0.01em" : "0.14em",
        fontFamily: err ? "var(--body)" : "var(--mono)", fontSize: err ? 13 : 11.5 }}>
        {err ? "That didn't go through — mind checking the email and trying again?" : "Private beta · iOS · one note when it's ready"}
      </div>
    </form>
  );
}

/* ---- small mocks for How it works ---- */
function PatternMock() {
  const bars = [8, 13, 7, 16, 10, 5, 6, 11, 9, 4, 14, 8];
  return (
    <div className="al-grain" style={{ border: "1px solid var(--line-2)", borderRadius: "var(--r-inst)",
      padding: "16px 16px 18px", background: "var(--bg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span className="al-label">Pattern</span>
        <span className="al-label" style={{ color: "var(--faint)" }}>tentative</span>
      </div>
      <p style={{ fontFamily: "var(--body)", fontSize: 14, lineHeight: 1.5, color: "var(--text)", margin: 0 }}>
        Pickups eased on mornings after an early night. Possible link, still watching.
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 24, marginTop: 16 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ width: 4, height: h, borderRadius: 1,
            background: i === bars.length - 1 ? "var(--text-2)" : "var(--faint)" }} />
        ))}
      </div>
    </div>
  );
}

function MoodPadMock() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
      <div style={{ position: "relative", width: 150, height: 150, borderRadius: 34,
        border: "1px solid var(--line-2)",
        background: "radial-gradient(circle at 64% 36%, hsl(42 5% 30%), hsl(40 4% 15%) 72%)" }}>
        <div style={{ position: "absolute", left: "50%", top: 14, bottom: 14, width: 1, background: "var(--line)" }} />
        <div style={{ position: "absolute", top: "50%", left: 14, right: 14, height: 1, background: "var(--line)" }} />
        <span className="al-label" style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", fontSize: 8.5 }}>energized</span>
        <span className="al-label" style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 8.5 }}>at rest</span>
        <div className={AL_REDUCED ? "" : "al-drift"} style={{ position: "absolute", left: "64%", top: "36%",
          transform: "translate(-50%,-50%)", width: 26, height: 26, borderRadius: "50%", animationDuration: "11s",
          animationTimingFunction: "cubic-bezier(.45,0,.55,1)", animationIterationCount: "infinite",
          background: "radial-gradient(circle at 40% 35%, var(--orb-a), var(--orb-b))",
          boxShadow: "0 0 16px color-mix(in oklab, var(--glow) 40%, transparent), inset 0 -3px 8px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
  );
}

/* ---- how-it-works panel ---- */
function HowPanel({ label, title, body, bullets, children, delay }) {
  return (
    <Reveal delay={delay}>
      <div className="al-grain" style={{ background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: "var(--r-soft)", padding: "28px 26px 30px", height: "100%",
        display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ minHeight: 156, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {children}
        </div>
        <div>
          <span className="al-label">{label}</span>
          <h3 style={{ fontFamily: "var(--display)", fontWeight: 500, fontSize: 21, lineHeight: 1.22,
            color: "var(--text)", margin: "10px 0 10px", letterSpacing: "-0.01em" }}>{title}</h3>
          <p style={{ fontFamily: "var(--body)", fontSize: 15, lineHeight: 1.58, color: "var(--text-2)", margin: 0,
            textWrap: "pretty" }}>{body}</p>
          {bullets && (
            <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "flex",
              flexDirection: "column", gap: 10 }}>
              {bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start",
                  fontFamily: "var(--body)", fontSize: 14.5, lineHeight: 1.42, color: "var(--text)" }}>
                  <span aria-hidden="true" style={{ flexShrink: 0, width: 5, height: 5, borderRadius: "50%",
                    background: "var(--faint)", marginTop: 7 }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================ */
function AsperaLanding() {
  useAsperaStyles();
  const [theme, setTheme] = useState("dark");
  const howRef = useRef(null);
  const scrollToHow = () => {
    const el = howRef.current;
    if (el) window.scrollTo({ top: el.offsetTop - 40, behavior: AL_REDUCED ? "auto" : "smooth" });
  };

  return (
    <div className="aspera-landing" data-theme={theme}>
      {/* theme toggle */}
      <div className="al-toggle" role="group" aria-label="Color theme">
        <button aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>Dark</button>
        <button aria-pressed={theme === "light"} onClick={() => setTheme("light")}>Light</button>
      </div>

      {/* ── 1 · HERO ── */}
      <header className="al-section" style={{ paddingTop: 132, paddingBottom: 96, textAlign: "center" }}>
        <div className="al-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Reveal><Orb size={208} ring={true} /></Reveal>
          <Reveal delay={80}>
            <div className="al-label" style={{ marginTop: 40, letterSpacing: "0.22em" }}>An agent for your digital habits</div>
          </Reveal>
          <Reveal delay={140}>
            <h1 style={{ fontFamily: "var(--display)", fontWeight: 500, letterSpacing: "-0.02em",
              fontSize: "clamp(2.3rem,5.4vw,4rem)", lineHeight: 1.08, color: "var(--text)",
              margin: "22px 0 0", maxWidth: 760, textWrap: "balance" }}>
              See your habits. Set your limits. Watch what changes.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="al-body" style={{ maxWidth: 560, margin: "22px auto 0" }}>
              Aspera reads the signals you already give your phone, like screen time, mood, and
              energy, then holds the limits you set and shows you whether they're working.
            </p>
          </Reveal>
          <Reveal delay={260} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ marginTop: 38, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <EmailCapture />
              </div>
              <button className="al-quiet" onClick={scrollToHow}>How it works ↓</button>
            </div>
          </Reveal>
        </div>
      </header>

      {/* ── 2 · THE LOOP ── */}
      <section className="al-section" style={{ paddingTop: 40 }}>
        <div className="al-wrap" style={{ maxWidth: 760 }}>
          <Reveal><span className="al-label">What it does</span></Reveal>
          <Reveal delay={80}>
            <p style={{ fontFamily: "var(--display)", fontWeight: 500, letterSpacing: "-0.01em",
              fontSize: "clamp(1.5rem,2.8vw,2.1rem)", lineHeight: 1.32, color: "var(--text)",
              margin: "22px 0 0", textWrap: "balance" }}>
              Aspera runs a loop: it notices a habit, holds the limit you set on it,
              then measures whether that actually changed anything.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className="al-body" style={{ marginTop: 22, maxWidth: 620 }}>
              Every pattern it surfaces comes from your own data and arrives as something to test.
              You decide what to do with it, whether that means adjusting a limit, watching longer, or moving on.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 3 · HOW IT WORKS ── */}
      <section className="al-section" ref={howRef} style={{ paddingTop: 60 }}>
        <div className="al-wrap">
          <Reveal style={{ marginBottom: 40 }}>
            <span className="al-label">How it works</span>
            <h2 className="al-h2" style={{ marginTop: 12, maxWidth: 560 }}>
              Three things you can do with it.
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            <HowPanel delay={0} label="Patterns"
              title="Spot what's driving a habit."
              body="Aspera surfaces a pattern from your own data when it's large and consistent, like fewer morning pickups after an early night, ready for you to test.">
              <PatternMock />
            </HowPanel>
            <HowPanel delay={90} label="Limits"
              title="Set a limit and let it hold."
              body="You decide how bypassable each app is, anywhere from a single breath before it opens to a firm block, and Aspera holds whatever line you draw."
              bullets={[
                "Delay gratification before an app will open",
                "Ban apps during the windows you choose",
                "Put a daily time limit on the ones you keep",
                "Give yourself a number of cheats you set",
              ]}>
              <Orb size={120} ring={false} />
            </HowPanel>
            <HowPanel delay={180} label="Check-ins"
              title="Log mood and energy in one move."
              body="Drop a single point on a two-axis pad. Aspera tracks how it shifts against your habits in about ten seconds, with no forms to fill.">
              <MoodPadMock />
            </HowPanel>
          </div>
        </div>
      </section>

      {/* ── 4 · THE LOOP, IN ONE LINE ── */}
      <section className="al-section">
        <div className="al-wrap" style={{ maxWidth: 880, textAlign: "center" }}>
          <Reveal style={{ display: "flex", justifyContent: "center", marginBottom: 34 }}>
            <Orb size={64} ring={false} />
          </Reveal>
          <Reveal delay={80}>
            <p style={{ fontFamily: "var(--display)", fontWeight: 500, letterSpacing: "-0.015em",
              fontSize: "clamp(1.9rem,4vw,3rem)", lineHeight: 1.24, color: "var(--text)", margin: 0,
              textWrap: "balance" }}>
              Notice a habit. Set a limit. Aspera holds it, then tells you if it worked.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 5 · CLOSING CTA ── */}
      <section className="al-section" style={{ paddingBottom: 60 }}>
        <div className="al-wrap" style={{ maxWidth: 820 }}>
          <Reveal>
            <div className="al-grain" style={{ background: "var(--elevated)", border: "1px solid var(--line-2)",
              borderRadius: "var(--r-soft)", padding: "clamp(34px, 5vw, 56px)", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Orb size={84} ring={true} />
              <h2 className="al-h2" style={{ marginTop: 28, maxWidth: 480 }}>
                Get early access.
              </h2>
              <p className="al-body" style={{ marginTop: 16, maxWidth: 440 }}>
                Leave an email and we'll send an invite when the next group opens.
              </p>
              <div style={{ marginTop: 28, display: "flex", justifyContent: "center", width: "100%" }}>
                <EmailCapture cta="Request a beta invite" onElevated={true} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── footer ── */}
      <footer style={{ paddingBottom: 72 }}>
        <div className="al-wrap" style={{ maxWidth: 820 }}>
          <hr className="al-rule" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16, paddingTop: 26 }}>
            <span style={{ fontFamily: "var(--display)", fontWeight: 500, fontSize: 22, letterSpacing: "0.04em",
              color: "var(--text)" }}>aspera</span>
            <span className="al-label" style={{ letterSpacing: "0.24em" }}>Ad astra per aspera</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AsperaLanding;
