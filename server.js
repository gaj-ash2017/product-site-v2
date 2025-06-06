const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");
const cors = require("cors");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
const { Parser } = require("json2csv");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// 🔧 Path Configuration
// ==========================
const root = __dirname;
const productsFile = path.join(root, "products.json");
const categoriesFile = path.join(root, "categories.json");
const mainCategoriesFile = path.join(__dirname, "data", "categories-main.json");
const subCategoriesFile = path.join(__dirname, "data", "categories-sub.json");
const tmpDir = path.join(root, "tmp");
const uploadsDir = path.join(root, "public", "uploads");
const archiveDir = path.join(root, "public", "archive-images"); // ✅ New archive path

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir); // ✅ Ensure archive-images exists
}

// Ensure tmp/ exists
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// ==========================
// 📦 Multer Configuration
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads")); // ✅ consistent path
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const stock = req.body.stockCode?.trim().replace(/\s+/g, "_") || "unnamed";
    cb(null, `${stock}${ext}`);
  },
});

const imageUpload = multer({ storage });
const csvUpload = multer({ dest: tmpDir });

// ==========================
// 🧩 Middleware Setup
// ==========================
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(root, "public")));
app.use("/uploads", express.static(uploadsDir));
app.use("/data", express.static(path.join(root, "data")));

// ✅ You can now safely remove these:
// const upload = multer({ dest: "temp/" });
// const imageUpload = multer({ dest: path.join(...) }); // already defined above

// Helper to read/write JSON
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

//Step 4A: Define a disguise function

function generateMaskedCode(stockCode) {
  const map = {
    A: "M",
    B: "N",
    C: "B",
    D: "V",
    E: "A",
    F: "K",
    G: "L",
    H: "Z",
    I: "X",
    J: "C",
    K: "D",
    L: "E",
    M: "R",
    N: "T",
    O: "Y",
    P: "U",
    Q: "I",
    R: "O",
    S: "P",
    T: "Q",
    U: "W",
    V: "S",
    W: "G",
    X: "H",
    Y: "J",
    Z: "F",
    0: "9",
    1: "8",
    2: "7",
    3: "6",
    4: "5",
    5: "4",
    6: "3",
    7: "2",
    8: "1",
    9: "0",
  };

  return stockCode
    .toUpperCase()
    .split("")
    .map((ch) => map[ch] || ch)
    .join("");
}

// === PRODUCTS ===
app.get("/products.json", (req, res) => {
  res.sendFile(productsFile);
});

app.post("/add-product", imageUpload.single("imageFile"), async (req, res) => {
  const productsFile = path.join(__dirname, "products.json");
  let products = [];

  try {
    const data = fs.readFileSync(productsFile, "utf-8");
    products = JSON.parse(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load products" });
  }

  const {
    stockCode,
    name,
    description,
    category,
    mainCategory,
    subCategory,
    extraNotes,
    quantity,
  } = req.body;

  let image = "default.jpg";
  let imagePath = "/uploads/default.jpg";
  let sourcePath = "/uploads/default.jpg";

  if (req.file) {
    const ext = ".jpg"; // ✅ force jpg extension
    const safeCode = stockCode.trim().replace(/\s+/g, "_");
    const finalName = `${safeCode}${ext}`;
    const finalPath = path.join(__dirname, "public/uploads", finalName);

    try {
      await sharp(req.file.path).jpeg({ quality: 80 }).toFile(finalPath);

      fs.unlinkSync(req.file.path); // delete temp file

      image = finalName;
      imagePath = `/uploads/${image}`;
      sourcePath = `/uploads/${image}`;
    } catch (err) {
      console.error("❌ Sharp failed to convert image:", err);
    }
  }

  const cleanedCode = stockCode.trim();
  const newProduct = {
    stockCode: cleanedCode,
    maskedCode: generateMaskedCode(cleanedCode),
    name: name.trim(),
    description: description.trim(),
    category: category.trim(),
    mainCategory: mainCategory?.trim() || "Uncategorized",
    subCategory: subCategory?.trim() || "Uncategorized",
    extraNotes: extraNotes.trim(),
    quantity: parseInt(quantity) || 0,
    image,
    imagePath,
    sourcePath,
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  fs.readFile(productsFile, "utf-8", (err, data) => {
    let products = [];
    if (!err && data) {
      try {
        products = JSON.parse(data);
      } catch {
        return res.status(500).send("❌ Error parsing products.json");
      }
    }

    const exists = products.find((p) => p.stockCode === newProduct.stockCode);
    if (exists) return res.status(400).send("❌ Product already exists.");

    const existing = products.find((p) => p.stockCode === newProduct.stockCode);
    if (existing) {
      return res.status(400).json({ error: "Stock code already exists!" });
    }

    products.push(newProduct);
    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("❌ Failed to save product.");
      res.json({ message: "✅ Product added successfully!" });
    });
  });
});

// edit product route
/* const multer = require("multer");
const upload = multer({ dest: "uploads/" }); */

// ✅ BACKEND: server.js

