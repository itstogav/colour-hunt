import { loadStripe } from '@stripe/js'; "use client";

import { useState, useEffect, useRef } from "react";

// ─── DATA ──────────────────────────────────────────────────────────────────────

const COLOURS = [
  { id:"c1",  name:"Crimson",       hex:"#DC2626", pantone:"485 C",          group:"primary" },
  { id:"c2",  name:"Cobalt",        hex:"#1D4ED8", pantone:"286 C",          group:"primary" },
  { id:"c3",  name:"Canary",        hex:"#EAB308", pantone:"012 C",          group:"primary" },
  { id:"c4",  name:"Emerald",       hex:"#059669", pantone:"340 C",          group:"primary" },
  { id:"c5",  name:"Jet",           hex:"#18181B", pantone:"Black C",        group:"primary" },
  { id:"c6",  name:"Blanc",         hex:"#F0EBE1", pantone:"9180 C",         group:"primary" },
  { id:"p1",  name:"Mocha Mousse",  hex:"#A07C5B", pantone:"POTY 2025",      group:"pantone" },
  { id:"p2",  name:"Peach Fuzz",    hex:"#FFBE98", pantone:"POTY 2024",      group:"pantone" },
  { id:"p3",  name:"Viva Magenta",  hex:"#BB2649", pantone:"POTY 2023",      group:"pantone" },
  { id:"p4",  name:"Very Peri",     hex:"#6667AB", pantone:"POTY 2022",      group:"pantone" },
  { id:"p5",  name:"Illuminating",  hex:"#F5DF4D", pantone:"POTY 2021",      group:"pantone" },
  { id:"n1",  name:"Matcha",        hex:"#7EA07A", pantone:"7491 C",         group:"nice" },
  { id:"n2",  name:"Sakura",        hex:"#F2A8B6", pantone:"183 C",          group:"nice" },
  { id:"n3",  name:"Nori",          hex:"#2D4A3E", pantone:"7721 C",         group:"nice" },
  { id:"n4",  name:"Asagi",         hex:"#5BA3C9", pantone:"284 C",          group:"nice" },
  { id:"n5",  name:"Fuji",          hex:"#9B8EC4", pantone:"2715 C",         group:"nice" },
  { id:"n6",  name:"Yamabuki",      hex:"#E8A000", pantone:"7549 C",         group:"nice" },
  { id:"n7",  name:"Beni",          hex:"#B03A2E", pantone:"7626 C",         group:"nice" },
  { id:"n8",  name:"Tetsu",         hex:"#3D3D3F", pantone:"Cool Gray 11 C", group:"nice" },
  { id:"n9",  name:"Usuzumi",       hex:"#8E8A84", pantone:"Warm Gray 8 C",  group:"nice" },
  { id:"n10", name:"Kinari",        hex:"#EDE0CC", pantone:"9183 C",         group:"nice" },
];

const GROUP_LABELS = { primary:"Primary", pantone:"Pantone of the Year", nice:"Curated" };

const MODES = [
  { id:"solo",  label:"Solo",   sub:"You vs the clock" },
  { id:"date",  label:"Date",   sub:"His and hers duel"  },
  { id:"group", label:"Group",  sub:"Up to 6 players"  },
];

const PLUS_FEATURES = [
  { label:"Custom timer",        sub:"30 seconds to 30 minutes" },
  { label:"Shared albums",       sub:"Hunt together, keep together" },
  { label:"Colour streaks",      sub:"Track your daily habit" },
  { label:"Leaderboards",        sub:"Compete across hunts" },
  { label:"Rare colour unlocks", sub:"Pantone specials and metallics" },
];

const PHOTO_TARGET = 9;
const HUNT_SECONDS = 600;

