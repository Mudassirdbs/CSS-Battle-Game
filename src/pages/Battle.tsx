import { useState, useRef, Suspense, useEffect } from "react";
import { toPng } from "html-to-image";
import pixelmatch from "pixelmatch";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { levels } from "@/data/levels";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const GREEN = "#22c55e";
const GREEN_DIM = "#16a34a";
const GREEN_GLOW = "rgba(34,197,94,0.25)";

const DIFF_STYLES: Record<string, { color: string; bg: string }> = {
  Easy:   { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  Medium: { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  Hard:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function ScoreRing({ score }: { score: number | null }) {
  const r = 26, sw = 3, nr = r - sw / 2;
  const circ = 2 * Math.PI * nr;
  const pct = score !== null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const offset = circ * (1 - pct);
  const color = score === null ? "var(--muted-foreground)" : score >= 90 ? GREEN : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <div style={{ position: "relative", width: r * 2, height: r * 2, flexShrink: 0 }}>
      <svg width={r * 2} height={r * 2} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={r} cy={r} r={nr} fill="none" stroke="#1a1a1a" strokeWidth={sw} />
        <circle cx={r} cy={r} r={nr} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color, fontSize: 9, fontWeight: 800, letterSpacing: "-0.5px" }}>
          {score !== null ? `${Math.round(score)}%` : "--"}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <div className="h-[2px] bg-secondary" />;
  const color = score >= 90 ? GREEN : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="h-[2px] bg-secondary">
      <div style={{ height: "100%", width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}88`, transition: "width 0.9s cubic-bezier(0.34,1.56,0.64,1)" }} />
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
  const { theme } = useTheme();
  const hiddenTargetRef = useRef<HTMLDivElement>(null);
  const hiddenOutputRef = useRef<HTMLDivElement>(null);

  const diff = DIFF_STYLES[currentLevel.difficulty];
  const scoreColor = score === null ? "hsl(var(--muted-foreground))" : score >= 90 ? GREEN : score >= 60 ? "#eab308" : "#ef4444";

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
      const d1 = mk(imgT).getContext("2d")!.getImageData(0, 0, 400, 300).data;
      const d2 = mk(imgO).getContext("2d")!.getImageData(0, 0, 400, 300).data;
      const diffPx = pixelmatch(d1, d2, null as any, 400, 300, { threshold: 0.1 });
      const pct = ((400 * 300 - diffPx) / (400 * 300)) * 100;
      setScore(pct);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      toast({
        title: pct === 100 ? "PERFECT" : pct >= 90 ? "SO CLOSE" : pct >= 60 ? "DECENT" : "KEEP TRYING",
        description: pct === 100 ? "Flawless pixel accuracy." : `${pct.toFixed(1)}% pixel match`,
      });
    } catch {
      toast({ title: "Error", description: "Could not capture output.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest("[data-menu]")) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-mono overflow-hidden">

      {/* ── HEADER ── */}
      <header className="h-[52px] shrink-0 flex items-center justify-between px-3 lg:px-5 bg-card border-b border-border">

        {/* Left: logo + level selector */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center shadow-[0_0_16px_rgba(34,197,94,0.25)]">
              <span className="text-black font-black text-[13px] leading-none">&lt;/&gt;</span>
            </div>
            <span className="hidden sm:inline-block font-extrabold text-[15px] tracking-widest text-foreground uppercase">
              CSS<span style={{ color: GREEN }}>Battle</span>
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-[1px] h-6 bg-border" />

          {/* Level picker */}
          <div style={{ position: "relative" }} data-menu>
            <button
              data-testid="select-level"
              onClick={() => setShowMenu((v) => !v)}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-md cursor-pointer text-xs font-inherit transition-all shadow-sm border ${showMenu ? 'border-green-500/40 shadow-[0_0_0_3px_rgba(34,197,94,0.25)] bg-secondary' : 'border-border hover:bg-muted bg-background text-foreground'}`}
            >
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: diff.color, background: diff.bg, padding: "3px 8px", borderRadius: 3 }}>
                {currentLevel.difficulty}
              </span>
              <span className="text-muted-foreground text-[11px]">#{currentLevel.id}</span>
              <span className="hidden sm:inline-block text-foreground font-semibold">{currentLevel.title}</span>
              <span className="text-muted-foreground text-[9px] ml-0.5">▾</span>
            </button>

            {showMenu && (
              <div className="absolute top-[calc(100%+6px)] left-0 bg-popover text-popover-foreground border border-border rounded-lg min-w-[280px] max-h-[380px] overflow-y-auto shadow-2xl z-50">
                {(["Easy", "Medium", "Hard"] as const).map((d) => {
                  const dc = DIFF_STYLES[d];
                  return (
                    <div key={d}>
                      <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-extrabold tracking-widest uppercase border-b border-border" style={{ color: dc.color }}>
                        {d}
                      </div>
                      {levels.filter((l) => l.difficulty === d).map((lvl) => {
                        const active = lvl.id === levelId;
                        return (
                          <button
                            key={lvl.id}
                            data-testid={`level-item-${lvl.id}`}
                            onClick={() => handleLevelChange(lvl.id)}
                            className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 border-l-2 text-xs font-inherit text-left transition-all ${active ? 'bg-secondary border-green-500 text-foreground' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                          >
                            <span className="text-muted-foreground/50 w-[22px] text-[10px]">#{lvl.id}</span>
                            <span style={{ flex: 1 }}>{lvl.title}</span>
                            {active && <span style={{ color: GREEN, fontSize: 14, lineHeight: 1 }}>●</span>}
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

        {/* Right: score + submit */}
        <div className="flex items-center gap-2 lg:gap-3.5">
          <ThemeToggle />
          {score !== null && (
            <div data-testid="text-score" className="hidden sm:block text-[14px] font-extrabold tracking-wide tabular-nums" style={{ color: scoreColor }}>
              {score.toFixed(1)}%
            </div>
          )}
          <ScoreRing score={score} />
          <button
            data-testid="button-submit"
            onClick={calculateScore}
            disabled={isSubmitting}
            className={`px-6 py-2 border-none rounded-md font-extrabold text-xs tracking-[1.5px] uppercase transition-all ${isSubmitting ? 'bg-secondary text-muted-foreground cursor-not-allowed shadow-none' : 'bg-green-500 hover:bg-green-600 text-black cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.25)]'}`}
            style={{ opacity: pulse ? 0.6 : 1 }}
          >
            {isSubmitting ? "Analyzing..." : "Submit"}
          </button>
        </div>
      </header>

      {/* Score progress bar */}
      <ScoreBar score={score} />

      {/* ── MAIN SPLIT ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">

        {/* Editor */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-border min-h-[50vh] lg:min-h-0 shrink-0 lg:shrink">
          {/* Tab bar */}
          <div className="h-[38px] bg-card border-b border-border flex items-stretch shrink-0">
            <div className="flex items-center gap-2 px-4 border-r border-border bg-background border-b-2" style={{ borderBottomColor: GREEN, marginBottom: -1 }}>
              <span style={{ color: GREEN, fontSize: 11 }}>◆</span>
              <span className="text-muted-foreground text-[11px] tracking-wide">style.html</span>
            </div>
            <div style={{ flex: 1 }} />
            <div className="flex items-center px-3.5 text-[10px] text-muted-foreground tracking-widest">HTML / CSS</div>
          </div>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">Loading editor...</div>}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <Editor
                height="100%"
                theme={theme === "dark" ? "vs-dark" : "light"}
                language="html"
                value={userCode}
                onChange={(val) => setUserCode(val || "")}
                options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", lineHeight: 22, padding: { top: 14, bottom: 14 }, scrollBeyondLastLine: false, wordWrap: "on", renderLineHighlight: "gutter", cursorBlinking: "phase", smoothScrolling: true }}
              />
            </div>
          </Suspense>
        </div>

        {/* Preview panels */}
        <div className="w-full lg:w-1/2 flex flex-col bg-background shrink-0 min-h-[80vh] lg:min-h-0">

          {/* Target */}
          <div className="flex-1 flex flex-col border-b border-border">
            <div className="h-[38px] bg-card border-b border-border flex items-center px-4 gap-2.5 shrink-0">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, boxShadow: `0 0 6px ${GREEN}`, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GREEN, textTransform: "uppercase" }}>Target</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: diff.color, background: diff.bg, padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>{currentLevel.difficulty}</span>
            </div>
            <div className="flex-1 flex items-center justify-center bg-background p-4 overflow-x-auto">
              <div className="w-[400px] h-[300px] rounded overflow-hidden shrink-0 ring-1 ring-border shadow-2xl">
                <iframe title="Target" srcDoc={currentLevel.targetHTML} sandbox="allow-scripts" style={{ width: 400, height: 300, border: "none", display: "block" }} />
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="flex-1 flex flex-col">
            <div className="h-[38px] bg-card border-b border-border flex items-center px-4 gap-2.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block shrink-0" />
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Your Output</span>
              <div style={{ flex: 1 }} />
              {score !== null && (
                <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor, letterSpacing: 0.5 }}>{score.toFixed(1)}% match</span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center bg-background p-4 overflow-x-auto">
              <div className="w-[400px] h-[300px] rounded overflow-hidden shrink-0 transition-shadow duration-400" style={{ boxShadow: score !== null ? `0 0 0 1px ${scoreColor}44, 0 0 24px ${scoreColor}22, 0 20px 60px rgba(0,0,0,0.4)` : "0 0 0 1px hsl(var(--border)), 0 20px 60px rgba(0,0,0,0.4)" }}>
                <iframe title="Your Output" srcDoc={userCode} sandbox="allow-scripts" style={{ width: 400, height: 300, border: "none", display: "block" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden capture */}
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
