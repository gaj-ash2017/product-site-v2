// ✅ products-edit.js (Cleaned, Fixed Sorting & Search)

let allProducts = [];

// === Load Products ===
fetch("/products.json")
  .then((res) => res.json())
  .then((products) => {
    allProducts = products.sort((a, b) =>
      (a.stockCode || "").localeCompare(b.stockCode || "")
    );
    populateCategoryFilter(products);
    populateMainAndSubCategoriesFromFiles();
    renderProducts(products);
  })
  .catch((err) => console.error("❌ Failed to load products:", err));

// === Load Categories for Edit Form ===
fetch("/categories.json")
  .then((res) => res.json())
  .then((categories) => {
    const select = document.getElementById("editCategory");
    const sorted = categories.sort((a, b) => {
      if (a.toLowerCase() === "uncategorized") return -1;
      if (b.toLowerCase() === "uncategorized") return 1;
      return a.localeCompare(b);
    });
    sorted.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  });

function populateCategoryFilter(products) {
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const sorted = categories.sort((a, b) => {
    if (a.toLowerCase() === "uncategorized") return -1;
    if (b.toLowerCase() === "uncategorized") return 1;
    return a.localeCompare(b);
  });
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = '<option value="">All Categories</option>';
  sorted.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });
}

// === Render Products ===
function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product";
    const stockCode = p.stockCode || "";
    const img = p.imagePath || "/uploads/default.jpg";

    div.innerHTML = `
      <div class="image-wrapper">
        <img src="${img}?t=${Date.now()}" alt="${
      p.name || "No name"
    }" onerror="this.src='/uploads/default.jpg';">
      </div>
      <h3>${p.name || "Unnamed"}</h3>
      <p>
        <span class="label">Code</span>
        <span class="colon">:</span>
        <span class="value">${stockCode}</span>
      </p>
      <p>
        <span class="label">Category</span>
        <span class="colon">:</span>
        <span class="value">${p.category || "Uncategorized"}</span>
      </p>
      <p>
        <span class="label">Main Category</span>
        <span class="colon">:</span>
        <span class="value">${p.mainCategory || "Uncategorized"}</span>
      </p>
      <p>
        <span class="label">Sub-Category</span>
        <span class="colon">:</span>
        <span class="value">${p.subCategory || "Uncategorized"}</span>
      </p>
      <p>
        <span class="label">Description</span>
        <span class="colon">:</span>
        <span class="value">${p.description || "—"}</span>
      </p>
      <p>
        <span class="label">Notes</span>
        <span class="colon">:</span>
        <span class="value">${p.extraNotes || "—"}</span>
      </p>
      <p>
        <span class="label">QTY on Hand</span>
        <span class="colon">:</span>
        <span class="value">${p.quantity || 0}</span>
      </p>
        
      <div class="buttons">
        <a href="edit-product.html?stockCode=${stockCode}" class="btn edit-btn">✏️ Edit</a>
        <button class="btn delete-btn" onclick="deleteProduct('${stockCode}')">🗑️ Delete</button>
      </div>
    `;

    // restore button
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "♻️ Restore Original";
    restoreBtn.className = "btn btn-restore";
    restoreBtn.onclick = () => restoreImage(stockCode);
    div.querySelector(".buttons").appendChild(restoreBtn);

    container.appendChild(div);
  });

  document.getElementById(
    "productCount"
  ).textContent = `Showing ${products.length} of ${allProducts.length} products`;
}

// === Search by Stock Code ===
document.getElementById("stockSearch").addEventListener("input", function () {
  const query = this.value.trim().toLowerCase();
  const filtered = allProducts.filter((p) =>
    p.stockCode?.toLowerCase().includes(query)
  );
  renderProducts(filtered);
});

// === Sort and Filter ===
document.getElementById("sortBy")?.addEventListener("change", filterAndSort);
document
  .getElementById("categoryFilter")
  ?.addEventListener("change", filterAndSort);
document
  .getElementById("searchInput")
  ?.addEventListener("input", filterAndSort);

document
  .getElementById("mainCategoryFilter")
  ?.addEventListener("change", filterAndSort);
document
  .getElementById("subCategoryFilter")
  ?.addEventListener("change", filterAndSort);

document
  .getElementById("mainCategorySearch")
  ?.addEventListener("input", filterAndSort);
