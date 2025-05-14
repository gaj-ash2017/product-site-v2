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

    fetch("/add-product", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(text);
          });
        }
        return res.text();
      })
      .then((msg) => {
        messageBox.textContent = msg;
        messageBox.style.color = "green";

        const newCategory = form.category.value.trim();
        const datalist = document.getElementById("categoryList");
        const existingOptions = Array.from(datalist.options).map((opt) =>
          opt.value.toLowerCase()
        );

        if (
          newCategory &&
          !existingOptions.includes(newCategory.toLowerCase())
        ) {
          const option = document.createElement("option");
          option.value = newCategory;
          datalist.appendChild(option);
        }

        form.reset();
        document.getElementById("addImagePreview").innerHTML = "";
      })
      .catch((err) => {
        messageBox.textContent = `⚠️ ${err.message}`;
        messageBox.style.color = "red";
        console.error(err);
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
