import { useState, useRef, Suspense, useEffect } from "react";
import { toPng } from "html-to-image";
import pixelmatch from "pixelmatch";
import Editor from "@monaco-editor/react";
import { levels } from "@/data/levels";
import { useToast } from "@/hooks/use-toast";

const DIFF_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  Easy:   { bg: "#0d2e1a", text: "#00e676", glow: "#00e676" },
  Medium: { bg: "#2e1f00", text: "#ffab00", glow: "#ffab00" },
  Hard:   { bg: "#2e0d0d", text: "#ff1744", glow: "#ff1744" },
};

function ScoreRing({ score }: { score: number | null }) {
  const r = 26, sw = 4, nr = r - sw / 2;
  const circ = 2 * Math.PI * nr;
  const pct = score !== null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const offset = circ * (1 - pct);
  const color = score === null ? "#333" : score >= 90 ? "#00e676" : score >= 60 ? "#ffab00" : "#ff1744";

  return (
    <div style={{ position: "relative", width: r * 2, height: r * 2, flexShrink: 0 }}>
      <svg width={r * 2} height={r * 2} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
        <circle cx={r} cy={r} r={nr} fill="none" stroke="#1a1a2e" strokeWidth={sw} />
        <circle cx={r} cy={r} r={nr} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: 9, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1 }}>
          {score !== null ? `${Math.round(score)}%` : "--"}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <div style={{ height: 3, background: "#0a0a12" }} />;
  const color = score >= 90 ? "#00e676" : score >= 60 ? "#ffab00" : "#ff1744";
  return (
    <div style={{ height: 3, background: "#0a0a12" }}>
      <div style={{ height: "100%", width: `${score}%`, background: color, boxShadow: `0 0 12px ${color}`, transition: "width 0.9s cubic-bezier(0.34,1.56,0.64,1)", borderRadius: "0 2px 2px 0" }} />
    </div>
  );
}

