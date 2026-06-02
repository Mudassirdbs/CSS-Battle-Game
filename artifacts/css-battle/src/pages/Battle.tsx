import { useState, useRef, Suspense } from "react";
import { toPng } from "html-to-image";
import pixelmatch from "pixelmatch";
import Editor from "@monaco-editor/react";
import { levels } from "@/data/levels";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Battle() {
  const [levelId, setLevelId] = useState<number>(levels[0].id);
  const currentLevel = levels.find((l) => l.id === levelId) || levels[0];
  const [userCode, setUserCode] = useState(currentLevel.startingCode);
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLevelChange = (idStr: string) => {
    const id = parseInt(idStr, 10);
    const lvl = levels.find((l) => l.id === id);
    if (lvl) {
      setLevelId(lvl.id);
      setUserCode(lvl.startingCode);
      setScore(null);
    }
  };

  const hiddenTargetRef = useRef<HTMLDivElement>(null);
  const hiddenOutputRef = useRef<HTMLDivElement>(null);

  const calculateScore = async () => {
    if (!hiddenTargetRef.current || !hiddenOutputRef.current) return;

    try {
      setIsSubmitting(true);
      // Wait a tiny bit for iframes in hidden divs to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      const targetDataUrl = await toPng(hiddenTargetRef.current, { width: 400, height: 300 });
      const outputDataUrl = await toPng(hiddenOutputRef.current, { width: 400, height: 300 });

      const imgTarget = new Image();
      const imgOutput = new Image();

      await Promise.all([
        new Promise((resolve) => {
          imgTarget.onload = resolve;
          imgTarget.src = targetDataUrl;
        }),
        new Promise((resolve) => {
          imgOutput.onload = resolve;
          imgOutput.src = outputDataUrl;
        }),
      ]);

      const canvasTarget = document.createElement("canvas");
      const canvasOutput = document.createElement("canvas");
      canvasTarget.width = 400;
      canvasTarget.height = 300;
      canvasOutput.width = 400;
      canvasOutput.height = 300;

      const ctxTarget = canvasTarget.getContext("2d");
      const ctxOutput = canvasOutput.getContext("2d");

      if (!ctxTarget || !ctxOutput) {
        throw new Error("Could not get canvas context");
      }

      ctxTarget.drawImage(imgTarget, 0, 0);
      ctxOutput.drawImage(imgOutput, 0, 0);

      const targetData = ctxTarget.getImageData(0, 0, 400, 300).data;
      const outputData = ctxOutput.getImageData(0, 0, 400, 300).data;

      const diffPixels = pixelmatch(targetData, outputData, null, 400, 300, { threshold: 0.1 });
      const totalPixels = 400 * 300;
      const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;
      
      setScore(matchPercentage);

      if (matchPercentage === 100) {
        toast({
          title: "Perfect Match!",
          description: "You nailed it exactly. 100%.",
          variant: "default",
          className: "bg-green-500 text-black border-none",
        });
      } else if (matchPercentage > 90) {
        toast({
          title: "Almost there!",
          description: `${matchPercentage.toFixed(1)}% match. Keep tweaking.`,
        });
      } else {
        toast({
          title: "Needs work",
          description: `${matchPercentage.toFixed(1)}% match. Check your dimensions and colors.`,
          variant: "destructive",
        });
      }

    } catch (err) {
      console.error(err);
      toast({
        title: "Error calculating score",
        description: "Something went wrong during image capture.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  let scoreColorClass = "text-muted-foreground";
  if (score !== null) {
    if (score > 90) scoreColorClass = "text-green-400";
    else if (score >= 60) scoreColorClass = "text-yellow-400";
    else scoreColorClass = "text-red-400";
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-mono text-foreground">
      {/* HEADER */}
      <header className="flex-none h-14 border-b border-border flex items-center justify-between px-4 bg-card z-10">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-tight text-primary uppercase">CSS BATTLE</h1>
          <Select value={levelId.toString()} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-[200px] h-8 bg-background border-border" data-testid="select-level">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((lvl) => (
                <SelectItem key={lvl.id} value={lvl.id.toString()} data-testid={`level-item-${lvl.id}`}>
                  {lvl.id}. {lvl.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          {score !== null && (
            <div className={`font-bold ${scoreColorClass}`} data-testid="text-score">
              {score.toFixed(1)}% match
            </div>
          )}
          <Button
            onClick={calculateScore}
            disabled={isSubmitting}
            className="h-8 rounded-none uppercase font-bold tracking-widest px-6"
            data-testid="button-submit"
          >
            {isSubmitting ? "Scoring..." : "Submit"}
          </Button>
        </div>
      </header>

      {/* MAIN SPLIT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Editor */}
        <div className="w-1/2 border-r border-border flex flex-col relative bg-[#1e1e1e]">
          <Suspense fallback={<div className="p-4 text-muted-foreground">Loading editor...</div>}>
            <Editor
              height="100%"
              theme="vs-dark"
              language="html"
              value={userCode}
              onChange={(val) => setUserCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "JetBrains Mono, monospace",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </Suspense>
        </div>

        {/* RIGHT: Output & Target */}
        <div className="w-1/2 flex flex-col bg-background">
          {/* Target */}
          <div className="flex-1 flex flex-col border-b border-border relative">
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-xs font-bold text-muted-foreground tracking-widest uppercase backdrop-blur-sm z-10 border border-white/10">
              Target
            </div>
            <div className="flex-1 flex items-center justify-center bg-card p-4 overflow-hidden relative checkerboard-bg">
              {/* Checkerboard background for visibility of transparent areas */}
              <div
                className="w-[400px] h-[300px] shadow-2xl ring-1 ring-border relative bg-white"
                style={{
                  backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
                }}
              >
                <iframe
                  title="Target"
                  srcDoc={currentLevel.targetHTML}
                  sandbox="allow-scripts"
                  className="w-[400px] h-[300px] border-none bg-transparent absolute inset-0"
                />
              </div>
            </div>
          </div>

          {/* User Output */}
          <div className="flex-1 flex flex-col relative">
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-xs font-bold text-muted-foreground tracking-widest uppercase backdrop-blur-sm z-10 border border-white/10">
              Your Output
            </div>
            <div className="flex-1 flex items-center justify-center bg-card p-4 overflow-hidden relative checkerboard-bg">
              <div
                className="w-[400px] h-[300px] shadow-2xl ring-1 ring-border relative bg-white"
                style={{
                  backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
                }}
              >
                <iframe
                  title="Your Output"
                  srcDoc={userCode}
                  sandbox="allow-scripts"
                  className="w-[400px] h-[300px] border-none bg-transparent absolute inset-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN OFFSCREEN ELEMENTS FOR html-to-image CAPTURE */}
      <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none opacity-0">
        <div ref={hiddenTargetRef} className="w-[400px] h-[300px] overflow-hidden bg-white">
          <iframe srcDoc={currentLevel.targetHTML} className="w-[400px] h-[300px] border-none" />
        </div>
        <div ref={hiddenOutputRef} className="w-[400px] h-[300px] overflow-hidden bg-white">
          <iframe srcDoc={userCode} className="w-[400px] h-[300px] border-none" />
        </div>
      </div>
    </div>
  );
}
