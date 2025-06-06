document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    const tabId = button.getAttribute("data-tab");

    // Toggle active tab
    document.querySelectorAll(".tab-button").forEach((btn) =>
      btn.classList.remove("active")
    );
    button.classList.add("active");

    // Toggle tab panels
    document.querySelectorAll(".tab-panel").forEach((panel) =>
      panel.classList.remove("active")
    );
    document.getElementById(tabId).classList.add("active");
  });
});