const fs = require("fs"); // Import the file system module for reading and writing files
const path = require("path"); // Import the path module for handling file paths

// Define the path to the products.json file
const productsFile = path.join(__dirname, "products.json");

// Read the products.json file asynchronously
fs.readFile(productsFile, "utf8", (err, data) => {
  // Handle any errors that occur during file reading
  if (err) return console.error("❌ Failed to read products.json", err);

  let products;
  try {
    // Parse the JSON data from the file
    products = JSON.parse(data);
  } catch (e) {
    // Handle any errors that occur during JSON parsing
    return console.error("❌ Invalid JSON in products.json");
  }

  let updated = 0; // Initialize a counter for the number of updated products

  // Iterate over each product in the array
  products.forEach((p) => {
    // Define a helper function to replace .jpeg with .jpg in a string
    const fixExt = (str) =>
      str?.endsWith(".jpeg") ? str.replace(/\.jpeg$/i, ".jpg") : str;

    const original = { ...p }; // Create a shallow copy of the original product

    // Update the image-related properties using the helper function
    p.image = fixExt(p.image);
    p.imagePath = fixExt(p.imagePath);
    p.sourcePath = fixExt(p.sourcePath);

    // Check if any of the properties were changed and increment the counter if so
    if (
      p.image !== original.image ||
      p.imagePath !== original.imagePath ||
      p.sourcePath !== original.sourcePath
    ) {
      updated++;
    }
  });

  // Write the updated products array back to the products.json file
  fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
    // Handle any errors that occur during file writing
    if (err) return console.error("❌ Failed to save products.json", err);
    // Log the number of products that were updated
    console.log(`✅ Patched ${updated} products to use .jpg extension.`);
  });
});