/**
 * Generates PWA icon PNGs from an SVG template.
 * Run: node scripts/generate-icons.mjs
 *
 * Uses a canvas-free approach — writes SVG files that browsers render as PNGs
 * via the manifest. For true PNG generation, install `sharp` and uncomment below.
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

function createIconSvg(size) {
  const radius = Math.round(size * 0.16);
  const fontSize = Math.round(size * 0.6);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0a0a0a"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-size="${fontSize}" font-family="sans-serif" fill="#f5f0e8">ক</text>
</svg>`;
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = createIconSvg(size);
  const path = join(publicDir, `icon-${size}.svg`);
  writeFileSync(path, svg);
  console.log(`Generated ${path}`);
}

console.log(
  '\nSVG icons generated. For PNG conversion, run through an image tool or install sharp.',
);
console.log('Most browsers accept SVG icons in the manifest — update manifest.ts if needed.');
