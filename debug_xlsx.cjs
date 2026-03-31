const xlsx = require('xlsx');

const wb = xlsx.readFile('./test_bd.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1, defval: ''});
for (let i = 0; i < 6; i++) {
  console.log(`ROW ${i}:`, JSON.stringify(data[i]));
}
