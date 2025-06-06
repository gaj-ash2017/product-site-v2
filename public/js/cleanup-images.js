document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("cleanupImagesBtn");
  const output = document.getElementById("deletedImagesList");

  btn.addEventListener("click", () => {
    if (!confirm("Delete all unused uploaded images?")) return;

    fetch("/cleanup-unused-images", { method: "POST" })
      .then((res) => res.json())
      .then((result) => {
        const deleted = result.deleted || [];

        if (deleted.length === 0) {
          output.innerHTML =
            "<p style='text-align:center;'>No unused images found ✅</p>";
          return;
        }

        output.innerHTML = `
          <h3>🧼 ${deleted.length} Image${
          deleted.length > 1 ? "s" : ""
        } Deleted</h3>
          <ul>${deleted.map((file) => `<li>${file}</li>`).join("")}</ul>
        `;
        document.getElementById("exitSection").style.display = "block";

        // ✅ Send log to server
        fetch("/api/save-cleanup-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: "deleted-images",
            items: deleted,
          }),
        })
          .then((res) => res.text())
          .then((msg) => console.log("✅ Server response:", msg))
          .catch((err) => console.error("❌ Save image log failed", err));
      });
  });
});

function exitCleanup() {
  window.location.href = "admin-dashboard.html"; // Or wherever you want to go
}