app.post("/edit-product", imageUpload.single("imageFile"), async (req, res) => {
  const {
    stockCode,
    name,
    description,
    category,
    mainCategory,
    subCategory,
    extraNotes,
    quantity,
  } = req.body;

  if (!stockCode) {
    return res.status(400).json({ error: "Missing stock code" });
  }

  try {
    const data = fs.readFileSync(productsFile, "utf-8");
    const products = JSON.parse(data);
    const productIndex = products.findIndex(
      (p) => p.stockCode === stockCode.trim()
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found." });
    }

    let image = products[productIndex].image || "default.jpg";
    let imagePath = products[productIndex].imagePath || "/uploads/default.jpg";
    let sourcePath =
      products[productIndex].sourcePath || "/uploads/default.jpg";

    // ✅ If a new image is uploaded, convert & assign properly
    if (req.file) {
      const ext = ".jpg";
      const safeCode = stockCode.trim().replace(/\s+/g, "_");
      const finalName = `${safeCode}${ext}`;
      const finalPath = path.join(uploadsDir, finalName);
      const archiveDir = path.join(root, "public", "archive-images");

      // 🟡 Archive current image only ONCE
      const originalImage = products[productIndex].image || "default.jpg";
      const originalImagePath = path.join(uploadsDir, originalImage);
      const timestamp = new Date()
        .toISOString()
        .replace(/[:T]/g, "-")
        .slice(0, 16); // YYYY-MM-DD_HH-MM
      const archiveName = `${safeCode}__${timestamp}.jpg`;
      const archivePath = path.join(archiveDir, archiveName);

      if (
        originalImage !== "default.jpg" &&
        fs.existsSync(originalImagePath) &&
        !fs.existsSync(archivePath)
      ) {
        fs.copyFileSync(originalImagePath, archivePath);

        // Log the archived file
        const logPath = path.join(root, "logs", "image-archive-log.txt");
        const logEntry = `--- ${new Date().toLocaleString()} ---\nArchived: ${archiveName}\n\n`;
        fs.appendFileSync(logPath, logEntry, "utf-8");
      }

      // 🔄 Replace image with new .jpg version
      try {
        await sharp(req.file.path).jpeg({ quality: 80 }).toFile(finalPath);

        fs.unlinkSync(req.file.path);
        image = finalName;
        imagePath = `/uploads/${finalName}`;
        sourcePath = `/uploads/${finalName}`;
      } catch (err) {
        console.error("❌ Sharp failed in edit-product:", err);
      }
    }

    // ✅ Update product fields
    products[productIndex] = {
      ...products[productIndex],
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      mainCategory: mainCategory?.trim() || "Uncategorized",
      subCategory: subCategory?.trim() || "Uncategorized",
      extraNotes: extraNotes.trim(),
      quantity: parseInt(quantity) || 0,
      image,
      imagePath,
      sourcePath,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    res.json({ message: "✅ Product updated." });
  } catch (err) {
    console.error("❌ Error saving product:", err);
    res.status(500).json({ error: "Failed to update product." });
  }
});

app.post("/delete-product", (req, res) => {
  const stockCode = req.body.stockCode;

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading products file");
    let products = JSON.parse(data);
    const product = products.find((p) => p.stockCode === stockCode);
    if (!product) return res.status(404).send("Product not found");

    const image = product.image;
    products = products.filter((p) => p.stockCode !== stockCode);

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to delete product");

      const imgPath = path.join(__dirname, "public/uploads", image);
      if (image !== "default.jpg" && fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }

      res.send("✅ Product deleted.");
    });
  });
});

// === CATEGORY ROUTES ===
app.get("/categories", (req, res) => {
  fs.readFile(categoriesFile, "utf-8", (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data));
  });
});

// === SORT PRODUCTS.JSON

// ✅ Permanently sort products.json by stockCode
app.post("/sort-products", (req, res) => {
  const filePath = path.join(__dirname, "products.json");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) return res.status(500).send("❌ Error reading products.json");

    let products = [];
    try {
      products = JSON.parse(data);
    } catch {
      return res.status(500).send("❌ Invalid JSON format in products.json");
    }

    products.sort((a, b) => {
      const codeA = a.stockCode?.toUpperCase() || "";
      const codeB = b.stockCode?.toUpperCase() || "";
      return codeA.localeCompare(codeB);
    });

    fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
      if (err)
        return res.status(500).send("❌ Failed to write sorted products");
      res.send("✅ Products successfully sorted by stockCode and saved.");
    });
  });
});

app.post("/add-category", (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).send("No category provided");

  fs.readFile(categoriesFile, "utf-8", (err, data) => {
    let categories = [];
    if (!err && data) categories = JSON.parse(data);

    if (categories.includes(category))
      return res.status(400).send("Category exists");

    categories.push(category);
    fs.writeFile(categoriesFile, JSON.stringify(categories, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to add category");
      res.send("✅ Category added!");
    });
  });
});

app.post("/edit-category", (req, res) => {
  const { oldCategory, newCategory } = req.body;
  if (!oldCategory || !newCategory)
    return res.status(400).send("Missing category data");

  fs.readFile(categoriesFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading categories");
    let categories = JSON.parse(data);

    const index = categories.indexOf(oldCategory);
    if (index === -1) return res.status(404).send("Category not found");

    categories[index] = newCategory;

    fs.writeFile(categoriesFile, JSON.stringify(categories, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to update category");
      res.send("✅ Category updated.");
    });
  });
});

app.post("/delete-category", (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).send("⚠️ No category name provided.");

  const categoriesPath = path.join(__dirname, "categories.json");

  fs.readFile(categoriesPath, "utf-8", (err, catData) => {
    if (err) return res.status(500).send("Error reading categories.");

    let categories = JSON.parse(catData);
    if (!categories.includes(category))
      return res.status(404).send("⚠️ Category not found.");

    categories = categories.filter((c) => c !== category);

    fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to delete category.");

      fs.readFile(productsFile, "utf-8", (err, prodData) => {
        if (err) return res.status(500).send("Error reading products.");

        let products = JSON.parse(prodData);
        let updated = false;

        products = products.map((p) => {
          if (p.category === category) {
            p.category = "Uncategorized";
            updated = true;
          }
          return p;
        });

        if (updated) {
          fs.writeFile(
            productsFile,
            JSON.stringify(products, null, 2),
            (err) => {
              if (err)
                return res
                  .status(500)
                  .send("Failed to update product categories.");
              res.send(
                "✅ Category deleted and products updated to 'Uncategorized'."
              );
            }
          );
        } else {
          res.send("✅ Category deleted. No products needed updating.");
        }
      });
    });
  });
});

