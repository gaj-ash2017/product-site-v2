const fs = require("fs");
const path = require("path");

// Go up one folder from js/ to public/
const filePath = path.join(__dirname, "..", "..", "products.json");

fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    return console.error("❌ Failed to read file:", err);
  }

  let products;
  try {
    products = JSON.parse(data);
  } catch (err) {
    return console.error("❌ Failed to parse JSON:", err);
  }

  const updated = products.map((p) => {
    if (!p.lastUpdated) {
      return { ...p, lastUpdated: new Date().toISOString() };
    }
    return p;
  });

  fs.writeFile(filePath, JSON.stringify(updated, null, 2), (err) => {
    if (err) {
      return console.error("❌ Failed to write file:", err);
    }
    console.log(`✅ Patched ${updated.length} records with lastUpdated timestamp.`);
  });
});