const fs = require("fs");
const path = require("path");

const productsFile = path.join(__dirname, "products.json");

fs.readFile(productsFile, "utf-8", (err, data) => {
  if (err) return console.error("❌ Failed to read products.json", err);

  let products = JSON.parse(data);
  let updated = 0;

  products.forEach((p) => {
    if (p.image && p.image.toLowerCase().endsWith(".jpeg")) {
      p.image = p.image.replace(/\.jpeg$/i, ".jpg");
      updated++;
    }
    if (p.imagePath && p.imagePath.toLowerCase().endsWith(".jpeg")) {
      p.imagePath = p.imagePath.replace(/\.jpeg$/i, ".jpg");
    }
    if (p.sourcePath && p.sourcePath.toLowerCase().endsWith(".jpeg")) {
      p.sourcePath = p.sourcePath.replace(/\.jpeg$/i, ".jpg");
    }
  });

  fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
    if (err) return console.error("❌ Failed to update products.json", err);
    console.log(`✅ Patched ${updated} product(s) with .jpg image extensions.`);
  });
});