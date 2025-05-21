let allProducts = [];

// Load products
fetch("/products.json")
  .then((res) => res.json())
  .then((products) => {
    allProducts = products;
    populateCategoryFilter(products);
    filterAndSort(); // Initial render
  });

// === Populate Category Dropdown ===
function populateCategoryFilter(products) {
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = '<option value="">All Categories</option>';

  categories
    .sort((a, b) => {
      if (a.toLowerCase() === "uncategorized") return -1;
      if (b.toLowerCase() === "uncategorized") return 1;
      return a.localeCompare(b);
    })
    .forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      filter.appendChild(opt);
    });
}

// === Highlight Matching Keyword ===
function highlight(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

// === Render Product Cards ===
function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="/uploads/${p.image}" alt="${
      p.name
    }" onerror="this.src='/uploads/default.jpg'">
      <h3>${highlight(p.name, keyword)}</h3>

      <p>
        <span class="label">Category</span>
        <span class="colon">:</span>
        <span class="value">${highlight(p.category, keyword)}</span>
      </p>
      <p>
        <span class="label">Description</span>
        <span class="colon">:</span>
        <span class="value">${highlight(p.description, keyword)}</span>
      </p>
      <p>
        <span class="label">Notes</span>
        <span class="colon">:</span>
        <span class="value">${highlight(p.extraNotes, keyword)}</span>
      </p>
      <p>
        <span class="label">Quantity</span>
        <span class="colon">:</span>
        <span class="value">${p.quantity}</span>
      </p>
    `;
    container.appendChild(div);
  });

  document.getElementById(
    "productCount"
  ).textContent = `Showing ${products.length} of ${allProducts.length} products`;
}

// === Filter and Sort Handler ===
function filterAndSort() {
  const cat = document.getElementById("categoryFilter").value.toLowerCase();
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const sort = document.getElementById("sortBy")?.value;

  let filtered = allProducts.filter((p) => {
    const matchesCategory = !cat || (p.category || "").toLowerCase() === cat;
    const matchesKeyword =
      p.name.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword);
    return matchesCategory && matchesKeyword;
  });

  if (sort === "name-asc")
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name-desc")
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === "date-newest")
    filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  else if (sort === "date-oldest")
    filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

  renderProducts(filtered);
}

// === Event Listeners ===
document
  .getElementById("categoryFilter")
  .addEventListener("change", filterAndSort);
document.getElementById("searchInput").addEventListener("input", filterAndSort);
document.getElementById("sortBy")?.addEventListener("change", filterAndSort);
