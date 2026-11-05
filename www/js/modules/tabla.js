function renderizarTabla() {
  const thead = document.getElementById('tablaHeader'); const tbody = document.getElementById('tablaBody');
  let h = '<th class="checkbox-col">✅</th><th>#</th>';
  columnas.forEach(col => {
    const sc = columnaOrden===col ? (ordenAscendente?'sorted-asc':'sorted-desc') : '';
    const tf = filtrosColumna.has(col) && filtrosColumna.get(col).size>0;
    const tit = col==='_hoja_origen' ? '📄 Hoja Origen' : escapeHtml(col);
    h += `<th class="${sc} ${tf?'con-filtro':''}"><span class="th-filtro">
      <span onclick="ordenarPor('${escapeAttr(col)}')" style="flex:1;cursor:pointer;">${tit}<span class="sort-icon"></span></span>
      <button class="btn-filtro-col ${tf?'activo':''}" onclick="event.stopPropagation();abrirFiltroColumna(event,'${escapeAttr(col)}')" title="Filtrar">🔽</button>
    </span></th>`;
  });
  thead.innerHTML = h;
  if(!datosFiltrados.length) { tbody.innerHTML = `<tr><td colspan="${columnas.length+2}" class="empty">No hay resultados</td></tr>`; return; }
  let html = '';
  datosFiltrados.forEach((row, idx) => {
    const sel = seleccionados.has(idx);
    const oi = datosOriginales.indexOf(row);
    const dup = duplicados.has(oi);
    const cid = asignaciones.get(oi);
    const carp = cid ? carpetas.get(cid) : null;
    html += `<tr class="${sel?'selected':''} ${dup?'duplicate':''}" data-idx="${idx}">
      <td class="checkbox-col"><input type="checkbox" ${sel?'checked':''} onchange="toggleSeleccion(${idx})"></td>
      <td>${idx+1}</td>`;
    columnas.forEach(col => {
      let v = row[col] != null ? row[col] : '';
      if(col===columnaNombre) {
        let badges = '';
        Object.keys(cadenasDetectadas).forEach(cd => { if(String(v).toLowerCase().includes(cd.toLowerCase())) badges += `<span class="chain-badge">${cd}</span>`; });
        if(carp) badges += `<span class="badge-carpeta" style="background:${carp.color}22;color:${carp.color};">📁 ${escapeHtml(carp.nombre)}</span>`;
        v = terminoBusqueda ? resaltarTexto(v, terminoBusqueda) : escapeHtml(v);
        html += `<td>${v} ${badges}</td>`;
      } else if(col==='_hoja_origen') {
        html += `<td><span style="background:#e9ecef;padding:2px 6px;border-radius:6px;font-size:.85em;">📄 ${escapeHtml(v)}</span></td>`;
      } else html += `<td>${escapeHtml(v)}</td>`;
    });
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

function ordenarPor(col) { if(columnaOrden===col) ordenAscendente=!ordenAscendente; else { columnaOrden=col; ordenAscendente=true; } filtrarDatos(); renderizarTabla(); }

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

function toggleSeleccion(idx) { if(seleccionados.has(idx)) seleccionados.delete(idx); else seleccionados.add(idx); actualizarEstadisticas(); renderizarCarpetas(); const row=document.querySelector(`tr[data-idx="${idx}"]`); if(row) row.classList.toggle('selected', seleccionados.has(idx)); }
function seleccionarTodos() { datosFiltrados.forEach((_,i)=>seleccionados.add(i)); renderizarTabla(); actualizarEstadisticas(); renderizarCarpetas(); }
function deseleccionarTodos() { seleccionados.clear(); renderizarTabla(); actualizarEstadisticas(); renderizarCarpetas(); }
