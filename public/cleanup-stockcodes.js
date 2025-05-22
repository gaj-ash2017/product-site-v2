document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/unused-stockcodes")
    .then((res) => res.json())
    .then((unused) => {
      const list = document.getElementById("unusedList");
      if (unused.length === 0) {
        list.innerHTML = "<li>No unused stock codes found ✅</li>";
        return;
      }

      unused.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${item.stockCode}</span>
            <button onclick="deleteOne('${item.stockCode}')">Delete</button>`;
        list.appendChild(li);
      });
    });

  document.getElementById("deleteAllBtn").addEventListener("click", () => {
    if (
      !confirm(
        "Are you sure you want to delete all unused stock code products?"
      )
    )
      return;

    fetch("/api/cleanup-unused-stockcodes", { method: "POST" })
      .then((res) => res.json())
      .then((result) => {
        const deletedDiv = document.getElementById("deletedList");
        const deleted = result.deleted || [];

        if (deleted.length === 0) {
          deletedDiv.innerHTML = "<p>No stock codes were deleted ✅</p>";
          return;
        }

        // Build summary and list
        deletedDiv.innerHTML = `
          <h3>✅ ${deleted.length} Stock Code${
          deleted.length > 1 ? "s" : ""
        } Deleted</h3>
          <ul>${deleted
            .map((code) => `<li>${code || "(blank)"}</li>`)
            .join("")}</ul>
        `;

        // Add download button using JS
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "📄 Download List";
        downloadBtn.addEventListener("click", () => {
          downloadList("deleted-stockcodes", deleted);
        });
        deletedDiv.appendChild(downloadBtn);

        document.getElementById("unusedList").innerHTML = "";
      });
  });

  // ✅ Download helper (fixed version)
  function downloadList(title, items) {
    fetch("/api/save-cleanup-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: title, items }),
    })
      .then((res) => res.text())
      .then((msg) => alert(msg))
      .catch(() => alert("❌ Failed to save log to server."));
  }
});

// 🔁 Existing deleteOne stays the same
function deleteOne(stockCode) {
  if (!confirm(`Delete product with stock code: ${stockCode}?`)) return;
  fetch(`/api/delete-product-by-stockcode/${stockCode}`, {
    method: "DELETE",
  }).then(() => location.reload());
}

// 🖼️ Unused image cleanup inline button
/* document
  .getElementById("cleanupImagesInlineBtn")
  .addEventListener("click", () => {
    if (!confirm("Delete all unused uploaded images?")) return;

    fetch("/cleanup-unused-images", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((result) => {
        const div = document.getElementById("inlineImageResult");
        if (result.deleted.length === 0) {
          div.innerHTML = "<p>No unused images found ✅</p>";
        } else {
          div.innerHTML = `
          <h3>🧼 Deleted Images:</h3>
          <ul>${result.deleted.map((img) => `<li>${img}</li>`).join("")}</ul>
        `;
        }
      });
  }); */
