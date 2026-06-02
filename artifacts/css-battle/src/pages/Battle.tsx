import { useState, useRef, Suspense, useEffect } from "react";
import { toPng } from "html-to-image";
import pixelmatch from "pixelmatch";
import Editor from "@monaco-editor/react";
import { levels } from "@/data/levels";
import { useToast } from "@/hooks/use-toast";

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: "#2ecc71",
  Medium: "#f39c12",
  Hard: "#e74c3c",
};

function ScoreRing({ score }: { score: number | null }) {
  const radius = 28;
  const stroke = 4;
  const norm = radius - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const pct = score !== null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const offset = circ * (1 - pct);

  let color = "#555";
  if (score !== null) {
    if (score >= 90) color = "#2ecc71";
    else if (score >= 60) color = "#f39c12";
    else color = "#e74c3c";
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={radius} cy={radius} r={norm} fill="none" stroke="#1e2433" strokeWidth={stroke} />
        <circle
          cx={radius}
          cy={radius}
          r={norm}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
        />
      </svg>
      <span style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, zIndex: 1 }}>
        {score !== null ? `${score.toFixed(0)}%` : "--"}
      </span>
    </div>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return null;
  let color = "#e74c3c";
  if (score >= 90) color = "#2ecc71";
  else if (score >= 60) color = "#f39c12";

  return (
    <div style={{ height: 3, background: "#1e2433", borderRadius: 2, overflow: "hidden", width: "100%" }}>
      <div
        style={{
          height: "100%",
          width: `${score}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          borderRadius: 2,
        }}
      />
    </div>
  );
}

export default function Battle() {
  const [levelId, setLevelId] = useState<number>(levels[0].id);
  const currentLevel = levels.find((l) => l.id === levelId) || levels[0];
  const [userCode, setUserCode] = useState(currentLevel.startingCode);
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [scoreFlash, setScoreFlash] = useState(false);
  const { toast } = useToast();

  const hiddenTargetRef = useRef<HTMLDivElement>(null);
  const hiddenOutputRef = useRef<HTMLDivElement>(null);

  const handleLevelChange = (id: number) => {
    const lvl = levels.find((l) => l.id === id);
    if (lvl) {
      setLevelId(lvl.id);
      setUserCode(lvl.startingCode);
      setScore(null);
      setShowLevelMenu(false);
    }
  };

  const calculateScore = async () => {
    if (!hiddenTargetRef.current || !hiddenOutputRef.current) return;
    try {
      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 200));

      const [targetDataUrl, outputDataUrl] = await Promise.all([
        toPng(hiddenTargetRef.current, { width: 400, height: 300 }),
        toPng(hiddenOutputRef.current, { width: 400, height: 300 }),
      ]);

      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = src;
        });

      const [imgTarget, imgOutput] = await Promise.all([loadImg(targetDataUrl), loadImg(outputDataUrl)]);

      const mkCanvas = (img: HTMLImageElement) => {
        const c = document.createElement("canvas");
        c.width = 400;
        c.height = 300;
        c.getContext("2d")!.drawImage(img, 0, 0);
        return c;
      };

      const c1 = mkCanvas(imgTarget);
      const c2 = mkCanvas(imgOutput);
      const d1 = c1.getContext("2d")!.getImageData(0, 0, 400, 300).data;
      const d2 = c2.getContext("2d")!.getImageData(0, 0, 400, 300).data;

      const diff = pixelmatch(d1, d2, null, 400, 300, { threshold: 0.1 });
      const pct = ((400 * 300 - diff) / (400 * 300)) * 100;
      setScore(pct);
      setScoreFlash(true);
      setTimeout(() => setScoreFlash(false), 600);

      const msg =
        pct === 100
          ? "Perfect pixel match. Legendary."
          : pct >= 90
          ? `${pct.toFixed(1)}% — almost there. Keep pushing.`
          : pct >= 60
          ? `${pct.toFixed(1)}% — getting closer. Check your layout.`
          : `${pct.toFixed(1)}% — back to the drawing board.`;

      toast({
        title: pct >= 90 ? (pct === 100 ? "PERFECT" : "SO CLOSE") : pct >= 60 ? "DECENT" : "MISS",
        description: msg,
      });
    } catch {
      toast({ title: "Capture failed", description: "Could not render the output for comparison.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-level-menu]")) setShowLevelMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const scoreColor =
    score === null ? "#555" : score >= 90 ? "#2ecc71" : score >= 60 ? "#f39c12" : "#e74c3c";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: "#0b0e1a", overflow: "hidden", fontFamily: "'JetBrains Mono', monospace", color: "#c9d1e0" }}
    >
      {/* HEADER */}
      <header
        style={{ flexShrink: 0, height: 56, borderBottom: "1px solid #1e2845", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#0d1120", position: "relative", zIndex: 20 }}
      >
        {/* Left: logo + level selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 28, background: "linear-gradient(180deg,#7c3aed,#2563eb)", borderRadius: 2 }} />
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 3, color: "#fff", textTransform: "uppercase" }}>CSS Battle</span>
          </div>

          {/* Level picker */}
          <div style={{ position: "relative" }} data-level-menu>
            <button
              data-testid="select-level"
              onClick={() => setShowLevelMenu((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "#141828", border: "1px solid #2a3350", borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: "#c9d1e0", fontSize: 13, fontFamily: "inherit" }}
            >
              <span style={{ color: DIFFICULTY_COLOR[currentLevel.difficulty], fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: DIFFICULTY_COLOR[currentLevel.difficulty] + "22", padding: "2px 6px", borderRadius: 3, border: `1px solid ${DIFFICULTY_COLOR[currentLevel.difficulty]}44` }}>
                {currentLevel.difficulty}
              </span>
              <span style={{ color: "#7c8db5", fontSize: 11 }}>#{currentLevel.id}</span>
              <span style={{ fontWeight: 600 }}>{currentLevel.title}</span>
              <span style={{ color: "#3d4f6e", fontSize: 10, marginLeft: 2 }}>▼</span>
            </button>

            {showLevelMenu && (
              <div
                style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#111827", border: "1px solid #1e2845", borderRadius: 8, minWidth: 280, maxHeight: 360, overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", zIndex: 100 }}
              >
                {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                  <div key={diff}>
                    <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: DIFFICULTY_COLOR[diff], letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid #1e2845` }}>
                      {diff}
                    </div>
                    {levels.filter((l) => l.difficulty === diff).map((lvl) => (
                      <button
                        key={lvl.id}
                        data-testid={`level-item-${lvl.id}`}
                        onClick={() => handleLevelChange(lvl.id)}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", background: lvl.id === levelId ? "#1a2235" : "transparent", border: "none", cursor: "pointer", color: lvl.id === levelId ? "#fff" : "#8da0c0", fontSize: 13, fontFamily: "inherit", textAlign: "left", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { if (lvl.id !== levelId) (e.currentTarget as HTMLElement).style.background = "#141c2e"; }}
                        onMouseLeave={(e) => { if (lvl.id !== levelId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span style={{ color: "#3d4f6e", width: 20, fontSize: 11 }}>#{lvl.id}</span>
                        <span style={{ flex: 1 }}>{lvl.title}</span>
                        {lvl.id === levelId && <span style={{ color: "#2563eb", fontSize: 11 }}>●</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: score ring + submit */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {score !== null && (
            <div
              data-testid="text-score"
              style={{ fontSize: 13, fontWeight: 700, color: scoreColor, letterSpacing: 1, opacity: scoreFlash ? 0.4 : 1, transition: "opacity 0.1s" }}
            >
              {score.toFixed(1)}% match
            </div>
          )}
          <ScoreRing score={score} />
          <button
            data-testid="button-submit"
            onClick={calculateScore}
            disabled={isSubmitting}
            style={{ padding: "8px 24px", background: isSubmitting ? "#1e2845" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit", letterSpacing: 2, textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer", boxShadow: isSubmitting ? "none" : "0 0 20px rgba(124,58,237,0.35)", transition: "all 0.2s" }}
          >
            {isSubmitting ? "Scoring..." : "Submit"}
          </button>
        </div>
      </header>

      {/* Score bar */}
      <div style={{ height: 3, background: "#0d1120", flexShrink: 0 }}>
        <ScoreBar score={score} />
      </div>

      {/* MAIN SPLIT */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* LEFT: Editor */}
        <div style={{ width: "50%", borderRight: "1px solid #1e2845", display: "flex", flexDirection: "column", background: "#0d1120" }}>
          {/* Editor tab bar */}
          <div style={{ height: 36, background: "#0a0d18", borderBottom: "1px solid #1a2235", display: "flex", alignItems: "center", padding: "0 0 0 0", flexShrink: 0 }}>
            <div style={{ padding: "0 18px", height: "100%", display: "flex", alignItems: "center", gap: 8, background: "#0d1120", borderRight: "1px solid #1a2235", fontSize: 12, color: "#8da0c0" }}>
              <span style={{ color: "#e06c75", fontSize: 11 }}>&#9679;</span>
              style.html
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: "0 14px", fontSize: 11, color: "#3d4f6e" }}>HTML + CSS</div>
          </div>

          <Suspense fallback={<div style={{ padding: 20, color: "#3d4f6e" }}>Loading editor...</div>}>
            <Editor
              height="100%"
              theme="vs-dark"
              language="html"
              value={userCode}
              onChange={(val) => setUserCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 22,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                renderLineHighlight: "gutter",
                bracketPairColorization: { enabled: true },
                cursorBlinking: "phase",
                smoothScrolling: true,
              }}
            />
          </Suspense>
        </div>

        {/* RIGHT: Target + Output */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column", background: "#0b0e1a" }}>
          {/* Target */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: "1px solid #1e2845" }}>
            <div style={{ height: 36, background: "#0a0d18", borderBottom: "1px solid #1a2235", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 6px #7c3aed" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#7c3aed", textTransform: "uppercase" }}>Target</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: "#3d4f6e" }}>{currentLevel.difficulty}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div style={{ width: 400, height: 300, position: "relative", borderRadius: 4, overflow: "hidden", boxShadow: "0 0 0 1px #1e2845, 0 16px 48px rgba(0,0,0,0.6)" }}>
                <iframe
                  title="Target"
                  srcDoc={currentLevel.targetHTML}
                  sandbox="allow-scripts"
                  style={{ width: 400, height: 300, border: "none", display: "block" }}
                />
              </div>
            </div>
          </div>

          {/* Output */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ height: 36, background: "#0a0d18", borderBottom: "1px solid #1a2235", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", boxShadow: "0 0 6px #2563eb" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#2563eb", textTransform: "uppercase" }}>Your Output</span>
              <div style={{ flex: 1 }} />
              {score !== null && (
                <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>{score.toFixed(1)}%</span>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div style={{ width: 400, height: 300, position: "relative", borderRadius: 4, overflow: "hidden", boxShadow: score !== null ? `0 0 0 2px ${scoreColor}44, 0 16px 48px rgba(0,0,0,0.6)` : "0 0 0 1px #1e2845, 0 16px 48px rgba(0,0,0,0.6)", transition: "box-shadow 0.4s ease" }}>
                <iframe
                  title="Your Output"
                  srcDoc={userCode}
                  sandbox="allow-scripts"
                  style={{ width: 400, height: 300, border: "none", display: "block" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN CAPTURE DIVS */}
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
