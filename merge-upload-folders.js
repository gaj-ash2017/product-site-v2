const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "uploads");
const targetDir = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(sourceDir)) {
  console.log("❌ No root uploads/ folder found.");
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log("📂 Created public/uploads/");
}

const sourceFiles = fs.readdirSync(sourceDir);
let moved = 0;
let skipped = 0;

sourceFiles.forEach((file) => {
  const srcPath = path.join(sourceDir, file);
  const destPath = path.join(targetDir, file);

  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied: ${file}`);
    moved++;
  } else {
    console.log(`⚠️ Skipped (already exists): ${file}`);
    skipped++;
  }
});

console.log(`\n🎉 Merge complete:`);
console.log(`🟢 ${moved} files copied.`);
console.log(`🟡 ${skipped} files skipped.`);