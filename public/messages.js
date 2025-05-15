fetch("/messages-list")
  .then((res) => res.json())
  .then((messages) => {
    const tbody = document.querySelector("#messageTable tbody");

    messages.reverse().forEach((msg) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${msg.name}</td>
        <td><a href="mailto:${msg.email}">${msg.email}</a></td>
        <td>${msg.message}</td>
        <td>${new Date(msg.date).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to load messages.json", err);
    document.body.innerHTML = "<h3>❌ Could not load messages.</h3>";
  });