app.get("/categories.json", (req, res) => {
  res.sendFile(path.join(__dirname, "categories.json"));
});

// === CLEANUP UNUSED IMAGES ===
app.post("/cleanup-unused-images", (req, res) => {
  const uploadsDir = path.join(__dirname, "public", "uploads");
  const products = JSON.parse(fs.readFileSync("products.json"));
  const usedImages = new Set(products.map((p) => p.image).filter(Boolean));

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res
        .status(500)
        .json({ error: "Failed to read uploads directory" });
    }

    const deleted = [];

    files.forEach((file) => {
      if (file === "default.jpg") return;
      if (!usedImages.has(file)) {
        fs.unlinkSync(path.join(uploadsDir, file));
        deleted.push(file);
      }
    });

    // ✅ Save cleanup timestamp
    fs.writeFileSync(
      path.join(__dirname, "logs", "last-cleanup.txt"),
      new Date().toLocaleString()
    );

    res.json({ success: true, deleted });
  });
});

// === IMPORT STOCKS CSV ===
app.post("/import-csv", csvUpload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("⚠️ No CSV file uploaded.");
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const productsFile = path.join(__dirname, "products.json");

      fs.readFile(productsFile, "utf-8", (err, data) => {
        let existingProducts = [];
        if (!err && data) {
          try {
            existingProducts = JSON.parse(data);
          } catch {
            return res.status(500).send("❌ Error parsing products.json");
          }
        }

        const existingStockCodes = new Set(
          existingProducts.map((p) => p.stockCode)
        );
        const newProducts = results
          .filter((p) => p.stockCode && !existingStockCodes.has(p.stockCode))
          .map((p) => ({
            stockCode: p.stockCode?.trim(),
            name: p.name?.trim() || "Unnamed",
            description: p.description?.trim() || "",
            category: p.category?.trim() || "Uncategorized",
            extraNotes: p.extraNotes?.trim() || "",
            quantity: parseInt(p.quantity) || 0,
            image: "default.jpg",
            dateAdded: new Date().toISOString(),
          }));

        const merged = [...existingProducts, ...newProducts];

        // Backup before write
        const backupPath = productsFile + ".bak";
        fs.copyFileSync(productsFile, backupPath);

        fs.writeFile(productsFile, JSON.stringify(merged, null, 2), (err) => {
          fs.unlinkSync(req.file.path); // Clean up temp file
          if (err) {
            console.error("❌ Failed to save merged products.json", err);
            return res.status(500).send("Failed to save product data.");
          }

          res.send(
            `✅ Imported ${newProducts.length} new products. 📦 Total in system: ${merged.length}`
          );
        });
      });
    })
    .on("error", (err) => {
      console.error("❌ Error parsing CSV:", err);
      res.status(500).send("Error parsing CSV.");
    });
});

app.post("/submit-contact", (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).send("❌ Missing fields.");
  }

  const contactPath = path.join(__dirname, "messages.json");
  const newEntry = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    date: new Date().toISOString(),
  };

  fs.readFile(contactPath, "utf-8", (err, data) => {
    let messages = [];
    if (!err && data) {
      try {
        messages = JSON.parse(data);
      } catch {
        return res.status(500).send("❌ Error parsing messages.json");
      }
    }

    messages.push(newEntry);
    fs.writeFile(contactPath, JSON.stringify(messages, null, 2), (err) => {
      if (err) return res.status(500).send("❌ Failed to save message.");
      res.send("✅ Message received! Thank you.");
    });
  });
});

app.get("/messages.json", (req, res) => {
  res.sendFile(path.join(__dirname, "messages.json"));
});

// === CLEANUP UNUSED STOCK CODES ===

