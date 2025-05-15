function loadCategories(selectedCategory) {
  fetch("/categories.json")
    .then((res) => res.json())
    .then((categories) => {
      const select = document.getElementById("category");

      const sorted = categories.sort((a, b) => {
        if (a.toLowerCase() === "uncategorized") return -1;
        if (b.toLowerCase() === "uncategorized") return 1;
        return a.localeCompare(b);
      });

      sorted.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selectedCategory) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to load categories:", err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const stockCode = new URLSearchParams(window.location.search).get(
    "stockCode"
  );
  if (!stockCode) {
    document.body.innerHTML = "<h3>❌ No stockCode provided in URL.</h3>";
    return;
  }

  fetch("/products.json")
    .then((res) => res.json())
    .then((products) => {
      const product = products.find((p) => p.stockCode === stockCode);
      if (!product) {
        document.body.innerHTML = "<h3>❌ Product not found.</h3>";
        return;
      }

      console.log("🧩 Image field from product:", product.image);

      document.querySelector(
        "#productTitle"
      ).textContent = `🛠️ Edit: ${product.name} (${product.stockCode})`;
      document.querySelector("#stockCode").value = product.stockCode || "";
      document.querySelector("#name").value = product.name || "";
      document.querySelector("#description").value = product.description || "";
      document.querySelector("#category").value = product.category || "";
      loadCategories(product.category);
      document.querySelector("#extraNotes").value = product.extraNotes || "";
      document.querySelector("#quantity").value = product.quantity || 0;

      document.querySelector(
        "#productTitle"
      ).textContent = `🛠️ Edit: ${product.name} (${product.stockCode})`;
      document.querySelector("#stockCode").value = product.stockCode || "";
      document.querySelector("#name").value = product.name || "";
      document.querySelector("#description").value = product.description || "";
      document.querySelector("#category").value = product.category || "";
      document.querySelector("#extraNotes").value = product.extraNotes || "";
      document.querySelector("#quantity").value = product.quantity || 0;

      // ✅ Show current image preview
      const image = product.image?.trim() || "default.jpg";
      const preview = document.getElementById("currentImagePreview");
      preview.innerHTML = `
  <img src="/uploads/${image}" alt="${product.name}" style="max-width: 150px; border: 1px solid #ccc; border-radius: 8px;" onerror="this.src='/uploads/default.jpg';">
`;
    })
    .catch((err) => {
      console.error("❌ Failed to load product data", err);
      document.body.innerHTML = "<h3>❌ Failed to load product data.</h3>";
    });

    document.getElementById("editForm").addEventListener("submit", (e) => {
      e.preventDefault();

      const form = e.target;
      const formData = new FormData(form);
      const fileInput = document.getElementById("imageFile");
      const productImage = document.getElementById("productImage");

      fetch("/edit-product", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.text())
        .then((msg) => {
          alert(msg);

          // ✅ If image was uploaded, update preview
          if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (e) {
              productImage.src = e.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
          }

          // ✅ Reset form fields
          form.reset();

          // ✅ Optionally set the preview back to default if no new image
          if (fileInput.files.length === 0) {
            productImage.src = "/uploads/default.jpg";
          }
        })
        .catch((err) => {
          alert("❌ Failed to save changes.");
          console.error(err);
        });
    });
});

document.getElementById("imageFile").addEventListener("change", function () {
  const fileInput = this;
  const preview = document.getElementById("productImage");

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.opacity = 0;
      setTimeout(() => {
        preview.style.opacity = 1;
      }, 100); // simple fade-in
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
});
