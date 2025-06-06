// ✅ import-export.js (frontend)
document.addEventListener("DOMContentLoaded", () => {
  // Export CSV button
  document.getElementById("exportCSVBtn").addEventListener("click", async () => {
    try {
      const res = await fetch("/export-csv");
      const csvText = await res.text();

      const blob = new Blob([csvText], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `products-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("❌ Failed to export CSV.");
      console.error(err);
    }
  });

  // Import CSV form
  document.getElementById("importCSVForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("csvFileInput");
    const file = input.files[0];

    if (!file || !file.name.endsWith(".csv")) {
      return alert("❌ Please select a valid CSV file.");
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const text = e.target.result;
      const rows = text.trim().split("\n");
      const headers = rows.shift().split(";").map((h) => h.trim());

      const expected = [
        "stockCode",
        "maskedCode",
        "name",
        "description",
        "category",
        "mainCategory",
        "subCategory",
        "extraNotes",
        "quantity",
        "dateAdded",
        "image"
      ];

      const missing = expected.filter((h) => !headers.includes(h));
      if (missing.length > 0) {
        document.getElementById("importResult").innerText = "❌ Invalid CSV format. Please check column headers.";
        return;
      }

      const newProducts = rows.map((line) => {
        const values = line.split(";").map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
        const obj = {};
        headers.forEach((key, i) => obj[key] = values[i] || "");
        obj.quantity = parseInt(obj.quantity) || 0;
        return obj;
      });

      try {
        const res = await fetch("/import-products-merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: newProducts }),
        });

        const msg = await res.text();
        document.getElementById("importResult").innerText = msg;
      } catch (err) {
        console.error("❌ Import failed:", err);
        document.getElementById("importResult").innerText = "❌ Import failed.";
      }
    };

    reader.readAsText(file);
  });
});