// Helper para crear hojas de Excel con formato y autofiltro
function crearHojaExcel(registros) {
  if (!registros || !registros.length) return null;
  
  const ws = XLSX.utils.json_to_sheet(registros);
  
  // Calcular anchos de columna
  const cols = [];
  const headers = Object.keys(registros[0] || {});
  
  headers.forEach((header, index) => {
    // Ancho base según el nombre de la columna
    let maxWidth = header.length;
    
    // Revisar las primeras 100 filas para calcular el ancho máximo real
    registros.slice(0, 100).forEach(row => {
      const val = String(row[header] || '');
      if (val.length > maxWidth) maxWidth = val.length;
    });
    
    // Limitar el ancho máximo a 50 caracteres para que no sea gigante
    cols.push({ wch: Math.min(maxWidth + 2, 50) });
  });
  
  ws['!cols'] = cols;
  
  // Añadir autofiltro a la primera fila (todas las columnas)
  // Esto genera las flechitas de filtro en Excel automáticamente
  const rango = XLSX.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: headers.length - 1, r: registros.length }
  });
  ws['!autofilter'] = { ref: rango };
  
  return ws;
}

window.crearHojaExcel = crearHojaExcel;
