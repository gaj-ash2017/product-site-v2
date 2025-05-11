const fs = require("fs");
const path = require("path");

const productsFile = path.join(__dirname, "products.json");

fs.readFile(productsFile, "utf-8", (err, data) => {
  if (err) return console.error("❌ Failed to read products.json");

  let products = JSON.parse(data);
  const now = new Date().toISOString();

  products = products.map((p) => ({
    ...p,
    dateAdded: p.dateAdded || now,
  }));

  fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
    if (err) return console.error("❌ Failed to write products.json");
    console.log("✅ dateAdded backfilled successfully to all products.");
  });
});
