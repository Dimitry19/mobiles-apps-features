const express = require('express');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const path = require('path');
const { readJsonSafe } = require('../utils/jsonReader');

const router = express.Router();
const BASE_DIR = path.join(__dirname, '../data');

// 🔐 (optionnel) middleware auth ici
// ==== CONFIGURATION ====
require('dotenv').config();
const ADMIN_USER = process.env.BASIC_USER || 'admin';
const ADMIN_PASS = process.env.BASIC_PASS || 'password';

 const adminAuthMiddleware = basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS },
    challenge: true, // affiche la fenêtre de login
    unauthorizedResponse: 'Accès refusé'
});

 

// ==== Fonction récursive pour lister les fichiers JSON ====
function listJsonFiles(dir) {
  const result = {};

  fs.readdirSync(dir).forEach(item => {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      const subResult = listJsonFiles(itemPath);
      if (Object.keys(subResult).length > 0) {
        result[item] = subResult;
      }
    } else if (stats.isFile() && item.endsWith('.json')) {
      if (!result.files) result.files = [];
      result.files.push(item);
    }
  });

  return result;
}




// Route principale admin
router.get('/admin', adminAuthMiddleware,(req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});


router.get('/filesdd', (req, res) => {
  const result = {};

  fs.readdirSync(BASE_DIR).forEach(dir => {
    const dirPath = path.join(BASE_DIR, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      const filesTree = listJsonFiles(dirPath);
        if (Object.keys(filesTree).length > 0) {
          result[dir] = filesTree;
        }
    }
  });

  res.json(result);
});

// 📂 Lister les catégories + fichiers
router.get('/files', (req, res) => {
  const result = {};

  fs.readdirSync(BASE_DIR).forEach(dir => {
    const dirPath = path.join(BASE_DIR, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      result[dir] = fs.readdirSync(dirPath)
        .filter(f => f.endsWith('.json'));
    }
  });

  res.json(result);
});

// 📄 Lire un fichier JSON
router.get('/file', (req, res) => {
  const { category, file } = req.query;
  const filePath = path.join(BASE_DIR, category, file);

  if (!filePath.startsWith(BASE_DIR)) {
    return res.status(403).end();
  }

 
  const data = readJsonSafe(filePath);
   console.log(data);
  res.json(data);
});

// 💾 Sauvegarder un fichier JSON
router.post('/file', express.json(), (req, res) => {
  const { category, file, content } = req.body;
  const filePath = path.join(BASE_DIR, category, file);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  res.json({ success: true });
});


router.put('/file/:category/:filename', express.json(), (req, res) => {
   const { category, filename } = req.params;
   const { content } = req.body;

  if (!category || !filename || content === undefined) {
    return res.status(400).json({ success: false, message: 'Paramètres manquants' });
  }

  const dirPath = path.join(BASE_DIR, category);
  const filePath = path.join(dirPath, filename);

  // Crée le dossier si nécessaire
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  try {
    let dataToWrite = typeof content === 'string' ? JSON.parse(content) : content;
    fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2));
    res.json({ success: true, message: `${filename} mis à jour dans ${category}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de l’écriture du fichier', error: err.message });
  }
});

module.exports = router;
