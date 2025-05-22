document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("cleanupImagesBtn");
  const output = document.getElementById("deletedImagesList");

  btn.addEventListener("click", () => {
    if (!confirm("Delete all unused uploaded images?")) return;

    fetch("/cleanup-unused-images", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((result) => {
        const deleted = result.deleted || [];
        output.innerHTML = ""; // Clear previous content

        if (deleted.length === 0) {
          output.innerHTML = "<p>No unused images found ✅</p>";
          return;
        }

        // Heading
        const heading = document.createElement("h3");
        heading.textContent = `🧼 ${deleted.length} Image${
          deleted.length > 1 ? "s" : ""
        } Deleted`;

        // List
        const ul = document.createElement("ul");
        deleted.forEach((img) => {
          const li = document.createElement("li");
          li.textContent = img;
          ul.appendChild(li);
        });

        // Save log button
        const logBtn = document.createElement("button");
        logBtn.textContent = "📄 Save Log to Server";
        logBtn.addEventListener("click", () => {
          saveToLog("deleted-images", deleted);
        });

        // Append to page
        output.appendChild(heading);
        output.appendChild(ul);
        output.appendChild(logBtn);
      });
  });
});

// Save deleted list to server-side logs folder
function saveToLog(filename, items) {
  fetch("/api/save-cleanup-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, items }),
  })
    .then((res) => res.text())
    .then((msg) => alert(msg))
    .catch(() => alert("❌ Failed to save log to server."));
}
