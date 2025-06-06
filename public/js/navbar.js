document.addEventListener("DOMContentLoaded", () => {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  const isAdmin =
    window.location.hostname.includes("localhost") ||
    window.location.hostname.includes("admin");

  navbarContainer.innerHTML = `
    <header class="site-header">
      <div class="logo-area">
        <img src="/images/9800i.jpeg" alt="Logo" class="logo" />
        <div class="company-name">
          <div>Ashwin Gajan</div>
          <div>T/A Just Parts</div>
          <div>Heavy Duty American Truck Parts</div>
        </div>
        <div class="hamburger-controls">
          <div class="hamburger" id="hamburger">&#9776;</div>
          <div class="close-menu" id="closeMenu">&times;</div>
        </div>
      </div>
    </header>

    <nav class="main-navbar" id="mainNavbar">
      <ul class="navbar-menu">
        <li><a href="/index.html">Home</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/contact.html">Contact</a></li>
        <li><a href="/our-contact-details.html">Our Details</a></li>
        <li><a href="/products.html">Products</a></li>
        ${
          isAdmin
            ? `<li><a href="/admin/admin-dashboard.html">📊 Admin Dashboard <span class="admin-badge">ADMIN</span></a></li>`
            : ""
        }
      </ul>
    </nav>
    <div class="spacer"></div>
  `;

  const hamburger = document.getElementById("hamburger");
  const closeMenu = document.getElementById("closeMenu");
  const menu = document.querySelector(".navbar-menu");
  const hamburgerControls = document.querySelector(".hamburger-controls");

  hamburger?.addEventListener("click", () => {
    menu.classList.add("show");
    hamburgerControls.classList.add("menu-open");
  });

  closeMenu?.addEventListener("click", () => {
    menu.classList.remove("show");
    hamburgerControls.classList.remove("menu-open");
  });
});
