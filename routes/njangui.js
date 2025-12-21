const express = require('express');
 
const path = require('path');
const { readJsonFile } = require('../services/jsonFile.service');

const router = express.Router()

const rootFolder = "../data/njangui";


router.get('/njangui', async (req, res)=>{

  const fileName = `njangui.json`;
  const data = await readJsonFile(rootFolder, fileName);

  res.json({
    success: true,
    data
  });
    
});

router.get('/njangui/:id', async (req, res, next) => {
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

    const fileName = `njangui-${id}.json`;
    const data = await readJsonFile(rootFolder, fileName);

    res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err); // 🔥 passe au middleware global
  }
});

module.exports=router

