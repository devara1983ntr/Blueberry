
const sharp = require('sharp');
const path = require('path');

const inputLogo = path.join(__dirname, '../src/assets/Blueberry.jpg');
const outputDir = path.join(__dirname, '../src/assets/generated');

// Create output directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Generate different logo sizes
sharp(inputLogo)
    .resize(128, 128)
    .toFile(path.join(outputDir, 'logo-small.png'));

sharp(inputLogo)
    .resize(256, 256)
    .toFile(path.join(outputDir, 'logo-medium.png'));

sharp(inputLogo)
    .resize(512, 512)
    .toFile(path.join(outputDir, 'logo-large.png'));

// Generate favicon
sharp(inputLogo)
    .resize(32, 32)
    .toFile(path.join(outputDir, 'favicon.ico'));

console.log('Asset generation complete.');
