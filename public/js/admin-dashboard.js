// ✅ admin-dashboard.js (Updated with correct empty category logic)

console.log("✅ admin-dashboard.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  fetch("/products.json")
    .then((res) => res.json())
    .then((products) => {
      // ✅ Total Products
      document.getElementById("totalProducts").textContent = products.length;

      // ✅ Total Categories
      const categories = [
        ...new Set(products.map((p) => p.category).filter(Boolean)),
      ];
      document.getElementById("categoryCount").textContent = categories.length;

      // ✅ No Image Count
      const noImageItems = products.filter(
        (p) => !p.image || p.image.trim() === ""
      );
      document.getElementById("noImageCount").textContent = noImageItems.length;

      // ✅ Uncategorized Count (actual label = "Uncategorized")
      const uncategorized = products.filter(
        (p) => p.category?.toLowerCase() === "uncategorized"
      );
      document.getElementById("uncategorizedCount").textContent =
        uncategorized.length;

      // ✅ Empty Description
      const emptyDescriptions = products.filter(
        (p) => !p.description || p.description.trim() === ""
      );
      document.getElementById("emptyDescriptionCount").textContent =
        emptyDescriptions.length;

      // ✅ Correct Empty Category (missing or blank only)
      // ✅ Split between blank and labeled "Uncategorized"
const emptyCategories = products.filter(
  (p) => !p.category || p.category.trim() === ""
);

const labeledUncategorized = products.filter(
  (p) => p.category?.toLowerCase() === "uncategorized"
);

// Update dashboard with only truly empty ones
document.getElementById("emptyCategoryCount").textContent = emptyCategories.length;

// Optional: log both for debugging
console.log("🧪 Empty Category Count (blank):", emptyCategories.length);
console.log("🧾 Labeled as 'Uncategorized':", labeledUncategorized.length);
    })
    .catch((err) => {
      console.error("❌ Failed to load product stats", err);
    });

  // ✅ Last Cleanup Time from logs/deleted-images.txt
  fetch("/logs/deleted-images.txt")
    .then((res) => res.text())
    .then((text) => {
      const lines = text.trim().split("\n");
      const header = lines.find((line) => line.startsWith("---"));
      const time = header?.replace(/---\s*/, "") || "Unknown";
      document.getElementById("cleanupTimeText").textContent = time;
    })
    .catch(() => {
      document.getElementById("cleanupTimeText").textContent = "Unknown";
    });

  // ✅ Message Count
  fetch("/messages/count")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("messageCount").textContent = data.count;
    })
    .catch(() => {
      document.getElementById("messageCount").textContent = "--";
    });

  // ✅ Load Unused Image Count
  // ✅ Load most recent Unused Image Count
  fetch("/logs/deleted-images.txt")
    .then((res) => res.text())
    .then((text) => {
      console.log("🧾 Raw Log:\n", text);

      const lines = text.trim().split("\n");
      let lastHeaderIndex = -1;

      // Find last cleanup block
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith("---")) {
          lastHeaderIndex = i;
          break;
        }
      }

      const recentImages = lines
        .slice(lastHeaderIndex + 1)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("---"));

      console.log("📦 Images found after last header:", recentImages);

      document.getElementById(
        "unusedImages"
      ).textContent = `${recentImages.length} image(s)`;

      const header = lines[lastHeaderIndex] || "";
      const time = header.replace(/---\s*/, "") || "Unknown";
      document.getElementById("cleanupTimeText").textContent = time;
    })
    .catch((err) => {
      console.error("❌ Failed to load image log", err);
      document.getElementById("unusedImages").textContent = "--";
      document.getElementById("cleanupTimeText").textContent = "Unknown";
    });
  // ✅ Load Unused Stock Code Count
  // ✅ Load Unused Stock Code Count from logs
  // ✅ Count actual deleted stock codes (ignoring "No stock codes..." messages)
  // ✅ Only count deleted stock codes from the latest log block
  fetch("/logs/deleted-stockcodes.txt")
    .then((res) => res.text())
    .then((text) => {
      const lines = text.trim().split("\n");
      const blocks = [];
      let currentBlock = [];

      for (let line of lines) {
        if (line.startsWith("---")) {
          if (currentBlock.length) blocks.push(currentBlock);
          currentBlock = [];
        } else {
          currentBlock.push(line);
        }
      }
      if (currentBlock.length) blocks.push(currentBlock);

      const latest = blocks[blocks.length - 1] || [];

      const validCodes = latest.filter(
        (line) =>
          line.trim() &&
          !line.toLowerCase().includes("no stock codes") &&
          !line.startsWith("---")
      );

      document.getElementById(
        "unusedStockCodes"
      ).textContent = `${validCodes.length} code(s)`;
    })
    .catch(() => {
      document.getElementById("unusedStockCodes").textContent = "--";
    });

  // ✅ Show actual unused image count based on uploads folder vs products.json
  Promise.all([
    fetch("/uploads").then((res) => res.json()),
    fetch("/products.json").then((res) => res.json()),
  ])
    .then(([uploadedImages, products]) => {
      const used = new Set(products.map((p) => p.image).filter(Boolean));
      const unused = uploadedImages.filter(
        (img) => img !== "default.jpg" && !used.has(img)
      );
      document.getElementById(
        "unusedImages"
      ).textContent = `${unused.length} image(s)`;
    })
    .catch(() => {
      document.getElementById("unusedImages").textContent = "--";
    });
});
