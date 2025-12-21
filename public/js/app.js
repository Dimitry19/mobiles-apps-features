// 🌙 Dark / Light mode
function toggleTheme() {
  const html = document.documentElement;
  const theme = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);
}

// Restore theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
}

// 🔌 API Status
function checkStatus() {
  fetch('/api/health')
    .then(res => res.json())
    .then(data => {
      document.getElementById('status').textContent =
        data.status === 'UP' ? '🟢 API opérationnelle' : '🔴 API indisponible';
    })
    .catch(() => {
      //document.getElementById('status').textContent = '❌ API inaccessible';
    });
}

checkStatus();
