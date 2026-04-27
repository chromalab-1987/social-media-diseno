import { useState, useEffect, useRef, useCallback } from "react";

/* ─── THEME ─────────────────────────────────────────────────────── */
const C = {
  bg:        "#0C0C0F",
  surface:   "#13131A",
  surf2:     "#1A1A24",
  surf3:     "#22222E",
  border:    "#2C2C3C",
  text:      "#F2EDE4",
  muted:     "#6B6B80",
  accent:    "#7B35D4",
  accentLt:  "#9F5FF0",
  accentDim: "#7B35D433",
  teal:      "#2A9D8F",
};

const NET_COLOR = {
  "Instagram":   "#E1306C",
  "LinkedIn":    "#0A7CB5",
  "TikTok":      "#FF004F",
  "Facebook":    "#1877F2",
  "X (Twitter)": "#1DA1F2",
  "Pinterest":   "#E60023",
};

const TIPOS_POR_RED = {
  "Instagram":   ["Posts", "Historias", "Reels"],
  "LinkedIn":    ["Posts", "Historias", "Artículos"],
  "TikTok":      ["Videos", "Lives"],
  "Facebook":    ["Posts", "Historias", "Reels"],
  "X (Twitter)": ["Tweets", "Hilos"],
  "Pinterest":   ["Pines"],
};

const REDES    = Object.keys(TIPOS_POR_RED);
const PILARES  = ["Educativo","Inspiracional","Entretenimiento","Promocional","Behind the scenes","UGC"];
const MESES    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const TONOS    = ["Profesional pero cercano","Inspiracional y aspiracional","Educativo y experto","Divertido y casual","Lujoso y exclusivo","Minimalista y directo","Empático y humano"];
const PALETTE_PRESETS   = ["#7B35D4","#F2EDE4","#0C0C0F","#E63946","#2A9D8F","#F4A261","#264653","#E9C46A","#A8DADC","#FF6B6B"];
const DEFAULTS_BY_INDEX = [3, 5, 2, 1];
const DIAS_SEMANA  = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const EVENT_COLORS = ["#E63946","#2A9D8F","#F4A261","#457B9D","#E9C46A","#9B5DE5","#FF6B6B","#A8DADC"];

/* ─── DATE HELPERS ───────────────────────────────────────────────── */
const parseMonthStart = (mesStr) => {
  const [mesNombre, año] = mesStr.split(" ");
  return new Date(parseInt(año), MESES.indexOf(mesNombre), 1);
};

const getDaysInMonth = (firstDay) =>
  new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();

const getPostDate = (semana, diaNombre, firstDay) => {
  const weekStartDay = (semana - 1) * 7 + 1;
  const d = new Date(firstDay.getFullYear(), firstDay.getMonth(), weekStartDay);
  const weekStartDOW = (d.getDay() + 6) % 7;
  const targetDOW = DIAS_SEMANA.indexOf(diaNombre);
  if (targetDOW === -1) return weekStartDay;
  let offset = targetDOW - weekStartDOW;
  if (offset < 0) offset += 7;
  return Math.min(weekStartDay + offset, getDaysInMonth(firstDay));
};

const getDayName = (dateNum, firstDay) => {
  const d = new Date(firstDay.getFullYear(), firstDay.getMonth(), dateNum);
  return DIAS_SEMANA[(d.getDay() + 6) % 7];
};

const getSemanaFromDate = (dateNum) => Math.min(4, Math.ceil(dateNum / 7));

/* ─── API ────────────────────────────────────────────────────────── */
const cleanJSON = txt => txt.replace(/```json|```/g, "").trim();

const callClaude = async (messages, maxTokens = 4000) => {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error de API");
  return data.text;
};

const getMonthOptions = () => {
  const d = new Date();
  return Array.from({ length: 13 }, (_, i) => {
    const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
    return { label: `${MESES[m.getMonth()]} ${m.getFullYear()}`, value: `${MESES[m.getMonth()]} ${m.getFullYear()}` };
  });
};

/* ─── SMALL COMPONENTS ───────────────────────────────────────────── */
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: 42, height: 22, borderRadius: 11, flexShrink: 0,
      background: on ? C.accent : C.border,
      position: "relative", cursor: "pointer", transition: "background .2s",
    }}>
      <div style={{
        position: "absolute", width: 16, height: 16, borderRadius: 8,
        background: C.text, top: 3, left: on ? 23 : 3, transition: "left .2s",
      }} />
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 9px",
      borderRadius: 100, fontSize: 11, fontFamily: "Georgia,serif",
      background: `${color}1A`, color, border: `1px solid ${color}40`,
      whiteSpace: "nowrap", letterSpacing: "0.04em",
    }}>{label}</span>
  );
}