const TIMER_PRESETS = [
  { label:"2 min",  seconds:120,    free:false, note:"Ranked" },
  { label:"5 min",  seconds:300,    free:true                 },
  { label:"10 min", seconds:600,    free:true                 },
  { label:"30 min", seconds:1800,   free:true                 },
  { label:"1 hr",   seconds:3600,   free:true                 },
  { label:"4 hr",   seconds:14400,  free:false, note:"Plus"   },
  { label:"8 hr",   seconds:28800,  free:false, note:"Plus"   },
  { label:"24 hr",  seconds:86400,  free:false, note:"Plus"   },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function isDark(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 < 145;
}

function fmtTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

// ─── STYLES ────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@300;400;700;900&family=Shippori+Mincho:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  :root {
    --ink:    #1A1713;
    --paper:  #F7F2EA;
    --mist:   #EDE6D6;
    --fog:    #C9BFB0;
    --ghost:  #9E9488;
    --warm:   #D4C9B5;
    --accent: #B84A2A;
    --green:  #2E8B57;
    --r:      14px;
    --fh: 'Shippori Mincho', serif;
    --fb: 'Zen Kaku Gothic New', sans-serif;
  }

  html, body, #root { height:100%; }

  body {
    font-family: var(--fb);
    background: var(--paper);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  button { cursor:pointer; font-family:var(--fb); border:none; background:none; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes scaleIn {
    from { opacity:0; transform:scale(.9) translateY(12px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes popIn {
    0%   { opacity:0; transform:scale(.7); }
    70%  { transform:scale(1.06); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes slideRight {
    from { opacity:0; transform:translateX(-20px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes breathe {
    0%,100% { transform:scale(1); }
    50%     { transform:scale(1.03); }
  }
  @keyframes timerPulse {
    0%,100% { opacity:1; }
    50%     { opacity:.4; }
  }
  @keyframes stampIn {
    0%   { opacity:0; transform:scale(1.8) rotate(-12deg); }
    55%  { opacity:1; transform:scale(.94) rotate(2deg); }
    100% { opacity:1; transform:scale(1) rotate(0deg); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .screen {
    min-height:100vh;
    display:flex;
    flex-direction:column;
    animation: fadeIn .25s ease both;
  }

  .t-display {
    font-family: var(--fh);
    font-weight:600;
    line-height:1.15;
    letter-spacing:-.02em;
  }
  .t-label {
    font-size:.64rem;
    font-weight:700;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--ghost);
  }
  .t-body {
    font-size:.88rem;
    font-weight:300;
    line-height:1.75;
    color:var(--ghost);
  }

  .btn {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding:15px 28px;
    border-radius:100px;
    font-size:.84rem;
    font-weight:700;
    letter-spacing:.05em;
    transition: transform .14s, box-shadow .14s;
    -webkit-tap-highlight-color:transparent;
  }
  .btn:active { transform:scale(.97); }
  .btn-ink    { background:var(--ink); color:var(--paper); }
  .btn-ink:hover { box-shadow:0 4px 20px rgba(26,23,19,.22); }
  .btn-ghost  { background:transparent; color:var(--ghost); border:1.5px solid var(--warm); }
  .btn-accent { background:var(--accent); color:#fff; }
  .btn-accent:hover { box-shadow:0 4px 20px rgba(184,74,42,.28); }
  .btn-green  { background:var(--green); color:#fff; }
  .btn-green:hover { box-shadow:0 4px 20px rgba(46,139,87,.32); }

  .card {
    background:#fff;
    border-radius:var(--r);
    border:1.5px solid var(--mist);
    transition:transform .18s, box-shadow .18s;
  }
  .card:active { transform:scale(.985); }

  .pill-tab {
    flex:1;
    padding:8px 4px;
    border-radius:100px;
    font-size:.72rem;
    font-weight:700;
    letter-spacing:.04em;
    color:var(--ghost);
    transition:all .2s;
    text-align:center;
  }
  .pill-tab.active { background:var(--ink); color:var(--paper); }

  .swatch {
    width:100%;
    aspect-ratio:1;
    border-radius:10px;
    cursor:pointer;
    transition:transform .18s, box-shadow .18s, outline-color .15s;
    outline:3px solid transparent;
    outline-offset:3px;
    position:relative;
    overflow:hidden;
  }
  .swatch:hover  { transform:scale(1.1); }
  .swatch.active {
    outline-color:var(--ink);
    transform:scale(1.1);
    box-shadow:0 6px 20px rgba(0,0,0,.18);
  }
  .swatch .check {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .2s;
  }
  .swatch.active .check { opacity:1; }

  .slot {
    aspect-ratio:1;
    border-radius:10px;
    background:var(--mist);
    border:1.5px dashed var(--warm);
    overflow:hidden;
    cursor:pointer;
    transition:transform .16s, border-color .16s;
    display:flex; align-items:center; justify-content:center;
    position:relative;
  }
  .slot.filled { border:none; }
  .slot.next { border-color:var(--fog); animation:breathe 2s ease infinite; }
  .slot img { width:100%; height:100%; object-fit:cover; }

  .rule { width:100%; height:1px; background:var(--mist); }
`;

// ─── ONBOARDING VISUALS ────────────────────────────────────────────────────────

function ClockVisual() {
  return (
    <div style={{ position:"relative", width:200, height:200 }}>
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:"1.5px solid var(--mist)",
      }} />
      {COLOURS.slice(0,8).map((c,i) => {
        const a = (i/8)*2*Math.PI - Math.PI/2;
        return (
          <div key={c.id} style={{
            position:"absolute",
            width:14, height:14, borderRadius:"50%",
            background:c.hex,
            left:`calc(50% + ${Math.cos(a)*84}px - 7px)`,
            top:`calc(50% + ${Math.sin(a)*84}px - 7px)`,
            animation:`breathe ${1.4+i*.18}s ease infinite`,
          }} />
        );
      })}
      <div style={{
        position:"absolute", inset:28, borderRadius:"50%",
        background:"var(--mist)",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", gap:2,
      }}>
        <div style={{ fontFamily:"var(--fh)", fontSize:"1.7rem", fontWeight:600 }}>10:00</div>
        <div style={{ fontSize:".58rem", letterSpacing:".14em", textTransform:"uppercase", color:"var(--ghost)" }}>minutes</div>
      </div>
    </div>
  );
}

function ScoringVisual() {
  // mock score card showing how points break down
  const rows = [
    { label:"Photos found",  val:"9 / 9",   color:"#059669" },
    { label:"Time bonus",    val:"+ 42",    color:"#1D4ED8" },
    { label:"Colour match",  val:"+ 18",    color:"#EAB308" },
  ];
  return (
    <div style={{ width:"100%", maxWidth:280, margin:"0 auto" }}>
      {/* big score */}
      <div style={{
        textAlign:"center",
        padding:"18px 0 14px",
        animation:"scaleIn .4s ease both",
      }}>
        <div className="t-label" style={{ marginBottom:6 }}>Final score</div>
        <div style={{
          fontFamily:"var(--fh)", fontSize:"3.4rem", fontWeight:600,
          lineHeight:1, letterSpacing:"-.03em",
        }}>
          960
        </div>
        <div className="t-body" style={{ fontSize:".7rem", marginTop:4 }}>out of 1000</div>
      </div>

      {/* breakdown */}
      <div style={{
        background:"#fff",
        border:"1.5px solid var(--mist)",
        borderRadius:12,
        padding:"6px 4px",
      }}>
        {rows.map((r,i) => (
          <div key={r.label} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 14px",
            borderBottom: i < rows.length-1 ? "1px solid var(--mist)" : "none",
            animation:`fadeUp .35s ease ${.1 + i*.08}s both`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:r.color }} />
              <span style={{ fontSize:".78rem", fontWeight:400 }}>{r.label}</span>
            </div>
            <span style={{ fontFamily:"var(--fh)", fontSize:".95rem", fontWeight:600, color:r.color }}>
              {r.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlusVisual() {
  const dotColours = ["#DC2626", "#1D4ED8", "#EAB308", "#059669", "#BB2649"];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, width:"100%", padding:"0 4px" }}>
      {PLUS_FEATURES.map((f,i) => (
        <div key={f.label} style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"10px 14px",
          background:"#fff",
          borderRadius:10,
          border:"1.5px solid var(--mist)",
          animation:`fadeUp .35s ease ${i*.07}s both`,
        }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:dotColours[i % dotColours.length], flexShrink:0 }} />
          <div>
            <div style={{ fontSize:".82rem", fontWeight:700 }}>{f.label}</div>
            <div style={{ fontSize:".67rem", color:"var(--ghost)", marginTop:1 }}>{f.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ONBOARDING ────────────────────────────────────────────────────────────────

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      visual: <ClockVisual />,
      title: "Find the colour.\nBeat the clock.",
      body: "Pick a colour. Step outside. Photograph nine things that match — before ten minutes runs out.",
      cta: false,
    },
    {
      visual: <PlusVisual />,
      title: "Go further with\nColour Hunt+",
      body: "Custom timers, shared albums, colour streaks, and rare Pantone unlocks.",
      cta: true,
    },
  ];

const handleSubscribe = async () => {
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  
  try {
    const response = await fetch('/api/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });
    
    const { sessionId } = await response.json();
    const result = await stripe.redirectToCheckout({ sessionId });
    
    if (result.error) {
      console.error(result.error.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

  const cur = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="screen" style={{ padding:"0 0 40px", background:"var(--paper)" }}>
      {/* progress + skip */}
      <div style={{ display:"flex", alignItems:"center", padding:"52px 28px 0" }}>
        <div style={{ display:"flex", gap:5, flex:1 }}>
          {slides.map((_,i) => (
            <div key={i} style={{
              height:3, borderRadius:100,
              width: i === step ? 24 : 8,
              background: i <= step ? "var(--ink)" : "var(--warm)",
              transition:"all .3s ease",
            }} />
          ))}
        </div>
        {!isLast && (
          <button className="t-label" style={{ cursor:"pointer" }} onClick={onDone}>skip</button>
        )}
      </div>

      {/* visual */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"40px 28px 32px", minHeight:280,
      }}>
        <div key={step} style={{ animation:"scaleIn .38s ease both", width:"100%" }}>
          {cur.visual}
        </div>
      </div>

      {/* copy */}
      <div style={{ padding:"0 28px 28px" }} key={`copy-${step}`}>
        <div className="t-display" style={{ fontSize:"1.75rem", marginBottom:12, whiteSpace:"pre-line",
          animation:"fadeUp .35s ease .05s both" }}>
          {cur.title}
        </div>
        <div className="t-body" style={{ animation:"fadeUp .35s ease .1s both" }}>
          {cur.body}
        </div>
      </div>

      {/* actions */}
      <div style={{ padding:"0 28px", display:"flex", flexDirection:"column", gap:10 }}>
        {isLast ? (
          <>
            <button className="btn btn-green" style={{ width:"100%" }} onClick={handleSubscribe}>
              Start free 7-day trial
            </button>
            <button className="btn btn-ghost" style={{ width:"100%", fontSize:".78rem" }} onClick={onDone}>
              Continue with free version
            </button>
          </>
        ) : (
          <button className="btn btn-ink" style={{ width:"100%" }} onClick={() => setStep(s => s+1)}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

// ─── HOME ──────────────────────────────────────────────────────────────────────

function Home({ onStart }) {
  return (
    <div className="screen" style={{ padding:"56px 28px 44px", background:"var(--paper)" }}>
      <div style={{ animation:"fadeIn .5s ease both" }}>
        <div className="t-label" style={{ marginBottom:10 }}>Colour Hunt</div>
        <div className="t-display" style={{ fontSize:"2.8rem", marginBottom:4 }}>Hunt by colour.</div>
        <div className="t-display" style={{ fontSize:"2.8rem", color:"var(--ghost)", marginBottom:36 }}>See differently.</div>
      </div>

      {/* colour strip */}
      <div style={{ display:"flex", gap:4, marginBottom:44, animation:"fadeUp .5s ease .12s both" }}>
        {COLOURS.slice(0,10).map((c,i) => (
          <div key={c.id} style={{
            flex:1, height:44, background:c.hex, borderRadius:6,
            animation:`fadeIn .4s ease ${i*.04}s both`,
          }} />
        ))}
      </div>

      <div style={{ flex:1 }} />

      <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"fadeUp .5s ease .22s both" }}>
        <button className="btn btn-ink" style={{ width:"100%" }} onClick={onStart}>
          Begin a hunt
        </button>
        <button className="btn btn-ghost" style={{ width:"100%", fontSize:".78rem" }}>
          Colour Hunt+ — free 7 days
        </button>
      </div>

      <div className="t-label" style={{ marginTop:28, textAlign:"center", fontSize:".58rem" }}>
        9 photos · 10 minutes · infinite colour
      </div>
    </div>
  );
}

// ─── MODE SELECT ───────────────────────────────────────────────────────────────

function ModeSelect({ onBack, onSelect }) {
  return (
    <div className="screen" style={{ padding:"52px 28px 40px", background:"var(--paper)" }}>
      <button className="t-label" style={{ marginBottom:32, display:"flex", alignItems:"center", gap:6 }} onClick={onBack}>
        <span style={{ fontSize:"1rem" }}>←</span> Back
      </button>
      <div className="t-label" style={{ marginBottom:8 }}>Step 1 of 2</div>
      <div className="t-display" style={{ fontSize:"2rem", marginBottom:6 }}>How are you<br/>playing today?</div>
      <div className="t-body" style={{ marginBottom:32 }}>Choose your hunt mode.</div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {MODES.map((m,i) => (
          <button key={m.id} className="card" style={{
            padding:"20px", width:"100%", textAlign:"left",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            animation:`fadeUp .35s ease ${i*.09}s both`,
          }} onClick={() => onSelect(m)}>
            <div>
              <div style={{ fontFamily:"var(--fh)", fontSize:"1.1rem", fontWeight:600, marginBottom:3 }}>{m.label}</div>
              <div className="t-body" style={{ fontSize:".76rem" }}>{m.sub}</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="var(--fog)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── COLOUR SELECT ─────────────────────────────────────────────────────────────

function ColourSelect({ mode, onBack, onStart }) {
  const [selected, setSelected] = useState(null);
  const [activeGroup, setActiveGroup] = useState("primary");
  const [timer, setTimer] = useState(HUNT_SECONDS);
  const [shuffling, setShuffling] = useState(false);

  const groups = ["primary","pantone","nice"].map(g => ({
    key:g, label:GROUP_LABELS[g],
    colours:COLOURS.filter(c => c.group===g),
  }));

  // Pick for me — roulette through colours for ~1.4s then settle
  function pickForMe() {
    if (shuffling) return;
    setShuffling(true);
    const pool = COLOURS;
    let ticks = 0;
    const maxTicks = 18;
    const id = setInterval(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setSelected(rand);
      setActiveGroup(rand.group);
      ticks++;
      // slow down near the end
      if (ticks >= maxTicks) {
        clearInterval(id);
        const final = pool[Math.floor(Math.random() * pool.length)];
        setSelected(final);
        setActiveGroup(final.group);
        setShuffling(false);
      }
    }, 75);
  }

  return (
    <div className="screen" style={{ background:"var(--paper)", overflowY:"auto" }}>
      <div style={{ padding:"52px 28px 0" }}>
        <button className="t-label" style={{ marginBottom:32, display:"flex", alignItems:"center", gap:6 }} onClick={onBack}>
          <span style={{ fontSize:"1rem" }}>←</span> Back
        </button>
        <div className="t-label" style={{ marginBottom:8 }}>Step 2 of 2 · {mode.label}</div>
        <div className="t-display" style={{ fontSize:"2rem", marginBottom:6 }}>Pick your colour.</div>
        <div className="t-body" style={{ marginBottom:20 }}>You are committed once you start.</div>

        {/* Pick for me */}
        <button
          onClick={pickForMe}
          disabled={shuffling}
          style={{
            width:"100%",
            padding:"14px 18px",
            marginBottom:22,
            borderRadius:12,
            background:"#fff",
            border:"1.5px dashed var(--warm)",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            cursor:shuffling?"wait":"pointer",
            transition:"border-color .2s, transform .15s",
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* little multi-dot icon */}
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"var(--mist)",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden",
            }}>
              {[0,1,2,3].map(i => {
                const c = COLOURS[(shuffling ? Math.floor(Date.now()/100)+i : i+2) % COLOURS.length];
                return (
                  <div key={i} style={{
                    position:"absolute",
                    width:9, height:9, borderRadius:"50%",
                    background:c.hex,
                    top: i < 2 ? 7 : 16,
                    left: (i % 2 === 0) ? 7 : 16,
                    transition:"background .15s",
                  }} />
                );
              })}
            </div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontFamily:"var(--fh)", fontSize:".95rem", fontWeight:600 }}>
                {shuffling ? "Choosing…" : "Pick for me"}
              </div>
              <div className="t-body" style={{ fontSize:".72rem", marginTop:1 }}>
                Can't decide? Let fate choose.
              </div>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{
            animation: shuffling ? "spin .6s linear infinite" : "none",
          }}>
            <path d="M3 9a6 6 0 0 1 10.5-4M15 9a6 6 0 0 1-10.5 4M13 3v3h-3M5 15v-3h3"
              stroke="var(--ghost)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* group tabs */}
        <div style={{
          display:"flex", gap:4,
          background:"var(--mist)", borderRadius:100, padding:4,
          marginBottom:20,
        }}>
          {groups.map(g => (
            <button key={g.key} className={`pill-tab ${activeGroup===g.key?"active":""}`}
              onClick={() => setActiveGroup(g.key)}>
              {g.label}
            </button>
          ))}
        </div>

        {/* swatch grid */}
        {groups.filter(g => g.key===activeGroup).map(g => (
          <div key={g.key} style={{
            display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:28,
            animation:"scaleIn .28s ease both",
          }}>
            {g.colours.map((c) => (
              <div key={c.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div
                  className={`swatch ${selected?.id===c.id?"active":""}`}
                  style={{ background:c.hex }}
                  onClick={() => !shuffling && setSelected(c)}
                >
                  <div className="check">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5"
                        stroke={isDark(c.hex)?"#fff":"rgba(0,0,0,0.7)"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize:".56rem", color:"var(--ghost)", textAlign:"center", lineHeight:1.25, fontWeight:400 }}>
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* timer picker */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div className="t-label">Timer</div>
            <div className="t-label" style={{ fontSize:".55rem", color:"var(--fog)" }}>
              {fmtTime(timer)}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
            {TIMER_PRESETS.map(p => {
              const isActive = timer === p.seconds;
              const isRanked = p.note === "Ranked";
              return (
                <button
                  key={p.label}
                  onClick={() => p.free && setTimer(p.seconds)}
                  style={{
                    padding:"12px 4px 10px",
                    borderRadius:10,
                    background: isActive ? "var(--ink)" : "#fff",
                    color: isActive ? "var(--paper)" : p.free ? "var(--ink)" : "var(--fog)",
                    border: isActive ? "1.5px solid var(--ink)" : "1.5px solid var(--mist)",
                    fontSize:".78rem",
                    fontWeight:700,
                    letterSpacing:".02em",
                    cursor: p.free ? "pointer" : "not-allowed",
                    position:"relative",
                    transition:"all .15s",
                  }}
                >
                  {p.label}
                  {!p.free && (
                    <div style={{
                      position:"absolute", top:-5, right:-5,
                      minWidth:16, height:16,
                      padding:"0 5px",
                      borderRadius:100,
                      background: isRanked ? "var(--green)" : "var(--accent)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      gap:3,
                    }}>
                      {isRanked ? (
                        // little trophy / star
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M5 1l1.18 2.39L8.8 3.78l-1.9 1.85.45 2.62L5 7l-2.35 1.24.45-2.62-1.9-1.85 2.62-.39L5 1z"
                            fill="#fff"/>
                        </svg>
                      ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M2 4v-.5a2 2 0 0 1 4 0V4M1.5 4h5v3.5h-5V4z" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="t-body" style={{ fontSize:".7rem", marginTop:10, lineHeight:1.6 }}>
            <span style={{ color:"var(--green)", fontWeight:700 }}>★ Ranked</span> goes to the global leaderboard.
            Marathon timers <span style={{ color:"var(--accent)", fontWeight:700 }}>(4h+)</span> unlock with Colour Hunt+.
          </div>
        </div>
      </div>

      {/* sticky footer */}
      <div style={{
        position:"sticky", bottom:0,
        background:"var(--paper)",
        padding:"16px 28px 36px",
        borderTop:"1px solid var(--mist)",
      }}>
        {selected ? (
          <div style={{ animation:"fadeUp .22s ease both" }}>
            <div style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              borderRadius:12, background:selected.hex, marginBottom:12,
            }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.2)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{
                  fontFamily:"var(--fh)", fontSize:".98rem", fontWeight:600,
                  color:isDark(selected.hex)?"#fff":"var(--ink)",
                }}>{selected.name}</div>
                <div style={{
                  fontSize:".62rem", letterSpacing:".1em", textTransform:"uppercase", marginTop:2,
                  color:isDark(selected.hex)?"rgba(255,255,255,.55)":"rgba(26,23,19,.45)",
                }}>{selected.pantone} · {fmtTime(timer)}</div>
              </div>
            </div>
            <button className="btn btn-ink" style={{ width:"100%" }}
              onClick={() => onStart(selected, timer)}
              disabled={shuffling}>
              Start hunt
            </button>
          </div>
        ) : (
          <div className="t-label" style={{ textAlign:"center", padding:"14px 0" }}>
            Select a colour to continue
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HUNT ──────────────────────────────────────────────────────────────────────

function Hunt({ colour, mode, duration = HUNT_SECONDS, onDone }) {
  const [photos, setPhotos]     = useState([]);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [active, setActive]     = useState(true);
  const fileRef  = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setActive(false);
          onDone({ photos, colour, mode, completed:false, timedOut:true });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active]);

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setPhotos(prev => {
      const added = files.slice(0, PHOTO_TARGET - prev.length).map(f => URL.createObjectURL(f));
      const next  = [...prev, ...added];
      if (next.length >= PHOTO_TARGET) {
        clearInterval(timerRef.current);
        setActive(false);
        setTimeout(() => onDone({ photos:next, colour, mode, completed:true, timedOut:false }), 300);
      }
      return next;
    });
  }

  const R     = 36;
  const circ  = 2 * Math.PI * R;
  const warn  = timeLeft <= 60;

  return (
    <div className="screen" style={{ padding:"40px 20px 32px", background:"var(--paper)" }}>
      <input type="file" ref={fileRef} accept="image/*" multiple style={{ display:"none" }} onChange={handleFiles} />

      {/* header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div className="t-label" style={{ marginBottom:4 }}>{mode.label} hunt</div>
          <div style={{ fontFamily:"var(--fh)", fontSize:"1.5rem", fontWeight:600 }}>
            {photos.length}
            <span style={{ color:"var(--ghost)", fontWeight:400, fontSize:"1.1rem" }}> / {PHOTO_TARGET}</span>
          </div>
        </div>

        {/* ring timer */}
        <div style={{ position:"relative", width:86, height:86 }}>
          <svg width="86" height="86" style={{ transform:"rotate(-90deg)" }}>
            <circle cx="43" cy="43" r={R} fill="none" stroke="var(--mist)" strokeWidth="5" />
            <circle
              cx="43" cy="43" r={R} fill="none"
              stroke={warn ? "var(--accent)" : colour.hex}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - timeLeft/duration)}
              style={{ transition:"stroke-dashoffset .8s linear, stroke .3s" }}
            />
          </svg>
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{
              fontFamily:"var(--fh)", fontSize:".95rem", fontWeight:600,
              color: warn ? "var(--accent)" : "var(--ink)",
              animation: warn ? "timerPulse 1s ease infinite" : "none",
            }}>{fmtTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height:5, borderRadius:100, background:"var(--mist)", marginBottom:18, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:100, background:colour.hex,
          width:`${(photos.length/PHOTO_TARGET)*100}%`,
          transition:"width .4s ease",
        }} />
      </div>

      {/* colour chip */}
      <div style={{
        display:"inline-flex", alignItems:"center", gap:8,
        padding:"5px 12px 5px 8px",
        background:"var(--mist)", borderRadius:100, marginBottom:18,
      }}>
        <div style={{ width:14, height:14, borderRadius:"50%", background:colour.hex }} />
        <span style={{ fontSize:".7rem", fontWeight:700, letterSpacing:".08em" }}>{colour.name}</span>
        <span style={{ fontSize:".62rem", color:"var(--ghost)", letterSpacing:".05em" }}>{colour.pantone}</span>
      </div>

      {/* 3x3 grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:20 }}>
        {Array.from({ length:PHOTO_TARGET }).map((_,i) => (
          <div
            key={i}
            className={`slot ${photos[i]?"filled":""} ${i===photos.length&&active?"next":""}`}
            onClick={() => i === photos.length && fileRef.current?.click()}
            style={{ animation:photos[i]?`popIn .3s ease both`:"none" }}
          >
            {photos[i] ? (
              <img src={photos[i]} alt="" />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                {i < photos.length ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="var(--fog)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i === photos.length ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="6" width="16" height="12" rx="2.5" stroke="var(--fog)" strokeWidth="1.5"/>
                    <circle cx="11" cy="12" r="3" stroke="var(--fog)" strokeWidth="1.5"/>
                    <path d="M8 6l1.5-2h3L14 6" stroke="var(--fog)" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--warm)" }} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* add photo */}
      <button
        className="btn"
        style={{
          width:"100%", fontSize:".86rem",
          background:colour.hex,
          color:isDark(colour.hex)?"#fff":"var(--ink)",
          opacity:photos.length>=PHOTO_TARGET?0.5:1,
          boxShadow:"0 4px 16px rgba(0,0,0,.14)",
        }}
        disabled={photos.length>=PHOTO_TARGET}
        onClick={() => photos.length < PHOTO_TARGET && fileRef.current?.click()}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6.5 5l1.2-2h2.6L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        Add photo — {PHOTO_TARGET - photos.length} remaining
      </button>

      <button
        style={{ marginTop:12, width:"100%", color:"var(--ghost)", fontSize:".74rem",
          padding:"8px", letterSpacing:".05em" }}
        onClick={() => {
          clearInterval(timerRef.current);
          setActive(false);
          onDone({ photos, colour, mode, completed:photos.length>=PHOTO_TARGET, timedOut:false });
        }}>
        Finish early
      </button>
    </div>
  );
}

// ─── RESULTS ───────────────────────────────────────────────────────────────────

function Results({ result, onRestart, onHome }) {
  const { photos, colour, mode, completed, timedOut } = result;
  const score = Math.round((photos.length / PHOTO_TARGET) * 100);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStamped(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="screen" style={{ padding:"44px 20px 44px", overflowY:"auto", background:"var(--paper)" }}>

      {/* badge */}
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ position:"relative", display:"inline-block", marginBottom:16 }}>
          <div style={{
            width:90, height:90, borderRadius:"50%",
            background:colour.hex, margin:"0 auto",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              fontFamily:"var(--fh)", fontSize:"2rem", fontWeight:600,
              color:isDark(colour.hex)?"#fff":"var(--ink)",
            }}>{photos.length}</div>
          </div>
          {stamped && (
            <div style={{
              position:"absolute", bottom:-6, right:-6,
              width:30, height:30, borderRadius:"50%",
              background:completed?"#059669":timedOut?"var(--accent)":"var(--fog)",
              display:"flex", alignItems:"center", justifyContent:"center",
              animation:"stampIn .4s ease both",
              boxShadow:"0 2px 8px rgba(0,0,0,.18)",
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                {completed
                  ? <path d="M2 6.5L5 9.5L11 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  : <path d="M6.5 3v3.5M6.5 9v.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                }
              </svg>
            </div>
          )}
        </div>

        <div className="t-display" style={{ fontSize:"1.75rem", marginBottom:6 }}>
          {completed ? "Hunt complete." : timedOut ? "Time is up." : `${photos.length} found.`}
        </div>
        <div className="t-body" style={{ fontSize:".84rem" }}>
          {completed
            ? `All 9 ${colour.name.toLowerCase()} things spotted.`
            : `${PHOTO_TARGET - photos.length} ${colour.name.toLowerCase()} things got away.`}
        </div>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:7,
          padding:"5px 12px 5px 8px",
          background:"var(--mist)", borderRadius:100, marginTop:14,
        }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:colour.hex }} />
          <span style={{ fontSize:".68rem", fontWeight:700, letterSpacing:".07em" }}>
            {colour.name} — {mode.label}
          </span>
        </div>
      </div>

      {/* photo grid */}
      {photos.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div className="t-label" style={{ marginBottom:10 }}>Your finds</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
            {Array.from({ length:PHOTO_TARGET }).map((_,i) => (
              <div key={i} style={{
                aspectRatio:"1", borderRadius:10, overflow:"hidden",
                background:"var(--mist)",
                border:i>=photos.length?"1.5px dashed var(--warm)":"none",
                animation:photos[i]?`popIn .3s ease ${i*.05}s both`:"none",
              }}>
                {photos[i] && <img src={photos[i]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* score card */}
      <div className="card" style={{ padding:"18px", marginBottom:20 }}>
        <div className="t-label" style={{ marginBottom:14 }}>Summary</div>
        <div style={{ display:"flex", justifyContent:"space-around" }}>
          {[
            { label:"Found",  val:photos.length },
            { label:"Target", val:PHOTO_TARGET  },
            { label:"Score",  val:`${score}%`   },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--fh)", fontSize:"2rem", fontWeight:600, color:colour.hex }}>{s.val}</div>
              <div className="t-label" style={{ marginTop:4, fontSize:".58rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
        <button className="btn btn-ink" style={{ width:"100%" }} onClick={onRestart}>Hunt again</button>
        <button className="btn btn-ghost" style={{ width:"100%" }} onClick={onHome}>Home</button>
      </div>

      {/* upsell */}
      <div style={{
        padding:"18px", borderRadius:14,
        background:"var(--mist)", border:"1.5px solid var(--warm)",
      }}>
        <div style={{ fontFamily:"var(--fh)", fontSize:".95rem", fontWeight:600, marginBottom:4 }}>
          Save your mosaic with Colour Hunt+
        </div>
        <div className="t-body" style={{ fontSize:".76rem", marginBottom:12 }}>
          Shared albums, streaks, rare colour unlocks. Free for 7 days.
        </div>
        <button className="btn btn-green" style={{ fontSize:".76rem", padding:"10px 20px" }}>
          Try free for 7 days
        </button>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [scene, setScene]       = useState("onboarding");
  const [mode, setMode]         = useState(null);
  const [colour, setColour]     = useState(null);
  const [duration, setDuration] = useState(HUNT_SECONDS);
  const [result, setResult]     = useState(null);

  function reset() { setMode(null); setColour(null); setDuration(HUNT_SECONDS); setResult(null); }

  return (
    <>
      <style>{CSS}</style>
      {scene === "onboarding" && <Onboarding onDone={() => setScene("home")} />}
      {scene === "home"       && <Home onStart={() => setScene("mode")} />}
      {scene === "mode"       && <ModeSelect onBack={() => setScene("home")} onSelect={m => { setMode(m); setScene("colour"); }} />}
      {scene === "colour"     && <ColourSelect mode={mode} onBack={() => setScene("mode")} onStart={(c, t) => { setColour(c); setDuration(t); setScene("hunt"); }} />}
      {scene === "hunt"       && <Hunt colour={colour} mode={mode} duration={duration} onDone={r => { setResult(r); setScene("results"); }} />}
      {scene === "results"    && <Results result={result} onRestart={() => { reset(); setScene("mode"); }} onHome={() => { reset(); setScene("home"); }} />}
    </>
  );
}
