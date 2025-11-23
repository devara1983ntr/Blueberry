const fs = require('fs');
const readline = require('readline');

const headers = ['embed', 'thumbnail', 'screenshots', 'title', 'tags', 'categories', 'actors', 'duration', 'views', 'likes', 'dislikes', 'thumbnail2', 'screenshots2'];

let csvData = [];
let jsonData = JSON.parse(fs.readFileSync('data_0.json', 'utf8'));

const rl = readline.createInterface({
  input: fs.createReadStream('pornhub.com-db.csv'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  const fields = line.split('|');
  if (fields.length === headers.length) {
    const obj = {};
    headers.forEach((h, i) => obj[h] = fields[i]);
    csvData.push(obj);
    if (csvData.length >= 1000) {
      rl.close();
    }
  }
});

rl.on('close', () => {
  let match = true;
  for (let i = 0; i < Math.min(csvData.length, jsonData.length); i++) {
    for (let key of headers) {
      if (csvData[i][key] !== jsonData[i][key]) {
        console.log(`Mismatch at index ${i}, key ${key}: CSV: ${csvData[i][key]}, JSON: ${jsonData[i][key]}`);
        match = false;
        break;
      }
    }
    if (!match) break;
  }
  if (match && csvData.length === jsonData.length) {
    console.log('The first 1000 records match perfectly.');
  } else {
    console.log('Data does not match.');
  }
});