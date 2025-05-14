// Fetch products
let allProducts = [];

console.log("✅ products.js is loaded");

fetch("/products.json")
  .then((res) => {
    console.log("📥 Fetched response:", res);
    return res.json();
  })
  .then((products) => {
    console.log("✅ Loaded products:", products);
    allProducts = products;
    populateCategoryFilter(products);
    renderProducts(products);
  })
  .catch((err) => {
    console.error("❌ Fetch error:", err);
  });

function getSafeCategory(p) {
  const raw = (p.category || "").trim();
  const value = raw !== "" ? raw : "Uncategorized";
  const cssClass = value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
  const isUncat = value.toLowerCase() === "uncategorized";
  return { value, cssClass, isUncat };
}

function populateCategoryFilter(products) {
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const cleaned = categories.map((cat) => cat.trim()).filter(Boolean);
  const sorted = cleaned
    .filter((cat) => cat.toLowerCase() !== "uncategorized")
    .sort((a, b) => a.localeCompare(b));

  if (cleaned.some((cat) => cat.toLowerCase() === "uncategorized")) {
    sorted.unshift("Uncategorized");
  }

  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = '<option value="">All Categories</option>';
  sorted.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });
}

function highlight(text, keyword) {
  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

/* RENDER PRODUCTS */

function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  const keyword = document.getElementById("searchInput").value.toLowerCase();

  products.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "product";

    // Debug: log raw product
    console.log(`🔍 Product ${i}:`, p);

    const img = p.image && p.image.trim() !== "" ? p.image : "default.jpg";
    const name = keyword ? highlight(p.name || "", keyword) : p.name || "";
    const description = keyword
      ? highlight(p.description || "", keyword)
      : p.description || "";

    // Raw fallback logic
    const rawCategory = typeof p.category === "string" ? p.category.trim() : "";
    if (!rawCategory) {
      console.warn(`⚠️ Missing or empty category for: ${p.name}`);
    }
    const safeCat = rawCategory !== "" ? rawCategory : "Uncategorized";
    const isUncat = safeCat.toLowerCase() === "uncategorized";
    const safeCatClass = safeCat
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    console.log(`📦 Category [${p.name}]:`, safeCat);

    div.innerHTML = `
      <img src="/uploads/${img}" alt="${
      p.name
    }" onerror="this.src='/uploads/default.jpg';"
           style="width: 120px; height: 120px; object-fit: cover; border-radius: 4px; margin: 0 auto 0.5rem; display: block;">
      <h3>${name}</h3>
      <p><span class="label">Category:</span><span class="category-tag> ${safeCatClass}">${safeCat}</span>
        ${isUncat ? '<span class="attention-tag">⚠️ Needs Category</span>' : ""}
      </p>
      <p><span class="label">Description:</span> <span class="value">${description}</span></p>
      <p><span class="label">Notes:</span> <span class="value">${
        p.extraNotes || ""
      }</span></p>
      <p><span class="label">Quantity:</span> <span class="value">${
        p.quantity ?? 0
      }</span></p>
    `;

    container.appendChild(div);
  });

  document.getElementById(
    "productCount"
  ).textContent = `Showing ${products.length} of ${allProducts.length} products`;
}

// ✅ Update product count at the bottom
/* const countElem = document.getElementById("productCount");
if (countElem) {
  countElem.textContent = `Showing ${products.length} of ${allProducts.length} products`;
} else {
  console.warn("⚠️ #productCount element not found.");
} */

function filterAndSort() {
  let filtered = [...allProducts];
  const cat = document.getElementById("categoryFilter").value;
  const sort = document.getElementById("sortBy").value;
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  if (cat) {
    filtered = filtered.filter(
      (p) =>
        (p.category || "").trim().toLowerCase() === cat.trim().toLowerCase()
    );
  }
  if (keyword) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
    );
  }

  if (sort === "name-asc")
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name-desc")
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  if (sort === "date-newest")
    filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  if (sort === "date-oldest")
    filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

  renderProducts(filtered);
}

document
  .getElementById("categoryFilter")
  .addEventListener("change", filterAndSort);
document.getElementById("sortBy").addEventListener("change", filterAndSort);
document.getElementById("searchInput").addEventListener("input", filterAndSort);
