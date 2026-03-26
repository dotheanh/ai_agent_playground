const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'renderer', 'assets');
const destDir = path.join(__dirname, '..', 'dist-renderer', 'assets');

// Create dest dir if not exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all files from src/renderer/assets to dist-renderer/assets
const files = fs.readdirSync(srcDir);
files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);

  // Skip .gitkeep etc
  if (fs.statSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied: ${file}`);
  }
});

console.log('Assets copied successfully!');
