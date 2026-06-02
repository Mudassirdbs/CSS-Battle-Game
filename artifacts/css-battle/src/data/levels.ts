export interface Level {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  targetHTML: string;
  startingCode: string;
}

const boilerplate = (body: string, bg = "#fff") =>
  `<!DOCTYPE html><html><body style="margin:0;width:400px;height:300px;background:${bg};overflow:hidden;">${body}</body></html>`;

const starter = (bg = "#fff") =>
  `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body {\n      margin: 0;\n      width: 400px;\n      height: 300px;\n      background: ${bg};\n      overflow: hidden;\n    }\n\n    /* write your CSS here */\n  </style>\n</head>\n<body>\n  <!-- write your HTML here -->\n</body>\n</html>`;

export const levels: Level[] = [
  {
    id: 1,
    title: "Centered Square",
    difficulty: "Easy",
    targetHTML: boilerplate(
      `<div style="width:100px;height:100px;background:#e74c3c;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>`
    ),
    startingCode: starter(),
  },
  {
    id: 2,
    title: "Blue Circle",
    difficulty: "Easy",
    targetHTML: boilerplate(
      `<div style="width:120px;height:120px;background:#3498db;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>`,
      "#f0f4f8"
    ),
    startingCode: starter("#f0f4f8"),
  },
  {
    id: 3,
    title: "Bullseye",
    difficulty: "Medium",
    targetHTML: boilerplate(
      `<div style="width:160px;height:160px;background:#e74c3c;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;">
        <div style="width:100px;height:100px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <div style="width:48px;height:48px;background:#e74c3c;border-radius:50%;"></div>
        </div>
      </div>`,
      "#1a1a2e"
    ),
    startingCode: starter("#1a1a2e"),
  },
  {
    id: 4,
    title: "French Flag",
    difficulty: "Easy",
    targetHTML: boilerplate(
      `<div style="display:flex;width:400px;height:300px;">
        <div style="flex:1;background:#002395;"></div>
        <div style="flex:1;background:#fff;"></div>
        <div style="flex:1;background:#ED2939;"></div>
      </div>`
    ),
    startingCode: starter(),
  },
  {
    id: 5,
    title: "Sunset Gradient",
    difficulty: "Medium",
    targetHTML: boilerplate(
      `<div style="width:400px;height:300px;background:linear-gradient(180deg,#0f0c29,#302b63,#ff6b35 70%,#ffd700);"></div>`
    ),
    startingCode: starter(),
  },
  {
    id: 6,
    title: "Olympic Rings",
    difficulty: "Hard",
    targetHTML: boilerplate(
      `<div style="position:relative;width:400px;height:300px;background:#fff;">
        <div style="position:absolute;top:90px;left:40px;width:80px;height:80px;border:12px solid #0081C8;border-radius:50%;"></div>
        <div style="position:absolute;top:90px;left:120px;width:80px;height:80px;border:12px solid #FCB131;border-radius:50%;"></div>
        <div style="position:absolute;top:90px;left:200px;width:80px;height:80px;border:12px solid #000;border-radius:50%;"></div>
        <div style="position:absolute;top:90px;left:280px;width:80px;height:80px;border:12px solid #00A651;border-radius:50%;"></div>
        <div style="position:absolute;top:130px;left:160px;width:80px;height:80px;border:12px solid #EE334E;border-radius:50%;"></div>
      </div>`
    ),
    startingCode: starter(),
  },
  {
    id: 7,
    title: "Neon Cross",
    difficulty: "Medium",
    targetHTML: boilerplate(
      `<div style="position:relative;width:400px;height:300px;background:#0d0d0d;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:30px;background:#ff00ff;box-shadow:0 0 20px #ff00ff,0 0 40px #ff00ff;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:30px;height:200px;background:#ff00ff;box-shadow:0 0 20px #ff00ff,0 0 40px #ff00ff;"></div>
      </div>`,
      "#0d0d0d"
    ),
    startingCode: starter("#0d0d0d"),
  },
  {
    id: 8,
    title: "Chessboard",
    difficulty: "Hard",
    targetHTML: boilerplate(
      `<div style="width:400px;height:300px;background:#f0d9b5;display:grid;grid-template-columns:repeat(8,50px);grid-template-rows:repeat(6,50px);">
        ${Array.from({ length: 48 }, (_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const dark = (row + col) % 2 === 1;
          return `<div style="background:${dark ? "#b58863" : "#f0d9b5"};"></div>`;
        }).join("")}
      </div>`
    ),
    startingCode: starter("#f0d9b5"),
  },
  {
    id: 9,
    title: "Pill Stack",
    difficulty: "Medium",
    targetHTML: boilerplate(
      `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;gap:12px;align-items:center;">
        <div style="width:180px;height:36px;background:#e74c3c;border-radius:18px;"></div>
        <div style="width:140px;height:36px;background:#e67e22;border-radius:18px;"></div>
        <div style="width:100px;height:36px;background:#f1c40f;border-radius:18px;"></div>
        <div style="width:60px;height:36px;background:#2ecc71;border-radius:18px;"></div>
      </div>`,
      "#111"
    ),
    startingCode: starter("#111"),
  },
  {
    id: 10,
    title: "Rotating Diamonds",
    difficulty: "Hard",
    targetHTML: boilerplate(
      `<div style="position:relative;width:400px;height:300px;background:#1a0533;">
        <div style="position:absolute;top:50%;left:50%;width:120px;height:120px;background:#9b59b6;transform:translate(-50%,-50%) rotate(45deg);"></div>
        <div style="position:absolute;top:50%;left:50%;width:80px;height:80px;background:#8e44ad;transform:translate(-50%,-50%) rotate(45deg);border:6px solid #e056fd;"></div>
        <div style="position:absolute;top:50%;left:50%;width:30px;height:30px;background:#e056fd;transform:translate(-50%,-50%) rotate(45deg);"></div>
      </div>`,
      "#1a0533"
    ),
    startingCode: starter("#1a0533"),
  },
  {
    id: 11,
    title: "Loading Spinner",
    difficulty: "Hard",
    targetHTML: boilerplate(
      `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div style="width:100px;height:100px;border-radius:50%;border:12px solid #2c2c2c;border-top:12px solid #00d2ff;border-right:12px solid #00d2ff;"></div>
      </div>`,
      "#0a0a0a"
    ),
    startingCode: starter("#0a0a0a"),
  },
  {
    id: 12,
    title: "Japanese Flag",
    difficulty: "Easy",
    targetHTML: boilerplate(
      `<div style="width:400px;height:300px;background:#fff;display:flex;align-items:center;justify-content:center;">
        <div style="width:150px;height:150px;background:#BC002D;border-radius:50%;"></div>
      </div>`
    ),
    startingCode: starter(),
  },
  {
    id: 13,
    title: "Gradient Cards",
    difficulty: "Hard",
    targetHTML: boilerplate(
      `<div style="position:absolute;inset:0;background:#13131a;display:flex;align-items:center;justify-content:center;gap:16px;">
        <div style="width:80px;height:120px;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);box-shadow:0 8px 32px rgba(102,126,234,0.4);"></div>
        <div style="width:80px;height:120px;border-radius:12px;background:linear-gradient(135deg,#f093fb,#f5576c);box-shadow:0 8px 32px rgba(245,87,108,0.4);margin-top:-20px;"></div>
        <div style="width:80px;height:120px;border-radius:12px;background:linear-gradient(135deg,#4facfe,#00f2fe);box-shadow:0 8px 32px rgba(79,172,254,0.4);"></div>
      </div>`,
      "#13131a"
    ),
    startingCode: starter("#13131a"),
  },
];
