const fs = require('fs');
const path = require('path');
 

function readJsonFile(rootFolder, fileName) {
  const filePath = path.join(__dirname,rootFolder,fileName);
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject({
          status: 404,
          code: 'FILE_NOT_FOUND',
          message: 'Fichier introuvable'
        });
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        reject({
          status: 500,
          code: 'INVALID_JSON',
          message: 'Fichier JSON invalide'
        });
      }
    });
  });
}

module.exports = { readJsonFile };
