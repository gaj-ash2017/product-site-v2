document.getElementById("importForm").addEventListener("submit", function (e) {
  const fileInput = document.getElementById("csvfile");
  const feedback = document.getElementById("feedback");

  if (!fileInput.files.length) {
    e.preventDefault();
    feedback.textContent = "⚠️ Please choose a CSV file first.";
    feedback.style.color = "red";
    return;
  }

  feedback.textContent = "Uploading...";
  feedback.style.color = "black";
});