document
  .getElementById("subCategorySearch")
  ?.addEventListener("input", filterAndSort);

document
  .getElementById("toggleMasked")
  ?.addEventListener("change", filterAndSort);

function filterAndSort() {
  const cat = document.getElementById("categoryFilter").value.toLowerCase();
  const mainCat =
    document.getElementById("mainCategoryFilter")?.value.toLowerCase() || "";
  const subCat =
    document.getElementById("subCategoryFilter")?.value.toLowerCase() || "";
  const mainSearch =
    document.getElementById("mainCategorySearch")?.value.toLowerCase() || "";
  const subSearch =
    document.getElementById("subCategorySearch")?.value.toLowerCase() || "";
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const sort = document.getElementById("sortBy")?.value;

  let filtered = allProducts.filter((p) => {
    return (
      (!cat || (p.category || "").toLowerCase() === cat) &&
      (!mainCat || (p.mainCategory || "").toLowerCase() === mainCat) &&
      (!subCat || (p.subCategory || "").toLowerCase() === subCat) &&
      (!mainSearch ||
        (p.mainCategory || "").toLowerCase().includes(mainSearch)) &&
      (!subSearch || (p.subCategory || "").toLowerCase().includes(subSearch)) &&
      ((p.name || "").toLowerCase().includes(keyword) ||
        (p.description || "").toLowerCase().includes(keyword))
    );
  });

  if (sort === "name-asc") {
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sort === "name-desc") {
    filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  } else if (sort === "updated-newest") {
    filtered.sort(
      (a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0)
    );
  } else if (sort === "updated-oldest") {
    filtered.sort(
      (a, b) => new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0)
    );
  }

  renderProducts(filtered);
}

// === Delete Product ===
function deleteProduct(stockCode) {
  if (!confirm("Delete this product?")) return;
  fetch("/delete-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stockCode }),
  })
    .then((res) => res.text())
    .then((msg) => {
      alert(msg);
      location.reload();
    });
}

// === Main/Sub Category from Files ===
let allMainCategories = [];
let allSubCategories = [];

function populateMainAndSubCategoriesFromFiles() {
  Promise.all([
    fetch("/data/categories-main.json").then((res) => res.json()),
    fetch("/data/categories-sub.json").then((res) => res.json()),
  ]).then(([mainCats, subCats]) => {
    allMainCategories = mainCats;
    allSubCategories = subCats;

    const mainSelect = document.getElementById("mainCategoryFilter");
    const subSelect = document.getElementById("subCategoryFilter");
    mainSelect.innerHTML = '<option value="">All Main Categories</option>';
    subSelect.innerHTML = '<option value="">All Sub Categories</option>';

    mainCats
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = cat.name;
        mainSelect.appendChild(opt);
      });

    mainSelect.addEventListener("change", () => {
      const selectedMain = mainSelect.value;
      const filteredSubs = allSubCategories.filter(
        (s) => s.mainCategory === selectedMain
      );
      subSelect.innerHTML = '<option value="">All Sub Categories</option>';
      filteredSubs.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub.name;
        opt.textContent = sub.name;
        subSelect.appendChild(opt);
      });
      filterAndSort();
    });
  });
}

const stockInput = document.getElementById("stockQuickJump");
const suggestionBox = document.getElementById("stockSuggestions");

if (stockInput && suggestionBox) {
  stockInput.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    suggestionBox.innerHTML = "";

    if (!query || !allProducts.length) return;

    const matches = allProducts.filter((p) =>
      p.stockCode?.toLowerCase().includes(query)
    );

    matches.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = `${p.stockCode} — ${p.name}`;
      li.addEventListener("click", () => {
        window.location.href = `edit-product.html?stockCode=${p.stockCode}`;
      });
      suggestionBox.appendChild(li);
    });
  });

  document.addEventListener("click", (e) => {
    if (!stockInput.contains(e.target) && !suggestionBox.contains(e.target)) {
      suggestionBox.innerHTML = "";
    }
  });
}
// restore original image

async function restoreImage(stockCode) {
  if (!confirm(`Restore original image for ${stockCode}?`)) return;
  try {
    const res = await fetch("/restore-original-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockCode }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Unknown error");
    alert(result.message);
    location.reload(); // Refresh to reflect restored image
  } catch (err) {
    alert("❌ Failed to restore: " + err.message);
  }
}
