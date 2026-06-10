# CSS Battle — Project Documentation

## What is it?

A browser-based coding game where players write HTML and CSS to replicate a target image as accurately as possible. The game scores your attempt using pixel-by-pixel comparison and gives you a match percentage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (via Vite) |
| Language | TypeScript |
| Styling (app UI) | Inline styles — Qoder-inspired dark theme (black + green) |
| Code Editor | `@monaco-editor/react` — the same engine that powers VS Code |
| Image Capture | `html-to-image` — renders DOM nodes to PNG data URLs |
| Pixel Comparison | `pixelmatch` — pixel-by-pixel image diff algorithm |
| Notifications | shadcn/ui `useToast` hook |
| Build Tool | Vite 7 |
| Package Manager | pnpm (monorepo workspace) |
| Font | JetBrains Mono (Google Fonts) |

---

## Project Structure

```
artifacts/css-battle/
├── src/
│   ├── data/
│   │   └── levels.ts          # All 13 level definitions
│   ├── pages/
│   │   └── Battle.tsx         # Main game page (entire game logic + UI)
│   ├── components/ui/         # shadcn/ui primitives (button, toast, etc.)
│   ├── hooks/
│   │   └── use-toast.ts       # Toast notification hook
│   ├── App.tsx                # Router — mounts Battle at "/"
│   └── index.css              # Global font + CSS variable theme
├── index.html
├── vite.config.ts
└── package.json
```

---

## Features

### Game Mechanics
- **Live preview** — the output iframe re-renders in real time as you type in the editor
- **Pixel scoring** — clicking Submit captures both the target and your output as images, then uses `pixelmatch` to count differing pixels and compute a match percentage
- **Score feedback** — a toast notification appears after scoring with a contextual message (Perfect / So Close / Decent / Keep Trying)

### Editor
- **Monaco editor** — full VS Code editor with HTML/CSS syntax highlighting, bracket pair colorisation, smooth scrolling, and JetBrains Mono font
- **Structured boilerplate** — every level starts with a proper `<!DOCTYPE html>` template including `<head><style>` for CSS and `<body>` for HTML, pre-wired with the correct canvas dimensions (400×300 px)
- **Live binding** — editor `onChange` updates React state which feeds directly into the output iframe's `srcDoc`

### UI
- **Split-screen layout** — editor on the left, Target + Your Output panels stacked on the right
- **Score ring** — animated SVG ring in the header fills up as your score increases; colour shifts green / yellow / red
- **Score bar** — a 2px progress bar under the header animates to your score percentage on every submit
- **Output border glow** — the output panel border glows in the score colour after submitting
- **Level dropdown** — custom dropdown groups all 13 levels by difficulty with a coloured left-border active indicator

### Levels (13 total)

| # | Title | Difficulty | What to build |
|---|---|---|---|
| 1 | Centered Square | Easy | Red square perfectly centred |
| 2 | Blue Circle | Easy | Blue circle on a light background |
| 3 | Bullseye | Medium | Three concentric circles (red/white/red) |
| 4 | French Flag | Easy | Three vertical colour bands |
| 5 | Sunset Gradient | Medium | Multi-stop vertical gradient (night to gold) |
| 6 | Olympic Rings | Hard | Five overlapping coloured ring outlines |
| 7 | Neon Cross | Medium | Glowing magenta cross on black |
| 8 | Chessboard | Hard | 8×6 alternating grid using CSS Grid |
| 9 | Pill Stack | Medium | Four decreasing-width rounded pills |
| 10 | Rotating Diamonds | Hard | Three nested rotated squares with border |
| 11 | Loading Spinner | Hard | Half-coloured circle border (spinner shape) |
| 12 | Japanese Flag | Easy | White background with centred red circle |
| 13 | Gradient Cards | Hard | Three gradient cards with coloured glows |

---

## How Scoring Works

1. User clicks **Submit**
2. Both the Target HTML and the user's code are rendered in hidden off-screen `<div>` containers (positioned at -9999px), each exactly 400×300 px
3. `html-to-image`'s `toPng()` captures each container as a PNG data URL
4. Both PNGs are drawn onto `<canvas>` elements to extract raw pixel data (`ImageData`)
5. `pixelmatch` compares the two pixel arrays with a threshold of `0.1` (slight colour tolerance) and returns the number of differing pixels
6. Score = `((400 × 300 − diffPixels) / (400 × 300)) × 100`

> **Why hidden divs instead of the visible iframes?**  
> `html-to-image` cannot capture sandboxed iframes due to browser security restrictions. The hidden divs render the same HTML outside of a sandboxed context, making capture possible.

---

## Colour Palette (Qoder-inspired theme)

| Role | Value |
|---|---|
| Page background | `#0a0a0a` |
| Panel / header background | `#0d0d0d` |
| Borders | `#1a1a1a` |
| Primary accent (green) | `#22c55e` |
| Green hover | `#16a34a` |
| Body text | `#e5e5e5` |
| Dim text | `#555` |
| Easy badge | `#22c55e` |
| Medium badge | `#eab308` |
| Hard badge | `#ef4444` |

---

## Running Locally

```bash
# From the workspace root
pnpm --filter @workspace/css-battle run dev
```

The app starts on the port assigned by the workflow.

---

## Key Design Decisions

- **400×300 px fixed canvas** — both iframes and capture containers are hard-coded to this size so pixel comparison is always 1:1 with no scaling artefacts
- **No backend** — all levels are hardcoded in `src/data/levels.ts`; no database or API calls are made
- **Sandboxed iframes** — the visible output iframes use `sandbox="allow-scripts"` to prevent the user's code from accessing the parent page
- **Off-screen capture divs** — a separate set of unsandboxed hidden divs mirror the same HTML for `html-to-image` capture (sandboxed iframes cannot be screenshotted by the library)
- **Inline styles for app UI** — avoids Tailwind class bleed into the iframes and gives precise control over the Qoder colour scheme
