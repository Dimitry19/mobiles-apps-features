
// ============================================
// Charger l'arbre des fichiers (avec catégories)
// ============================================
async function loadFileTree() {
  try {
    const res = await fetch('/admin/files');
    const data = await res.json();
    
    renderFileTree(data);
  } catch (error) {
    console.error('Erreur chargement fichiers:', error);
    showToast('Erreur', 'Impossible de charger les fichiers', 'danger');
  }
}



// ============================================
// Charger un fichier (avec catégorie)
// ============================================
async function openFile(category, filename) {
  try {
    // Highlight le fichier actif
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`[data-category="${category}"][data-filename="${filename}"]`);
    activeItem?.classList.add('active');

    // Construire le path
    const path = `${category}/${filename}`;
    const res = await fetch(`/admin/file?category=${encodeURIComponent(category)}&file=${encodeURIComponent(filename)}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const content = await res.text();

    currentFile = { category, filename, path };
    originalContent = content;

    // Mettre à jour l'éditeur
    if (monacoEditor) {
      const language = getLanguageFromFilename(filename);
      monaco.editor.setModelLanguage(monacoEditor.getModel(), language);
      monacoEditor.setValue(content);
    } else {
      document.getElementById('editor').value = content;
    }

    // Mettre à jour l'UI
    document.getElementById('currentFileName').innerHTML = `
      <span class="text-muted">${getFileIcon(filename)}</span> ${filename}
      <span class="badge bg-secondary ms-2">${category}</span>
    `;
    document.getElementById('currentFilePath').textContent = path;
    
    toggleSaveButton(false);
    updateEditorStatus('Chargé');
    
    showToast('Succès', `Fichier "${filename}" chargé`, 'success');

  } catch (error) {
    console.error('Erreur chargement fichier:', error);
    showToast('Erreur', `Impossible de charger "${filename}": ${error.message}`, 'danger');
  }
}



// ============================================
// Sauvegarder un fichier (avec catégorie)
// ============================================
async function saveFile() {
  if (!currentFile) {
    showToast('Erreur', 'Aucun fichier sélectionné', 'warning');
    return;
  }

  const content = monacoEditor ? monacoEditor.getValue() : document.getElementById('editor').value;
  const { category, filename } = currentFile;

  try {
    // Valider le JSON si c'est un fichier JSON
    if (filename.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (e) {
        showToast('Erreur', `JSON invalide: ${e.message}`, 'danger');
        return;
      }
    }
 

    const res = await fetch(`/admin/file/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `HTTP ${res.status}`);
    }

    originalContent = content;
    toggleSaveButton(false);
    updateEditorStatus('Sauvegardé');
    showToast('Succès', `Fichier "${filename}" sauvegardé`, 'success');

  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    showToast('Erreur', `Impossible de sauvegarder: ${error.message}`, 'danger');
  }
}

// ============================================
// Annuler les modifications
// ============================================
function revertChanges() {
  if (!currentFile) return;

  if (monacoEditor) {
    monacoEditor.setValue(originalContent);
  } else {
    document.getElementById('editor').value = originalContent;
  }

  toggleSaveButton(false);
  updateEditorStatus('Modifications annulées');
  showToast('Info', 'Modifications annulées', 'info');
}

// ============================================
// Rafraîchir la liste
// ============================================
function refreshFiles() {
  const icon = document.getElementById('refreshIcon');
  icon.style.animation = 'spin 0.5s linear';
  
  loadFileTree();
  
  setTimeout(() => {
    icon.style.animation = '';
  }, 500);
}



 

