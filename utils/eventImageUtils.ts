/**
 * Generates a default purple image for events without a cover image.
 * Uses the standard "Inicio" purple color.
 * 
 * @returns A data URL representing the generated image.
 */
export const generateDefaultEventImage = (): string => {
  const width = 800;
  const height = 400;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 1. Background (Standard NovaGob "Inicio" Purple/Indigo)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#6366f1'); // Indigo 500
  gradient.addColorStop(1, '#9333ea'); // Purple 600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 2. Subtle pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width + height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - height, height);
    ctx.stroke();
  }

  // 3. Icon (Simplified Calendar/Event icon)
  const iconSize = 80;
  const centerX = width / 2;
  const centerY = height / 2 - 30;
  
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 20;
  
  // Draw simplified calendar icon
  const x = centerX - iconSize / 2;
  const y = centerY - iconSize / 2;
  const r = 12; // corner radius
  
  // Main body
  roundRect(ctx, x, y, iconSize, iconSize, r);
  ctx.fill();
  
  // Header of calendar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  roundRect(ctx, x, y, iconSize, 25, { tl: r, tr: r, bl: 0, br: 0 });
  ctx.fill();
  
  // "Dots" or "Lines" in calendar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.arc(x + 20 + i * 20, y + 40 + j * 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Text (Always "EVENTO")
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';
  ctx.fillText('EVENTO', centerX, centerY + iconSize / 2 + 70);
  
  return canvas.toDataURL('image/jpeg', 0.8);
};

// Helper to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl: number; tr: number; bl: number; br: number }
) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, bl: radius, br: radius };
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}
