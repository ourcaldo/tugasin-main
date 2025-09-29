// Simple icon generator for PWA icons using Canvas API
export function generateIcon(size: number): string {
  if (typeof document === 'undefined') {
    // Server-side fallback
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#2563eb"/>
        <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial, sans-serif" font-size="${size/3}" font-weight="bold" text-anchor="middle" fill="white">T</text>
      </svg>
    `)}`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background circle
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();

  // Letter T
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size / 3}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);

  // Small accent dot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(size * 0.75, size * 0.75, size * 0.05, 0, 2 * Math.PI);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

export function createIconFiles() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const icons: { [key: string]: string } = {};
  
  sizes.forEach(size => {
    icons[`icon-${size}x${size}.png`] = generateIcon(size);
  });
  
  return icons;
}