// Utility: Load and save products
function loadProducts() {
  try {
    const data = fs.readFileSync(productsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

// 1. Get products with invalid/empty/malformed stock codes
app.get("/api/unused-stockcodes", (req, res) => {
  const products = loadProducts();
  const unused = products.filter(
    (p) =>
      !p.stockCode ||
      p.stockCode.trim() === "" ||
      /[^a-zA-Z0-9_-]/.test(p.stockCode)
  );
  res.json(unused);
});

// 2. Delete product by stock code
app.delete("/api/delete-product-by-stockcode/:code", (req, res) => {
  const stockCode = req.params.code.trim();
  let products = loadProducts();
  const product = products.find((p) => p.stockCode === stockCode);
  if (!product) return res.status(404).send("Product not found");

  products = products.filter((p) => p.stockCode !== stockCode);
  saveProducts(products);

  // Remove image if needed
  const img = product.image;
  const imgPath = path.join(__dirname, "public", "uploads", img);
  if (img && img !== "default.jpg" && fs.existsSync(imgPath)) {
    fs.unlinkSync(imgPath);
  }

  // ✅ Log the cleanup time
  fs.writeFileSync(
    path.join(__dirname, "logs", "last-cleanup.txt"),
    new Date().toLocaleString()
  );

  res.json({ success: true, deleted });
});

// 3. Bulk delete unused stock code entries
app.post("/api/cleanup-unused-stockcodes", (req, res) => {
  let products = loadProducts();
  const unused = products.filter(
    (p) =>
      !p.stockCode ||
      p.stockCode.trim() === "" ||
      /[^a-zA-Z0-9_-]/.test(p.stockCode)
  );
  const remaining = products.filter(
    (p) =>
      p.stockCode &&
      p.stockCode.trim() !== "" &&
      !/[^a-zA-Z0-9_-]/.test(p.stockCode)
  );

  saveProducts(remaining);

  // Delete their images
  const deleted = [];
  unused.forEach((p) => {
    if (p.image && p.image !== "default.jpg") {
      const imgPath = path.join(__dirname, "public", "uploads", p.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }
    deleted.push(p.stockCode || "(empty)");
  });

  // ✅ Always log a cleanup event, even if none found
  const logPath = path.join(__dirname, "logs", "deleted-stockcodes.txt");
  const timestamp = new Date().toLocaleString();
  const logEntry = `\n--- ${timestamp} ---\n${
    deleted.length ? deleted.join("\n") : "No stock codes were deleted ✅"
  }\n`;

  fs.appendFileSync(logPath, logEntry);

  res.json({
    success: true,
    deleted,
    message: deleted.length
      ? `${deleted.length} stock code(s) deleted.`
      : "No unused stock codes found ✅",
  });
});

// === SAVE CLEANUP LOG TO SERVER ===
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// === SAVE CLEANUP LOG TO LOGS FOLDER ===
// === SAVE CLEANUP LOG TO LOGS FOLDER ===
app.post("/api/save-cleanup-log", (req, res) => {
  console.log("🛠️ Log Request Hit");
  console.log("Payload received:", req.body);

  const { filename, items } = req.body;

  if (!filename || !Array.isArray(items)) {
    console.error("❌ Invalid log request:", { filename, items });
    return res.status(400).send("❌ Invalid filename or data.");
  }

  const safeName = filename.replace(/[^a-z0-9_-]/gi, "_") + ".txt";
  const logPath = path.join(__dirname, "logs", safeName);

  const timestamp = new Date().toLocaleString();
  const logEntry = `\n--- ${timestamp} ---\n${items.join("\n")}\n`;

  fs.appendFile(logPath, logEntry, (err) => {
    if (err) {
      console.error("❌ Failed to write log file:", err);
      return res.status(500).send("❌ Failed to save log.");
    }

    console.log(`✅ Log written: ${safeName}`);
    res.send(`✅ Log saved to logs/${safeName}`);
  });
});

// === GET /uploads - list all image files ===
app.get("/uploads", (req, res) => {
  const uploadsDir = path.join(__dirname, "public", "uploads");
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("❌ Failed to read uploads directory");
      return res
        .status(500)
        .json({ error: "Failed to read uploads directory" });
    }

    const junkFiles = [".DS_Store", "Thumbs.db", "desktop.ini"];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const cleanImages = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return !junkFiles.includes(file) && imageExtensions.includes(ext);
    });

    res.json(cleanImages);
  });
});
//LAST CLEANUP - START
app.get("/api/last-cleanup", (req, res) => {
  const logPath = path.join(__dirname, "logs", "last-cleanup.txt");

  if (!fs.existsSync(logPath)) {
    return res.json({ lastCleanup: null });
  }

  const timestamp = fs.readFileSync(logPath, "utf-8");
  res.json({ lastCleanup: timestamp });
});
// LAST CLEANUP - END

//Add a helper function in server.js:
function generateMaskedCode(stockCode) {
  if (!stockCode) return "";
  const map = {
    A: "Q",
    B: "W",
    C: "E",
    D: "R",
    E: "T",
    F: "Y",
    G: "U",
    H: "I",
    I: "O",
    J: "P",
    K: "A",
    L: "S",
    M: "D",
    N: "F",
    O: "G",
    P: "H",
    Q: "J",
    R: "K",
    S: "L",
    T: "Z",
    U: "X",
    V: "C",
    W: "V",
    X: "B",
    Y: "N",
    Z: "M",
    0: "9",
    1: "8",
    2: "7",
    3: "6",
    4: "5",
    5: "4",
    6: "3",
    7: "2",
    8: "1",
    9: "0",
    _: "-",
    "-": "_",
  };

  return stockCode
    .toUpperCase()
    .split("")
    .map((char) => map[char] || char)
    .join("");
}

//Step 4D: Retrofix maskedCode for existing products

app.all("/fix-masked-codes", (req, res) => {
  const products = loadProducts();
  let updated = false;

  products.forEach((p) => {
    if (!p.maskedCode && p.stockCode) {
      p.maskedCode = generateMaskedCode(p.stockCode);
      updated = true;
    }
  });

  if (updated) {
    saveProducts(products);
    return res.send("✅ All missing masked codes were added.");
  } else {
    return res.send("✅ All products already have masked codes.");
  }
});

// ✅ Serve logs/deleted-images.txt safely
app.get("/logs/deleted-images.txt", (req, res) => {
  const logPath = path.join(__dirname, "logs", "deleted-images.txt");
  if (!fs.existsSync(logPath)) return res.status(404).send("Log not found.");
  res.sendFile(logPath);
});

app.get("/logs/deleted-stockcodes.txt", (req, res) => {
  const logPath = path.join(__dirname, "logs", "deleted-stockcodes.txt");
  if (!fs.existsSync(logPath)) return res.status(404).send("Log not found.");
  res.sendFile(logPath);
});

