const fs = require('fs');

async function uploadTest() {
  const fileBuffer = fs.readFileSync('./test_bd.xlsx');
  const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const formData = new FormData();
  formData.append('file', blob, 'test_bd.xlsx');

  try {
    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(err) {
    console.error('Error:', err);
  }
}

uploadTest();