function Stepper({ value, onChange, min = 0, max = 14 }) {
  const btn = (side) => ({
    width: 26, height: 26, background: C.surf3, border: "none", color: C.text,
    borderRadius: side === "l" ? "6px 0 0 6px" : "0 6px 6px 0",
    cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
  });
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button style={btn("l")} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span style={{
        width: 34, height: 26, background: C.bg, fontFamily: "Georgia,serif",
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, color: value === 0 ? C.muted : C.accentLt,
      }}>{value}</span>
      <button style={btn("r")} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

/* ─── POST CARD ──────────────────────────────────────────────────── */
function PostCard({ post, semanaNum, onEdit, onRegenerate, regeneratingId, onDesign }) {
  const netColor = NET_COLOR[post.red] || C.accent;
  const isRegen  = regeneratingId === post.id;
  return (
    <div className="post-card" style={{
      background: C.surface, borderRadius: 10, marginBottom: 10,
      borderLeft: `3px solid ${netColor}`,
      opacity: isRegen ? 0.55 : 1, transition: "opacity .25s",
    }}>
      <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", borderBottom: `1px solid ${C.border}` }}>
        <Badge label={post.red}   color={netColor} />
        <Badge label={post.tipo}  color={C.accent} />
        <Badge label={post.pilar} color={C.muted}  />
        {post.isManual && <Badge label="✍️ Manual" color={C.teal} />}

        {/* Day selector */}
        <select
          value={post.dia || "Lunes"}
          onChange={e => onEdit(semanaNum, post.id, "dia", e.target.value)}
          style={{
            marginLeft: "auto", background: C.surf3,
            border: `1px solid ${C.border}`, borderRadius: 6,
            color: C.text, fontSize: 11, padding: "4px 8px",
            fontFamily: "Georgia,serif", cursor: "pointer", outline: "none",
          }}
        >
          {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* 🎨 Crear pieza button */}
        <button
          onClick={() => onDesign(post)}
          title="Abrir editor de diseño"
          style={{
            background: `${C.accent}22`,
            border: `1px solid ${C.accent}55`,
            borderRadius: 6, color: C.accentLt,
            fontSize: 11, padding: "4px 10px",
            cursor: "pointer", fontFamily: "Georgia,serif",
            transition: "all .15s", whiteSpace: "nowrap",
          }}
        >
          🎨 Crear pieza
        </button>

        <button onClick={() => onRegenerate(semanaNum, post)} disabled={isRegen} style={{
          background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
          color: isRegen ? C.muted : C.accentLt, fontSize: 11, padding: "4px 10px",
          cursor: "pointer", fontFamily: "Georgia,serif",
        }}>
          {isRegen ? "regenerando…" : "↺ Regenerar"}
        </button>
      </div>

      <div style={{ padding: "12px 16px 14px" }}>
        <textarea
          value={post.copy}
          onChange={e => onEdit(semanaNum, post.id, "copy", e.target.value)}
          style={{
            width: "100%", background: C.surf2, border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.text, fontSize: 13, lineHeight: 1.75,
            padding: "10px 13px", resize: "vertical", minHeight: 72,
            fontFamily: "Georgia,serif", boxSizing: "border-box", outline: "none",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "Georgia,serif" }}>Hashtags</div>
            <input value={post.hashtags} onChange={e => onEdit(semanaNum, post.id, "hashtags", e.target.value)} style={{
              width: "100%", background: C.surf2, border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.accentLt, fontSize: 12, padding: "8px 11px",
              fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "Georgia,serif" }}>CTA</div>
            <input value={post.cta} onChange={e => onEdit(semanaNum, post.id, "cta", e.target.value)} style={{
              width: "100%", background: C.surf2, border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.text, fontSize: 12, padding: "8px 11px",
              fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box",
            }} />
          </div>
        </div>
        {post.promptImagen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: "#9F5FF0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "Georgia,serif" }}>🎨 Prompt de imagen</div>
            <textarea
              value={post.promptImagen}
              onChange={e => onEdit(semanaNum, post.id, "promptImagen", e.target.value)}
              style={{
                width: "100%", background: "#1A1A24", border: `1px solid #9F5FF040`,
                borderRadius: 6, color: "#C8A8F0", fontSize: 12, lineHeight: 1.6,
                padding: "8px 11px", resize: "vertical", minHeight: 48,
                fontFamily: "Georgia,serif", boxSizing: "border-box", outline: "none",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── DESIGN EDITOR ──────────────────────────────────────────────── */
const DESIGN_FORMATS = {
  instagram: { w: 1080, h: 1080, label: "Instagram",      icon: "▣" },
  linkedin:  { w: 1200, h: 628,  label: "LinkedIn",       icon: "▬" },
  post:      { w: 1080, h: 1350, label: "Post 4:5",       icon: "▩" },
  story:     { w: 1080, h: 1920, label: "Story / Banner", icon: "▮" },
};
const DESIGN_TEMPLATES = {
  dark:      { label: "Dark",      bg: "#0C0C0F", text: "#F2EDE4", accent: "#7B35D4", gradient: false },
  light:     { label: "Light",     bg: "#F8F6F2", text: "#111111", accent: "#7B35D4", gradient: false },
  gradient:  { label: "Gradient",  bg: "#1A0A2E", text: "#F2EDE4", accent: "#9F5FF0", gradient: true  },
  editorial: { label: "Editorial", bg: "#F4EFE6", text: "#2C1810", accent: "#E63946", gradient: false },
};
const FONT_OPTIONS = [
  { label: "Georgia",   value: "Georgia, serif" },
  { label: "Arial",     value: "Arial, sans-serif" },
  { label: "Helvetica", value: "'Helvetica Neue', Helvetica, sans-serif" },
  { label: "Times",     value: "'Times New Roman', Times, serif" },
  { label: "Verdana",   value: "Verdana, Geneva, sans-serif" },
  { label: "Impact",    value: "Impact, Charcoal, fantasy" },
  { label: "Courier",   value: "'Courier New', Courier, monospace" },
  { label: "Trebuchet", value: "'Trebuchet MS', Helvetica, sans-serif" },
];

/* ColorInput: color picker + editable hex field */
function ColorInput({ value, onChange }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const safe = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000";
  const onHex = (v) => { setHex(v); if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v); };
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
      <input type="color" value={safe}
        onChange={e => { onChange(e.target.value); setHex(e.target.value); }}
        style={{ width: 30, height: 26, border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0, padding: 1 }} />
      <input type="text" value={hex} onChange={e => onHex(e.target.value)} maxLength={7} placeholder="#000000"
        style={{ flex: 1, background: C.surf3, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontSize: 11, padding: "4px 8px", fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function drawRR(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function canvasWrap(ctx, text, maxW) {
  const words = text.split(" "), lines = []; let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function DesignEditor({ post, onClose, initialLogo }) {
  const [format,   setFormat]   = useState("instagram");
  const [template, setTemplate] = useState("dark");
  const [copy,     setCopy]     = useState(post.copy     || "");
  const [cta,      setCta]      = useState(post.cta      || "");
  const [hashtags, setHashtags] = useState(post.hashtags || "");
  const [fontFamily, setFontFamily] = useState("Georgia, serif");
  const [fontSize,   setFontSize]   = useState(42);
  const [align,      setAlign]      = useState("left");
  const [bgColor,   setBgColor]   = useState(DESIGN_TEMPLATES.dark.bg);
  const [accColor,  setAccColor]  = useState(DESIGN_TEMPLATES.dark.accent);
  const [copyColor, setCopyColor] = useState(DESIGN_TEMPLATES.dark.text);
  const [ctaColor,  setCtaColor]  = useState("#CCBBFF");
  const [hashColor, setHashColor] = useState("#9F5FF0");
  const [bgImage, setBgImage]  = useState(null);
  const [bgFit,   setBgFit]    = useState("cover");
  const [showBadges, setShowBadges] = useState(true);
  const [textXF, setTextXF] = useState(0.074);
  const [textYF, setTextYF] = useState(0.34);
  const [logo, setLogo] = useState(
    initialLogo ? { src: initialLogo, xF: 0.06, yF: 0.05, wF: 0.22, ar: 1 } : null
  );
  const [downloading, setDownloading] = useState(false);
  const [dragging,    setDragging]    = useState("");
  const textDrag   = useRef(null);
  const logoDrag   = useRef(null);
  const logoResize = useRef(null);
  const previewRef = useRef(null);
  const bgFileRef  = useRef(null);
  const logoFileRef = useRef(null);

  const fmt = DESIGN_FORMATS[format];
  const tpl = DESIGN_TEMPLATES[template];

  useEffect(() => {
    setBgColor(tpl.bg === "gradient" ? "#1A0A2E" : tpl.bg);
    setAccColor(tpl.accent);
    setCopyColor(tpl.text);
  }, [template]);

  const PREV_W = 420, PREV_H = 460;
  const scale = Math.min(PREV_W / fmt.w, PREV_H / fmt.h);
  const pw = Math.round(fmt.w * scale);
  const ph = Math.round(fmt.h * scale);
  const pFont  = Math.round(fontSize * scale);
  const pPad   = Math.round(60 * scale);
  const pLineH = Math.round(fontSize * 1.6 * scale);
  const pBadgeH = Math.round(32 * scale);
  const previewBg = bgImage ? "transparent"
    : tpl.gradient ? `linear-gradient(135deg, ${bgColor} 0%, #7B35D4 60%, #2A9D8F 100%)`
    : bgColor;
  const approxCharsPerLine = Math.max(1, Math.floor((pw - textXF * pw - pPad) / (pFont * 0.55)));
  const approxLines = Math.max(1, Math.ceil(copy.length / approxCharsPerLine));
  const pTextH    = approxLines * pLineH;
  const textTopPx  = textYF * ph;
  const accentTopPx = textTopPx + pTextH + Math.round(22 * scale);
  const ctaTopPx    = accentTopPx + Math.round(20 * scale);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      if (dragging === "text" && textDrag.current) {
        const dx = e.clientX - textDrag.current.startX;
        const dy = e.clientY - textDrag.current.startY;
        setTextXF(Math.max(0, Math.min(0.8,  textDrag.current.startXF + dx / pw)));
        setTextYF(Math.max(0, Math.min(0.85, textDrag.current.startYF + dy / ph)));
      }
      if (dragging === "logo" && logoDrag.current) {
        const dx = e.clientX - logoDrag.current.startX;
        const dy = e.clientY - logoDrag.current.startY;
        setLogo(l => l ? { ...l,
          xF: Math.max(0, Math.min(0.92, logoDrag.current.startXF + dx / pw)),
          yF: Math.max(0, Math.min(0.92, logoDrag.current.startYF + dy / ph)),
        } : l);
      }
      if (dragging === "resize" && logoResize.current) {
        const dx = e.clientX - logoResize.current.startX;
        setLogo(l => l ? { ...l, wF: Math.max(0.04, Math.min(0.9, logoResize.current.startWF + dx / pw)) } : l);
      }
    };
    const onUp = () => {
      textDrag.current = null; logoDrag.current = null; logoResize.current = null;
      setDragging("");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, pw, ph]);

  const handleLogoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const img = new Image();
      img.onload = () => setLogo({ src, xF: 0.06, yF: 0.05, wF: 0.22, ar: img.height / img.width });
      img.src = src;
    };
    reader.readAsDataURL(file);
  };
  const handleBgFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const buildCanvas = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = fmt.w; canvas.height = fmt.h;
    const ctx = canvas.getContext("2d");
    const loadImg = (src) => new Promise((res, rej) => {
      const img = new Image(); img.onload = () => res(img); img.onerror = rej;
      img.crossOrigin = "anonymous"; img.src = src;
    });
    if (bgImage) {
      try {
        const img = await loadImg(bgImage);
        if (bgFit === "cover") {
          const s = Math.max(fmt.w / img.width, fmt.h / img.height);
          const sw = img.width * s, sh = img.height * s;
          ctx.drawImage(img, (fmt.w - sw) / 2, (fmt.h - sh) / 2, sw, sh);
        } else { ctx.drawImage(img, 0, 0, fmt.w, fmt.h); }
      } catch { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, fmt.w, fmt.h); }
    } else if (tpl.gradient) {
      const grad = ctx.createLinearGradient(0, 0, fmt.w, fmt.h);
      grad.addColorStop(0, bgColor); grad.addColorStop(0.6, "#7B35D4"); grad.addColorStop(1, "#2A9D8F");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, fmt.w, fmt.h);
    } else { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, fmt.w, fmt.h); }

    const pad = 80, lineH = fontSize * 1.6;
    const netColor = NET_COLOR[post.red] || accColor;

    if (showBadges) {
      const bH = 44;
      ctx.fillStyle = `${netColor}28`; drawRR(ctx, pad, pad, 200, bH, bH / 2); ctx.fill();
      ctx.strokeStyle = `${netColor}55`; ctx.lineWidth = 1; drawRR(ctx, pad, pad, 200, bH, bH / 2); ctx.stroke();
      ctx.fillStyle = netColor;
      ctx.font = `bold ${Math.round(fontSize * 0.38)}px ${fontFamily}`;
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(post.red, pad + 18, pad + bH / 2);
      if (post.pilar) {
        ctx.font = `${Math.round(fontSize * 0.32)}px ${fontFamily}`;
        const pilarW = ctx.measureText(post.pilar).width + 28;
        ctx.fillStyle = `${accColor}22`; drawRR(ctx, fmt.w - pad - pilarW, pad, pilarW, bH, bH / 2); ctx.fill();
        ctx.fillStyle = accColor; ctx.fillText(post.pilar, fmt.w - pad - pilarW + 14, pad + bH / 2);
      }
    }

    const textCanvasX = textXF * fmt.w, textCanvasY = textYF * fmt.h;
    const maxW = fmt.w - textCanvasX - pad;
    ctx.font = `${fontSize}px ${fontFamily}`; ctx.textBaseline = "top"; ctx.fillStyle = copyColor;
    const tAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
    ctx.textAlign = tAlign;
    const lines = canvasWrap(ctx, copy, maxW);
    const refX = align === "center" ? textCanvasX + maxW / 2 : align === "right" ? textCanvasX + maxW : textCanvasX;
    lines.forEach((ln, i) => ctx.fillText(ln, refX, textCanvasY + i * lineH));
    const totalTextH = lines.length * lineH;
    const accentY = textCanvasY + totalTextH + 36;
    ctx.fillStyle = accColor;
    const accentX = align === "center" ? refX - 50 : align === "right" ? refX - 80 : refX;
    ctx.fillRect(accentX, accentY, 80, 4);
    if (cta) {
      ctx.font = `${Math.round(fontSize * 0.42)}px ${fontFamily}`; ctx.fillStyle = ctaColor;
      ctx.textAlign = tAlign; ctx.fillText(cta, refX, accentY + 32);
    }
    if (hashtags) {
      ctx.font = `${Math.round(fontSize * 0.34)}px ${fontFamily}`; ctx.fillStyle = hashColor;
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(hashtags.length > 90 ? hashtags.slice(0, 90) + "\u2026" : hashtags, pad, fmt.h - pad);
    }
    if (logo) {
      try {
        const logoImg = await loadImg(logo.src);
        const lw = logo.wF * fmt.w, lh = lw * logo.ar;
        ctx.drawImage(logoImg, logo.xF * fmt.w, logo.yF * fmt.h, lw, lh);
      } catch {}
    }
    return canvas;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = await buildCanvas();
      const link = document.createElement("a");
      link.download = `${post.red}-${format}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png"); link.click();
    } catch (e) { console.error("Export error", e); }
    finally { setDownloading(false); }
  };

  const inp = { width: "100%", background: C.surf3, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 12, padding: "8px 10px", fontFamily: "Georgia,serif", boxSizing: "border-box", outline: "none", marginBottom: 8, resize: "vertical" };
  const lbl = { display: "block", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.accentLt, marginBottom: 5, fontFamily: "Georgia,serif" };
  const sec = { borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 };
  const chipBtnS = (active) => ({ flex: 1, padding: "6px 3px", borderRadius: 5, border: `1px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}22` : "transparent", color: active ? C.accentLt : C.muted, fontSize: 10, cursor: "pointer", fontFamily: "Georgia,serif", transition: "all .15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
  const uploadBtnStyle = { display: "inline-flex", alignItems: "center", gap: 6, background: C.surf3, border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 11, padding: "7px 12px", cursor: "pointer", fontFamily: "Georgia,serif" };
  const alignBtnS = (active) => ({ flex: 1, height: 28, borderRadius: 5, border: `1px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}22` : "transparent", color: active ? C.accentLt : C.muted, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" });
  const isDragging = dragging !== "";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 60 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 900, maxWidth: "99vw", background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 61, display: "flex", flexDirection: "column", animation: "slideIn .25s ease", cursor: isDragging ? "grabbing" : "default", userSelect: isDragging ? "none" : "auto" }}>

        {/* Header */}
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, color: C.text, fontFamily: "Georgia,serif" }}>🎨 Editor de pieza</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{post.red} · {post.tipo} · {post.pilar}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── SIDEBAR ── */}
          <div style={{ width: 258, flexShrink: 0, overflowY: "auto", borderRight: `1px solid ${C.border}`, padding: "14px 14px 28px" }}>

            <label style={lbl}>Plantilla</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
              {Object.entries(DESIGN_TEMPLATES).map(([k, t]) => (
                <button key={k} style={chipBtnS(template === k)} onClick={() => setTemplate(k)}>{t.label}</button>
              ))}
            </div>

            <div style={sec}>
              <label style={lbl}>Formato</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {Object.entries(DESIGN_FORMATS).map(([k, f]) => (
                  <button key={k} style={chipBtnS(format === k)} onClick={() => setFormat(k)}>{f.icon} {f.label}</button>
                ))}
              </div>
            </div>

            {/* Fondo */}
            <div style={sec}>
              <label style={lbl}>Fondo</label>
              <input ref={bgFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleBgFile(e.target.files?.[0])} />
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <button style={{ ...uploadBtnStyle, flex: 1, justifyContent: "center" }} onClick={() => bgFileRef.current?.click()}>🖼 Subir imagen</button>
                {bgImage && <button onClick={() => setBgImage(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, fontSize: 11, padding: "7px 10px", cursor: "pointer" }}>✕</button>}
              </div>
              {bgImage && (
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {["cover","contain"].map(f => <button key={f} style={chipBtnS(bgFit === f)} onClick={() => setBgFit(f)}>{f}</button>)}
                </div>
              )}
              <label style={{ ...lbl, marginTop: 4 }}>Color de fondo</label>
              <ColorInput value={bgColor} onChange={setBgColor} />
              <label style={lbl}>Color de acento</label>
              <ColorInput value={accColor} onChange={setAccColor} />
            </div>

            {/* Texto */}
            <div style={sec}>
              <label style={lbl}>Texto principal</label>
              <textarea value={copy} onChange={e => setCopy(e.target.value)} rows={4} style={inp} />
              <label style={lbl}>Fuente</label>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={{ ...inp, appearance: "none", cursor: "pointer", resize: "none" }}>
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <label style={lbl}>Tamaño — {fontSize}px</label>
              <input type="range" min={16} max={90} value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.accent, marginBottom: 10 }} />
              <label style={lbl}>Alineación</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[["left","←"],["center","↔"],["right","→"]].map(([v,icon]) => (
                  <button key={v} style={alignBtnS(align === v)} onClick={() => setAlign(v)}>{icon}</button>
                ))}
              </div>
              <label style={lbl}>Color del texto</label>
              <ColorInput value={copyColor} onChange={setCopyColor} />
            </div>

            {/* CTA */}
            <div style={sec}>
              <label style={lbl}>CTA</label>
              <input value={cta} onChange={e => setCta(e.target.value)} style={{ ...inp, resize: "none" }} />
              <label style={lbl}>Color CTA</label>
              <ColorInput value={ctaColor} onChange={setCtaColor} />
            </div>

            {/* Hashtags */}
            <div style={sec}>
              <label style={lbl}>Hashtags</label>
              <input value={hashtags} onChange={e => setHashtags(e.target.value)} style={{ ...inp, resize: "none" }} />
              <label style={lbl}>Color hashtags</label>
              <ColorInput value={hashColor} onChange={setHashColor} />
            </div>

            {/* Etiquetas toggle */}
            <div style={{ ...sec, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: C.text, fontFamily: "Georgia,serif" }}>Etiquetas</div>
                <div style={{ fontSize: 10, color: C.muted }}>Mostrar red / pilar</div>
              </div>
              <Toggle on={showBadges} onToggle={() => setShowBadges(v => !v)} />
            </div>

            {/* Logo */}
            <div style={sec}>
              <label style={lbl}>Logo</label>
              <input ref={logoFileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" style={{ display: "none" }} onChange={e => handleLogoFile(e.target.files?.[0])} />
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <button style={{ ...uploadBtnStyle, flex: 1, justifyContent: "center" }} onClick={() => logoFileRef.current?.click()}>📁 {logo ? "Cambiar logo" : "Subir logo"}</button>
                {logo && <button onClick={() => setLogo(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, fontSize: 11, padding: "7px 10px", cursor: "pointer" }}>✕</button>}
              </div>
              {logo && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <img src={logo.src} style={{ height: 28, maxWidth: 80, objectFit: "contain", borderRadius: 4, background: "#fff1", border: `1px solid ${C.border}` }} alt="logo" />
                    <span style={{ fontSize: 10, color: C.muted, fontFamily: "Georgia,serif" }}>Arrastrá en la vista previa para mover · esquina para escalar</span>
                  </div>
                  <label style={lbl}>Tamaño — {Math.round(logo.wF * 100)}%</label>
                  <input type="range" min={4} max={80} value={Math.round(logo.wF * 100)} onChange={e => setLogo(l => l ? { ...l, wF: parseInt(e.target.value) / 100 } : l)} style={{ width: "100%", accentColor: C.accent }} />
                </>
              )}
            </div>
          </div>

          {/* ── PREVIEW ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.bg, overflow: "hidden", padding: "20px" }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontFamily: "Georgia,serif" }}>
              Vista previa — {fmt.label} · {fmt.w}×{fmt.h}px
              {isDragging && <span style={{ color: C.accent, marginLeft: 8 }}>arrastrando…</span>}
            </div>

            <div ref={previewRef} style={{ width: pw, height: ph, position: "relative", overflow: "hidden", background: previewBg, borderRadius: 8, boxShadow: "0 8px 40px rgba(0,0,0,.7)", flexShrink: 0 }}>

              {bgImage && (
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: bgFit, backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
              )}

              {showBadges && (
                <>
                  <div style={{ position: "absolute", top: pPad, left: pPad, background: `${NET_COLOR[post.red] || accColor}28`, border: `1px solid ${NET_COLOR[post.red] || accColor}55`, borderRadius: pBadgeH / 2, height: pBadgeH, display: "flex", alignItems: "center", padding: `0 ${Math.round(12 * scale)}px`, fontSize: Math.round(13 * scale), color: NET_COLOR[post.red] || accColor, fontFamily: fontFamily, fontWeight: "bold", whiteSpace: "nowrap", pointerEvents: "none" }}>{post.red}</div>
                  {post.pilar && <div style={{ position: "absolute", top: pPad, right: pPad, background: `${accColor}22`, border: `1px solid ${accColor}55`, borderRadius: pBadgeH / 2, height: pBadgeH, display: "flex", alignItems: "center", padding: `0 ${Math.round(10 * scale)}px`, fontSize: Math.round(11 * scale), color: accColor, fontFamily: fontFamily, whiteSpace: "nowrap", pointerEvents: "none" }}>{post.pilar}</div>}
                </>
              )}

              {/* Text drag handle */}
              <div
                onMouseDown={e => { e.preventDefault(); textDrag.current = { startX: e.clientX, startY: e.clientY, startXF: textXF, startYF: textYF }; setDragging("text"); }}
                title="Arrastrá para mover el texto"
                style={{ position: "absolute", left: textXF * pw, top: Math.max(0, textTopPx - 16), background: C.accent, borderRadius: "4px 4px 0 0", padding: "2px 8px 1px", fontSize: 9, color: "#fff", cursor: "grab", display: "flex", alignItems: "center", gap: 3, fontFamily: "Georgia,serif", whiteSpace: "nowrap", zIndex: 10 }}>
                ⠿ mover texto
              </div>

              {/* Copy text */}
              <div style={{ position: "absolute", left: textXF * pw, top: textTopPx, right: pPad, fontSize: pFont, color: copyColor, fontFamily: fontFamily, lineHeight: `${pLineH}px`, textAlign: align, wordBreak: "break-word", pointerEvents: "none", zIndex: 5 }}>{copy}</div>

              {/* Accent line */}
              <div style={{ position: "absolute", top: accentTopPx, left: align === "center" ? "50%" : align === "right" ? undefined : textXF * pw, right: align === "right" ? pPad : undefined, transform: align === "center" ? "translateX(-50%)" : undefined, width: Math.round(60 * scale), height: Math.round(3 * scale), background: accColor, borderRadius: 2, pointerEvents: "none", zIndex: 5 }} />

              {/* CTA */}
              {cta && <div style={{ position: "absolute", top: ctaTopPx, left: textXF * pw, right: pPad, fontSize: Math.round(fontSize * 0.42 * scale), color: ctaColor, fontFamily: fontFamily, textAlign: align, pointerEvents: "none", zIndex: 5 }}>{cta}</div>}

              {/* Hashtags */}
              {hashtags && <div style={{ position: "absolute", bottom: pPad, left: pPad, right: pPad, fontSize: Math.round(fontSize * 0.34 * scale), color: hashColor, fontFamily: fontFamily, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 5 }}>{hashtags}</div>}

              {/* Logo */}
              {logo && (
                <div
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); logoDrag.current = { startX: e.clientX, startY: e.clientY, startXF: logo.xF, startYF: logo.yF }; setDragging("logo"); }}
                  style={{ position: "absolute", left: logo.xF * pw, top: logo.yF * ph, width: logo.wF * pw, cursor: dragging === "logo" ? "grabbing" : "grab", zIndex: 20 }}>
                  <img src={logo.src} style={{ width: "100%", display: "block", pointerEvents: "none" }} alt="logo" />
                  <div style={{ position: "absolute", inset: -1, border: `1px dashed ${C.accent}88`, borderRadius: 2, pointerEvents: "none" }} />
                  <div
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); logoResize.current = { startX: e.clientX, startWF: logo.wF }; setDragging("resize"); }}
                    style={{ position: "absolute", right: -5, bottom: -5, width: 12, height: 12, background: C.accent, borderRadius: 2, cursor: "nwse-resize", zIndex: 21 }} />
                </div>
              )}
            </div>

            <div style={{ fontSize: 10, color: C.muted, marginTop: 10, fontFamily: "Georgia,serif", textAlign: "center" }}>
              {pw}×{ph}px preview → exporta {fmt.w}×{fmt.h}px
              {logo && <span style={{ color: C.accentLt, marginLeft: 8 }}>· Logo: arrastrá para mover, esquina ◢ para escalar</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center", flexShrink: 0, background: C.surface }}>
          <button onClick={handleDownload} disabled={downloading} style={{ background: downloading ? C.surf3 : C.accent, border: "none", borderRadius: 9, color: C.text, fontSize: 14, padding: "12px 28px", cursor: downloading ? "not-allowed" : "pointer", fontFamily: "Georgia,serif", transition: "background .2s", display: "flex", alignItems: "center", gap: 8 }}>
            {downloading ? (<>{[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.accentLt, display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i * .2}s` }} />)}Generando…</>) : "⬇ Descargar PNG"}
          </button>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "Georgia,serif" }}>{fmt.w}×{fmt.h}px · PNG listo para publicar</div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, padding: "9px 18px", cursor: "pointer", fontFamily: "Georgia,serif" }}>Cerrar</button>
        </div>
      </div>
    </>
  );
}

