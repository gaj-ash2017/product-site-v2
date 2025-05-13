// ✅ Full working server.js with integrated product + category management
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
const imageUpload = multer({ dest: path.join(__dirname, "public/uploads/") });

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
      const ext = path.extname(req.file.originalname);
      const safeName = updated.stockCode + ext;
      const newPath = path.join(req.file.destination, safeName);
      fs.renameSync(req.file.path, newPath);
      updated.image = safeName;

      if (oldImage !== "default.jpg") {
        const oldPath = path.join(__dirname, "public/uploads", oldImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
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

    // Remove the category
    categories = categories.filter((c) => c !== category);

    fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), (err) => {
      if (err) return res.status(500).send("Failed to delete category.");

      // Now update products.json to replace this category
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
