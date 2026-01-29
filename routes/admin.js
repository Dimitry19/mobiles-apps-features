const express = require('express');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const path = require('path');
const { readJsonSafe } = require('../utils/jsonReader');

 
 
const { MongoClient } = require("mongodb");

require("dotenv").config();

const router = express.Router();
const BASE_DIR = path.join(__dirname, "../data");

const uri = process.env.MONGODB_URI;

// Vérification de sécurité
if (!uri) {
  throw new Error(
    "MONGODB_URI n'est pas défini dans les variables d'environnement",
  );
}

const clientMongoDB = new MongoClient(uri);
let cachedClientMongoDB = null;

// ==== CONFIGURATION ====
require("dotenv").config();
const ADMIN_USER = process.env.BASIC_USER || "admin";
const ADMIN_PASS = process.env.BASIC_PASS || "password";

const adminBasicAuthMiddleware = basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true, // affiche la fenêtre de login(native du navigateur)
  unauthorizedResponse: "Accès refusé",
});

function adminAuthMiddleware(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/login");
}

// Route principale admin
router.get("/admin", adminAuthMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

//  Lister les catégories + fichiers
router.get("/files", (req, res) => {
  const result = {};

  fs.readdirSync(BASE_DIR).forEach((dir) => {
    const dirPath = path.join(BASE_DIR, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      result[dir] = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
    }
  });

  res.json(result);
});

//  Lire un fichier JSON
router.get("/file", (req, res) => {
  const { category, file } = req.query;

  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) {
    fileSystemRead(category, file, res);
  } else {
    databaseMongoDbRead(category, file, res);
  }
});

//  Sauvegarder un fichier JSON
router.post("/file", express.json(), (req, res) => {
  const { category, file, content } = req.body;
  const filePath = path.join(BASE_DIR, category, file);

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  res.json({ success: true });
});

router.put("/file/:category/:filename", express.json(), async (req, res) => {
  const { category, filename } = req.params;
  const { content } = req.body;

  if (!category || !filename || content === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Paramètres manquants" });
  }
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    fileSystemUpdate(category, filename, content, res);
  } else {
    databaseMongoDbUpdate(category, filename, content, res);
  }
});

async function databaseMongoDbUpdate(category, filename, content, res) {
  try {
    const collection = await getCollection();

    // Upsert (insert ou update)
    const result = await collection.updateOne(
      { category, filename },
      {
        $set: {
          content,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          // ← Ajout   seulement si nouveau document
          createdAt: new Date(),
          language: getLanguageFromFilename(filename),
        },
      },
      { upsert: true },
    );

    console.log("Fichier sauvegardé:", {
      category,
      filename,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });

    res.json({
      success: true,
      message: "Fichier sauvegardé dans MongoDB",
      isNew: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error("Erreur MongoDB update:", error);
    res.status(500).json({
      success: false,
      message: "Erreur MongoDB",
      error: error.message,
    });
  }
}

async function fileSystemUpdate(category, filename, content, res) {
  const dirPath = path.join(BASE_DIR, category);
  const filePath = path.join(dirPath, filename);

  // Crée le dossier si nécessaire
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  try {
    let dataToWrite =
      typeof content === "string" ? JSON.parse(content) : content;
    fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2));
    res.json({
      success: true,
      message: `${filename} mis à jour dans ${category}`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l’écriture du fichier",
      error: err.message,
    });
  }
}

async function databaseMongoDbRead(category, filename, res) {
  try {
    console.log("Recherche fichier:", { category, filename });

    const collection = await getCollection();

    const file = await collection.findOne({ category, filename });

    console.log("Fichier trouvé:", file ? "OUI" : "NON");

    if (!file) {
      return res.status(404).send("Fichier non trouvé");
    }

    res.send(file.content);
  } catch (error) {
    console.error(" Erreur:", error);
    res.status(500).json({ error: "databaseMongoDbRead:" + error.message });
  }
}

async function fileSystemRead(category, file, res) {
  const filePath = path.join(BASE_DIR, category, file);

  if (!filePath.startsWith(BASE_DIR)) {
    return res.status(403).end();
  }
  const data = readJsonSafe(filePath);
  console.log(data);
  res.json(data);
}

async function connectToDatabase() {
  try {
    if (cachedClientMongoDB) {
      return cachedClientMongoDB;
    }

    await clientMongoDB.connect();
    cachedClientMongoDB = clientMongoDB;
    return clientMongoDB;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur de connexion a la base de donnees" });
  }
}

async function getCollection() {
  try {
    const client = await connectToDatabase();
    const db = client.db("mobiles-features");
    const collection = db.collection("features");
    return collection;
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error:
          "Erreur de recuperation de la collection depuis la base de donnees",
      });
  }
}

function getLanguageFromFilename(filename) {
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".yml") || filename.endsWith(".yaml")) return "yaml";
  if (filename.endsWith(".xml")) return "xml";
  if (filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".properties")) return "ini";
  return "plaintext";
}
 

 module.exports = router;