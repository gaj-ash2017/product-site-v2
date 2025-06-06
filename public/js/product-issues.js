console.log("✅ product-issues.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded");

  fetch("/products.json")
    .then((res) => res.json())
    .then((products) => {
      console.log("✅ Products fetched:", products);

      const descriptionIssues = products.filter((p) => !p.description?.trim());

      const categoryIssues = products.filter(
        (p) =>
          !p.category || p.category.trim().toLowerCase() === "uncategorized"
      );

      console.log("⚠️ Empty Descriptions:", descriptionIssues.length);
      console.log("⚠️ Empty Categories:", categoryIssues.length);

      populateIssueList("descriptionIssuesList", descriptionIssues);
      populateIssueList("categoryIssuesList", categoryIssues);

      scrollToPanelFromHash();
    })
    .catch((err) => {
      console.error("❌ Failed to load products.json", err);
    });
});

function populateIssueList(containerId, items) {
  const ul = document.getElementById(containerId);
  if (!ul) return;
  ul.innerHTML = "";

  if (items.length === 0) {
    ul.innerHTML = "<li>No issues found 🎉</li>";
    return;
  }

  items.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
  <a href="edit-product.html?stockCode=${p.stockCode}" class="issue-link">
    <span class="stock-code">${p.stockCode}</span>
    <span class="product-name">${p.name}</span>
  </a>
`;
    ul.appendChild(li);
  });
}

function scrollToPanelFromHash() {
  const hash = window.location.hash?.replace("#", "");
  if (hash && document.getElementById(hash)) {
    document.getElementById(hash).scrollIntoView({ behavior: "smooth" });
  }
}
