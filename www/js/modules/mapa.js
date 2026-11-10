let mapaInstancia = null;

function mostrarMapa() {
  if (!datosFiltrados.length) { alertSeguro('No hay datos filtrados para mostrar en el mapa'); return; }
  
  const colLat = columnas.find(c => c.toLowerCase() === 'lat' || c.toLowerCase() === 'latitud');
  const colLng = columnas.find(c => c.toLowerCase() === 'lng' || c.toLowerCase() === 'lon' || c.toLowerCase() === 'longitud');
  
  if (!colLat || !colLng) { 
    alertSeguro('No se encontraron las columnas de Latitud (Lat) y Longitud (Lng) en tu Excel.'); 
    return; 
  }

  document.getElementById('modalMapa').style.display = 'block';

  if (mapaInstancia) {
    mapaInstancia.remove();
    mapaInstancia = null;
  }

  mapaInstancia = L.map('mapaContainer').setView([21.1619, -86.8515], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapaInstancia);

  const bounds = L.latLngBounds();
  let pinesAgregados = 0;
  let listaHtml = '';
  let contador = 1;

  datosFiltrados.forEach(row => {
    const lat = parseFloat(String(row[colLat]).replace(',', '.'));
    const lng = parseFloat(String(row[colLng]).replace(',', '.'));
    
    if (!isNaN(lat) && !isNaN(lng)) {
      const nombre = row[columnaNombre] || 'Sin nombre';
      const oi = datosOriginales.indexOf(row);
      const cid = asignaciones.get(oi);
      const carpeta = cid ? carpetas.get(cid) : null;
      
      const colorPin = carpeta ? carpeta.color : '#dc3545'; 
      
      const icono = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color:${colorPin}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 4px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; color:white; font-size:9px; font-weight:bold;">${contador}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([lat, lng], {icon: icono}).addTo(mapaInstancia);
      
      const etiquetaCarpeta = carpeta ? `<br><span style="background:${carpeta.color}22;color:#333;padding:2px 6px;border-radius:4px;font-size:11px;">📁 ${escapeHtml(carpeta.nombre)}</span>` : '';
      
      marker.bindPopup(`<strong style="color:#333;">${contador}. ${escapeHtml(nombre)}</strong>${etiquetaCarpeta}<br><a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank">Abrir en Google Maps</a>`);
      
      marker.on('click', () => {
        document.querySelectorAll('.item-mapa').forEach(el => el.style.background = 'transparent');
        const el = document.getElementById(`item-mapa-${contador}`);
        if (el) el.style.background = '#e7f3ff';
      });

      listaHtml += `<div id="item-mapa-${contador}" class="item-mapa" style="padding:6px; border-bottom:1px solid #ddd; cursor:pointer;" onclick="centrarMapa(${lat}, ${lng}, ${contador})">
        <strong style="color:#333; font-size:1.1em;">${contador}.</strong> 
        <span style="color:#333;">${escapeHtml(nombre)}</span><br>
        <span style="font-size:0.8em; color:#666;">${carpeta ? '📁 ' + escapeHtml(carpeta.nombre) : 'Sin categoría'}</span>
      </div>`;

      bounds.extend([lat, lng]);
      pinesAgregados++;
      contador++;
    }
  });

  document.getElementById('listaMapa').innerHTML = listaHtml || '<p style="color:#666;">No hay coordenadas válidas.</p>';

  if (pinesAgregados > 0) {
    mapaInstancia.fitBounds(bounds, { padding: [30, 30] });
  } else {
    alertSeguro('Los registros filtrados no tienen coordenadas válidas.');
  }
}

function centrarMapa(lat, lng, id) {
  if (mapaInstancia) {
    mapaInstancia.setView([lat, lng], 15);
    document.querySelectorAll('.item-mapa').forEach(el => el.style.background = 'transparent');
    const el = document.getElementById(`item-mapa-${id}`);
    if (el) el.style.background = '#e7f3ff';
  }
}

function cerrarMapa() {
  document.getElementById('modalMapa').style.display = 'none';
  if (mapaInstancia) {
    mapaInstancia.remove();
    mapaInstancia = null;
  }
}

function imprimirMapa() {
  if (!mapaInstancia) return;
  
  const controles = document.querySelectorAll('.leaflet-control-zoom');
  controles.forEach(c => c.style.display = 'none');
  
  const botones = document.querySelectorAll('#modalMapa button, #modalMapa h3');
  botones.forEach(b => b.style.display = 'none');

  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      body * { visibility: hidden; }
      #modalMapa, #modalMapa * { visibility: visible; }
      #modalMapa { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: white; }
      .modal-content { box-shadow: none; border: none; width: 100%; max-width: none; height: auto; }
      #mapaContainer { height: 60vh !important; border: 1px solid #333 !important; }
      #listaMapa { max-height: 30vh !important; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .item-mapa { page-break-inside: avoid; }
    }
  `;
  document.head.appendChild(style);

  window.print();

  setTimeout(() => {
    document.head.removeChild(style);
    controles.forEach(c => c.style.display = '');
    botones.forEach(b => b.style.display = '');
  }, 1000);
}

window.mostrarMapa = mostrarMapa;
window.cerrarMapa = cerrarMapa;
window.centrarMapa = centrarMapa;
window.imprimirMapa = imprimirMapa;
