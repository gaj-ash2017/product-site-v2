const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const productsFile = path.join(__dirname, "products.json");
const categoriesFile = path.join(__dirname, "categories.json");

// Ensure tmp/ directory exists
const tmpDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

const imageUpload = multer({ dest: path.join(__dirname, "public/uploads/") });
const csvUpload = multer({ dest: tmpDir }); // for importing CSVs

// === PRODUCTS ===
app.get("/products.json", (req, res) => {
  res.sendFile(productsFile);
});

app.post("/add-product", imageUpload.single("imageFile"), (req, res) => {
  const { stockCode, name, description, category, extraNotes, quantity } =
    req.body;
  let image = "default.jpg";

  if (req.file) {
    const ext = path.extname(req.file.originalname) || ".jpg";
    const safeCode = stockCode.trim().replace(/\s+/g, "_");
    const newName = `${safeCode}${ext}`;
    const newPath = path.join(req.file.destination, newName);
    try {
      fs.renameSync(req.file.path, newPath);
      image = newName;
    } catch {
      console.error("❌ Failed to rename image.");
    }
  }

  const newProduct = {
    stockCode: stockCode.trim(),
    name: name.trim(),
    description: description.trim(),
    category: category.trim(),
    extraNotes: extraNotes.trim(),
    quantity: parseInt(quantity) || 0,
    image,
    dateAdded: new Date().toISOString(),
  };

  fs.readFile(productsFile, "utf-8", (err, data) => {
    let products = [];
    if (!err && data) {
      try {
        products = JSON.parse(data);
      } catch {
        return res.status(500).send("Error parsing products.json");
      }
    }

    const exists = products.find((p) => p.stockCode === newProduct.stockCode);
    if (exists) return res.status(400).send("Product already exists.");

    products.push(newProduct);
    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to save product.");
      res.send("✅ Product added successfully!");
    });
  });
});

app.post("/edit-product", imageUpload.single("imageFile"), (req, res) => {
  const updated = {
    stockCode: req.body.stockCode?.trim(),
    name: req.body.name?.trim(),
    description: req.body.description?.trim(),
    category: req.body.category?.trim(),
    extraNotes: req.body.extraNotes?.trim(),
    quantity: parseInt(req.body.quantity) || 0,
  };

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading products file");

    let products = JSON.parse(data);
    const index = products.findIndex((p) => p.stockCode === updated.stockCode);
    if (index === -1) return res.status(404).send("Product not found");

    updated.dateAdded = products[index].dateAdded || new Date().toISOString();
    const oldImage = products[index].image;

    if (req.file) {
      const ext = path.extname(req.file.originalname) || ".jpg";

      // ✅ Always use the original stock code from existing product entry
      const actualCode = products[index].stockCode;
      const safeName = actualCode + ext;

      const oldImage = products[index].image;
      const newPath = path.join(__dirname, "public/uploads", safeName);

      console.log("✅ Received file:", req.file.originalname);
      console.log("🧾 Renaming to:", newPath);

      try {
        fs.renameSync(req.file.path, newPath);
        updated.image = safeName;
        updated.imageUpdatedAt = new Date().toISOString();

        if (oldImage && oldImage !== "default.jpg" && oldImage !== safeName) {
          const oldPath = path.join(__dirname, "public/uploads", oldImage);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.error("❌ Error renaming image:", err);
        updated.image = oldImage;
      }
    } else {
      updated.image = oldImage;
      updated.imageUpdatedAt = products[index].imageUpdatedAt || null;
    }
    
    products[index] = updated;

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to save updated product");
      res.send("✅ Product updated successfully!");
    });
  });
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
      if (err) return res.status(500).send("❌ Failed to write sorted products");
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("💡 Tip: Use 'nodemon server.js' so your changes auto-refresh!");
});
