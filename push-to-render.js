const fs = require("fs");
const fetch = require("node-fetch"); // install via npm install node-fetch@2

const messages = JSON.parse(fs.readFileSync("imported-messages.json", "utf-8"));

fetch("https://product-site-v2.onrender.com/import-messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(messages),
})
  .then((res) => res.text())
  .then((msg) => console.log("✅", msg))
  .catch((err) => console.error("❌ Upload failed:", err));
