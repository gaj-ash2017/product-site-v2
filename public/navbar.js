document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split("/").pop();

  const header = `
    <header>
      <div class="logo-area">
        <img src="./images/9800i.jpeg" alt="Logo" />
        <span>Ashwin Gajan T/A Just Parts</span>
        <div class="hamburger" id="hamburger">&#9776;</div>
      </div>
    </header>
  `;

  const navbar = `
    <nav class="main-navbar" id="mainNavbar">
      <ul class="navbar-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="our-contact-details.html">Our Details</a></li>
        <li><a href="products.html">Products</a></li>
        <li><a href="add-products.html" class="admin-only">Add Product</a></li>
        <li><a href="import.html" class="admin-only">Import</a></li>
        <li><a href="products-edit.html" class="admin-only">Admin</a></li>
      </ul>
    </nav>
    <div class="spacer"></div>
  `;

  const navbarContainer = document.getElementById("navbar");
  if (navbarContainer) {
    navbarContainer.innerHTML = header + navbar;

    // Highlight current page
    const links = navbarContainer.querySelectorAll(".navbar-menu a");
    links.forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
      }
    });

    // Hamburger toggle
    const hamburger = document.getElementById("hamburger");
    const navbarMenu = document.querySelector(".navbar-menu");
    hamburger.addEventListener("click", () => {
      navbarMenu.classList.toggle("show");
    });

    // Admin visibility logic
    const isAdmin =
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("admin");
    if (!isAdmin) {
      document
        .querySelectorAll(".admin-only")
        .forEach((el) => (el.style.display = "none"));
    }
  }
});
