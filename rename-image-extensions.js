const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "public", "uploads");

fs.readdir(uploadsDir, (err, files) => {
  if (err) return console.error("❌ Failed to read uploads directory", err);

  let renamed = 0;

  files.forEach((file) => {
    if (file.toLowerCase().endsWith(".jpeg")) {
      const oldPath = path.join(uploadsDir, file);
      const newFile = file.replace(/\.jpeg$/i, ".jpg");
      const newPath = path.join(uploadsDir, newFile);

      fs.renameSync(oldPath, newPath);
      renamed++;
    }
  });

  console.log(`✅ Renamed ${renamed} .jpeg file(s) to .jpg`);
});