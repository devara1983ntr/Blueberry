import sharp from 'sharp';
import fs from 'fs';

async function generateIcons() {
  const svgBuffer = fs.readFileSync('src/assets/logo.svg');

  // Generate 192x192 icon
  await sharp(svgBuffer)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
    })
    .png({ quality: 90 }) // optimize for web
    .toFile('icon-192.png');

  // Generate 512x512 icon
  await sharp(svgBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ quality: 90 })
    .toFile('icon-512.png');

  console.log('PWA icons generated successfully');
}

generateIcons();