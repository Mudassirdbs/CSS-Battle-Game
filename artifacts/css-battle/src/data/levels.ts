export interface Level {
  id: number;
  title: string;
  targetHTML: string;
  startingCode: string;
}

export const levels: Level[] = [
  {
    id: 1,
    title: "Centered Square",
    targetHTML: `<!DOCTYPE html><html><body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;width:400px;height:300px;"><div style="width:100px;height:100px;background:#e74c3c;"></div></body></html>`,
    startingCode: `<!DOCTYPE html>
<html>
<body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;width:400px;height:300px;">
  <!-- Your code here -->
</body>
</html>`,
  },
  {
    id: 2,
    title: "Blue Circle",
    targetHTML: `<!DOCTYPE html><html><body style="margin:0;background:#f0f4f8;display:flex;align-items:center;justify-content:center;width:400px;height:300px;"><div style="width:120px;height:120px;background:#3498db;border-radius:50%;"></div></body></html>`,
    startingCode: `<!DOCTYPE html>
<html>
<body style="margin:0;background:#f0f4f8;display:flex;align-items:center;justify-content:center;width:400px;height:300px;">
  <!-- Your code here -->
</body>
</html>`,
  },
];
