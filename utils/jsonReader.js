const fs = require('fs');

function readJsonSafe(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/^\uFEFF/, '').trim(); // Retirer BOM
    return JSON.parse(content);
}

module.exports = { readJsonSafe };