// 🔄 Schedule cleanup to run every day at 3 AM
cron.schedule("0 16 * * *", () => {
  console.log("🧹 Scheduled daily image cleanup running...");

  const uploadsDir = path.join(__dirname, "public", "uploads");
  const products = loadProducts();
  const usedImages = new Set(products.map((p) => p.image).filter(Boolean));
  const deleted = [];

  fs.readdir(uploadsDir, (err, files) => {
    if (err) return console.error("❌ Failed to read uploads dir:", err);

    files.forEach((file) => {
      if (file === "default.jpg") return;
      if (!usedImages.has(file)) {
        fs.unlinkSync(path.join(uploadsDir, file));
        deleted.push(file);
      }
    });

    if (deleted.length > 0) {
      const timestamp = new Date().toLocaleString();
      const logEntry = `\n--- ${timestamp} ---\n${deleted.join("\n")}\n`;
      const logPath = path.join(__dirname, "logs", "deleted-images.txt");
      fs.appendFileSync(logPath, logEntry);
      console.log(`✅ ${deleted.length} images cleaned up`);
    } else {
      console.log("✅ No unused images found today.");
    }
  });
});

//Add a temporary route to server.js

app.post("/manual-image-cleanup", (req, res) => {
  const uploadsDir = path.join(__dirname, "public", "uploads");
  const products = loadProducts();
  const usedImages = new Set(products.map((p) => p.image).filter(Boolean));
  const deleted = [];

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("❌ Failed to read uploads directory:", err);
      return res.status(500).send("❌ Failed to read uploads directory.");
    }

    files.forEach((file) => {
      if (file === "default.jpg") return;
      if (!usedImages.has(file)) {
        fs.unlinkSync(path.join(uploadsDir, file));
        deleted.push(file);
      }
    });

    if (deleted.length > 0) {
      const timestamp = new Date().toLocaleString();
      const logEntry = `\n--- ${timestamp} ---\n${deleted.join("\n")}\n`;
      const logPath = path.join(__dirname, "logs", "deleted-images.txt");
      fs.appendFileSync(logPath, logEntry);
      console.log(`✅ Manual cleanup: ${deleted.length} images removed`);
    }

    res.send(`✅ Manual cleanup complete. ${deleted.length} image(s) deleted.`);
  });
});
// get message count
app.get("/messages/count", (req, res) => {
  const messagesPath = path.join(__dirname, "messages.json");

  if (!fs.existsSync(messagesPath)) {
    return res.json({ count: 0 });
  }

  const messages = JSON.parse(fs.readFileSync(messagesPath, "utf-8"));
  res.json({ count: messages.length });
});

//main categories and sub categories

// GET all main categories
// ✅ Load main categories as array of objects
const subCategoriesPath = path.join(__dirname, "data", "categories-sub.json");

app.get("/api/categories-sub/:main", (req, res) => {
  const main = req.params.main;
  fs.readFile(subCategoriesPath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Error reading sub-categories:", err);
      return res.status(500).json({ error: "Failed to load sub-categories" });
    }

    let subs;
    try {
      subs = JSON.parse(data);
    } catch (parseErr) {
      console.error("❌ Invalid JSON in categories-sub.json");
      return res.status(500).json({ error: "Invalid sub-categories data" });
    }

    // Filter sub-categories that match the main category
    const filtered = subs.filter((sub) => sub.mainCategory === main);
    res.json(filtered);
  });
});

// Route: GET /api/categories-sub
app.get("/api/categories-sub", (req, res) => {
  fs.readFile(subCategoriesFile, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Error reading sub-categories:", err);
      return res.status(500).json({ error: "Failed to load sub-categories" });
    }

    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch (e) {
      console.error("❌ Invalid JSON in categories-sub.json:", e);
      res.status(500).json({ error: "Invalid JSON in sub-categories" });
    }
  });
});

// POST to add a new main category
app.post("/api/categories-main", async (req, res) => {
  try {
    const { newMain } = req.body;
    if (!newMain)
      return res.status(400).json({ error: "Missing category name" });

    let mainCategories = JSON.parse(
      fs.readFileSync(mainCategoriesFile, "utf-8")
    );

    // Normalize entries to object format
    mainCategories = mainCategories.map((m) =>
      typeof m === "string" ? { name: m } : m
    );

    // Check for duplicates
    if (mainCategories.find((m) => m.name === newMain)) {
      return res.status(400).json({ error: "Category already exists" });
    }

    mainCategories.push({ name: newMain });

    fs.writeFileSync(
      mainCategoriesFile,
      JSON.stringify(mainCategories, null, 2)
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to add main category:", err);
    res.status(500).json({ error: "Failed to add main category" });
  }
});

// POST to add a subcategory to a main category
// POST a new subcategory
app.post("/api/categories-sub", (req, res) => {
  try {
    const { mainCategory, newSub } = req.body;
    if (!mainCategory || !newSub) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const subCategories = JSON.parse(
      fs.readFileSync(subCategoriesFile, "utf-8")
    );

    // Check if sub already exists
    const exists = subCategories.find(
      (s) => s.name === newSub && s.mainCategory === mainCategory
    );
    if (exists) {
      return res.status(400).json({ error: "Sub-category already exists" });
    }

    const newEntry = {
      id: Date.now().toString(),
      name: newSub,
      mainCategory,
    };

    subCategories.push(newEntry);
    fs.writeFileSync(subCategoriesFile, JSON.stringify(subCategories, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to add sub-category:", err);
    res.status(500).json({ error: "Failed to add sub-category" });
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// update current itmes with main cat and sub cat

app.post("/api/update-product-category", express.json(), (req, res) => {
  const { stockCode, mainCategory, subCategory } = req.body;
  if (!stockCode || !mainCategory || !subCategory) {
    return res.status(400).send("Missing data.");
  }

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Failed to read products.");

    let products;
    try {
      products = JSON.parse(data);
    } catch {
      return res.status(500).send("Failed to parse products.json");
    }

    const index = products.findIndex((p) => p.stockCode === stockCode);
    if (index === -1) return res.status(404).send("Product not found.");

    products[index].mainCategory = mainCategory;
    products[index].subCategory = subCategory;

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to save changes.");
      res.send("✅ Product updated.");
    });
  });
});

app.get("/api/categories-main", (req, res) => {
  fs.readFile(mainCategoriesFile, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Failed to load main categories" });
    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch {
      res.status(500).json({ error: "Invalid JSON in main categories" });
    }
  });
});

app.get("/api/categories-sub", (req, res) => {
  fs.readFile(subCategoriesFile, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Failed to load sub-categories" });
    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch {
      res.status(500).json({ error: "Invalid JSON in sub-categories" });
    }
  });
});

