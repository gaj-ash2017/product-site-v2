const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "products.json");
let cleaned = 0;

try {
  let products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  products.forEach((p) => {
    if (p.image) {
      const original = p.image;
      const clean = original.replace(/['"“”]+/g, "").trim();
      if (clean !== original) {
        p.image = clean;
        cleaned++;
      }
    }

    if (p.imagePath) {
      const filename = p.imagePath.split("/").pop().replace(/['"“”]+/g, "").trim();
      p.imagePath = `/uploads/${filename}`;
    }

    if (p.sourcePath) {
      const filename = p.sourcePath.split("/").pop().replace(/['"“”]+/g, "").trim();
      p.sourcePath = `/uploads/${filename}`; // We're standardizing it now
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
  console.log(`✅ Cleaned ${cleaned} malformed image filename(s).`);

} catch (err) {
  console.error("❌ Failed to sanitize image names:", err);
}