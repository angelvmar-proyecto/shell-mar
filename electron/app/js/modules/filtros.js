let filtrosColumna = new Map();
let panelFiltroAbierto = null;

function abrirFiltroColumna(event, col) {
  event.stopPropagation(); 
  cerrarPanelFiltro();
  
  // LEER SOLO DE LOS DATOS FILTRADOS ACTUALES (Filtros jerárquicos)
  const conteo = new Map();
  datosFiltrados.forEach(row => { const v = String(row[col] ?? '').trim(); conteo.set(v, (conteo.get(v)||0)+1); });
  const vals = Array.from(conteo.keys()).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
  
  const actual = filtrosColumna.get(col);
  const sel = new Set(actual && actual.size>0 ? Array.from(actual).filter(v => vals.includes(v)) : vals);
  
  const panel = document.createElement('div'); 
  panel.className='filtro-col-panel';
  const titulo = col==='_hoja_origen' ? '📄 Hoja Origen' : col;
  
  let html = `<h4>Filtrar: <span style="color:#333;font-weight:normal;">${escapeHtml(titulo)}</span><span class="cerrar-panel" onclick="cerrarPanelFiltro()">×</span></h4>
    <input type="text" id="buscarValorFiltro" placeholder="🔍 Buscar..." oninput="filtrarListaValores()">
    <div class="filtro-col-valores" id="filtroColValores">`;
  
  vals.forEach(v => {
    const et = v===''?'(vacío)':v;
    html += `<label><input type="checkbox" class="chk-valor" value="${escapeAttr(v)}" ${sel.has(v)?'checked':''}><span>${escapeHtml(et)}</span><span class="conteo">${conteo.get(v)}</span></label>`;
  });
  
  html += `</div><div class="filtro-col-acciones">
    <button class="btn-col-todos" onclick="marcarTodosValores(true)">☑️ Todos</button>
    <button class="btn-col-todos" onclick="marcarTodosValores(false)">⬜ Ninguno</button>
    <button class="btn-col-limpiar" onclick="limpiarFiltroColumna('${escapeAttr(col)}')">🗑️ Limpiar</button>
    <button class="btn-col-aplicar" onclick="aplicarFiltroColumna('${escapeAttr(col)}')">✔️ Aplicar</button>
  </div>`;
  
  panel.innerHTML = html; 
  document.body.appendChild(panel);
  
  const r = event.currentTarget.getBoundingClientRect(); 
  const pr = panel.getBoundingClientRect();
  let left = r.left + window.scrollX, top = r.bottom + window.scrollY + 4;
  if(left+pr.width > window.innerWidth-10) left = window.innerWidth - pr.width - 10;
  if(left < 10) left = 10;
  
  panel.style.left = left+'px'; 
  panel.style.top = top+'px';
  panelFiltroAbierto = panel;
  
  setTimeout(()=>document.getElementById('buscarValorFiltro')?.focus(),50);
  setTimeout(()=>document.addEventListener('mousedown', clickFueraPanelFiltro),0);
}

function cerrarPanelFiltro() { 
  if(panelFiltroAbierto){ 
    panelFiltroAbierto.remove(); 
    panelFiltroAbierto=null; 
  } 
  document.removeEventListener('mousedown', clickFueraPanelFiltro); 
}

function clickFueraPanelFiltro(e) { 
  if(panelFiltroAbierto && !panelFiltroAbierto.contains(e.target) && !e.target.classList.contains('btn-filtro-col')) {
    cerrarPanelFiltro(); 
  }
}

function filtrarListaValores() { 
  const t = (document.getElementById('buscarValorFiltro')?.value||'').toLowerCase(); 
  document.querySelectorAll('#filtroColValores label').forEach(l=>{ 
    const v=l.querySelector('.chk-valor').value.toLowerCase(); 
    l.style.display = v.includes(t)?'flex':'none'; 
  }); 
}

function marcarTodosValores(m) { 
  document.querySelectorAll('#filtroColValores .chk-valor').forEach(c=>c.checked=m); 
}

function aplicarFiltroColumna(col) {
  const checks = document.querySelectorAll('#filtroColValores .chk-valor');
  const marcados = new Set(); checks.forEach(c=>{ if(c.checked) marcados.add(c.value); });
  
  const totalVista = datosFiltrados.length;
  let sumaMarcados = 0;
  datosFiltrados.forEach(r => { if(marcados.has(String(r[col]??'').trim())) sumaMarcados++; });
  
  if(marcados.size===0) filtrosColumna.set(col, new Set());
  else if(sumaMarcados === totalVista && !filtrosColumna.has(col)) filtrosColumna.delete(col);
  else filtrosColumna.set(col, marcados);
  
  cerrarPanelFiltro(); 
  filtrarDatos(); 
  renderizarTabla(); 
  actualizarEstadisticas(); 
  renderizarFiltrosActivos();
}

function limpiarFiltroColumna(col) { 
  filtrosColumna.delete(col); 
  cerrarPanelFiltro(); 
  filtrarDatos(); 
  renderizarTabla(); 
  actualizarEstadisticas(); 
  renderizarFiltrosActivos(); 
}

function renderizarFiltrosActivos() {
  const c = document.getElementById('filtrosActivos'); 
  let html='';
  
  if(filtrosColumna.size>0) {
    html += '<strong>Filtros por columna:</strong> ';
    filtrosColumna.forEach((vals,col)=>{
      const res = vals.size===0 ? '⛔ (ninguno)' : (vals.size<=3 ? Array.from(vals).map(v=>v===''?'(vacío)':v).join(', ') : `${vals.size} valores`);
      const tit = col==='_hoja_origen'?'📄 Hoja Origen':col;
      html += `<span class="filter-tag-col">${escapeHtml(tit)}: ${escapeHtml(res)} <span class="remove" onclick="limpiarFiltroColumna('${escapeAttr(col)}')">×</span></span>`;
    });
    html += '<br>';
  }
  
  if(filtrosActivos.length>0) {
    html += '<strong>Filtros texto:</strong> ';
    filtrosActivos.forEach((f,i)=>{ html += `<span class="filter-tag">${f.columna}: ${f.valor} <span class="remove" onclick="eliminarFiltro(${i})">×</span></span>`; });
  }
  
  c.innerHTML = html;
}

function eliminarFiltro(i) { 
  filtrosActivos.splice(i,1); 
  filtrarDatos(); 
  renderizarTabla(); 
  actualizarEstadisticas(); 
  renderizarFiltrosActivos(); 
}

window.abrirFiltroColumna = abrirFiltroColumna;
window.cerrarPanelFiltro = cerrarPanelFiltro;
window.filtrarListaValores = filtrarListaValores;
window.marcarTodosValores = marcarTodosValores;
window.aplicarFiltroColumna = aplicarFiltroColumna;
window.limpiarFiltroColumna = limpiarFiltroColumna;