// GET all subcategories (new structure)
app.get("/api/categories-sub", (req, res) => {
  try {
    const filePath = path.join(__dirname, "categories-sub.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const subCategories = JSON.parse(raw);
    res.json(subCategories); // returns an array of { id, name, mainCategory }
  } catch (err) {
    console.error("❌ Failed to read categories-sub.json:", err.message);
    res.status(500).json({ error: "Failed to load sub-categories" });
  }
});

app.get("/test-sub-json", (req, res) => {
  const subCatPath = path.join(__dirname, "categories-sub.json");
  try {
    const raw = fs.readFileSync(subCatPath, "utf8");
    res.type("text").send(raw);
  } catch (err) {
    res.send("❌ FILE ERROR: " + err.message);
  }
});

// PUT (edit) a sub-category
app.put("/api/categories-sub/:id", (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Sub-category name is required" });
  }

  try {
    const subCategories = JSON.parse(
      fs.readFileSync(subCategoriesFile, "utf-8")
    );
    const index = subCategories.findIndex((s) => s.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Sub-category not found" });
    }

    subCategories[index].name = name;

    fs.writeFileSync(subCategoriesFile, JSON.stringify(subCategories, null, 2));
    console.log(`✅ Sub-category renamed: ${id} → ${name}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to rename sub-category:", err);
    res.status(500).json({ error: "Failed to rename sub-category" });
  }
});

// DELETE a sub-category
app.delete("/api/categories-sub/:id", (req, res) => {
  const { id } = req.params;

  try {
    let subs = JSON.parse(fs.readFileSync(subCategoriesPath, "utf8"));
    const initialLength = subs.length;
    subs = subs.filter((s) => s.id !== id);

    if (subs.length === initialLength) {
      return res.status(404).json({ error: "Sub-category not found" });
    }

    fs.writeFileSync(subCategoriesPath, JSON.stringify(subs, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to delete sub-category" });
  }
});

// DELETE a main category
// DELETE a main category and any sub-categories that belong to it
app.delete("/api/categories-main/:name", (req, res) => {
  const name = decodeURIComponent(req.params.name);
  console.log(`🗑️ Attempting to delete main category: ${name}`);

  fs.readFile(mainCategoriesFile, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Failed to read main categories" });

    let mainCategories;
    try {
      mainCategories = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON in categories-main" });
    }

    const updated = mainCategories.filter((m) => {
      const value = typeof m === "string" ? m : m.name;
      return value !== name;
    });

    if (updated.length === mainCategories.length) {
      return res.status(404).json({ error: "Main category not found" });
    }

    fs.writeFile(
      mainCategoriesFile,
      JSON.stringify(updated, null, 2),
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Failed to write main categories" });

        // Optional: remove subcategories too
        fs.readFile(subCategoriesFile, "utf8", (err, subData) => {
          if (err) return res.json({ success: true, removed: 0 });

          let subCategories = [];
          try {
            subCategories = JSON.parse(subData);
          } catch (e) {
            return res.json({ success: true, removed: 0 });
          }

          const remaining = subCategories.filter(
            (s) => s.mainCategory !== name
          );
          const removed = subCategories.length - remaining.length;

          fs.writeFile(
            subCategoriesFile,
            JSON.stringify(remaining, null, 2),
            (err) => {
              if (err) console.warn("⚠️ Could not update sub-categories");
              res.json({ success: true, removed });
            }
          );
        });
      }
    );
  });
});

// RENAME a main category
app.put("/api/categories-main/rename", (req, res) => {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    return res.status(400).json({ error: "Missing oldName or newName" });
  }

  fs.readFile(mainCategoriesFile, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Failed to read main categories" });

    let categories;
    try {
      categories = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON format" });
    }

    let updated = false;
    categories = categories.map((cat) => {
      if (
        (typeof cat === "string" && cat === oldName) ||
        (typeof cat === "object" && cat.name === oldName)
      ) {
        updated = true;
        return { name: newName };
      }
      return cat;
    });

    if (!updated)
      return res.status(404).json({ error: "Old category not found" });

    fs.writeFile(
      mainCategoriesFile,
      JSON.stringify(categories, null, 2),
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Failed to save updated categories" });
        res.json({ success: true });
      }
    );
  });
});

// Endpoint to import CSV and update products
app.post(
  "/api/import-products-csv",
  csvUpload.single("csvFile"),
  (req, res) => {
    if (!req.file) return res.status(400).send("❌ No file uploaded");

    const filePath = req.file.path;
    const updatedProducts = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        // Optional: Normalize fields
        row.quantity = parseInt(row.quantity) || 0;
        row.maskedCode = generateMaskedCode(row.stockCode || "");
        row.image = row.image?.trim() || "default.jpg";
        row.mainCategory = row.mainCategory?.trim() || "Uncategorized";
        row.subCategory = row.subCategory?.trim() || "Uncategorized";
        row.category = row.category?.trim() || "Uncategorized";
        updatedProducts.push(row);
      })
      .on("end", () => {
        fs.unlinkSync(filePath);

        fs.writeFile(
          productsFile,
          JSON.stringify(updatedProducts, null, 2),
          (err) => {
            if (err) {
              console.error("❌ Failed to save products.json:", err);
              return res.status(500).send("❌ Failed to save products.");
            }
            res.send(
              `✅ Imported ${updatedProducts.length} products and updated database.`
            );
          }
        );
      });
  }
);

// ✅ CSV Export Route
app.get("/export-csv", (req, res) => {
  fs.readFile(productsFile, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Failed to read products.json:", err);
      return res.status(500).send("❌ Failed to export.");
    }

    try {
      const products = JSON.parse(data);
      const headers = [
        "stockCode",
        "maskedCode",
        "name",
        "description",
        "category",
        "mainCategory",
        "subCategory",
        "extraNotes",
        "quantity",
        "dateAdded",
        "image",
        "lastUpdated",
      ];

      const csv = [
        headers.join(","),
        ...products.map((p) =>
          headers
            .map((key) => `"${(p[key] || "").toString().replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=products-export.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      res.send(csv);
    } catch (e) {
      console.error("❌ Failed to convert to CSV:", e);
      res.status(500).send("❌ Error exporting CSV.");
    }
  });
});

