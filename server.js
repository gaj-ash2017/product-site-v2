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

// Serve products.json to frontend
app.get("/products.json", (req, res) => {
  res.sendFile(productsFile);
});

// CSV Import
const csvUpload = multer({ dest: "uploads/" });
app.post("/import-csv", csvUpload.single("csvfile"), (req, res) => {
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
        let existing = [];
        if (!err && data) {
          try {
            existing = JSON.parse(data);
          } catch {}
        }

        results.forEach((newProd) => {
          const index = existing.findIndex(
            (p) =>
              p.stockCode?.trim().toLowerCase() ===
              newProd.stockCode.toLowerCase()
          );
          if (index >= 0) {
            newProd.dateAdded = existing[index].dateAdded || newProd.dateAdded;
            existing[index] = newProd;
          } else {
            existing.push(newProd);
          }
        });

        fs.writeFile(productsFile, JSON.stringify(existing, null, 2), (err) => {
          if (err) return res.status(500).send("Error saving products.");
          fs.unlink(req.file.path, () => {});
          res.send("✅ Products imported successfully!");
        });
      });
    });
});

// Add Product
app.post("/add-product", imageUpload.single("imageFile"), (req, res) => {
  const { stockCode, name, description, category, extraNotes, quantity } =
    req.body;
  const trimmedCode = stockCode?.trim();
  let image = "default.jpg";

  if (req.file && trimmedCode) {
    const ext = path.extname(req.file.originalname) || ".jpg";
    const safeName = trimmedCode.replace(/\s+/g, "_");
    const newName = `${safeName}${ext}`;
    const newPath = path.join(req.file.destination, newName);
    fs.renameSync(req.file.path, newPath);
    image = newName;
  }

  const newProduct = {
    stockCode: trimmedCode,
    name: name?.trim(),
    description: description?.trim(),
    category: category?.trim(),
    extraNotes: extraNotes?.trim(),
    quantity: parseInt(quantity) || 0,
    image,
    dateAdded: new Date().toISOString(),
  };

  fs.readFile(productsFile, "utf-8", (err, data) => {
    let products = [];
    if (!err && data) {
      try {
        products = JSON.parse(data);
      } catch {}
    }
    if (products.find((p) => p.stockCode === newProduct.stockCode)) {
      return res
        .status(400)
        .send("Product with this stock code already exists.");
    }
    products.push(newProduct);
    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to save product.");
      res.send("✅ Product added successfully!");
    });
  });
});

// Edit Product
app.post("/edit-product", imageUpload.single("imageFile"), (req, res) => {
  const updatedCode = req.body.stockCode?.trim();
  if (!updatedCode) return res.status(400).send("Missing stock code");

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Failed to read products");

    let products = JSON.parse(data);
    const index = products.findIndex((p) => p.stockCode === updatedCode);
    if (index === -1) return res.status(404).send("Product not found");

    const product = products[index];
    const ext = req.file ? path.extname(req.file.originalname) : null;
    let newImage = product.image;

    if (req.file && ext) {
      const newName = `${updatedCode}${ext}`;
      const newPath = path.join(req.file.destination, newName);
      fs.renameSync(req.file.path, newPath);
      newImage = newName;
      // Delete old image
      if (product.image !== "default.jpg") {
        const oldPath = path.join(__dirname, "public/uploads", product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    products[index] = {
      ...product,
      name: req.body.name?.trim(),
      description: req.body.description?.trim(),
      category: req.body.category?.trim(),
      extraNotes: req.body.extraNotes?.trim(),
      quantity: parseInt(req.body.quantity) || 0,
      image: newImage,
      dateAdded: product.dateAdded || new Date().toISOString(),
    };

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to save edited product");
      res.send("✅ Product updated with image");
    });
  });
});

// Delete Product
app.post("/delete-product", (req, res) => {
  const stockCodeToDelete = req.body.stockCode?.trim();
  if (!stockCodeToDelete) return res.status(400).send("No stock code provided");

  fs.readFile(productsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading products.");
    let products = JSON.parse(data);
    const product = products.find((p) => p.stockCode === stockCodeToDelete);
    if (!product) return res.status(404).send("Product not found");

    const imageToDelete = product.image;
    products = products.filter((p) => p.stockCode !== stockCodeToDelete);

    fs.writeFile(productsFile, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).send("Error saving products.");
      const imgPath = path.join(__dirname, "public/uploads", imageToDelete);
      if (imageToDelete !== "default.jpg" && fs.existsSync(imgPath)) {
        fs.unlink(imgPath, () => {});
      }
      res.send("✅ Product deleted.");
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
