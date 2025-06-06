document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/unused-stockcodes")
    .then((res) => res.json())
    .then((unused) => {
      const list = document.getElementById("unusedList");
      if (unused.length === 0) {
        list.innerHTML = `<li style="text-align: center;">No unused stock codes found ✅</li>`;
        return;
      }

      unused.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${item.stockCode || "(blank)"}</span>
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
        const deleted = result.deleted || [];
        const deletedDiv = document.getElementById("deletedList");

        if (deleted.length === 0) {
          deletedDiv.innerHTML =
            "<p style='text-align:center'>No stock codes were deleted ✅</p>";
          return;
        }

        // Show results
        deletedDiv.innerHTML = `
          <h3>✅ ${deleted.length} Stock Code${
          deleted.length > 1 ? "s" : ""
        } Deleted</h3>
          <ul>${deleted
            .map((code) => `<li>${code || "(blank)"}</li>`)
            .join("")}</ul>
        `;

        // ✅ SAVE TO LOG FILE
        fetch("/api/save-cleanup-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: "deleted-stockcodes",
            items: deleted,
          }),
        })
          .then((res) => res.text())
          .then((msg) => console.log("✅ Server response:", msg))
          .catch((err) => console.error("❌ Save log failed", err));

        // Optional: Clear the unused list
        document.getElementById("unusedList").innerHTML = "";
      });
  });
});

function deleteOne(stockCode) {
  if (!confirm(`Delete product with stock code: ${stockCode}?`)) return;
  fetch(`/api/delete-product-by-stockcode/${stockCode}`, {
    method: "DELETE",
  }).then(() => location.reload());
}