app.post("/import-products", (req, res) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    try {
      const parsed = JSON.parse(body);
      const imported = parsed.products;

      if (!Array.isArray(imported)) {
        return res.status(400).send("❌ Invalid product data format.");
      }

      // Load existing products
      const existingData = fs.existsSync(productsFile)
        ? JSON.parse(fs.readFileSync(productsFile, "utf-8"))
        : [];

      // Create a map for fast updates
      const productMap = {};
      existingData.forEach((p) => {
        productMap[p.stockCode] = p;
      });

      // Update or add imported products
      imported.forEach((newProd) => {
        const code = newProd.stockCode;
        newProd.maskedCode = generateMaskedCode(code || "");
        newProd.dateAdded =
          productMap[code]?.dateAdded || new Date().toISOString();
        newProd.image =
          newProd.image?.trim() || productMap[code]?.image || "default.jpg";
        newProd.imageUpdatedAt = productMap[code]?.imageUpdatedAt || null;
        newProd.quantity = parseInt(newProd.quantity) || 0;
        newProd.category = newProd.category?.trim() || "Uncategorized";
        newProd.mainCategory = newProd.mainCategory?.trim() || "Uncategorized";
        newProd.subCategory = newProd.subCategory?.trim() || "Uncategorized";

        // Merge or add
        productMap[code] = { ...productMap[code], ...newProd };
      });

      const mergedProducts = Object.values(productMap);

      fs.writeFile(
        productsFile,
        JSON.stringify(mergedProducts, null, 2),
        (err) => {
          if (err) {
            console.error("❌ Failed to write products:", err);
            return res.status(500).send("❌ Failed to save product list.");
          }

          res.send(
            `✅ Imported ${imported.length} products successfully. 📦 Total in system: ${mergedProducts.length}`
          );
        }
      );
    } catch (err) {
      console.error("❌ Error parsing JSON:", err);
      res.status(500).send("❌ Failed to import.");
    }
  });
});

app.post("/import-products-merge", (req, res) => {
  const newProducts = req.body.products;

  if (!Array.isArray(newProducts)) {
    return res.status(400).send("❌ Invalid product data format.");
  }

  const expectedHeaders = [
    "stockCode",
    "maskedCode",
    "name",
    "description",
    "category",
    "mainCategory",
    "subCategory",
    "extraNotes",
    "quantity",
    "dateAdded",
    "image",
  ];

  const allHeadersPresent = expectedHeaders.every(
    (header) =>
      newProducts.length === 0 || Object.keys(newProducts[0]).includes(header)
  );

  if (!allHeadersPresent) {
    return res
      .status(400)
      .send("❌ Invalid CSV format. Please check column headers.");
  }

  // Read current products
  fs.readFile(productsFile, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Error reading products.json:", err);
      return res.status(500).send("❌ Failed to read existing products.");
    }

    let existing = [];
    try {
      existing = JSON.parse(data);
    } catch (parseErr) {
      console.error("❌ Failed to parse products.json:", parseErr);
    }

    // Merge: Replace if stockCode matches
    const merged = [...existing];

    newProducts.forEach((incoming) => {
      const index = merged.findIndex((p) => p.stockCode === incoming.stockCode);
      incoming.lastUpdated = new Date().toISOString(); // ⏱️ Add/update timestamp
      // incoming.lastUpdated = new Date().toISOString(); // ✅ Add this
      const timestamp = new Date().toISOString();

      if (index >= 0) {
        merged[index] = {
          ...merged[index],
          ...incoming,
          lastUpdated: timestamp,
        };
      } else {
        merged.push({
          ...incoming,
          lastUpdated: timestamp,
        });
      }
    });

    fs.writeFile(productsFile, JSON.stringify(merged, null, 2), (err) => {
      if (err) {
        console.error("❌ Failed to write merged products:", err);
        return res.status(500).send("❌ Failed to save merged products.");
      }

      res.send(
        `✅ Imported ${newProducts.length} items. 📦 Total in system: ${merged.length}`
      );
    });
  });
});

