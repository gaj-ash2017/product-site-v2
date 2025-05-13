// clear-categories.js
const fs = require("fs");
const path = require("path");

const productsFile = path.join(__dirname, "products.json");

fs.readFile(productsFile, "utf-8", (err, data) => {
  if (err) return console.error("❌ Failed to read products.json:", err);

  let products;
  try {
    products = JSON.parse(data);
  } catch (e) {
    return console.error("❌ Invalid JSON format:", e);
  }

  const updated = products.map((p) => ({ ...p, category: "Uncategorized" }));

  fs.writeFile(productsFile, JSON.stringify(updated, null, 2), (err) => {
    if (err) return console.error("❌ Failed to write updated file:", err);
    console.log("✅ All categories reset to 'Uncategorized'.");
  });
});
