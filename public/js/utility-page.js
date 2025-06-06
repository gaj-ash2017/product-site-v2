console.log("✅ utility-page.js loaded");

let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ Only run if the All Products panel is visible
  const container = document.getElementById("utilityProductContainer");
  if (!container) return;

  try {
    const res = await fetch("/products.json"); // Make sure this path is valid!
    allProducts = await res.json();
    renderUtilityProducts(allProducts);
  } catch (err) {
    console.error("❌ Failed to load products:", err);
  }

  // Select All
  document.getElementById("selectAllBtn").addEventListener("click", () => {
    document
      .querySelectorAll(".product-checkbox")
      .forEach((cb) => (cb.checked = true));
    updateSelectedCount();
  });

  // Clear All
  document.getElementById("clearAllBtn").addEventListener("click", () => {
    document
      .querySelectorAll(".product-checkbox")
      .forEach((cb) => (cb.checked = false));
    updateSelectedCount();
  });

  // Export Selected
  document.getElementById("exportBtn").addEventListener("click", () => {
    exportSelectedProducts(allProducts);
  });

  // Show Default Images
  document.getElementById("showDefaultBtn").addEventListener("click", () => {
    const defaults = allProducts
      .filter((p) => p.image === "default.jpg")
      .sort((a, b) =>
        (a.stockCode || "").trim().localeCompare((b.stockCode || "").trim())
      );
    renderUtilityProducts(defaults);
  });

  // Reset Filter
  document.getElementById("resetBtn").addEventListener("click", () => {
    renderUtilityProducts(allProducts);
  });
});

