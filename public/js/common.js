// ============================================
// Toast notifications
// ============================================
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toastId = `toast-${Date.now()}`;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-header bg-${type} text-white">
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">${message}</div>
  `;
  
  container.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// ============================================
// Toggle Theme
// ============================================
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  html.setAttribute("data-bs-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  document.getElementById("themeIcon").textContent =
    newTheme === "dark" ? "🌙" : "☀️";
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
  document.getElementById("themeIcon").textContent =
    savedTheme === "dark" ? "🌙" : "☀️";
}

// Restore theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
}


async function load(containerId, config = {}) {
  const { label = "Accueil", path = "/admin", icon = "bi-house" } = config;

  try {
    // Construire l'URL avec les paramètres
    const navbarUrl = new URL("/partials/navbar.html", window.location.origin);
    navbarUrl.searchParams.set("label", label);
    navbarUrl.searchParams.set("path", path);
    navbarUrl.searchParams.set("icon", icon);

    // Charger la navbar
    const response = await fetch(navbarUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Injecter dans le DOM
    const container = document.getElementById(containerId);

    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    container.innerHTML = html;

    console.log("✅ Navbar loaded successfully");
  } catch (error) {
    console.error("❌ Error loading navbar:", error);
    this.showFallbackNavbar(containerId, config);
  }
}

function loadNavbar(navbarId) {
  fetch("/partials/navbar.html")
    .then((res) => res.text())
    .then((html) => {
      document.getElementById(navbarId).innerHTML = html;
      const container = document.getElementById(navbarId);
      container.innerHTML = html;
    });
}
function loadFooter(id){
    fetch('/partials/footer.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
    });
}

function getLanguageFromFilename(filename) {
  if (filename.endsWith('.json')) return 'json';
  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
  if (filename.endsWith('.xml')) return 'xml';
  if (filename.endsWith('.js')) return 'javascript';
  if (filename.endsWith('.properties')) return 'ini';
  return 'plaintext';
}
 