// ✅ Route to get main categories
app.get("/categories-main.json", (req, res) => {
  res.sendFile(mainCategoriesFile);
});

// ✅ Route to get sub categories
app.get("/categories-sub.json", (req, res) => {
  res.sendFile(subCategoriesFile);
});

// ✅ Add your existing routes below
// For example:
app.get("/products.json", (req, res) => {
  fs.readFile(productsFile, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading products");
    }
    res.type("json").send(data);
  });
});

//fix categories main format

app.post("/api/fix-categories-main", (req, res) => {
  const fs = require("fs");
  const filePath = path.join(__dirname, "data", "categories-main.json");

  try {
    let data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Normalize entries to { name: "..." }
    const cleaned = data.map((item) =>
      typeof item === "string" ? { name: item } : item
    );

    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
    res.json({ success: true, count: cleaned.length });
  } catch (err) {
    console.error("❌ Failed to fix categories-main.json:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// fix sub categories format

app.post("/api/cleanup-categories-sub", async (req, res) => {
  try {
    const subsPath = path.join(__dirname, "data", "categories-sub.json");
    const subs = JSON.parse(fs.readFileSync(subsPath, "utf8"));

    const validSubs = subs.filter(
      (s) =>
        s && s.name && s.name.trim() && s.mainCategory && s.mainCategory.trim()
    );

    const removed = subs.length - validSubs.length;

    fs.writeFileSync(subsPath, JSON.stringify(validSubs, null, 2), "utf8");

    res.json({ success: true, removed });
  } catch (err) {
    console.error("❌ Error during sub-category cleanup:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// clean iup unuesed stock codes

app.post("/cleanup-unused-stockcodes", (req, res) => {
  const productsPath = path.join(__dirname, "data", "products.json");
  const logPath = path.join(__dirname, "logs", "removed-stockcodes.log");

  try {
    const raw = fs.readFileSync(productsPath, "utf-8");
    const products = JSON.parse(raw);

    let removed = [];
    const kept = [];

    for (const p of products) {
      const code = (p.stockCode || "").trim();
      if (!code) {
        removed.push(p);
      } else {
        kept.push(p);
      }
    }

    // Save filtered list
    fs.writeFileSync(productsPath, JSON.stringify(kept, null, 2));

    // Log removed items
    if (!fs.existsSync("logs")) fs.mkdirSync("logs");
    const logText = removed.length
      ? removed
          .map((p) => `${p.stockCode || "[BLANK]"} — ${p.name || "Unnamed"}`)
          .join("\n")
      : "No products removed.";
    fs.writeFileSync(logPath, logText);

    console.log(`✅ Removed ${removed.length} products with missing stockCode`);

    // ✅ send actual count
    res.json({ removedCount: removed.length || 0 });
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    res.status(500).json({ error: "Failed to clean up missing stock codes" });
  }
});

/**/
// 🔍 Check which products have missing image files
app.get("/api/missing-images", (req, res) => {
  const productsPath = path.join(__dirname, "products.json");
  const uploadsDir = path.join(__dirname, "uploads");

  try {
    const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
    const missing = [];

    products.forEach((p) => {
      let imageName = (p.image || "").trim();

      // Clean quotes or invisible characters too
      imageName = imageName.replace(/^["']+|["']+$/g, ""); // remove surrounding quotes

      // Skip if default or empty
      if (!imageName || imageName === "default.jpg") return;

      const imagePath = path.join(uploadsDir, imageName);
      if (!fs.existsSync(imagePath)) {
        missing.push({
          stockCode: p.stockCode,
          name: p.name || "Unnamed",
          image: imageName,
        });
      }
    });

    res.json({ missing, count: missing.length });
  } catch (err) {
    console.error("❌ Error checking missing images:", err);
    res.status(500).json({ error: "Failed to check image files." });
    console.log(`🧪 Checking image for ${p.stockCode}: "${imageName}"`);
    console.log(`Exists?`, fs.existsSync(path.join(uploadsDir, imageName)));
  }
});
/**/
//restore original image from archive
const restoreLogPath = path.join(__dirname, "logs/restore-image-log.txt");

app.post("/restore-original-image", (req, res) => {
  const { stockCode } = req.body;
  if (!stockCode) return res.status(400).json({ error: "Missing stock code." });

  const safeCode = stockCode.trim().replace(/\s+/g, "_");
  const uploadsPath = path.join(__dirname, "public/uploads", `${safeCode}.jpg`);

  // Find archived file
  const archiveDir = path.join(__dirname, "public/archive-images");
  const matches = fs
    .readdirSync(archiveDir)
    .filter((f) => f.startsWith(safeCode + "__") && f.endsWith(".jpg"))
    .sort()
    .reverse();

  if (!matches.length) {
    return res.status(404).json({ error: "Archived image not found." });
  }

  const archivedFile = matches[0];
  const archivedPath = path.join(archiveDir, archivedFile);

  try {
    fs.copyFileSync(archivedPath, uploadsPath);

    // ✅ Log the restoration
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const logEntry = `--- ${now} ---\nRestored: ${safeCode}.jpg\nFrom: archive-images/${archivedFile}\nTo: public/uploads/${safeCode}.jpg\n\n`;
    fs.appendFileSync(restoreLogPath, logEntry);

    res.json({ message: `✅ Restored image from ${archivedFile}` });
  } catch (err) {
    console.error("❌ Restore error:", err);
    res.status(500).json({ error: "Failed to restore image." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("💡 Tip: Use 'nodemon server.js' so your changes auto-refresh!");
});
