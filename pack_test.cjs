const xlsx = require('xlsx');
const fs = require('fs');

// Read ALARMAS.csv
const alarmasCsv = fs.readFileSync('./datos/ListaDePrecios-PARTNER-20251125.xlsx - ALARMAS.csv');
const wb = xlsx.read(alarmasCsv, { type: 'buffer' });
wb.SheetNames[0] = 'ALARMAS';

// Read ACCESORIOS.csv
const accesoriosCsv = fs.readFileSync('./datos/ListaDePrecios-PARTNER-20251125.xlsx - ACCESORIOS.csv');
const wbAcc = xlsx.read(accesoriosCsv, { type: 'buffer' });
xlsx.utils.book_append_sheet(wb, wbAcc.Sheets[wbAcc.SheetNames[0]], 'ACCESORIOS');

// Write out to test_bd.xlsx
xlsx.writeFile(wb, './test_bd.xlsx');
console.log('test_bd.xlsx created successfully!');
