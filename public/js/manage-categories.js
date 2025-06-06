document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
});

// Load both main and sub-categories
async function loadCategories() {
  try {
    const [mainRes, subRes] = await Promise.all([
      fetch("/api/categories-main"),
      fetch("/api/categories-sub"),
    ]);

    let mainCategories = await mainRes.json();
    mainCategories = mainCategories.map((m) =>
      typeof m === "string" ? { name: m } : m
    );

    const subCategories = await subRes.json();

    console.log("✅ mainCategories:", mainCategories);
    console.log("✅ subCategories:", subCategories);

    if (!Array.isArray(mainCategories) || !Array.isArray(subCategories)) {
      throw new Error("Categories not in expected format");
    }

    renderMainCategories(mainCategories);
    populateMainDropdown(mainCategories);
    renderSubCategories(subCategories);

  } catch (err) {
    console.error("⚠️ Failed to load categories:", err);
  }
}

// Render main category list
function renderMainCategories(mains) {
  const list = document.getElementById("mainCategoryList");
  list.innerHTML = "";

  mains
    .slice()
    .sort((a, b) => {
      const aName = a.name || a;
      const bName = b.name || b;
      return aName.localeCompare(bName);
    })
    .forEach((main) => {
      const name = main.name || main;
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${name}</span>
        <button class="edit-main" data-name="${name}">✏️</button>
        <button class="delete-main" data-name="${name}">🗑️</button>
      `;
      list.appendChild(li);
    });

  document.querySelectorAll(".edit-main").forEach((btn) =>
    btn.addEventListener("click", handleEditMainCategory)
  );
  document.querySelectorAll(".delete-main").forEach((btn) =>
    btn.addEventListener("click", handleDeleteMainCategory)
  );
}

// Render sub-category list
function renderSubCategories(subs) {
  const list = document.getElementById("subCategoryList");
  list.innerHTML = "";

  if (!Array.isArray(subs)) return console.error("⚠️ subCategories not array");

  const allMainOptions = Array.from(
    document.getElementById("subMainCategorySelect").options
  )
    .map((opt) => opt.value)
    .filter((v) => v);

  const grouped = {};
  subs.forEach((sub) => {
    if (!grouped[sub.mainCategory]) {
      grouped[sub.mainCategory] = [];
    }
    grouped[sub.mainCategory].push(sub);
  });

  const sortedMains = allMainOptions.sort((a, b) => a.localeCompare(b));

  sortedMains.forEach((main) => {
    const hasSubs = grouped[main]?.length > 0;
    const groupHeader = document.createElement("h3");
    groupHeader.textContent = hasSubs
      ? `🔹 ${main}`
      : `🔹 ${main} (no sub-categories)`;
    list.appendChild(groupHeader);

    if (hasSubs) {
      grouped[main]
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((sub) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <span>${sub.name} — ${sub.mainCategory}</span>
            <button class="edit-sub" data-id="${sub.id}">✏️</button>
            <button class="delete-sub" data-id="${sub.id}">🗑️</button>
          `;
          list.appendChild(li);
        });
    }
  });

  document.querySelectorAll(".edit-sub").forEach((btn) =>
    btn.addEventListener("click", handleEditSubCategory)
  );
  document.querySelectorAll(".delete-sub").forEach((btn) =>
    btn.addEventListener("click", handleDeleteSubCategory)
  );
}

