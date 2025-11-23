const fs = require('fs');
const readline = require('readline');

const headers = ['embed', 'thumbnail', 'screenshots', 'title', 'tags', 'categories', 'actors', 'duration', 'views', 'likes', 'dislikes', 'thumbnail2', 'screenshots2'];
let allData = [];

const rl = readline.createInterface({
  input: fs.createReadStream('pornhub.com-db.csv'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  const fields = line.split('|');
  if (fields.length === headers.length) {
    const obj = {};
    headers.forEach((h, i) => obj[h] = fields[i]);
    allData.push(obj);
  }
});

rl.on('close', () => {
  fs.writeFileSync('full_data.json', JSON.stringify(allData, null, 2));
  console.log(`Processed ${allData.length} records and saved to full_data.json`);
});