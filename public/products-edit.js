let allProducts = [];

fetch("/products.json")
  .then((res) => res.json())
  .then((products) => {
    console.log("✅ Raw Products:", products);

    products.sort((a, b) => {
      const codeA = a.stockCode?.toUpperCase() || "";
      const codeB = b.stockCode?.toUpperCase() || "";
      return codeA.localeCompare(codeB);
    });

    console.log("✅ Sorted Products:", products);

    allProducts = products;
    populateCategoryFilter(products);
    renderProducts(products);
  });

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

function highlight(text, keyword) {
  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function renderProducts(products) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product";
    const img = p.image?.trim() || "default.jpg";
    const name = keyword ? highlight(p.name, keyword) : p.name;
    const description = keyword
      ? highlight(p.description, keyword)
      : p.description;
    div.innerHTML = `
          <div class="image-wrapper">
  <img src="/uploads/${p.image}?t=${Date.now()}" alt="${
      p.name
    }" onerror="this.src='/uploads/default.jpg';">
  ${
    p.imageUpdatedAt && new Date() - new Date(p.imageUpdatedAt) < 10000 // if updated within last 10 seconds
      ? '<span class="updated-tag">✔️ Updated!</span>'
      : ""
  }
</div>
          <h3>${name}</h3>
          <p>
           <span class="label">Stock Code</span>
           <span class="colon">:</span>
           <span class="value badge">${p.stockCode}</span>
          </p>
          <p>
           <span class="label">Category</span>
           <span class="colon">:</span>
           <span class="value ${p.category?.toLowerCase() === "uncategorized" ? "uncategorized-tag" : ""}">
           ${p.category || "Uncategorized"}</span>
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
          <div class="buttons">
  <a href="edit-product.html?stockCode=${
    p.stockCode
  }" class="btn edit-btn">✏️ Edit</a>
  <button class="btn delete-btn" onclick="deleteProduct('${
    p.stockCode
  }')">🗑️ Delete</button>
</div>`;
    container.appendChild(div);
  });
  document.getElementById(
    "productCount"
  ).textContent = `Showing ${products.length} of ${allProducts.length} products`;
}

document.getElementById("stockSearch").addEventListener("input", function () {
  const query = this.value.trim().toLowerCase();

  const filtered = allProducts.filter((product) =>
    product.stockCode?.toLowerCase().includes(query)
  );

  renderProducts(filtered);
});

function filterAndSort() {
  let filtered = [...allProducts];
  const cat = document.getElementById("categoryFilter").value;
  const sort = document.getElementById("sortBy").value;
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  if (cat)
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === cat.toLowerCase()
    );
  if (keyword)
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
    );
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

/* function editProduct(code) {
  const p = allProducts.find((p) => p.stockCode === code);
  if (!p) return;
  document.getElementById("editStockCode").value = p.stockCode;
  document.getElementById(
    "editStockCodeDisplay"
  ).textContent = `Stock Code: ${p.stockCode}`;
  document.getElementById("editName").value = p.name;
  document.getElementById("editDescription").value = p.description;
  document.getElementById("editCategory").value = p.category;
  document.getElementById("editExtraNotes").value = p.extraNotes;
  document.getElementById("editQuantity").value = p.quantity;
  const form = document.getElementById("editForm");
  const cards = document.querySelectorAll(".product");
  cards.forEach((card) => {
    if (card.nextSibling === form) card.parentNode.removeChild(form);
  });
  const target = Array.from(cards).find(
    (card) => card.querySelector(".value")?.textContent === code
  );
  if (target) {
    target.after(form);
    form.style.display = "block";
  }
} */

/* function submitEdit(e) {
  e.preventDefault();
  const form = document.getElementById("editForm");
  const formData = new FormData(form);
  fetch("/edit-product", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.text())
    .then((msg) => {
      alert(msg);
      location.reload();
    });
} */

/* function cancelEditForm() {
  const form = document.getElementById("editForm");
  form.reset();
  form.style.display = "none";
  document.getElementById("imagePreview").innerHTML = "";
} */

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

function previewImage() {
  const fileInput = document.getElementById("editImageFile");
  const preview = document.getElementById("imagePreview");
  preview.innerHTML = "";
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.maxWidth = "150px";
      img.style.border = "1px solid #ccc";
      img.style.borderRadius = "4px";
      preview.appendChild(img);
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

function sortProducts() {
  if (
    !confirm(
      "Sort all products by stock code? This will overwrite products.json."
    )
  )
    return;

  fetch("/sort-products", { method: "POST" })
    .then((res) => res.text())
    .then((msg) => alert(msg))
    .catch((err) => alert("❌ Sort failed"));
}

function cleanupUnusedImages() {
  if (!confirm("Clean up unused images? This cannot be undone.")) return;

  fetch("/cleanup-unused-images", {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      const resultBox = document.getElementById("cleanupResult");
      if (data.deleted && data.deleted.length > 0) {
        resultBox.innerHTML = `
          ✅ <strong>${
            data.deleted.length
          }</strong> unused image(s) removed:<br>
          <ul>${data.deleted.map((file) => `<li>${file}</li>`).join("")}</ul>
        `;
      } else {
        resultBox.textContent = "✅ No unused images found.";
      }
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("cleanupResult").textContent =
        "❌ Failed to clean up images.";
    });
}

fetch("/products.json")
  .then((res) => res.json())
  .then((products) => {
    allProducts = products;
    populateCategoryFilter(products);
    renderProducts(products);

    // ✅ Setup edit search
    const input = document.getElementById("editSearchInput");
    const results = document.getElementById("editSearchResults");

    input.addEventListener("input", () => {
      const keyword = input.value.trim().toLowerCase();
      results.innerHTML = "";

      if (keyword.length < 2) return;

      const filtered = allProducts.filter((p) =>
        p.stockCode.toLowerCase().includes(keyword)
      );

      filtered.forEach((p) => {
        const div = document.createElement("div");
        div.className = "search-result";
        div.textContent = `${p.stockCode} — ${p.name}`;
        div.onclick = () => {
          window.location.href = `edit-product.html?stockCode=${p.stockCode}`;
        };
        results.appendChild(div);
      });
    });
  });