function renderFileTree(data) {
  const tree = document.getElementById("fileTree");
  tree.innerHTML = "";

  if (!data || Object.keys(data).length === 0) {
    tree.innerHTML = '<p class="text-muted small">Aucun fichier trouvé</p>';
    return;
  }

  // Parcourir chaque catégorie
  Object.entries(data).forEach(([category, files], index) => {
    // En-tête de catégorie (collapsible)
    const categoryId = `category-${index}`;
    const collapseId = `collapse-${index}`;

    const categoryHeader = document.createElement("div");
    categoryHeader.className = "mb-2";
    categoryHeader.innerHTML = `
      <button 
        class="btn btn-sm btn-outline-secondary w-100 text-start d-flex align-items-center justify-content-between"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#${collapseId}"
        aria-expanded="true"
      >
        <span>
          <strong>📁 ${category}</strong>
          <span class="badge bg-secondary ms-2">${files.length}</span>
        </span>
        <span class="collapse-icon">▼</span>
      </button>
    `;

    tree.appendChild(categoryHeader);

    // Liste des fichiers (collapsible)
    const fileList = document.createElement("div");
    fileList.id = collapseId;
    fileList.className = "collapse show";
    fileList.innerHTML = '<div class="ps-2 mb-3"></div>';

    const container = fileList.querySelector("div");

    // Ajouter chaque fichier
    files.forEach((filename) => {
      const item = document.createElement("div");
      item.className = "file-item";
      item.setAttribute("data-category", category);
      item.setAttribute("data-filename", filename);
      item.onclick = () => openFile(category, filename);

      const icon = getFileIcon(filename);
      item.innerHTML = `
        <span class="file-icon">${icon}</span>
        <span class="flex-grow-1">${filename}</span>
      `;

      container.appendChild(item);
    });

    tree.appendChild(fileList);

    // Animation de l'icône collapse
    categoryHeader.querySelector("button").addEventListener("click", (e) => {
      const icon = e.currentTarget.querySelector(".collapse-icon");
      setTimeout(() => {
        const isExpanded = fileList.classList.contains("show");
        icon.textContent = isExpanded ? "▼" : "▶";
      }, 200);
    });
  });
}

function getFileIcon(filename) {
  if (filename.endsWith('.json')) return '📄';
  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return '📋';
  if (filename.endsWith('.xml')) return '📑';
  if (filename.endsWith('.properties')) return '⚙️';
  return '📝';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}


// Formater l'uptime
function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}j`;
}

// Animation de la barre d'activité
function animateActivityBar() {
  const bar = document.getElementById('activityBar');
  bar.style.width = '0%';
  setTimeout(() => {
    bar.style.transition = 'width 0.5s ease';
    bar.style.width = '100%';
    setTimeout(() => {
      bar.style.transition = 'width 0.3s ease';
      bar.style.width = '0%';
    }, 500);
  }, 50);
}



// ============================================
// UI Helpers
// ============================================
function toggleSaveButton(enabled) {
  document.getElementById('saveBtn').disabled = !enabled;
  document.getElementById('revertBtn').disabled = !enabled;
}

function updateEditorStatus(text) {
  const status = document.getElementById('editorStatus');
  const badges = {
    'Modifié': 'warning',
    'Sauvegardé': 'success',
    'Chargé': 'info',
    'Modifications annulées': 'secondary',
    'Prêt': 'secondary'
  };
  
  const badgeClass = badges[text] || 'secondary';
  status.innerHTML = `<span class="badge bg-${badgeClass}">${text}</span>`;
}
// ============================================
// Monaco Editor Setup
// ============================================
function initMonaco() {
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
  
  require(['vs/editor/editor.main'], function() {
    monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
      value: '// Sélectionnez un fichier pour commencer',
      language: 'json',
      theme: document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      cursorStyle: 'line',
      formatOnPaste: true,
      formatOnType: true
    });

    // Détecter les changements
    monacoEditor.onDidChangeModelContent(() => {
      const hasChanges = monacoEditor.getValue() !== originalContent;
      toggleSaveButton(hasChanges);
      updateEditorStatus(hasChanges ? 'Modifié' : 'Sauvegardé');
    });

    // Fallback: cacher le textarea
    document.getElementById('editor').style.display = 'none';
  });
}

// ============================================
// Charger les stats API
// ============================================
async function loadHealthStats() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    
    document.getElementById('apiVersion').textContent = data.version || 'N/A';
    document.getElementById('apiUptime').textContent = `${data.uptime || 0}s`;
  } catch (error) {
    console.error('Erreur chargement stats:', error);
    document.getElementById('apiVersion').textContent = 'Erreur';
    document.getElementById('apiUptime').textContent = 'N/A';
  }
}


function initialize() {
 
// ============================================
// Initialisation
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initMonaco();
  loadHealthStats();
  loadFileTree();

   loadFooter("admin-footer");
  
  // Rafraîchir les stats toutes les 30s
    setInterval(loadHealthStats, 30000);
    });
}


async function showAbout(modalId) {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  document.getElementById("aboutVersion").textContent = data.version || "N/A";
  document.getElementById("aboutNode").textContent = data.node || "N/A";
  document.getElementById("aboutEnv").textContent = data.environment || "N/A";
  document.getElementById("aboutUptime").textContent = formatUptime(
    data.uptime || 0
  );

  var modal = new bootstrap.Modal(document.getElementById(modalId), {});
  if (modal) modal.show();
}