document.addEventListener("DOMContentLoaded", () => {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  navbarContainer.innerHTML = `
    <header class="site-header">
      <div class="logo-area">
        <img src="./images/9800i.jpeg" alt="Logo" class="logo" />
        <div class="company-name">
          <div>Ashwin Gajan</div>
          <div>T/A Just Parts</div>
          <div>Heavy Duty Spares</div>
        </div>
        <div class="hamburger-controls">
  <div class="hamburger" id="hamburger">&#9776;</div>
  <div class="close-menu" id="closeMenu">&times;</div>
</div>
      </div>
    </header>

    <nav class="main-navbar" id="mainNavbar">
      <ul class="navbar-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="our-contact-details.html">Our Details</a></li>
        <li><a href="products.html">Products</a></li>
        <li><a href="add-products.html" class="admin-only">Add Product</a></li>
        <li><a href="import-products.html" class="admin-only">Import Products</a></li>
        <li><a href="products-edit.html" class="admin-only">Admin</a></li>
        <li><a href="categories.html" class="admin-only">Category Admin</a></li>
        <li><a href="messages.html" class="admin-only">View Messages</a></li>
      </ul>
    </nav>
    <div class="spacer"></div>
  `;

  const hamburger = document.getElementById("hamburger");
  const closeMenu = document.getElementById("closeMenu");
  const menu = document.querySelector(".navbar-menu");

  // Show menu
  hamburger?.addEventListener("click", () => {
    menu.classList.add("show");
  });

  // Hide menu
  closeMenu?.addEventListener("click", () => {
    menu.classList.remove("show");
  });

  // Auto-collapse after clicking a menu item
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  });

  // Admin hide logic
  const isAdmin =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("admin");
  if (!isAdmin) {
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.style.display = "none";
    });
  }
});
