let mapaInstancia = null;

function mostrarMapa() {
  if (!datosFiltrados.length) { alertSeguro('No hay datos filtrados para mostrar en el mapa'); return; }
  
  // Verificar que existan las columnas Lat y Lng
  const colLat = columnas.find(c => c.toLowerCase() === 'lat' || c.toLowerCase() === 'latitud');
  const colLng = columnas.find(c => c.toLowerCase() === 'lng' || c.toLowerCase() === 'lon' || c.toLowerCase() === 'longitud');
  
  if (!colLat || !colLng) { 
    alertSeguro('No se encontraron las columnas de Latitud (Lat) y Longitud (Lng) en tu Excel.'); 
    return; 
  }

  document.getElementById('modalMapa').style.display = 'block';

  // Si ya había un mapa, lo destruimos para crear uno nuevo
  if (mapaInstancia) {
    mapaInstancia.remove();
    mapaInstancia = null;
  }

  // Inicializar el mapa (centrado temporalmente en el Caribe Mexicano)
  mapaInstancia = L.map('mapaContainer').setView([21.1619, -86.8515], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapaInstancia);

  const bounds = L.latLngBounds();
  let pinesAgregados = 0;

  datosFiltrados.forEach(row => {
    const lat = parseFloat(String(row[colLat]).replace(',', '.'));
    const lng = parseFloat(String(row[colLng]).replace(',', '.'));
    
    if (!isNaN(lat) && !isNaN(lng)) {
      const nombre = row[columnaNombre] || 'Sin nombre';
      const oi = datosOriginales.indexOf(row);
      const cid = asignaciones.get(oi);
      const carpeta = cid ? carpetas.get(cid) : null;
      
      // Color del pin según la carpeta (si tiene)
      const colorPin = carpeta ? carpeta.color : '#3388ff';
      
      // Crear un icono de color personalizado
      const icono = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color:${colorPin}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([lat, lng], {icon: icono}).addTo(mapaInstancia);
      
      const etiquetaCarpeta = carpeta ? `<br><span style="background:${carpeta.color}22;color:${carpeta.color};padding:2px 6px;border-radius:4px;font-size:11px;">📁 ${escapeHtml(carpeta.nombre)}</span>` : '';
      
      marker.bindPopup(`<strong>${escapeHtml(nombre)}</strong>${etiquetaCarpeta}<br><a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank">Abrir en Google Maps</a>`);
      
      bounds.extend([lat, lng]);
      pinesAgregados++;
    }
  });

  if (pinesAgregados > 0) {
    mapaInstancia.fitBounds(bounds, { padding: [30, 30] });
  } else {
    alertSeguro('Los registros filtrados no tienen coordenadas válidas.');
  }
}

function cerrarMapa() {
  document.getElementById('modalMapa').style.display = 'none';
  if (mapaInstancia) {
    mapaInstancia.remove();
    mapaInstancia = null;
  }
}

window.mostrarMapa = mostrarMapa;
window.cerrarMapa = cerrarMapa;
