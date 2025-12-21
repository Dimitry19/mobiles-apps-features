// ============================================
// Formater l'uptime
// ============================================
function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}j`;
}

// 🔌 API Status
// ============================================
// Vérifier le statut de l'API
// ============================================
async function checkStatus() {
  const iconEl = document.getElementById("statusIcon");
  const messageEl = document.getElementById("statusMessage");
  const detailsEl = document.getElementById("statusDetails");
  const statsEl = document.getElementById("statsGrid");

  // État de chargement
  iconEl.innerHTML = '<div class="status-loading"></div>';
  messageEl.textContent = "Vérification du serveur en cours...";
  detailsEl.classList.add("d-none");

  try {
    const response = await fetch("/api/health");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Succès
    iconEl.innerHTML = "✅";
    messageEl.innerHTML =
      '<span class="text-success fw-bold">Serveur opérationnel</span>';

    // Afficher les détails
    detailsEl.classList.remove("d-none");
    document.getElementById("apiVersion").textContent = data.version || "N/A";
    document.getElementById("apiNodeVersion").textContent = data.node || "N/A";
    document.getElementById("apiUptime").textContent = formatUptime(
      data.uptime || 0
    );
    document.getElementById("apiStatus").className = "badge bg-success";
    document.getElementById("apiStatus").textContent = "En ligne";

    // Afficher les stats (avec des valeurs simulées)
    statsEl.style.display = "grid";
    document.getElementById("statRequests").textContent =
      data.requests || Math.floor(Math.random() * 10000);
    document.getElementById("statLatency").textContent = `${
      data.latency || Math.floor(Math.random() * 100)
    }ms`;
    document.getElementById("statSuccess").textContent =
      data.successRate || "99.9%";

    showToast("Succès", "Serveur opérationnel", "success");
  } catch (error) {
    // Erreur
    iconEl.innerHTML = "❌";
    messageEl.innerHTML =
      '<span class="text-danger fw-bold">Serveur inaccessible</span>';

    detailsEl.classList.remove("d-none");
    document.getElementById("apiVersion").textContent = "N/A";
    document.getElementById("apiUptime").textContent = "N/A";
    document.getElementById("apiStatus").className = "badge bg-danger";
    document.getElementById("apiStatus").textContent = "Hors ligne";

    statsEl.style.display = "none";

    showToast(
      "Erreur",
      `Impossible de contacter le serveur: ${error.message}`,
      "danger"
    );

    console.error("Erreur health check:", error);
  }
}
//checkStatus();

function initialize() {
  // ============================================
  // Configuration
  // ============================================
  let statusCheckInterval = null;

  let navbarId = "navbar-container";
  let footer = "footer";

  // ============================================
  // Initialisation
  // ============================================
  document.addEventListener("DOMContentLoaded", () => {
    loadNavbar(navbarId);
    // Charger le thème
    // loadTheme();

    // Vérifier le statut au chargement
    checkStatus();

    loadFooter(footer);

    // Auto-refresh toutes les 30s
    statusCheckInterval = setInterval(checkStatus, 30000);
  });

  // ============================================
  // Cleanup on unload
  // ============================================
  window.addEventListener("beforeunload", () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
  });
}