/* ─── ADD PANEL ──────────────────────────────────────────────────── */
function AddPanel({ onClose, onAddPost, onAddEvento, onEditEvento, onDeleteEvento, brandForm, editingEvento }) {
  const isEditingEvento = !!editingEvento;
  const [tab, setTab] = useState(isEditingEvento ? "evento" : "post");
  const [postForm, setPostForm] = useState({
    red: brandForm.redes[0] || "Instagram",
    tipo: "",
    pilar: PILARES[0],
    semana: 1,
    dia: "Lunes",
    copy: "",
    hashtags: "",
    cta: "",
    promptImagen: "",
  });
  const [eventoForm, setEventoForm] = useState(
    editingEvento
      ? { titulo: editingEvento.titulo, semana: editingEvento.semana, dia: editingEvento.dia, color: editingEvento.color }
      : { titulo: "", semana: 1, dia: "Lunes", color: EVENT_COLORS[0] }
  );

  const tipos = TIPOS_POR_RED[postForm.red] || [];
  const setPF = (k, v) => setPostForm(f => ({ ...f, [k]: v }));
  const setEF = (k, v) => setEventoForm(f => ({ ...f, [k]: v }));

  const handlePostSubmit = () => {
    if (!postForm.copy.trim()) return;
    onAddPost({ ...postForm, tipo: postForm.tipo || tipos[0] || "" });
    onClose();
  };
  const handleEventoSubmit = () => {
    if (!eventoForm.titulo.trim()) return;
    if (isEditingEvento) {
      onEditEvento({ ...editingEvento, ...eventoForm });
    } else {
      onAddEvento({ ...eventoForm, id: `ev-${Date.now()}` });
    }
    onClose();
  };

  const inp = {
    width: "100%", background: C.surf3, border: `1px solid ${C.border}`,
    borderRadius: 8, color: C.text, fontSize: 13, padding: "10px 13px",
    fontFamily: "Georgia,serif", boxSizing: "border-box", outline: "none", marginBottom: 12,
  };
  const lbl = {
    display: "block", fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase",
    color: C.accentLt, marginBottom: 6, fontFamily: "Georgia,serif",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 50 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: 430, maxWidth: "95vw",
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        zIndex: 51, overflowY: "auto", padding: "28px 26px",
        animation: "slideIn .25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 15, color: C.text, fontFamily: "Georgia,serif" }}>
            {isEditingEvento ? "Editar evento" : "Agregar al calendario"}
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {!isEditingEvento && (
          <div style={{ display: "flex", gap: 6, marginBottom: 22, background: C.surf2, borderRadius: 8, padding: 4 }}>
            {[["post", "📝 Post manual"], ["evento", "📌 Evento / Festivo"]].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: "8px 10px", borderRadius: 6, border: "none",
                background: tab === k ? C.accent : "transparent",
                color: tab === k ? C.text : C.muted,
                fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", transition: "all .15s",
              }}>{label}</button>
            ))}
          </div>
        )}

        {tab === "post" && (
          <div>
            <label style={lbl}>Red social</label>
            <select value={postForm.red} onChange={e => setPF("red", e.target.value)}
              style={{ ...inp, appearance: "none", cursor: "pointer" }}>
              {REDES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Tipo</label>
                <select value={postForm.tipo || tipos[0]} onChange={e => setPF("tipo", e.target.value)}
                  style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                  {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Pilar</label>
                <select value={postForm.pilar} onChange={e => setPF("pilar", e.target.value)}
                  style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                  {PILARES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Semana</label>
                <select value={postForm.semana} onChange={e => setPF("semana", parseInt(e.target.value))}
                  style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>Semana {n}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Día</label>
                <select value={postForm.dia} onChange={e => setPF("dia", e.target.value)}
                  style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                  {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <label style={lbl}>Copy *</label>
            <textarea value={postForm.copy} onChange={e => setPF("copy", e.target.value)}
              placeholder="Escribí el texto del post…"
              style={{ ...inp, resize: "vertical", minHeight: 100 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Hashtags</label>
                <input value={postForm.hashtags} onChange={e => setPF("hashtags", e.target.value)}
                  placeholder="#tag1 #tag2" style={inp} />
              </div>
              <div>
                <label style={lbl}>CTA</label>
                <input value={postForm.cta} onChange={e => setPF("cta", e.target.value)}
                  placeholder="Llamada a la acción" style={inp} />
              </div>
            </div>

            <button onClick={handlePostSubmit} style={{
              width: "100%", background: C.accent, border: "none", borderRadius: 8,
              color: C.text, fontSize: 14, padding: "14px", cursor: "pointer",
              fontFamily: "Georgia,serif", marginTop: 4, letterSpacing: "0.02em",
            }}>✍️ Agregar post manual</button>
          </div>
        )}

        {tab === "evento" && (
          <div>
            <label style={lbl}>Título del evento *</label>
            <input value={eventoForm.titulo} onChange={e => setEF("titulo", e.target.value)}
              placeholder="ej: Día de la Madre, Feriado Nacional…" style={inp} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Semana</label>
                <select value={eventoForm.semana} onChange={e => setEF("semana", parseInt(e.target.value))}
                  style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>Semana {n}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Día</label>
                <select value={eventoForm.dia} onChange={e => setEF("dia", e.target.value)}
                  style={{ ...inp, appearance: "none", cursor: "pointer" }}>
                  {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <label style={lbl}>Color de etiqueta</label>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 20 }}>
              {EVENT_COLORS.map(color => (
                <div key={color} onClick={() => setEF("color", color)} style={{
                  width: 32, height: 32, borderRadius: "50%", background: color, cursor: "pointer",
                  border: `3px solid ${eventoForm.color === color ? C.text : "transparent"}`,
                  outline: eventoForm.color === color ? `2px solid ${C.accent}` : "none",
                  transition: "all .15s",
                }} />
              ))}
            </div>

            {eventoForm.titulo && (
              <div style={{
                background: `${eventoForm.color}18`, border: `1px solid ${eventoForm.color}55`,
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                fontSize: 12, color: eventoForm.color, fontFamily: "Georgia,serif",
              }}>
                📌 Vista previa: <strong>{eventoForm.titulo}</strong>
              </div>
            )}

            <button onClick={handleEventoSubmit} style={{
              width: "100%", background: C.teal, border: "none", borderRadius: 8,
              color: C.text, fontSize: 14, padding: "14px", cursor: "pointer",
              fontFamily: "Georgia,serif", letterSpacing: "0.02em",
            }}>{isEditingEvento ? "💾 Guardar cambios" : "📌 Agregar evento"}</button>

            {isEditingEvento && (
              <button onClick={() => { onDeleteEvento(editingEvento.id); onClose(); }} style={{
                width: "100%", background: "transparent", border: `1px solid #E6394655`,
                borderRadius: 8, color: "#E63946", fontSize: 13, padding: "11px",
                cursor: "pointer", fontFamily: "Georgia,serif", marginTop: 10,
              }}>🗑 Eliminar evento</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ─── CALENDAR MONTH ─────────────────────────────────────────────── */
function CalendarMonth({ strategy, eventos, firstDay, dragPost, setDragPost, movePost, onEditEvento, onDeleteEvento }) {
  const daysInMonth = getDaysInMonth(firstDay);
  const firstDOW    = (firstDay.getDay() + 6) % 7;

  const postsByDate   = {};
  const eventosByDate = {};

  strategy.semanas?.forEach(s => {
    s.posts?.forEach(p => {
      const date = getPostDate(s.numero, p.dia, firstDay);
      if (!postsByDate[date]) postsByDate[date] = [];
      postsByDate[date].push({ ...p, semanaNum: s.numero });
    });
  });
  eventos.forEach(ev => {
    const date = getPostDate(ev.semana, ev.dia, firstDay);
    if (!eventosByDate[date]) eventosByDate[date] = [];
    eventosByDate[date].push(ev);
  });

  const handleDrop = (dateNum) => {
    if (!dragPost) return;
    movePost(dragPost.postId, dragPost.semanaNum, getSemanaFromDate(dateNum), getDayName(dateNum, firstDay));
    setDragPost(null);
  };

  const cells = [];
  for (let i = 0; i < firstDOW; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: 10, color: C.muted, padding: "6px 0",
            letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Georgia,serif",
          }}>{d.slice(0, 3)}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((dateNum, i) => {
          if (dateNum === null) return <div key={`empty-${i}`} style={{ minHeight: 90 }} />;
          const posts = postsByDate[dateNum]   || [];
          const evs   = eventosByDate[dateNum] || [];
          return (
            <div
              key={dateNum}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(dateNum)}
              style={{
                minHeight: 90, background: C.surface, borderRadius: 8,
                border: `1px solid ${dragPost ? C.accent + "55" : C.border}`,
                padding: "6px", transition: "border-color .2s",
              }}
            >
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontFamily: "Georgia,serif" }}>{dateNum}</div>
              {evs.map(ev => (
                <div key={ev.id} style={{
                  background: ev.color, borderRadius: 3, padding: "2px 4px",
                  fontSize: 9, color: "#fff", marginBottom: 2, fontWeight: 700,
                  overflow: "hidden", display: "flex", alignItems: "center", gap: 2,
                }}>
                  <span onClick={() => onEditEvento(ev)} title="Editar" style={{
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}>📌 {ev.titulo}</span>
                  <span onClick={() => onDeleteEvento(ev.id)} title="Eliminar" style={{
                    cursor: "pointer", opacity: 0.75, flexShrink: 0, lineHeight: 1,
                    padding: "0 1px", fontWeight: 400, fontSize: 10,
                  }}>✕</span>
                </div>
              ))}
              {posts.map(post => (
                <div
                  key={post.id}
                  draggable
                  title={`${post.red} · ${post.tipo}\n${post.copy?.slice(0, 80)}…`}
                  onDragStart={() => setDragPost({ postId: post.id, semanaNum: post.semanaNum })}
                  onDragEnd={() => setDragPost(null)}
                  style={{
                    background: `${NET_COLOR[post.red] || C.accent}22`,
                    border: `1px solid ${NET_COLOR[post.red] || C.accent}55`,
                    borderRadius: 4, padding: "3px 6px", fontSize: 10,
                    color: NET_COLOR[post.red] || C.accent, marginBottom: 3,
                    cursor: "grab", userSelect: "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 3,
                  }}
                >
                  {post.isManual && <span>✍️</span>}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{post.red}</span>
                  <span style={{ color: C.muted, fontSize: 9 }}>· {post.tipo}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CALENDAR WEEK ──────────────────────────────────────────────── */
function CalendarWeek({ semana, strategy, eventos, firstDay, dragPost, setDragPost, movePost, onEditEvento, onDeleteEvento }) {
  const daysInMonth = getDaysInMonth(firstDay);
  const weekStart   = (semana - 1) * 7 + 1;
  const weekEnd     = Math.min(semana * 7, daysInMonth);

  const postsByDay   = Object.fromEntries(DIAS_SEMANA.map(d => [d, []]));
  const eventosByDay = Object.fromEntries(DIAS_SEMANA.map(d => [d, []]));

  strategy.semanas?.forEach(s => {
    s.posts?.forEach(p => {
      const date = getPostDate(s.numero, p.dia, firstDay);
      if (date >= weekStart && date <= weekEnd) {
        const dayName = getDayName(date, firstDay);
        postsByDay[dayName]?.push({ ...p, semanaNum: s.numero });
      }
    });
  });
  eventos.forEach(ev => {
    const date = getPostDate(ev.semana, ev.dia, firstDay);
    if (date >= weekStart && date <= weekEnd) {
      const dayName = getDayName(date, firstDay);
      eventosByDay[dayName]?.push(ev);
    }
  });

  const weekDays = DIAS_SEMANA.map(dayName => {
    const date = getPostDate(semana, dayName, firstDay);
    return { dayName, date: date >= weekStart && date <= weekEnd ? date : null };
  });

  const handleDrop = (dayName) => {
    if (!dragPost) return;
    movePost(dragPost.postId, dragPost.semanaNum, semana, dayName);
    setDragPost(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
      {weekDays.map(({ dayName, date }) => {
        const posts = postsByDay[dayName]   || [];
        const evs   = eventosByDay[dayName] || [];
        const inactive = date === null;
        return (
          <div
            key={dayName}
            onDragOver={e => { if (!inactive) e.preventDefault(); }}
            onDrop={() => !inactive && handleDrop(dayName)}
            style={{
              background: C.surface, borderRadius: 10,
              border: `1px solid ${dragPost && !inactive ? C.accent + "88" : C.border}`,
              opacity: inactive ? 0.3 : 1,
              transition: "border-color .2s, opacity .2s",
              minHeight: 200, display: "flex", flexDirection: "column",
            }}
          >
            <div style={{
              padding: "10px 12px", borderBottom: `1px solid ${C.border}`,
              background: C.surf2, borderRadius: "10px 10px 0 0",
            }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, fontFamily: "Georgia,serif" }}>
                {dayName.slice(0, 3)}
              </div>
              {date && <div style={{ fontSize: 20, color: C.text, fontFamily: "Georgia,serif", marginTop: 2 }}>{date}</div>}
            </div>
            <div style={{ padding: 8, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {evs.map(ev => (
                <div key={ev.id} style={{
                  background: ev.color + "22", border: `1px solid ${ev.color}66`,
                  borderRadius: 5, padding: "5px 8px", fontSize: 10,
                  color: ev.color, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span onClick={() => onEditEvento(ev)} style={{ flex: 1, cursor: "pointer" }}>📌 {ev.titulo}</span>
                  <span onClick={() => onDeleteEvento(ev.id)} title="Eliminar" style={{
                    cursor: "pointer", opacity: 0.6, fontSize: 11, fontWeight: 400,
                    lineHeight: 1, flexShrink: 0,
                  }}>✕</span>
                </div>
              ))}
              {posts.map(post => (
                <div
                  key={post.id}
                  draggable
                  onDragStart={() => setDragPost({ postId: post.id, semanaNum: post.semanaNum })}
                  onDragEnd={() => setDragPost(null)}
                  style={{
                    background: `${NET_COLOR[post.red] || C.accent}18`,
                    border: `1px solid ${NET_COLOR[post.red] || C.accent}55`,
                    borderRadius: 7, padding: "8px 9px",
                    cursor: "grab", userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: NET_COLOR[post.red] || C.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: NET_COLOR[post.red] || C.accent, fontWeight: 700 }}>{post.red}</span>
                    <span style={{ fontSize: 9, color: C.muted }}>{post.tipo}</span>
                    {post.isManual && <span style={{ marginLeft: "auto", fontSize: 9 }}>✍️</span>}
                  </div>
                  <div style={{
                    fontSize: 11, color: C.text, lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{post.copy}</div>
                  {post.pilar && (
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 5 }}>{post.pilar}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── APP ────────────────────────────────────────────────────────── */
export default function App() {
  const MONTHS = getMonthOptions();

  const [form, setForm] = useState({
    negocio: "", industria: "", sitioWeb: "", audiencia: "", objetivo: "",
    mes: MONTHS[1].value, tono: TONOS[0], redes: [], pilares: [],
    logoSrc: null,
  });
  const [contenido, setContenido]     = useState({});
  const [usePalette, setUsePalette]   = useState(false);
  const [palette, setPalette]         = useState(["#7B35D4", "#F2EDE4", "#0C0C0F"]);
  const [colorInput, setColorInput]   = useState("");
  const [screen, setScreen]           = useState("form");
  const [strategy, setStrategy]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [error, setError]             = useState("");
  const [regeneratingId, setRegeneratingId] = useState(null);

  const [viewMode, setViewMode]         = useState("list");
  const [currentWeek, setCurrentWeek]   = useState(1);
  const [eventos, setEventos]           = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [dragPost, setDragPost]         = useState(null);

  /* ── NEW: design editor state ── */
  const [designingPost, setDesigningPost] = useState(null);

  const [hasSaved, setHasSaved]     = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copyFlash, setCopyFlash]   = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleRed = r => {
    if (form.redes.includes(r)) {
      setForm(f => ({ ...f, redes: f.redes.filter(x => x !== r) }));
      setContenido(p => { const n = { ...p }; delete n[r]; return n; });
    } else {
      setForm(f => ({ ...f, redes: [...f.redes, r] }));
      const d = {};
      TIPOS_POR_RED[r].forEach((t, i) => { d[t] = DEFAULTS_BY_INDEX[i] ?? 1; });
      setContenido(p => ({ ...p, [r]: d }));
    }
  };

  const togglePilar = p => setForm(f => ({
    ...f, pilares: f.pilares.includes(p) ? f.pilares.filter(x => x !== p) : [...f.pilares, p],
  }));

  const setTipoCantidad = (red, tipo, val) => setContenido(p => ({
    ...p, [red]: { ...p[red], [tipo]: Math.max(0, Math.min(14, val)) },
  }));

  const updatePost = (semanaNum, postId, field, value) => setStrategy(prev => ({
    ...prev,
    semanas: prev.semanas.map(s => s.numero === semanaNum
      ? { ...s, posts: s.posts.map(p => p.id === postId ? { ...p, [field]: value } : p) }
      : s),
  }));

  const movePost = (postId, oldSemana, newSemana, newDia) => {
    setStrategy(prev => {
      const post = prev.semanas.find(s => s.numero === oldSemana)?.posts.find(p => p.id === postId);
      if (!post) return prev;
      const updated = { ...post, dia: newDia };
      return {
        ...prev,
        semanas: prev.semanas.map(s => {
          if (s.numero === oldSemana && s.numero === newSemana)
            return { ...s, posts: s.posts.map(p => p.id === postId ? updated : p) };
          if (s.numero === oldSemana)
            return { ...s, posts: s.posts.filter(p => p.id !== postId) };
          if (s.numero === newSemana)
            return { ...s, posts: [...s.posts, updated] };
          return s;
        }),
      };
    });
  };

  const addManualPost = (postData) => {
    const semana = postData.semana || 1;
    setStrategy(prev => ({
      ...prev,
      semanas: prev.semanas.map(s =>
        s.numero === semana
          ? { ...s, posts: [...s.posts, { ...postData, id: `manual-${Date.now()}`, isManual: true }] }
          : s
      ),
    }));
  };

  const addEvento    = (ev) => setEventos(prev => [...prev, ev]);
  const editEvento   = (ev) => setEventos(prev => prev.map(e => e.id === ev.id ? ev : e));
  const deleteEvento = (id) => setEventos(prev => prev.filter(e => e.id !== id));

  /* ─── PERSISTENCE ─────────────────────────────────────────────── */
  const STORAGE_KEY = "chroma_strategy_v1";

  const encodePayload = (data) => {
    const str   = JSON.stringify(data);
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes));
  };
  const decodePayload = (encoded) => {
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const data = decodePayload(hash);
        if (data.strategy) {
          setStrategy(data.strategy);
          setEventos(data.eventos || []);
          setForm(f => ({ ...f, ...data.form }));
          setScreen("result");
          history.replaceState(null, "", window.location.pathname);
          return;
        }
      } catch (e) {}
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHasSaved(true);
  }, []);

  useEffect(() => {
    if (!strategy) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ strategy, eventos, form }));
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 2000);
      return () => clearTimeout(t);
    } catch (e) {}
  }, [strategy, eventos]);

  const restoreSaved = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data?.strategy) {
        setStrategy(data.strategy);
        setEventos(data.eventos || []);
        setForm(f => ({ ...f, ...data.form }));
        setScreen("result");
      }
    } catch (e) {}
  };

  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSaved(false);
  };

  const copyShareURL = () => {
    const encoded = encodePayload({ strategy, eventos, form });
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 2500);
    });
  };

  /* ─── PROMPT & GENERATE ──────────────────────────────────────── */
  const buildWeekPrompt = (semanaNum, includeResumen) => {
    const redesInfo = form.redes.length > 0
      ? form.redes.map(r => {
          const tipos = Object.entries(contenido[r] || {}).filter(([, v]) => v > 0).map(([t, v]) => `${t}: ${v}`).join(", ");
          return `  - ${r}: ${tipos} por semana`;
        }).join("\n")
      : "  - Instagram: Posts: 3, Historias: 5, Reels: 2 por semana";
    const total = form.redes.reduce((acc, r) => acc + Object.values(contenido[r] || {}).reduce((a, v) => a + v, 0), 0) || 10;

    const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
    const dayHints = dias.slice(0, Math.min(7, total)).join(", ");

    return `Sos un estratega experto en redes sociales. Generá posts REALES para la semana ${semanaNum} de 4 del mes de ${form.mes}.

NEGOCIO: ${form.negocio}${form.industria ? ` — ${form.industria}` : ""}
${form.sitioWeb ? `Sitio web: ${form.sitioWeb}\n` : ""}AUDIENCIA: ${form.audiencia || "General"}
OBJETIVO: ${form.objetivo || "Aumentar presencia y engagement"}
TONO: ${form.tono}
PILARES: ${form.pilares.join(", ") || "Educativo, Inspiracional, Promocional"}
${usePalette && palette.length > 0 ? `PALETA: ${palette.join(", ")}\n` : ""}
REDES Y CANTIDAD:
${redesInfo}
Total posts esta semana: ${total}

INSTRUCCIONES:
- Distribuí los ${total} posts entre días variados (preferentemente: ${dayHints})
- Copies completos y listos para publicar, con emojis naturales
- Hashtags distintos en cada post (5-8 por post)
- CTA específico y accionable por post
- Hashtags: string plano separado por espacios, SIN paréntesis ni corchetes. Ejemplo: "#marketing #branding #tips"
- promptImagen: prompt en inglés para generar imagen con IA (composición, estilo, mood, colores). Máx 2 oraciones.

Devolvé SOLO JSON válido, sin markdown, sin texto extra:
{${includeResumen ? `
  "resumen": "enfoque estratégico del mes completo en 2-3 oraciones",` : ""}
  "posts": [
    {
      "id": "s${semanaNum}-1",
      "red": "Instagram",
      "tipo": "Post",
      "pilar": "Educativo",
      "copy": "texto completo del post listo para publicar",
      "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
      "cta": "llamada a la acción específica",
      "dia": "Lunes",
      "promptImagen": "prompt en inglés para IA image generator"
    }
  ]
}`;
  };

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const callWithRetry = async (messages, maxTokens, label) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const raw  = await callClaude(messages, maxTokens);
        const text = cleanJSON(raw);
        JSON.parse(text);
        return text;
      } catch (e) {
        const isRateLimit = e.message?.match(/try again in ([\d.]+)s/i);
        if (isRateLimit) {
          const secs = Math.ceil(parseFloat(isRateLimit[1])) + 2;
          for (let s = secs; s > 0; s--) {
            setLoadingMsg(`${label} — límite de API, reanudando en ${s}s…`);
            await wait(1000);
          }
        } else if (attempt < 3) {
          setLoadingMsg(`${label} — reintentando…`);
          await wait(1500);
        } else {
          throw new Error(`Respuesta inválida del modelo. Intentá de nuevo.`);
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (!form.negocio) { setError("Ingresá el nombre del negocio para continuar."); return; }
    setError(""); setLoading(true);

    try {
      const semanas = [];
      let resumen   = "";

      for (let n = 1; n <= 4; n++) {
        const label = `Generando semana ${n} de 4…`;
        setLoadingMsg(label);
        const text = await callWithRetry([{ role: "user", content: buildWeekPrompt(n, n === 1) }], 4000, label);
        const data = JSON.parse(text);
        if (n === 1 && data.resumen) resumen = data.resumen;
        semanas.push({ numero: n, posts: data.posts || [] });
        if (n < 4) await wait(3000);
      }

      setStrategy({ resumen, semanas });
      setEventos([]);
      setScreen("result");
      setViewMode("list");
      setCurrentWeek(1);
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (semanaNum, post) => {
    setRegeneratingId(post.id);
    try {
      const prompt = `Regenera este post para "${form.negocio}" (${form.industria || "negocio"}).\nRed: ${post.red} | Tipo: ${post.tipo} | Pilar: ${post.pilar} | Mes: ${form.mes} | Tono: ${form.tono}\n${usePalette ? `Paleta: ${palette.join(", ")}` : ""}\nDevuelve SOLO JSON sin markdown: {"copy":"...","hashtags":"...","cta":"...","dia":"...","promptImagen":"prompt en inglés para generar imagen con IA"}`;
      const raw  = await callClaude([{ role: "user", content: prompt }], 600);
      const data = JSON.parse(cleanJSON(raw));
      ["copy", "hashtags", "cta", "dia", "promptImagen"].forEach(f => { if (data[f]) updatePost(semanaNum, post.id, f, data[f]); });
    } catch (e) { console.error(e); }
    finally { setRegeneratingId(null); }
  };

  /* styles */
  const inputS = {
    width: "100%", background: C.surf2, border: `1px solid ${C.border}`,
    borderRadius: 8, color: C.text, fontSize: 14, padding: "13px 16px",
    fontFamily: "Georgia,serif", boxSizing: "border-box", outline: "none",
  };
  const labelS = {
    display: "block", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
    color: C.accentLt, marginBottom: 11, fontFamily: "Georgia,serif",
  };
  const chipS = active => ({
    padding: "8px 15px", borderRadius: 100, fontSize: 13, cursor: "pointer",
    fontFamily: "Georgia,serif", transition: "all .15s", userSelect: "none",
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? `${C.accent}28` : "transparent",
    color: active ? C.accentLt : C.muted,
  });
  const viewBtnS = (active) => ({
    padding: "7px 14px", borderRadius: 6, border: "none",
    background: active ? C.accent : "transparent",
    color: active ? C.text : C.muted,
    fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif", transition: "all .15s",
  });

  const GLOBAL_CSS = `
    *{box-sizing:border-box}
    input::placeholder,textarea::placeholder{color:${C.muted}66}
    input:focus,textarea:focus,select:focus{border-color:${C.accent}!important}
    button:disabled{opacity:.5;cursor:not-allowed!important}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
    @keyframes bounce{0%,80%,100%{transform:scale(.55);opacity:.35}40%{transform:scale(1);opacity:1}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
    @media print{
      .no-print{display:none!important}
      .post-card{break-inside:avoid;page-break-inside:avoid}
      body,html{background:white!important;color:#111!important}
      .post-card{background:#f5f5f5!important;border:1px solid #ddd!important;border-left-width:3px!important}
      textarea,input{border:none!important;background:transparent!important;resize:none!important}
    }
  `;

  const headerEl = (right) => (
    <header className="no-print" style={{
      borderBottom: `1px solid ${C.border}`, padding: "18px 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: C.bg, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 30, height: 30, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: C.text, flexShrink: 0 }}>C</div>
        <span style={{ fontSize: 12, letterSpacing: "0.13em", textTransform: "uppercase", opacity: .75 }}>Chroma — Estrategia de Redes</span>
      </div>
      {right}
    </header>
  );

  /* ══ FORM ══════════════════════════════════════════════════════ */
  if (screen === "form") return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia,serif" }}>
      <style>{GLOBAL_CSS}</style>
      {headerEl(null)}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 28px 80px" }}>

        {hasSaved && screen === "form" && (
          <div style={{
            background: C.surf2, border: `1px solid ${C.accent}55`, borderRadius: 10,
            padding: "16px 20px", marginBottom: 28,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 3 }}>✦ Tenés una estrategia guardada</div>
              <div style={{ fontSize: 12, color: C.muted }}>¿Querés continuar donde lo dejaste?</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={restoreSaved} style={{
                background: C.accent, border: "none", borderRadius: 7, color: C.text,
                fontSize: 12, padding: "9px 16px", cursor: "pointer", fontFamily: "Georgia,serif",
              }}>Restaurar</button>
              <button onClick={clearSaved} style={{
                background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7,
                color: C.muted, fontSize: 12, padding: "9px 14px", cursor: "pointer", fontFamily: "Georgia,serif",
              }}>Descartar</button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 44 }}>
          <div style={{ display: "inline-block", background: C.accentDim, border: `1px solid ${C.accent}40`, color: C.accentLt, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 16 }}>Generador IA</div>
          <h1 style={{ fontSize: "clamp(26px,5vw,46px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 13px", lineHeight: 1.1 }}>Estrategia mensual<br />de redes sociales</h1>
          <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.75, maxWidth: 480, margin: 0 }}>Completá los datos de tu negocio y en segundos tendrás un plan de contenido completo, editable y listo para ejecutar.</p>
        </div>

        {/* 01 — Negocio + Logo */}
        <section style={{ marginBottom: 32 }}>
          <label style={labelS}>01 — Tu negocio</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input style={inputS} placeholder="Nombre del negocio *" value={form.negocio} onChange={e => setField("negocio", e.target.value)} />
            <input style={inputS} placeholder="Industria (ej: diseño, moda, tech)" value={form.industria} onChange={e => setField("industria", e.target.value)} />
          </div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input style={{ ...inputS, paddingLeft: 38 }} placeholder="Sitio web (opcional) — la IA lo analizará para personalizar el contenido" value={form.sitioWeb} onChange={e => setField("sitioWeb", e.target.value)} />
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>🌐</span>
          </div>
          {/* Logo upload */}
          <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 3 }}>Logo de marca</div>
              <div style={{ fontSize: 12, color: C.muted }}>PNG o SVG — se precargará en el editor de cada post</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {form.logoSrc && (
                <img src={form.logoSrc} style={{ height: 36, maxWidth: 100, objectFit: "contain", borderRadius: 5, background: "#fff1", border: `1px solid ${C.border}` }} alt="logo" />
              )}
              <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" id="logo-form-upload" style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setField("logoSrc", ev.target.result);
                  reader.readAsDataURL(file);
                }} />
              <label htmlFor="logo-form-upload" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.surf3, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "9px 14px", cursor: "pointer", fontFamily: "Georgia,serif", whiteSpace: "nowrap" }}>
                {form.logoSrc ? "🔄 Cambiar" : "📁 Subir logo"}
              </label>
              {form.logoSrc && (
                <button onClick={() => setField("logoSrc", null)} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, fontSize: 12, padding: "9px 10px", cursor: "pointer", fontFamily: "Georgia,serif" }}>✕</button>
              )}
            </div>
          </div>
          {form.sitioWeb && <div style={{ marginTop: 8, fontSize: 12, color: C.accentLt, display: "flex", alignItems: "center", gap: 6 }}><span>✦</span> La IA analizará este sitio para enfocar el contenido en tu propuesta de valor real</div>}
        </section>
        <div style={{ height: 1, background: C.border, margin: "4px 0 32px" }} />

        {/* 02 */}
        <section style={{ marginBottom: 32 }}>
          <label style={labelS}>02 — Audiencia y objetivo del mes</label>
          <textarea style={{ ...inputS, resize: "vertical", minHeight: 74, marginBottom: 12 }} placeholder="¿A quién le hablás? (ej: emprendedores 25-40 que quieren mejorar su imagen de marca)" value={form.audiencia} onChange={e => setField("audiencia", e.target.value)} />
          <textarea style={{ ...inputS, resize: "vertical", minHeight: 74 }} placeholder="Objetivo del mes (ej: lanzar nuevo servicio, generar leads, aumentar seguidores)" value={form.objetivo} onChange={e => setField("objetivo", e.target.value)} />
        </section>

        <div style={{ height: 1, background: C.border, margin: "4px 0 32px" }} />

        {/* 03 */}
        <section style={{ marginBottom: 32 }}>
          <label style={labelS}>03 — Mes y tono de voz</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <select style={{ ...inputS, appearance: "none", cursor: "pointer" }} value={form.mes} onChange={e => setField("mes", e.target.value)}>
              {MONTHS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select style={{ ...inputS, appearance: "none", cursor: "pointer" }} value={form.tono} onChange={e => setField("tono", e.target.value)}>
              {TONOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        <div style={{ height: 1, background: C.border, margin: "4px 0 32px" }} />

        {/* 04 */}
        <section style={{ marginBottom: 32 }}>
          <label style={labelS}>04 — Redes sociales y frecuencia semanal</label>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px", lineHeight: 1.6 }}>Seleccioná las redes y ajustá cuántas publicaciones querés por semana en cada tipo de contenido.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {REDES.map(r => <span key={r} style={chipS(form.redes.includes(r))} onClick={() => toggleRed(r)}>{r}</span>)}
          </div>
          {form.redes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {form.redes.map(r => (
                <div key={r} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${NET_COLOR[r]}`, borderRadius: 9, padding: "14px 18px", animation: "fadeIn .25s ease" }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 12, fontFamily: "Georgia,serif" }}>{r}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {TIPOS_POR_RED[r].map(tipo => (
                      <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: C.muted, fontFamily: "Georgia,serif", minWidth: 66 }}>{tipo}</span>
                        <Stepper value={contenido[r]?.[tipo] ?? 0} onChange={v => setTipoCantidad(r, tipo, v)} />
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "Georgia,serif" }}>/sem</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ height: 1, background: C.border, margin: "4px 0 32px" }} />

        {/* 05 */}
        <section style={{ marginBottom: 32 }}>
          <label style={labelS}>05 — Pilares de contenido</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PILARES.map(p => <span key={p} style={chipS(form.pilares.includes(p))} onClick={() => togglePilar(p)}>{p}</span>)}
          </div>
        </section>

        <div style={{ height: 1, background: C.border, margin: "4px 0 32px" }} />

        {/* 06 */}
        <section style={{ marginBottom: 36 }}>
          <label style={labelS}>06 — Identidad visual (opcional)</label>
          <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: usePalette ? 18 : 0 }}>
              <div>
                <div style={{ fontSize: 13, color: C.text }}>Paleta de colores personalizada</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Los prompts de imagen incluirán tus colores exactos</div>
              </div>
              <Toggle on={usePalette} onToggle={() => setUsePalette(v => !v)} />
            </div>
            {usePalette && (
              <div style={{ animation: "fadeIn .2s ease" }}>
                {palette.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {palette.map((c, i) => (
                      <div key={i} onClick={() => setPalette(p => p.filter((_, j) => j !== i))} title="Click para quitar" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `2px solid ${C.border}` }} />
                        <span style={{ fontSize: 9, color: C.muted }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Presets</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  {PALETTE_PRESETS.map(c => (
                    <div key={c} onClick={() => { if (palette.includes(c)) setPalette(p => p.filter(x => x !== c)); else if (palette.length < 6) setPalette(p => [...p, c]); }} style={{ width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${palette.includes(c) ? C.text : "transparent"}`, outline: palette.includes(c) ? `2px solid ${C.accent}` : "none", transition: "all .15s" }} />
                  ))}
                </div>
                <input style={{ ...inputS, fontSize: 13 }} placeholder="Hex personalizado: #FF5733 → Enter" value={colorInput} onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { const v = colorInput.trim(); if (v.match(/^#[0-9A-Fa-f]{3,6}$/) && !palette.includes(v) && palette.length < 6) { setPalette(p => [...p, v]); setColorInput(""); } } }} />
              </div>
            )}
          </div>
        </section>

        {error && <div style={{ background: "#2A0808", border: "1px solid #7B1F1F", borderRadius: 8, padding: "13px 17px", color: "#FF9999", fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button onClick={handleGenerate} disabled={loading} style={{
          width: "100%", border: "none", borderRadius: 10, fontSize: 15, padding: "17px",
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "Georgia,serif", letterSpacing: "0.04em",
          background: loading ? C.surf3 : C.accent, color: C.text, transition: "background .2s",
        }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", gap: 5 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accentLt, display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i * .2}s` }} />)}
              </span>
              <span style={{ color: C.muted }}>{loadingMsg}</span>
            </span>
          ) : "→ Generar estrategia mensual"}
        </button>
      </div>
    </div>
  );

  /* ══ RESULT ════════════════════════════════════════════════════ */
  if (!strategy) return null;
  const totalPosts = strategy.semanas?.reduce((a, s) => a + (s.posts?.length || 0), 0) || 0;
  const firstDay   = parseMonthStart(form.mes);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia,serif" }}>
      <style>{GLOBAL_CSS}</style>

      {headerEl(
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* View toggle */}
          <div className="no-print" style={{ display: "flex", gap: 2, background: C.surf2, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            <button style={viewBtnS(viewMode === "list")}  onClick={() => setViewMode("list")}>☰ Lista</button>
            <button style={viewBtnS(viewMode === "week")}  onClick={() => setViewMode("week")}>▦ Semana</button>
            <button style={viewBtnS(viewMode === "month")} onClick={() => setViewMode("month")}>▣ Mes</button>
          </div>
          {/* Add button */}
          <button className="no-print" onClick={() => setShowAddPanel(true)} style={{
            background: C.teal, border: "none", borderRadius: 8,
            color: C.text, fontSize: 12, padding: "8px 14px",
            cursor: "pointer", fontFamily: "Georgia,serif",
          }}>+ Agregar</button>

          {savedFlash && (
            <span style={{ fontSize: 11, color: C.teal, animation: "fadeIn .2s ease" }}>✓ Guardado</span>
          )}

          {/* Share URL */}
          <button onClick={copyShareURL} title="Copiar link con la estrategia codificada" style={{
            background: copyFlash ? C.teal : C.surf2,
            border: `1px solid ${copyFlash ? C.teal : C.border}`, borderRadius: 8,
            color: C.text, fontSize: 12, padding: "8px 13px", cursor: "pointer",
            fontFamily: "Georgia,serif", transition: "all .25s",
          }}>{copyFlash ? "✓ Link copiado" : "🔗 Compartir"}</button>

          <button onClick={() => window.print()} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "8px 15px", cursor: "pointer", fontFamily: "Georgia,serif" }}>⬇ PDF</button>
          <button onClick={() => { setScreen("form"); setStrategy(null); setEventos([]); }} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "8px 15px", cursor: "pointer", fontFamily: "Georgia,serif" }}>← Nueva</button>
        </div>
      )}

      <div style={{ maxWidth: viewMode === "list" ? 860 : "100%", margin: "0 auto", padding: "36px 28px 80px" }}>

        {/* Summary */}
        <div style={{ background: C.surf2, borderLeft: `3px solid ${C.accent}`, borderRadius: 10, padding: "20px 24px", marginBottom: 30, animation: "fadeIn .4s ease" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: C.accentLt, marginBottom: 10 }}>Resumen estratégico — {form.mes}</div>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: C.text, margin: "0 0 12px" }}>{strategy.resumen}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Badge label={form.negocio} color={C.accent} />
            <Badge label={`${totalPosts} publicaciones`} color={C.muted} />
            <Badge label={form.mes} color={C.muted} />
            {eventos.length > 0 && <Badge label={`${eventos.length} evento${eventos.length > 1 ? "s" : ""}`} color={C.teal} />}
          </div>
        </div>

        {/* Tip bar */}
        <div className="no-print" style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 16px", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13 }}>
            {viewMode === "list" ? "✏️" : "⟺"}
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {viewMode === "list"  && <>Editá los campos directamente. Usá <strong style={{ color: C.accentLt }}>🎨 Crear pieza</strong> para diseñar y descargar el PNG de cada post. Usá <strong style={{ color: C.accentLt }}>↺ Regenerar</strong> para reescribir con IA.</>}
            {viewMode === "week"  && <>Arrastrá los posts entre columnas para cambiar el día de publicación. Las flechas navegan entre semanas.</>}
            {viewMode === "month" && <>Vista completa del mes. Arrastrá cualquier post a otro día para reprogramarlo.</>}
          </span>
        </div>

        {/* ── LIST VIEW ── */}
        {viewMode === "list" && strategy.semanas?.map(semana => (
          <div key={semana.numero} style={{ marginBottom: 46, animation: "fadeIn .4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, whiteSpace: "nowrap" }}>Semana {semana.numero}</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{semana.posts?.length || 0} publicaciones</span>
            </div>
            {semana.posts?.map(post => (
              <PostCard
                key={post.id}
                post={post}
                semanaNum={semana.numero}
                onEdit={updatePost}
                onRegenerate={handleRegenerate}
                regeneratingId={regeneratingId}
                onDesign={setDesigningPost}
              />
            ))}
          </div>
        ))}

        {/* ── WEEK VIEW ── */}
        {viewMode === "week" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button
                onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                disabled={currentWeek === 1}
                style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "8px 18px", cursor: "pointer", fontFamily: "Georgia,serif" }}
              >← Anterior</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>{form.mes}</div>
                <div style={{ fontSize: 17, color: C.text }}>Semana {currentWeek} <span style={{ color: C.muted, fontSize: 13 }}>de 4</span></div>
              </div>
              <button
                onClick={() => setCurrentWeek(w => Math.min(4, w + 1))}
                disabled={currentWeek === 4}
                style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "8px 18px", cursor: "pointer", fontFamily: "Georgia,serif" }}
              >Siguiente →</button>
            </div>
            <CalendarWeek
              semana={currentWeek}
              strategy={strategy}
              eventos={eventos}
              firstDay={firstDay}
              dragPost={dragPost}
              setDragPost={setDragPost}
              movePost={movePost}
              onEditEvento={(ev) => { setEditingEvento(ev); setShowAddPanel(true); }}
              onDeleteEvento={deleteEvento}
            />
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {viewMode === "month" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Vista mensual</div>
              <div style={{ fontSize: 18, color: C.text }}>{form.mes}</div>
            </div>
            <CalendarMonth
              strategy={strategy}
              eventos={eventos}
              firstDay={firstDay}
              dragPost={dragPost}
              setDragPost={setDragPost}
              movePost={movePost}
              onEditEvento={(ev) => { setEditingEvento(ev); setShowAddPanel(true); }}
              onDeleteEvento={deleteEvento}
            />
          </div>
        )}

        {/* Bottom */}
        <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 40 }}>
          <button onClick={() => window.print()} style={{ background: C.accent, border: "none", borderRadius: 10, color: C.text, fontSize: 14, padding: "14px 30px", cursor: "pointer", fontFamily: "Georgia,serif" }}>⬇ Exportar PDF</button>
          <button onClick={() => { setScreen("form"); setStrategy(null); setEventos([]); }} style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: "14px 26px", cursor: "pointer", fontFamily: "Georgia,serif" }}>← Nueva estrategia</button>
        </div>
      </div>

      {/* Add Panel */}
      {showAddPanel && (
        <AddPanel
          onClose={() => { setShowAddPanel(false); setEditingEvento(null); }}
          onAddPost={addManualPost}
          onAddEvento={addEvento}
          onEditEvento={editEvento}
          onDeleteEvento={deleteEvento}
          brandForm={form}
          editingEvento={editingEvento}
        />
      )}

      {/* ── DESIGN EDITOR PANEL ── */}
      {designingPost && (
        <DesignEditor
          post={designingPost}
          onClose={() => setDesigningPost(null)}
          initialLogo={form.logoSrc}
        />
      )}
    </div>
  );
}
