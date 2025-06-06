document.addEventListener("DOMContentLoaded", async () => {
  const productContainer = document.getElementById("productContainer");
  const messageBox = document.getElementById("message");

  const [products, mainCategories, subCategoryMap] = await Promise.all([
    fetch("/products.json").then((res) => res.json()),
    fetch("/api/categories-main").then((res) => res.json()),
    fetch("/api/categories-sub/BULK").then((res) => res.json()), // We'll replace this below
  ]);

  // Sort by mainCategory → then subCategory → then stockCode

  products.sort((a, b) => {
    const mainA = a.mainCategory || "Uncategorized";
    const mainB = b.mainCategory || "Uncategorized";

    if (mainA !== mainB) {
      return mainA.localeCompare(mainB);
    }

    const subA = a.subCategory || "Uncategorized";
    const subB = b.subCategory || "Uncategorized";

    if (subA !== subB) {
      return subA.localeCompare(subB);
    }

    return (a.stockCode || "").localeCompare(b.stockCode || "");
  });

  // Instead, we fetch subcategories per main as needed
  const cachedSubCategories = {};

  function createDropdown(options, selectedValue) {
    const select = document.createElement("select");
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (opt === selectedValue) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }

  let count = 0;

  for (const product of products) {
    if (
      product.mainCategory &&
      product.subCategory &&
      product.mainCategory !== "Uncategorized" &&
      product.subCategory !== "Uncategorized"
    ) {
      continue;
    }

    count++; // ✅ Count how many are editable

    // (Your existing card creation code continues here...)

    const card = document.createElement("div");
    card.className = "product-card";

    const title = document.createElement("h3");
    title.textContent = `${product.stockCode} — ${product.name}`;
    card.appendChild(title);

    const categoryInfo = document.createElement("p");
    categoryInfo.innerHTML = `
  <strong>Main:</strong> ${product.mainCategory || "Uncategorized"}<br>
  <strong>Sub:</strong> ${product.subCategory || "Uncategorized"}
`;
    categoryInfo.style.marginBottom = "10px";
    categoryInfo.style.fontSize = "0.95em";
    categoryInfo.style.color = "#555";

    card.appendChild(categoryInfo);

    card.style.border = "1px solid #ccc";
    card.style.padding = "10px";
    card.style.marginBottom = "15px";

    const mainSelect = createDropdown(
      mainCategories,
      product.mainCategory || "Uncategorized"
    );

    const subSelect = document.createElement("select");
    subSelect.innerHTML = `<option>Loading...</option>`;
    subSelect.disabled = true;

    async function loadSubOptions(main) {
      if (!cachedSubCategories[main]) {
        const res = await fetch(`/api/categories-sub/${main}`);
        const subs = await res.json();
        cachedSubCategories[main] = subs;
      }
      const subs = cachedSubCategories[main];
      subSelect.innerHTML = "";
      subs.forEach((sub) => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        if (sub === product.subCategory) opt.selected = true;
        subSelect.appendChild(opt);
      });
      subSelect.disabled = false;
    }

    await loadSubOptions(mainSelect.value);

    mainSelect.addEventListener("change", () => {
      loadSubOptions(mainSelect.value);
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾 Save";
    saveBtn.style.marginLeft = "10px";

    saveBtn.addEventListener("click", () => {
      fetch("/api/update-product-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCode: product.stockCode,
          mainCategory: mainSelect.value,
          subCategory: subSelect.value,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update");
          return res.text();
        })
        .then((msg) => {
          // ✅ Optional: fade out before removal
          card.style.transition = "opacity 0.5s";
          card.style.opacity = "0.5";

          setTimeout(() => {
            card.remove();

            // ✅ Update the count and banner
            count--;
            const statsBox = document.getElementById("categoryStats");
            if (count > 0) {
              statsBox.textContent = `📝 ${count} products still need categorization.`;
            } else {
              statsBox.textContent = `🎉 All products are categorized!`;
            }
          }, 600);
        })
        .catch((err) => {
          const error = document.createElement("p");
          error.textContent = `❌ ${err.message}`;
          error.style.color = "red";
          error.style.marginTop = "5px";
          error.className = "confirmation";

          const existing = card.querySelector(".confirmation");
          if (existing) existing.remove();

          card.appendChild(error);
        });
    });
    card.appendChild(mainSelect);
    card.appendChild(subSelect);
    card.appendChild(saveBtn);

    productContainer.appendChild(card);
  }
  const statsBox = document.getElementById("categoryStats");
  if (count > 0) {
    statsBox.textContent = `📝 ${count} products still need categorization.`;
  } else {
    statsBox.textContent = `🎉 All products are categorized!`;
  }
});
