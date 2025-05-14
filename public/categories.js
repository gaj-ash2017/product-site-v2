async function fetchCategories() {
  const res = await fetch("/categories");
  const categories = await res.json();
  const container = document.getElementById("categoryList");
  container.innerHTML = "";

  categories.sort((a, b) => a.localeCompare(b)); // ✅ sort alphabetically

  categories.forEach((category) => {
    const div = document.createElement("div");
    div.className = "category-item";

    const input = document.createElement("input");
    input.value = category;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) return alert("Enter new name");
      const res = await fetch("/edit-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldCategory: category,
          newCategory: newName,
        }),
      });
      alert(await res.text());
      fetchCategories();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = async () => {
      if (!confirm(`Delete category "${category}"?`)) return;
      const res = await fetch("/delete-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category }),
      });
      alert(await res.text());
      fetchCategories();
    };

    div.appendChild(input);
    div.appendChild(editBtn);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}

document
  .getElementById("addCategoryForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("newCategoryInput");
    const name = input.value.trim();
    if (!name) return;
    const res = await fetch("/add-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: name }), // 🔥 Consistent key
    });
    alert(await res.text());
    input.value = "";
    fetchCategories();
  });

fetchCategories();
