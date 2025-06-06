const fs = require("fs");
const path = require("path");

const productsFile = path.resolve(__dirname, "../../products.json");

fs.readFile(productsFile, "utf-8", (err, data) => {
  if (err) return console.error("❌ Failed to read products.json:", err);

  let products;
  try {
    products = JSON.parse(data);
  } catch (parseErr) {
    return console.error("❌ Failed to parse JSON:", parseErr);
  }

  let updatedCount = 0;

  const patched = products.map((product) => {
    if (!product.mainCategory || !product.subCategory) {
      product.mainCategory = product.mainCategory || "Uncategorized";
      product.subCategory = product.subCategory || "Uncategorized";
      updatedCount++;
    }
    return product;
  });

  fs.writeFile(productsFile, JSON.stringify(patched, null, 2), (err) => {
    if (err) return console.error("❌ Failed to write products.json:", err);
    console.log(`✅ Patched ${updatedCount} products with missing fields.`);
  });
});