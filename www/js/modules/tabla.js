let paginaActual = 1;
const FILAS_POR_PAGINA = 100;
let vistaCompacta = false;

function toggleVistaCompacta() {
  vistaCompacta = !vistaCompacta;
  document.getElementById('btnVista').style.background = vistaCompacta ? '#28a745' : '#0056b3';
  renderizarTabla();
}

function cambiarPagina(delta) {
  const totalPaginas = Math.ceil(datosFiltrados.length / FILAS_POR_PAGINA);
  paginaActual += delta;
  if (paginaActual < 1) paginaActual = 1;
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;
  renderizarTabla();
}

function renderizarTabla() {
  const thead = document.getElementById('tablaHeader'); const tbody = document.getElementById('tablaBody');
  
  const totalPaginas = Math.ceil(datosFiltrados.length / FILAS_POR_PAGINA) || 1;
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;
  
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = Math.min(inicio + FILAS_POR_PAGINA, datosFiltrados.length);
  const filasPagina = datosFiltrados.slice(inicio, fin);

  const pagPanel = document.getElementById('paginacionPanel');
  if (datosFiltrados.length > FILAS_POR_PAGINA) {
    pagPanel.style.display = 'flex';
    document.getElementById('paginacionInfo').textContent = `Página ${paginaActual} de ${totalPaginas} (${datosFiltrados.length} registros)`;
    document.getElementById('btnPagAnt').disabled = paginaActual === 1;
    document.getElementById('btnPagSig').disabled = paginaActual === totalPaginas;
  } else {
    pagPanel.style.display = 'none';
  }

  let h = '<th class="checkbox-col">✅</th><th>#</th>';
  columnas.forEach(col => {
    const sc = columnaOrden===col ? (ordenAscendente?'sorted-asc':'sorted-desc') : '';
    const tf = filtrosColumna.has(col) && filtrosColumna.get(col).size>0;
    const tit = col==='_hoja_origen' ? '📄 Hoja' : escapeHtml(col);
    const esImportante = col === columnaNombre || col === '_hoja_origen' || col.toLowerCase().includes('cadena') || col.toLowerCase().includes('zona');
    const claseOcultar = (vistaCompacta && !esImportante) ? 'col-oculta' : '';

    h += `<th class="${sc} ${tf?'con-filtro':''} ${claseOcultar}"><span class="th-filtro">
      <span onclick="ordenarPor('${escapeAttr(col)}')" style="flex:1;cursor:pointer;">${tit}<span class="sort-icon"></span></span>
      <button class="btn-filtro-col ${tf?'activo':''}" onclick="event.stopPropagation();abrirFiltroColumna(event,'${escapeAttr(col)}')" title="Filtrar">🔽</button>
    </span></th>`;
  });
  thead.innerHTML = h;

  if(!filasPagina.length) { tbody.innerHTML = `<tr><td colspan="${columnas.length+2}" class="empty">No hay resultados</td></tr>`; return; }

  let html = '';
  filasPagina.forEach((row, idxPag) => {
    const idxGlobal = inicio + idxPag;
    const sel = seleccionados.has(idxGlobal);
    const oi = datosOriginales.indexOf(row);
    const dup = duplicados.has(oi);
    const cid = asignaciones.get(oi);
    const carp = cid ? carpetas.get(cid) : null;
    
    html += `<tr class="${sel?'selected':''} ${dup?'duplicate':''}" data-idx="${idxGlobal}">
      <td class="checkbox-col"><input type="checkbox" ${sel?'checked':''} onchange="toggleSeleccion(${idxGlobal})"></td>
      <td>${idxGlobal+1}</td>`;
      
    columnas.forEach(col => {
      let v = row[col] != null ? row[col] : '';
      const esImportante = col === columnaNombre || col === '_hoja_origen' || col.toLowerCase().includes('cadena') || col.toLowerCase().includes('zona');
      const claseOcultar = (vistaCompacta && !esImportante) ? 'col-oculta' : '';

      if(col===columnaNombre) {
        let badges = '';
        Object.keys(cadenasDetectadas).forEach(cd => { if(String(v).toLowerCase().includes(cd.toLowerCase())) badges += `<span class="chain-badge">${cd}</span>`; });
        if(carp) badges += `<span class="badge-carpeta" style="background:${carp.color}22;color:${carp.color};">📁 ${escapeHtml(carp.nombre)}</span>`;
        
        // ENLACE A GOOGLE MAPS
        const nombreParaMaps = encodeURIComponent(String(v) + ', ' + (row['Zona'] || row['Ciudad'] || row['País'] || ''));
        const linkMaps = `<a href="https://www.google.com/maps/search/?api=1&query=${nombreParaMaps}" target="_blank" class="btn-maps" title="Ver en Google Maps">📍</a>`;

        v = terminoBusqueda ? resaltarTexto(v, terminoBusqueda) : escapeHtml(v);
        html += `<td class="${claseOcultar}"><div style="display:flex; align-items:center; gap:4px;">${linkMaps} <span>${v}</span></div> ${badges}</td>`;
      } else if(col==='_hoja_origen') {
        html += `<td class="${claseOcultar}"><span style="background:#e9ecef;padding:2px 6px;border-radius:6px;font-size:.85em;">📄 ${escapeHtml(v)}</span></td>`;
      } else html += `<td class="${claseOcultar}">${escapeHtml(v)}</td>`;
    });
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

function ordenarPor(col) { 
  if(columnaOrden===col) ordenAscendente=!ordenAscendente; 
  else { columnaOrden=col; ordenAscendente=true; } 
  paginaActual = 1;
  filtrarDatos(); 
  renderizarTabla(); 
}

function resaltarTexto(texto, termino) {
  const esc = escapeHtml(String(texto));
  let terms = [termino];
  if(termino.includes(' AND ')) terms = termino.split(' AND ').map(t=>t.trim());
  else if(termino.includes(' OR ')) terms = termino.split(' OR ').map(t=>t.trim());
  else if(termino.includes(' NOT ')) terms = [termino.split(' NOT ')[0].trim()];
  let r = esc;
  terms.forEach(t => { r = r.replace(new RegExp(`(${escapeRegex(t)})`,'gi'), '<span class="highlight">$1</span>'); });
  return r;
}

function toggleSeleccion(idx) { 
  if(seleccionados.has(idx)) seleccionados.delete(idx); 
  else seleccionados.add(idx); 
  actualizarEstadisticas(); 
  renderizarCarpetas(); 
  const row=document.querySelector(`tr[data-idx="${idx}"]`); 
  if(row) row.classList.toggle('selected', seleccionados.has(idx)); 
}

function seleccionarTodos() { 
  const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
  const fin = Math.min(inicio + FILAS_POR_PAGINA, datosFiltrados.length);
  for(let i=inicio; i<fin; i++) seleccionados.add(i);
  renderizarTabla(); actualizarEstadisticas(); renderizarCarpetas(); 
}

function deseleccionarTodos() { 
  seleccionados.clear(); 
  renderizarTabla(); actualizarEstadisticas(); renderizarCarpetas(); 
}

window.toggleVistaCompacta = toggleVistaCompacta;
window.cambiarPagina = cambiarPagina;