function renderUtilityProducts(products) {
  const container = document.getElementById("utilityProductContainer");
  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageSrc = product.image?.trim() || "default.jpg";

    card.innerHTML = `
      <div class="checkbox-container">
        <input type="checkbox" class="product-checkbox" data-stock="${
          product.stockCode
        }">
      </div>
      <img src="/uploads/${imageSrc}" alt="${
      product.name || "Product"
    }" onerror="this.src='/uploads/default.jpg'">
      <div class="product-info">
        <p class="product-name"><strong>${
          product.name || "Unnamed Product"
        }</strong></p>
        <p class="${product.image === "default.jpg" ? "missing-image" : ""}">
  Stock Code: ${product.stockCode} ${
      product.image === "default.jpg" ? "🚫" : ""
    }
</p>
        <p>Category: ${product.category || "Uncategorized"}</p>
        <p>Main: ${product.mainCategory || "Uncategorized"}</p>
        <p>Sub: ${product.subCategory || "Uncategorized"}</p>
        <p>Description: ${product.description || ""}</p>
        <p>Quantity: ${product.quantity || 0}</p>
        <p>Extra Notes: ${product.extraNotes || ""}</p>
        <p>Image: ${product.image || "default.jpg"}</p>
        <p>Masked Code: ${product.maskedCode || ""}</p>
        <p>Last Updated: ${product.lastUpdated || ""}</p>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach change event to all checkboxes
  document.querySelectorAll(".product-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", updateSelectedCount);
  });
  // Reset count
  updateSelectedCount();
}

//helper
function updateSelectedCount() {
  const selected = document.querySelectorAll(
    ".product-checkbox:checked"
  ).length;
  const banner = document.getElementById("selectedCount");
  banner.textContent = `🧮 ${selected} product(s) selected`;
}

// Add listeners to update count live
document
  .querySelectorAll(".product-checkbox")
  .forEach((cb) => cb.addEventListener("change", updateSelectedCount));

function exportSelectedProducts(products) {
  const selected = Array.from(document.querySelectorAll(".product-checkbox"))
    .filter((cb) => cb.checked)
    .map((cb) => cb.dataset.stock);

  const selectedProducts = products.filter((p) =>
    selected.includes(p.stockCode)
  );

  if (selectedProducts.length === 0) {
    alert("Please select at least one product.");
    return;
  }

  const csvHeader = [
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

  const csvRows = selectedProducts.map((p) => {
    return csvHeader
      .map((field) => {
        const value =
          p[field] !== undefined && p[field] !== null ? p[field] : "";
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(",");
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    csvHeader.join(",") +
    "\n" +
    csvRows.join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "exported-products.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// csv import
document.getElementById("importBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];
  if (!file) return alert("Please select a CSV file to import.");

  const formData = new FormData();
  formData.append("csvFile", file);

  try {
    const res = await fetch("/api/import-products", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (result.success) {
      alert(`✅ Imported ${result.importedCount} products!`);
      location.reload(); // Or re-fetch and re-render
    } else {
      alert("❌ Import failed: " + (result.error || "Unknown error"));
    }
  } catch (err) {
    console.error("❌ Import error:", err);
    alert("❌ Error during import: " + err.message);
  }
});

// Import from Tab 2
const importBtnTab2 = document.getElementById("importBtnTab2");
if (importBtnTab2) {
  importBtnTab2.addEventListener("click", async () => {
    const file = document.getElementById("importFileTab2").files[0];
    if (!file) return alert("Please select a CSV file to import.");

    const formData = new FormData();
    formData.append("csvFile", file);

    try {
      const res = await fetch("/api/import-products", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        alert(`✅ Imported ${result.importedCount} products!`);
        location.reload(); // Refresh dashboard
      } else {
        alert("❌ Import failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("❌ Import error:", err);
      alert("❌ Error during import: " + err.message);
    }
  });
}

// Export from Tab 2
const exportBtnTab2 = document.getElementById("exportAllBtnTab2");
if (exportBtnTab2) {
  exportBtnTab2.addEventListener("click", () => {
    if (!allProducts.length) return alert("No products loaded.");
    const csvHeader = [
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
    const csvRows = allProducts.map((p) =>
      csvHeader
        .map((field) => `"${String(p[field] || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvHeader.join(",") +
      "\n" +
      csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "all-products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
// end
// start
// Tab 3: Missing Images Loader
const missingTab = document.getElementById("missingProductContainer");

if (missingTab) {
  // Wait a bit for DOM and data to load
  window.addEventListener("DOMContentLoaded", () => {
    // If we already have products loaded (from tab 1), reuse them
    if (allProducts.length) {
      renderMissingProducts();
    } else {
      // Fallback: Fetch if not already loaded
      fetch("/products.json")
        .then((res) => res.json())
        .then((data) => {
          allProducts = data;
          renderMissingProducts();
        })
        .catch((err) => {
          console.error(
            "❌ Failed to load products for missing images tab:",
            err
          );
        });
    }
  });
}

function renderMissingProducts() {
  const defaults = allProducts
    .filter((p) => p.image === "default.jpg")
    .sort((a, b) => (a.stockCode || "").localeCompare(b.stockCode || ""));

  const countBanner = document.getElementById("missingDefaultCount");
  const container = document.getElementById("missingProductContainer");

  countBanner.textContent = `🖼️ ${defaults.length} product(s) using default.jpg`;
  container.innerHTML = "";

  if (!defaults.length) {
    container.innerHTML = "<p>No missing images found!</p>";
    return;
  }

  defaults.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageSrc = product.image?.trim() || "default.jpg";

    card.innerHTML = `
  <div class="checkbox-container">
    <input type="checkbox" class="missing-checkbox" data-stock="${
      product.stockCode
    }">
  </div>
  <img src="/uploads/${imageSrc}" alt="${
      product.name || "Product"
    }" onerror="this.src='/uploads/default.jpg'">
  <div class="product-info">
    <p class="product-name"><strong>${
      product.name || "Unnamed Product"
    }</strong></p>
    <p class="missing-image">Stock Code: ${product.stockCode}</p>
    <p>Category: ${product.category || "Uncategorized"}</p>
    <p>Main: ${product.mainCategory || "Uncategorized"}</p>
    <p>Sub: ${product.subCategory || "Uncategorized"}</p>
    <p>Description: ${product.description || ""}</p>
    <p>Quantity: ${product.quantity || 0}</p>
    <p>Image: ${product.image || "default.jpg"}</p>
    <p>Masked Code: ${product.maskedCode || ""}</p>
    <p>Last Updated: ${product.lastUpdated || ""}</p>
  </div>
`;

    container.appendChild(card);
  });
}
//end
// start
const exportMissingBtn = document.getElementById("exportMissingBtn");

