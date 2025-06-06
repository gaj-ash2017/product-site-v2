function previewAddImage() {
  const input = document.querySelector('input[name="imageFile"]');
  const preview = document.getElementById("addImagePreview");
  preview.innerHTML = "";

  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.maxWidth = "150px";
      img.style.border = "1px solid #ccc";
      img.style.borderRadius = "4px";
      preview.appendChild(img);
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Submit form handler
document
  .getElementById("addProductForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const messageBox = document.getElementById("successMessage");
    messageBox.textContent = "Submitting...";

    const mainCategory = document.getElementById("mainCategory").value;
    const subCategory = document.getElementById("subCategory").value;
    formData.set("mainCategory", mainCategory);
    formData.set("subCategory", subCategory);

    fetch("/add-product", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const messageBox = document.getElementById("successMessage");

        let responseData;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          responseData = await res.json();
        } else {
          responseData = await res.text();
        }

        if (!res.ok) {
          const errorMsg =
            typeof responseData === "string"
              ? responseData
              : responseData.error || "Unknown error";
          throw new Error(errorMsg);
        }

        // If all good, show success
        messageBox.textContent =
          typeof responseData === "string"
            ? responseData
            : responseData.message || "✅ Product added!";
        messageBox.style.color = "green";

        form.reset();
        document.getElementById("addImagePreview").innerHTML = "";
      })
      .catch((err) => {
        const messageBox = document.getElementById("successMessage");
        messageBox.textContent = `⚠️ ${err.message}`;
        messageBox.style.color = "red";
        console.error("🚨 Error during add-product:", err);
      });
  });

// ✅ Load categories from categories.json (not products.json)
async function loadCategories() {
  try {
    const res = await fetch("/categories");
    if (!res.ok) throw new Error("Failed to fetch categories.");
    const categories = await res.json();
    const datalist = document.getElementById("categoryList");
    datalist.innerHTML = "";

    categories.sort((a, b) => a.localeCompare(b));
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      datalist.appendChild(opt);
    });
  } catch (err) {
    console.error("⚠️ Failed to load categories:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadCategories);

// main and sub categories'

document.addEventListener("DOMContentLoaded", () => {
  const mainSelect = document.getElementById("mainCategory");
  const subSelect = document.getElementById("subCategory");

  // Load main categories
  fetch("/api/categories-main")
    .then((res) => res.json())
    .then((mainCategories) => {
      mainSelect.innerHTML = "";
      mainCategories.forEach((main) => {
        const name = typeof main === "string" ? main : main.name;
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        mainSelect.appendChild(option);
      });
      loadSubcategories(mainSelect.value);
    });

  // Load subcategories when main changes
  mainSelect.addEventListener("change", () => {
    loadSubcategories(mainSelect.value);
  });

  function loadSubcategories(mainCategory) {
    fetch(`/api/categories-sub/${mainCategory}`)
      .then((res) => res.json())
      .then((subs) => {
        subSelect.innerHTML = "";
        subs.forEach((sub) => {
          const name = typeof sub === "string" ? sub : sub.name;
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          subSelect.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("❌ Failed to load sub-categories:", err);
      });
  }

  // Button handlers
  window.addMainCategory = () => {
    const newMain = prompt("Enter new main category:");
    if (!newMain) return;
    fetch("/api/categories-main", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newMain }),
    }).then((res) => {
      if (!res.ok) return res.json().then((err) => alert(err.error));
      location.reload();
    });
  };

  window.addSubCategory = () => {
    const main = mainSelect.value;
    const newSub = prompt(`Add subcategory to "${main}":`);
    if (!newSub) return;
    fetch("/api/categories-sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ main, newSub }),
    }).then((res) => {
      if (!res.ok) return res.json().then((err) => alert(err.error));
      loadSubcategories(main);
    });
  };
});