export default function Battle() {
  const [levelId, setLevelId] = useState<number>(levels[0].id);
  const currentLevel = levels.find((l) => l.id === levelId) || levels[0];
  const [userCode, setUserCode] = useState(currentLevel.startingCode);
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pulse, setPulse] = useState(false);
  const { toast } = useToast();
  const hiddenTargetRef = useRef<HTMLDivElement>(null);
  const hiddenOutputRef = useRef<HTMLDivElement>(null);

  const diff = DIFF_COLORS[currentLevel.difficulty];
  const scoreColor = score === null ? "#555" : score >= 90 ? "#00e676" : score >= 60 ? "#ffab00" : "#ff1744";

  const handleLevelChange = (id: number) => {
    const lvl = levels.find((l) => l.id === id);
    if (lvl) { setLevelId(lvl.id); setUserCode(lvl.startingCode); setScore(null); setShowMenu(false); }
  };

  const calculateScore = async () => {
    if (!hiddenTargetRef.current || !hiddenOutputRef.current) return;
    try {
      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 250));
      const [t, o] = await Promise.all([
        toPng(hiddenTargetRef.current, { width: 400, height: 300 }),
        toPng(hiddenOutputRef.current, { width: 400, height: 300 }),
      ]);
      const load = (src: string) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
      const [imgT, imgO] = await Promise.all([load(t), load(o)]);
      const mk = (img: HTMLImageElement) => { const c = document.createElement("canvas"); c.width = 400; c.height = 300; c.getContext("2d")!.drawImage(img, 0, 0); return c; };
      const c1 = mk(imgT), c2 = mk(imgO);
      const d1 = c1.getContext("2d")!.getImageData(0, 0, 400, 300).data;
      const d2 = c2.getContext("2d")!.getImageData(0, 0, 400, 300).data;
      const diff2 = pixelmatch(d1, d2, null, 400, 300, { threshold: 0.1 });
      const pct = ((400 * 300 - diff2) / (400 * 300)) * 100;
      setScore(pct);
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
      toast({
        title: pct === 100 ? "PERFECT MATCH" : pct >= 90 ? "SO CLOSE" : pct >= 60 ? "GETTING THERE" : "KEEP TRYING",
        description: pct === 100 ? "Flawless pixel accuracy." : `${pct.toFixed(1)}% pixel match`,
      });
    } catch {
      toast({ title: "Error", description: "Could not capture the output.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest("[data-menu]")) setShowMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#07070f", color: "#c8cfe8", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <header style={{ height: 54, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "#0a0a18", borderBottom: "1px solid #151530" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 32, borderRadius: 3, background: "linear-gradient(180deg,#a855f7,#6366f1,#3b82f6)", boxShadow: "0 0 16px #a855f744" }} />
            <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: 4, color: "#fff", textTransform: "uppercase" }}>CSS<span style={{ color: "#a855f7", margin: "0 3px" }}>&#x2605;</span>BATTLE</span>
          </div>

          {/* Level selector */}
          <div style={{ position: "relative" }} data-menu>
            <button
              data-testid="select-level"
              onClick={() => setShowMenu((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: "#0f0f1e", border: "1px solid #1e1e3f", borderRadius: 8, cursor: "pointer", color: "#c8cfe8", fontSize: 12, fontFamily: "inherit", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a855f7")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e3f")}
            >
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: diff.text, background: diff.bg, padding: "3px 7px", borderRadius: 4, border: `1px solid ${diff.text}44` }}>
                {currentLevel.difficulty}
              </span>
              <span style={{ color: "#3d3d6b", fontSize: 11 }}>#{currentLevel.id}</span>
              <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{currentLevel.title}</span>
              <span style={{ color: "#3d3d6b", fontSize: 9, marginLeft: 2 }}>▾</span>
            </button>

            {showMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#0d0d1f", border: "1px solid #1e1e3f", borderRadius: 10, minWidth: 290, maxHeight: 380, overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px #a855f722", zIndex: 999 }}>
                {(["Easy", "Medium", "Hard"] as const).map((d) => {
                  const dc = DIFF_COLORS[d];
                  return (
                    <div key={d}>
                      <div style={{ padding: "10px 14px 5px", fontSize: 10, fontWeight: 800, color: dc.text, letterSpacing: 2, textTransform: "uppercase", borderBottom: "1px solid #12122a" }}>
                        — {d} —
                      </div>
                      {levels.filter((l) => l.difficulty === d).map((lvl) => {
                        const active = lvl.id === levelId;
                        return (
                          <button
                            key={lvl.id}
                            data-testid={`level-item-${lvl.id}`}
                            onClick={() => handleLevelChange(lvl.id)}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", background: active ? "#1a0a2e" : "transparent", border: "none", cursor: "pointer", color: active ? "#e2e8f0" : "#7878a8", fontSize: 12, fontFamily: "inherit", textAlign: "left" }}
                            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#12122a"; }}
                            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          >
                            <span style={{ color: "#2a2a4e", width: 22, fontSize: 10 }}>#{lvl.id}</span>
                            <span style={{ flex: 1 }}>{lvl.title}</span>
                            {active && <span style={{ color: "#a855f7", fontSize: 12 }}>◀</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Score + Submit */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {score !== null && (
            <div data-testid="text-score" style={{ fontSize: 14, fontWeight: 800, color: scoreColor, letterSpacing: 1, textShadow: `0 0 12px ${scoreColor}` }}>
              {score.toFixed(1)}%
            </div>
          )}
          <ScoreRing score={score} />
          <button
            data-testid="button-submit"
            onClick={calculateScore}
            disabled={isSubmitting}
            style={{ padding: "9px 28px", background: isSubmitting ? "#1a1a2e" : "linear-gradient(135deg,#a855f7 0%,#6366f1 50%,#3b82f6 100%)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 800, fontSize: 12, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer", boxShadow: isSubmitting ? "none" : "0 0 24px #a855f755, 0 4px 12px rgba(168,85,247,0.3)", transition: "all 0.25s", opacity: pulse ? 0.5 : 1 }}
          >
            {isSubmitting ? "Analyzing..." : "Submit"}
          </button>
        </div>
      </header>

      {/* Score bar */}
      <ScoreBar score={score} />

      {/* ── MAIN AREA ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Editor panel */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", borderRight: "1px solid #151530" }}>
          <div style={{ height: 36, background: "#09091a", borderBottom: "1px solid #151530", display: "flex", alignItems: "center", padding: "0 0", flexShrink: 0 }}>
            <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#0f0f20", borderRight: "1px solid #151530" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28ca41" }} />
              <span style={{ marginLeft: 6, fontSize: 11, color: "#3d3d6b" }}>style.html</span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: "#2a2a4e", marginRight: 14 }}>HTML / CSS</span>
          </div>
          <Suspense fallback={<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#2a2a4e" }}>Loading editor...</div>}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <Editor
                height="100%"
                theme="vs-dark"
                language="html"
                value={userCode}
                onChange={(val) => setUserCode(val || "")}
                options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", lineHeight: 22, padding: { top: 14, bottom: 14 }, scrollBeyondLastLine: false, wordWrap: "on", renderLineHighlight: "gutter", cursorBlinking: "phase", smoothScrolling: true }}
              />
            </div>
          </Suspense>
        </div>

        {/* Preview panels */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", background: "#07070f" }}>

          {/* Target */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #151530" }}>
            <div style={{ height: 36, background: "#09091a", borderBottom: "1px solid #151530", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 8px #a855f7" }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#a855f7", textTransform: "uppercase" }}>Target</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: diff.text, fontWeight: 700 }}>{currentLevel.difficulty}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center, #0d0d20 0%, #07070f 100%)", padding: 12 }}>
              <div style={{ width: 400, height: 300, borderRadius: 6, overflow: "hidden", boxShadow: "0 0 0 1px #1e1e3f, 0 0 40px rgba(168,85,247,0.08), 0 20px 60px rgba(0,0,0,0.7)" }}>
                <iframe title="Target" srcDoc={currentLevel.targetHTML} sandbox="allow-scripts" style={{ width: 400, height: 300, border: "none", display: "block" }} />
              </div>
            </div>
          </div>

          {/* Output */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ height: 36, background: "#09091a", borderBottom: "1px solid #151530", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 8px #6366f1" }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#6366f1", textTransform: "uppercase" }}>Your Output</span>
              <div style={{ flex: 1 }} />
              {score !== null && (
                <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor, textShadow: `0 0 8px ${scoreColor}` }}>{score.toFixed(1)}% match</span>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center, #0d0d20 0%, #07070f 100%)", padding: 12 }}>
              <div style={{ width: 400, height: 300, borderRadius: 6, overflow: "hidden", boxShadow: score !== null ? `0 0 0 2px ${scoreColor}55, 0 0 40px ${scoreColor}22, 0 20px 60px rgba(0,0,0,0.7)` : "0 0 0 1px #1e1e3f, 0 20px 60px rgba(0,0,0,0.7)", transition: "box-shadow 0.5s ease" }}>
                <iframe title="Your Output" srcDoc={userCode} sandbox="allow-scripts" style={{ width: 400, height: 300, border: "none", display: "block" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden capture divs */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none", opacity: 0 }}>
        <div ref={hiddenTargetRef} style={{ width: 400, height: 300, overflow: "hidden" }}>
          <iframe srcDoc={currentLevel.targetHTML} style={{ width: 400, height: 300, border: "none" }} />
        </div>
        <div ref={hiddenOutputRef} style={{ width: 400, height: 300, overflow: "hidden" }}>
          <iframe srcDoc={userCode} style={{ width: 400, height: 300, border: "none" }} />
        </div>
      </div>
    </div>
  );
}