if (exportMissingBtn) {
  exportMissingBtn.addEventListener("click", () => {
    const selected = Array.from(document.querySelectorAll(".missing-checkbox"))
      .filter((cb) => cb.checked)
      .map((cb) => cb.dataset.stock);

    const selectedProducts = allProducts.filter(
      (p) =>
        selected.includes(p.stockCode) &&
        (p.image || "").trim().toLowerCase() === "default.jpg"
    );

    if (selectedProducts.length === 0) {
      alert("Please select at least one missing image product.");
      return;
    }

    const csvHeader = [
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

    const csvRows = selectedProducts.map((p) =>
      csvHeader
        .map((field) => `"${String(p[field] || "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvHeader.join(",") +
      "\n" +
      csvRows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "missing-images.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
//end
//start
const cleanupStockBtn = document.getElementById("cleanupStockBtn");
const cleanupImagesBtn = document.getElementById("cleanupImagesBtn");
const cleanupResultBox = document.getElementById("cleanupResult");

if (cleanupStockBtn) {
  cleanupStockBtn.addEventListener("click", async () => {
    const confirmClean = confirm("Remove products with unused stock codes?");
    if (!confirmClean) return;

    try {
      const res = await fetch("/cleanup-unused-stockcodes", { method: "POST" });
      const result = await res.json();
      cleanupResultBox.textContent = `✅ Removed ${result.removedCount} unused stock code products.`;
    } catch (err) {
      console.error("Stock cleanup failed:", err);
      cleanupResultBox.textContent = "❌ Failed to remove unused stock codes.";
    }
  });
}

if (cleanupImagesBtn) {
  cleanupImagesBtn.addEventListener("click", async () => {
    const confirmClean = confirm("Delete unused images from uploads?");
    if (!confirmClean) return;

    try {
      const res = await fetch("/cleanup-unused-images", { method: "POST" });
      const result = await res.json();
      cleanupResultBox.textContent = `🧻 Deleted ${result.deletedCount} unused images.`;
    } catch (err) {
      console.error("Image cleanup failed:", err);
      cleanupResultBox.textContent = "❌ Failed to delete unused images.";
    }
  });
}
//end
// start
const scanBtn = document.getElementById("scanMissingImagesBtn");
const exportBtn = document.getElementById("exportMissingImagesBtn");
const resultBox = document.getElementById("missingImageResult");
const listContainer = document.getElementById("missingImageList");

let missingImageData = [];

if (scanBtn) {
  scanBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/missing-images");
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      missingImageData = data.missing || [];

      resultBox.textContent = `🔍 Found ${missingImageData.length} product(s) with missing image files.`;
      exportBtn.style.display = missingImageData.length
        ? "inline-block"
        : "none";

      // Render each missing image product
      listContainer.innerHTML = "";

      if (missingImageData.length) {
        missingImageData.forEach((p) => {
          const item = document.createElement("div");
          item.className = "missing-image-card";

          const hasStock = p.stockCode && p.stockCode.trim();

          item.innerHTML = `
    <div>
      <strong>${p.name || "Unnamed"}</strong><br>
      <code>${p.stockCode || "❌ No Code"}</code> | <em>${
            p.image || "No image"
          }</em>
    </div>
    ${
      hasStock
        ? `<button onclick="location.href='/admin/edit-product.html?stockCode=${encodeURIComponent(
            p.stockCode
          )}'">✏️ Edit</button>`
        : `<button disabled title="Missing stock code">⚠️ No Edit</button>`
    }
  `;

          listContainer.appendChild(item);
        });
      } else {
        listContainer.innerHTML = "<p>No missing image files found 🎉</p>";
      }
    } catch (err) {
      console.error("❌ Failed to scan missing images:", err);
      resultBox.textContent = "❌ Failed to check for missing images.";
    }
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (!missingImageData.length) return alert("No missing images to export.");

    const csvHeader = ["stockCode", "name", "image"];
    const csvRows = missingImageData.map((p) =>
      csvHeader
        .map((field) => `"${String(p[field] || "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvHeader.join(",") +
      "\n" +
      csvRows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "missing-image-products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
//end
