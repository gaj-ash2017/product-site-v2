let allProducts = [];

// Load products
fetch("/products.json")
  .then((res) => res.json())
  .then((products) => {
    allProducts = products;
    populateCategoryFilter(products);
    filterAndSort(); // Initial render
  });

// Fill the category dropdown
function populateCategoryFilter(products) {
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = '<option value="">All Categories</option>';

  categories.sort((a, b) => {
    if (a.toLowerCase() === "uncategorized") return -1;
    if (b.toLowerCase() === "uncategorized") return 1;
    return a.localeCompare(b);
  });

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });
}

// Render visible product cards
function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="/uploads/${p.image}" alt="${p.name}" onerror="this.src='/uploads/default.jpg'">
      <h3>${p.name}</h3>
      <p>
       <span class="label">Stock Code</span>
       <span class="colon">:</span>
       <span class="value">${p.stockCode}</span>
      </p>
      <p>
       <span class="label">Category</span>
       <span class="colon">:</span>
       <span class="value">${p.category}</span>
      </p>
      <p>
       <span class="label">Description</span>
       <span class="colon">:</span>
       <span class="value">${p.description}</span>
      </p>
      <p>
       <span class="label">Notes</span>
       <span class="colon">:</span>
       <span class="value">${p.extraNotes}</span>
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

// Filter and sort handler
function filterAndSort() {
  const category = document
    .getElementById("categoryFilter")
    .value.toLowerCase();
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const sortBy = document.getElementById("sortBy")?.value;

  let filtered = allProducts.filter((p) => {
    const matchesCategory =
      !category || (p.category || "").toLowerCase() === category;
    const matchesKeyword =
      p.name.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword);
    return matchesCategory && matchesKeyword;
  });

  // Sorting
  if (sortBy === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "name-desc") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === "date-newest") {
    filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  } else if (sortBy === "date-oldest") {
    filtered.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
  }

  renderProducts(filtered);
}

// Event listeners
document
  .getElementById("categoryFilter")
  .addEventListener("change", filterAndSort);
document.getElementById("searchInput").addEventListener("input", filterAndSort);
document.getElementById("sortBy")?.addEventListener("change", filterAndSort);
