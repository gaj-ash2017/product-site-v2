document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  fetch("/submit-contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => res.text())
    .then((msg) => {
      document.getElementById("contactStatus").textContent = msg;
      this.reset();
    })
    .catch((err) => {
      document.getElementById("contactStatus").textContent =
        "❌ Failed to send message.";
    });
});
