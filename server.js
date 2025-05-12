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
const imageUpload = multer({ dest: path.join(__dirname, "public/uploads/") });

// Helper to delete unused images
function deleteIfUnused(imageName) {
  if (!imageName || imageName === "default.jpg") return;

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return;
    try {
      const products = JSON.parse(data);
      const stillUsed = products.some((p) => p.image === imageName);
      const imgPath = path.join(__dirname, "public/uploads", imageName);

      if (!stillUsed && fs.existsSync(imgPath)) {
        fs.unlink(imgPath, () => {
          console.log(`🧹 Cleaned up unused image: ${imageName}`);
        });
      }
    } catch (e) {
      console.error("❌ Error parsing JSON for cleanup.");
    }
  });
}

// Serve products.json
app.get("/products.json", (req, res) => {
  res.sendFile(productsFile);
});

// Import CSV
const upload = multer({ dest: "uploads/" });
app.post("/import-csv", upload.single("csvfile"), (req, res) => {
  if (!req.file) return res.status(400).send("No CSV file uploaded.");
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      const product = {
        stockCode: row.stockCode?.trim() || "",
        name: row.name?.trim() || "",
        description: row.description?.trim() || "",
        category: row.category?.trim() || "",
        extraNotes: row.extraNotes?.trim() || "",
        quantity: parseInt(row.quantity) || 0,
        image: row.imageName?.trim() || "default.jpg",
        dateAdded: new Date().toISOString(),
      };
      results.push(product);
    })
    .on("end", () => {
      fs.readFile(productsFile, "utf-8", (err, data) => {
        let existingProducts = [];
        if (!err && data) {
          try {
            existingProducts = JSON.parse(data);
          } catch (e) {
            return res.status(500).send("Error parsing existing products.");
          }
        }

        results.forEach((newProd) => {
          const index = existingProducts.findIndex(
            (p) => p.stockCode.toLowerCase() === newProd.stockCode.toLowerCase()
          );
          if (index >= 0) {
            newProd.dateAdded =
              existingProducts[index].dateAdded || new Date().toISOString();
            existingProducts[index] = newProd;
          } else {
            existingProducts.push(newProd);
          }
        });

        existingProducts = existingProducts.map((p) => ({
          ...p,
          dateAdded: p.dateAdded || new Date().toISOString(),
        }));

        fs.writeFile(
          productsFile,
          JSON.stringify(existingProducts, null, 2),
          (err) => {
            if (err) return res.status(500).send("Error saving products.");
            fs.unlink(req.file.path, () => {});
            res.send("✅ Products imported successfully!");
          }
        );
      });
    })
    .on("error", () => res.status(500).send("Error processing CSV."));
});

// Add product with image
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

// Edit product
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
      const ext = path.extname(req.file.originalname);
      const safeName = updated.stockCode + ext;
      const newPath = path.join(req.file.destination, safeName);
      fs.renameSync(req.file.path, newPath);
      updated.image = safeName;

      deleteIfUnused(oldImage);
    } else {
      updated.image = oldImage;
    }

    products[index] = updated;
    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to save updated product");
      res.send("✅ Product updated successfully!");
    });
  });
});

// Delete product
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
      deleteIfUnused(image);
      res.send("✅ Product deleted.");
    });
  });
});

// Clean up unused images
app.post("/cleanup-unused-images", (req, res) => {
  const uploadsDir = path.join(__dirname, "public/uploads");

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("❌ Could not read products.json");

    let usedImages = new Set();
    try {
      const products = JSON.parse(data);
      products.forEach(p => {
        if (p.image && p.image !== "default.jpg") {
          usedImages.add(p.image);
        }
      });
    } catch {
      return res.status(500).send("❌ Error parsing products.json");
    }

    fs.readdir(uploadsDir, (err, files) => {
      if (err) return res.status(500).send("❌ Could not read uploads folder");

      let deleted = [];
      files.forEach(file => {
        if (!usedImages.has(file) && file !== "default.jpg") {
          const filePath = path.join(uploadsDir, file);
          fs.unlinkSync(filePath);
          deleted.push(file);
        }
      });

      res.send(`✅ Deleted ${deleted.length} unused image(s): ${deleted.join(", ")}`);
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("💡 Tip: Use 'nodemon server.js' so your changes auto-refresh!");
});
