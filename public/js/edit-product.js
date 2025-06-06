console.log("✅ edit-product.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const stockCode = new URLSearchParams(window.location.search).get(
    "stockCode"
  );
  console.log("🛰️ Extracted stockCode:", stockCode);

  if (!stockCode) {
    document.body.innerHTML = "<h3>❌ No stockCode provided in URL.</h3>";
    return;
  }

  const product = await loadProduct(stockCode);
  console.log("🔍 Product fetched:", product);

  if (!product) {
    document.body.innerHTML = "<h3>❌ Product not found.</h3>";
    return;
  }

  populateForm(product);
  await populateMainAndSubWithTomSelect(
    product.mainCategory,
    product.subCategory
  );

  // Attach image preview listener
  document.getElementById("imageFile").addEventListener("change", function () {
    const newPreview = document.getElementById("newImagePreview");
    newPreview.innerHTML = "";

    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "150px";
        img.style.border = "1px solid #ccc";
        img.style.borderRadius = "4px";
        newPreview.appendChild(img);
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

  // ✅ FRONTEND: edit-product.js (form submission)

document.getElementById("editProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  try {
    const res = await fetch("/edit-product", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("❌ Failed to save product");

    const data = await res.json();
    alert(data.message || "✅ Product updated");
    window.location.href = "products-edit.html";
  } catch (err) {
    console.error("❌ Error while updating:", err);
    alert("❌ Could not save product");
  }
});
});

async function loadProduct(stockCode) {
  try {
    const res = await fetch("/products.json");
    const products = await res.json();
    return products.find((p) => p.stockCode === stockCode);
  } catch (err) {
    console.error("❌ Failed to load product:", err);
    return null;
  }
}

function populateForm(product) {
  document.querySelector("#stockCode").value = product.stockCode || "";
  document.querySelector("#name").value = product.name || "";
  document.querySelector("#description").value = product.description || "";
  document.querySelector("#extraNotes").value = product.extraNotes || "";
  document.querySelector("#quantity").value = product.quantity || 0;
  document.getElementById("editCategoryInput").value = product.category || "";

  const image = product.image?.trim() || "default.jpg";
  document.getElementById("currentImagePreview").innerHTML = `
    <img src="/uploads/${image}" alt="${product.name}" 
         style="max-width: 150px; border-radius: 8px; border: 1px solid #ccc"
         onerror="this.src='/uploads/default.jpg';">
  `;
}

async function populateMainAndSubWithTomSelect(currentMain, currentSub) {
  try {
    const [mainRes, subRes] = await Promise.all([
      fetch("/data/categories-main.json").then((res) => res.json()),
      fetch("/data/categories-sub.json").then((res) => res.json()),
    ]);
    const allMainCategories = mainRes;
    const allSubCategories = subRes;

    const mainSelect = document.getElementById("editMainCategory");
    const subSelect = document.getElementById("editSubCategory");

    mainSelect.innerHTML = `<option value="">Select Main Category</option>`;
    subSelect.innerHTML = `<option value="">Select Sub Category</option>`;
    subSelect.disabled = true;

    allMainCategories
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = cat.name;
        mainSelect.appendChild(opt);
      });

    const mainTom = new TomSelect("#editMainCategory", {
      placeholder: "Select Main Category",
      onChange(value) {
        updateSubDropdown(value, allSubCategories, currentSub);
      },
    });

    const subTom = new TomSelect("#editSubCategory", {
      placeholder: "Select Sub Category",
      create: false,
    });

    if (currentMain) mainTom.setValue(currentMain);
    if (currentSub) {
      updateSubDropdown(currentMain, allSubCategories, currentSub);
    }

    function updateSubDropdown(mainVal, allSubs, selectedSub) {
      subTom.clearOptions();
      if (!mainVal) {
        subTom.disable();
        return;
      }
      const filtered = allSubs.filter((s) => s.mainCategory === mainVal);
      filtered.forEach((sub) => {
        subTom.addOption({ value: sub.name, text: sub.name });
      });
      subTom.enable();
      subTom.refreshOptions(false);
      if (selectedSub) subTom.setValue(selectedSub);
    }
  } catch (err) {
    console.error("❌ Failed to load dropdowns:", err);
  }
}