async function handleEditSubCategory(e) {
  const id = e.target.dataset.id;
  const li = e.target.closest("li");
  const currentText = li.querySelector("span").textContent;
  const [nameOnly] = currentText.split(" — ");

  const input = document.createElement("input");
  input.value = nameOnly.trim();
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "❌";

  li.innerHTML = "";
  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);

  saveBtn.addEventListener("click", async () => {
    const updatedName = input.value.trim();
    if (!updatedName) return alert("Name cannot be empty");

    try {
      const res = await fetch(`/api/categories-sub/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: updatedName }),
      });
      const result = await res.json();
      if (result.success) await loadCategories();
      else alert("❌ Failed to update: " + (result.error || "Unknown"));
    } catch (err) {
      alert("❌ Update error: " + err.message);
    }
  });

  cancelBtn.addEventListener("click", loadCategories);
}

async function handleDeleteSubCategory(e) {
  const id = e.target.dataset.id;
  if (!confirm("Are you sure you want to delete this sub-category?")) return;

  try {
    const res = await fetch(`/api/categories-sub/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) await loadCategories();
    else alert("❌ Delete failed: " + (result.error || "Unknown"));
  } catch (err) {
    alert("❌ Delete error: " + err.message);
  }
}

function handleEditMainCategory(e) {
  const oldName = e.target.dataset.name;
  const li = e.target.closest("li");

  const input = document.createElement("input");
  input.value = oldName;
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾";
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "❌";

  li.innerHTML = "";
  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);

  saveBtn.addEventListener("click", async () => {
    const newName = input.value.trim();
    if (!newName) return;

    try {
      const res = await fetch("/api/categories-main/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      });
      const result = await res.json();
      if (result.success) await loadCategories();
      else alert("❌ Rename failed: " + (result.error || "Unknown"));
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  });

  cancelBtn.addEventListener("click", loadCategories);
}

async function handleDeleteMainCategory(e) {
  const name = e.target.dataset.name;
  if (!confirm(`Delete main category "${name}" and all its sub-categories?`))
    return;

  try {
    const res = await fetch(`/api/categories-main/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (result.success) {
      alert(`✅ Deleted "${name}" (${result.removed} sub-categories removed)`);
      await loadCategories();
    } else {
      alert("❌ Failed to delete main category");
    }
  } catch (err) {
    alert("❌ Error deleting main category: " + err.message);
  }
}

function populateMainDropdown(mains) {
  const select = document.getElementById("subMainCategorySelect");
  select.innerHTML = `<option value="">-- Select Main Category --</option>`;

  mains
    .slice()
    .sort((a, b) => a.name?.localeCompare(b.name || a.localeCompare(b)))
    .forEach((main) => {
      const name = main.name || main;
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
}

document.getElementById("addMainCategory").addEventListener("click", async () => {
  const input = document.getElementById("newMainCategory");
  const newMain = input.value.trim();
  if (!newMain) return;

  try {
    const res = await fetch("/api/categories-main", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newMain }),
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Main category added!");
      input.value = "";
      await loadCategories();
    } else {
      alert("❌ Failed to add main category: " + (result.error || "Unknown"));
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

document.getElementById("addSubCategory").addEventListener("click", async () => {
  const main = document.getElementById("subMainCategorySelect").value;
  const newSub = document.getElementById("newSubCategory").value.trim();

  if (!main || !newSub) {
    alert("Please select a main category and enter a sub-category.");
    return;
  }

  try {
    const response = await fetch("/api/categories-sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mainCategory: main, newSub }),
    });

    const result = await response.json();
    if (result.success) {
      alert("✅ Sub-category added!");
      document.getElementById("newSubCategory").value = "";
      await loadCategories();
    } else {
      alert("❌ Failed to add sub-category: " + (result.error || "Unknown"));
    }
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

document.getElementById("fixMainCategories").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/fix-categories-main", {
      method: "POST",
    });
    const result = await res.json();
    if (result.success) {
      alert(`✅ Fixed ${result.count} entries`);
      await loadCategories();
    } else {
      alert("❌ Fix failed: " + (result.error || "Unknown"));
    }
  } catch (err) {
    alert("❌ Fix error: " + err.message);
  }
});

document.getElementById("cleanupSubCategories")?.addEventListener("click", async () => {
  if (!confirm("Remove invalid sub-categories?")) return;

  try {
    const res = await fetch("/api/cleanup-sub-categories", { method: "POST" });
    const result = await res.json();
    if (result.success) {
      alert(`✅ Removed ${result.removed} invalid sub-categories`);
      await loadCategories();
    } else {
      alert("❌ Cleanup failed: " + (result.error || "Unknown"));
    }
  } catch (err) {
    alert("❌ Cleanup error: " + err.message);
  }
});