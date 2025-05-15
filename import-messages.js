const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to your SQLite DB
const dbPath = path.join(__dirname, "data", "messages.db");
const db = new sqlite3.Database(dbPath);

// Load the downloaded JSON file
const messages = JSON.parse(fs.readFileSync("imported-messages.json", "utf-8"));

let inserted = 0;

db.serialize(() => {
  messages.forEach((msg) => {
    db.run(
      `INSERT OR IGNORE INTO messages (name, email, message, date)
       VALUES (?, ?, ?, ?)`,
      [msg.name, msg.email, msg.message, msg.date],
      (err) => {
        if (err) {
          console.error("❌ Error inserting:", err.message);
        } else {
          inserted++;
        }
      }
    );
  });

  db.close(() => {
    console.log(`✅ Import complete. Inserted ${inserted} message(s).`);
  });
});
