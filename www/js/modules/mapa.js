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

  if (mapaInstancia) { mapaInstancia.remove(); mapaInstancia = null; }

  mapaInstancia = L.map('mapaContainer').setView([21.1619, -86.8515], 8);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: 'attribution: 'attribution: '&copy; OpenStreetMap'copy; OpenStreetMap attribution: '&copy; OpenStreetMap'copy; CARTO'copy; OpenStreetMap attribution: 'attribution: '&copy; OpenStreetMap'copy; OpenStreetMap attribution: '&copy; OpenStreetMap'copy; CARTO'copy; CARTO'
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
      
      // Icono con el número y un borde blanco
      const icono = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color:${colorPin}; width:22px; height:22px; border-radius:50% 50% 50% 0; transform: rotate(-45deg); border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.5);"><span style="display:block; transform: rotate(45deg); color:white; font-size:11px; font-weight:bold; text-align:center; line-height:22px;">${contador}</span></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22]
        className: 'custom-pin',
        html: `<div style="background-color:${colorPin}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 4px rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">${contador}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([lat, lng], {icon: icono}).addTo(mapaInstancia);
      
      // AÑADIR TOOLTIP PERMANENTE CON EL NOMBRE
      marker.bindTooltip(`${contador}. ${escapeHtml(nombre)}`, {
        permanent: true,
        direction: 'right',
        className: 'map-tooltip',
        offset: [8, 0]
      });
      
      const etiquetaCarpeta = carpeta ? `<br><span style="background:${carpeta.color}22;color:#333;padding:2px 6px;border-radius:4px;font-size:11px;">📁 ${escapeHtml(carpeta.nombre)}</span>` : '';
      marker.bindPopup(`<strong>${contador}. ${escapeHtml(nombre)}</strong>${etiquetaCarpeta}<br><a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank">Abrir en Google Maps</a>`);
      
      marker.on('click', () => {
        document.querySelectorAll('.item-mapa').forEach(el => el.style.background = 'transparent');
        const el = document.getElementById(`item-mapa-${contador}`);
        if (el) el.style.background = '#e7f3ff';
      });

      listaHtml += `<div id="item-mapa-${contador}" class="item-mapa" style="padding:4px; border-bottom:1px solid #ddd; cursor:pointer;" onclick="centrarMapa(${lat}, ${lng}, ${contador})">
        <strong style="color:#333;">${contador}.</strong> <span style="color:#333;">${escapeHtml(nombre)}</span>
      </div>`;

      bounds.extend([lat, lng]);
      pinesAgregados++;
      contador++;
    }
  });

  document.getElementById('listaMapa').innerHTML = listaHtml || '<p style="color:#666;">No hay coordenadas válidas.</p>';

  if (pinesAgregados > 0) {
    mapaInstancia.fitBounds(bounds, { padding: [50, 50] }); // Más padding para que quepan los tooltips
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
  if (mapaInstancia) { mapaInstancia.remove(); mapaInstancia = null; }
}

function imprimirMapa() {
  if (!mapaInstancia) return;
  
  document.querySelectorAll('.leaflet-control-zoom, .leaflet-control-attribution').forEach(c => c.style.display = 'none');
  document.querySelectorAll('#modalMapa button, #modalMapa h3').forEach(b => b.style.display = 'none');

  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      @page { size: letter portrait; margin: 10mm; }
      body * { visibility: hidden; }
      #modalMapa, #modalMapa * { visibility: visible; }
      #modalMapa { position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: white; }
      .modal-content { box-shadow: none; border: none; width: 100%; max-width: none; height: auto; padding: 0; }
      #mapaContainer { height: 70vh !important; border: 2px solid #333 !important; page-break-inside: avoid; }
      #listaMapa { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; font-size: 10px; margin-top: 10px; }
      .item-mapa { page-break-inside: avoid; border: none !important; padding: 2px !important; }
      /* Hacer los tooltips más legibles en papel */
      .map-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; color: black !important; font-weight: bold; font-size: 10px; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    document.head.removeChild(style);
    document.querySelectorAll('.leaflet-control-zoom, .leaflet-control-attribution').forEach(c => c.style.display = '');
    document.querySelectorAll('#modalMapa button, #modalMapa h3').forEach(b => b.style.display = '');
  }, 1000);
}

window.mostrarMapa = mostrarMapa;
window.cerrarMapa = cerrarMapa;
window.centrarMapa = centrarMapa;
window.imprimirMapa = imprimirMapa;
