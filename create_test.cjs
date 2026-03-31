const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();

// Sheet 1: Productos
const data1 = [
  ['Código', 'Producto', 'Precio', 'Stock'],
  ['P001', 'Cable HDMI 2m', 2500.50, 150],
  ['P002', 'Teclado Mecánico RGB', 45000, 30],
  ['P003', 'Mouse Inalámbrico', 15800, 85],
  ['P004', 'Monitor 24" LED', 185000, 12],
  ['P005', 'Auriculares Bluetooth', 22000, 45],
];
const ws1 = XLSX.utils.aoa_to_sheet(data1);
XLSX.utils.book_append_sheet(wb, ws1, 'Productos');

// Sheet 2: Proveedores
const data2 = [
  ['ID', 'Proveedor', 'Contacto', 'Ciudad'],
  ['S001', 'TechDistrib SA', 'Juan Pérez', 'Buenos Aires'],
  ['S002', 'ElectroMundo', 'María García', 'Córdoba'],
  ['S003', 'InfoParts', 'Carlos López', 'Rosario'],
];
const ws2 = XLSX.utils.aoa_to_sheet(data2);
XLSX.utils.book_append_sheet(wb, ws2, 'Proveedores');

// Sheet 3: Precios Mayoristas
const data3 = [
  ['Código', 'Precio Lista', 'Desc. 5+', 'Desc. 10+', 'Desc. 50+'],
  ['P001', 2500.50, 2375.48, 2250.45, 2000.40],
  ['P002', 45000, 42750, 40500, 36000],
  ['P003', 15800, 15010, 14220, 12640],
  ['P004', 185000, 175750, 166500, 148000],
  ['P005', 22000, 20900, 19800, 17600],
];
const ws3 = XLSX.utils.aoa_to_sheet(data3);
XLSX.utils.book_append_sheet(wb, ws3, 'Precios Mayoristas');

XLSX.writeFile(wb, './test_data.xlsx');
console.log('Test file created: test_data.xlsx (3 sheets: Productos, Proveedores, Precios Mayoristas)');
