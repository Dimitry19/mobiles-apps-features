const express = require('express');
const path = require('path');
const { readJsonFile } = require('../services/jsonFile.service');

const router = express.Router()

const rootFolder = '../data/colis';

 
router.get("/colis", async (req, res) => {
  const fileName = `colis.json`;
  const data = await readJsonFile(rootFolder, fileName);

  res.json({
    success: true,
    data,
  });
});

router.get('/colis/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // id autorisé : nombre OU "demo"
    const isValidId = /^\d+$/.test(id) || id === 'demo';

    if (!isValidId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID invalide. Utilisez un nombre ou "demo".'
      });
    }

    const fileName = `colis-${id}.json`;
    const data = await readJsonFile(rootFolder,fileName);

    res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err); // 🔥 passe au middleware global
  }
});
module.exports=router

