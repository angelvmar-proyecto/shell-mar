let datosOriginales = [], datosFiltrados = [], columnas = [], columnaNombre = '';
let seleccionados = new Set(), terminoBusqueda = '', busquedaGlobal = false, busquedaDifusa = false;
let filtrosActivos = [], cadenasDetectadas = {}, vistasGuardadas = {}, columnaOrden = '', ordenAscendente = true, duplicados = new Set();

const CADENAS_HOTELERAS = ['riu','marriott','hilton','hyatt','radisson','westin','sheraton','fiesta americana','hampton inn','holiday inn','intercontinental','xcaret','royal caribbean','sandos','barceló','iberostar','melia','secrets','dreams','sunwing','air canada','transat','bahia principe'];

// ===== CARGA DE EXCEL =====
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const wb = XLSX.read(new Uint8Array(ev.target.result), {type:'array'});
      const filas = [], info = [];
      
      wb.SheetNames.forEach(nh => {
        const sh = wb.Sheets[nh]; if(!sh) return;
        const json = XLSX.utils.sheet_to_json(sh, {defval:''}); if(!json.length) return;
        json.forEach(r => { 
          r['_hoja_origen'] = nh; 
          filas.push(r); 
        });
        info.push({nombre:nh, filas:json.length});
      });
      
      if(!filas.length) { alertSeguro('El Excel no tiene datos en ninguna hoja'); return; }
      
      const setC = new Set(); 
      filas.forEach(r => Object.keys(r).forEach(c => setC.add(c)));
      columnas = ['_hoja_origen', ...Array.from(setC).filter(c=>c!=='_hoja_origen')];
      
      datosOriginales = filas;
      carpetas.clear(); asignaciones.clear(); filtrosColumna.clear(); filtrosActivos=[]; carpetaActivaFiltro=null; contadorCarpetas=0; seleccionados.clear(); terminoBusqueda=''; cadenasDetectadas={}; columnaOrden='';
      document.getElementById('searchInput').value = '';
      
      const sel = document.getElementById('columnaNombre'); 
      sel.innerHTML='<option value="">Columna Nombre</option>';
      let det = '';
      columnas.forEach(c => { 
        if(c==='_hoja_origen') return; 
        const o=document.createElement('option'); o.value=c; o.textContent=c; sel.appendChild(o); 
        const cl=c.toLowerCase(); 
        if(cl.includes('nombre')||cl.includes('name')||cl.includes('hotel')) det=c; 
      });
      
      if(det) { sel.value=det; columnaNombre=det; }
      
      habilitarBotones(); 
      filtrarDatos(); 
      renderizarTabla(); 
      actualizarEstadisticas(); 
      detectarDuplicados(); 
      renderizarCarpetas(); 
      renderizarFiltrosActivos();
      document.getElementById('carpetasPanel').style.display='block';
      
      const res = info.map(h=>`• ${h.nombre}: ${h.filas}`).join('\n');
      mostrarToast(`📚 ${info.length} hojas unidas · ${filas.length} registros`, 4000);
      
    } catch(err) { 
      alertSeguro('Error al leer el Excel: ' + err.message); 
    }
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('columnaNombre').addEventListener('change', function() { columnaNombre=this.value; if(columnaNombre) renderizarTabla(); });
document.getElementById('searchInput').addEventListener('input', function() { terminoBusqueda=this.value.trim(); filtrarDatos(); renderizarTabla(); actualizarEstadisticas(); });

// ===== FILTRADO PRINCIPAL =====
function filtrarDatos() {
  datosFiltrados = [...datosOriginales];
  if(carpetaActivaFiltro) {
    if(carpetaActivaFiltro==='__SIN_ASIGNAR__') datosFiltrados = datosFiltrados.filter((_,i)=>!asignaciones.has(i));
    else datosFiltrados = datosFiltrados.filter((_,i)=>asignaciones.get(i)===carpetaActivaFiltro);
  }
  filtrosColumna.forEach((vals,col) => { if(vals && vals.size>0) datosFiltrados = datosFiltrados.filter(r => vals.has(String(r[col]??'').trim())); });
  if(terminoBusqueda) datosFiltrados = aplicarBusqueda(datosFiltrados, terminoBusqueda);
  if(columnaOrden) datosFiltrados.sort((a,b)=>{ const va=a[columnaOrden]??'', vb=b[columnaOrden]??''; const c=va<vb?-1:va>vb?1:0; return ordenAscendente?c:-c; });
}

function aplicarBusqueda(datos, termino) {
  let r = datos;
  const txt = (row) => busquedaGlobal ? Object.values(row).join(' ').toLowerCase() : String(row[columnaNombre]||'').toLowerCase();
  if(termino.includes(' AND ')) { termino.split(' AND ').map(p=>p.trim()).forEach(p => { r = r.filter(row => busquedaDifusa ? busquedaDifusaMatch(txt(row), p.toLowerCase()) : txt(row).includes(p.toLowerCase())); }); }
  else if(termino.includes(' OR ')) { const parts = termino.split(' OR ').map(p=>p.trim()); r = r.filter(row => parts.some(p => busquedaDifusa ? busquedaDifusaMatch(txt(row), p.toLowerCase()) : txt(row).includes(p.toLowerCase()))); }
  else if(termino.includes(' NOT ')) { const [inc, exc] = termino.split(' NOT ').map(p=>p.trim()); r = r.filter(row => { const t=txt(row); const a = busquedaDifusa?busquedaDifusaMatch(t,inc.toLowerCase()):t.includes(inc.toLowerCase()); const b = busquedaDifusa?busquedaDifusaMatch(t,exc.toLowerCase()):t.includes(exc.toLowerCase()); return a&&!b; }); }
  else { r = r.filter(row => busquedaDifusa ? busquedaDifusaMatch(txt(row), termino.toLowerCase()) : txt(row).includes(termino.toLowerCase())); }
  return r;
}

// ===== DUPLICADOS Y CADENAS =====
function detectarDuplicados() {
  duplicados.clear();
  const ns = datosOriginales.map(r => String(r[columnaNombre]||'').toLowerCase().trim());
  ns.forEach((n,i) => { if(n && ns.filter(x=>x===n).length>1) duplicados.add(i); });
  document.getElementById('totalDuplicados').textContent = duplicados.size;
}
function mostrarDuplicados() { if(!duplicados.size) { alertSeguro('No hay duplicados'); return; } datosFiltrados = datosOriginales.filter((_,i)=>duplicados.has(i)); renderizarTabla(); actualizarEstadisticas(); }
function detectarCadenas() {
  cadenasDetectadas = {};
  datosOriginales.forEach(r => { const n = String(r[columnaNombre]||'').toLowerCase(); CADENAS_HOTELERAS.forEach(c => { if(n.includes(c)) { if(!cadenasDetectadas[c]) cadenasDetectadas[c]=[]; cadenasDetectadas[c].push(r); } }); });
  const total = Object.values(cadenasDetectadas).reduce((s,a)=>s+a.length,0);
  alertSeguro(`✅ ${Object.keys(cadenasDetectadas).length} cadenas en ${total} hoteles`);
  renderizarTabla();
}

// ===== TOGGLES =====
function toggleGlobal() { busquedaGlobal=!busquedaGlobal; document.getElementById('btnGlobal').style.background = busquedaGlobal?'#28a745':'#0056b3'; filtrarDatos(); renderizarTabla(); }
function toggleDifusa() { busquedaDifusa=!busquedaDifusa; document.getElementById('btnDifusa').style.background = busquedaDifusa?'#28a745':'#0056b3'; filtrarDatos(); renderizarTabla(); }

function limpiarTodo() {
  document.getElementById('searchInput').value=''; terminoBusqueda=''; busquedaGlobal=false; busquedaDifusa=false; seleccionados.clear(); filtrosActivos=[]; filtrosColumna.clear(); carpetaActivaFiltro=null; cerrarPanelFiltro();
  document.getElementById('btnGlobal').style.background='#0056b3'; document.getElementById('btnDifusa').style.background='#0056b3';
  filtrarDatos(); renderizarTabla(); actualizarEstadisticas(); renderizarFiltrosActivos(); renderizarCarpetas();
}

// ===== VISTAS =====
function guardarVista() {
  const n = prompt('Nombre de la vista:'); if(!n) return;
  vistasGuardadas[n] = { terminoBusqueda, busquedaGlobal, busquedaDifusa, filtrosActivos:[...filtrosActivos], filtrosColumna: Array.from(filtrosColumna.entries()).map(([c,s])=>[c,Array.from(s)]) };
  localStorage.setItem('vistasGuardadas', JSON.stringify(vistasGuardadas)); alertSeguro('✅ Guardada');
}
function cargarVista() {
  const vs = Object.keys(vistasGuardadas); if(!vs.length) { alertSeguro('No hay vistas'); return; }
  const n = prompt(`Vistas:\n${vs.join('\n')}\n\nNombre:`); if(!n||!vistasGuardadas[n]) return;
  const v = vistasGuardadas[n]; terminoBusqueda=v.terminoBusqueda||''; busquedaGlobal=!!v.busquedaGlobal; busquedaDifusa=!!v.busquedaDifusa; filtrosActivos=v.filtrosActivos||[];
  filtrosColumna.clear(); if(v.filtrosColumna) v.filtrosColumna.forEach(([c,a])=>filtrosColumna.set(c,new Set(a)));
  document.getElementById('searchInput').value=terminoBusqueda;
  document.getElementById('btnGlobal').style.background = busquedaGlobal?'#28a745':'#0056b3';
  document.getElementById('btnDifusa').style.background = busquedaDifusa?'#28a745':'#0056b3';
  filtrarDatos(); renderizarTabla(); actualizarEstadisticas(); renderizarFiltrosActivos();
}

// ===== EDICIÓN MASIVA =====
function editarMasiva() {
  if(!seleccionados.size) { alertSeguro('Selecciona registros primero'); return; }
  const modal = document.createElement('div');
  modal.className = 'modal'; modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px;">
      <h3>Editar registros</h3>
      <p>Modificando <strong>${seleccionados.size}</strong> registro(s).</p>
      <label>Columna:</label>
      <select id="editColSelect" style="width:100%; margin-bottom:10px; padding:5px;">${columnas.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
      <label>Nuevo valor:</label>
      <input type="text" id="editValInput" style="width:100%; margin-bottom:15px; padding:5px;">
      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button onclick="this.closest('.modal').remove()" style="background:#ccc; padding:8px; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
        <button onclick="aplicarEdicionMasiva()" style="background:#0056b3; color:white; padding:8px; border:none; border-radius:4px; cursor:pointer;">Aplicar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function aplicarEdicionMasiva() {
  const col = document.getElementById('editColSelect').value;
  const val = document.getElementById('editValInput').value;
  guardarParaDeshacer('edición masiva');
  seleccionados.forEach(i => { const item=datosFiltrados[i]; const oi=datosOriginales.indexOf(item); if(oi!==-1) datosOriginales[oi][col]=val; });
  document.querySelector('.modal[style*="display: block"]').remove();
  filtrarDatos(); renderizarTabla(); actualizarEstadisticas();
  mostrarToast(`✅ ${seleccionados.size} actualizados`, 3000);
  programarAutoguardado();
}

// ===== LIMPIADOR DE CARACTERES ROTOS =====
function limpiarTextosRaros() {
  if (!datosOriginales.length) { alertSeguro('Carga un Excel primero'); return; }
  const haySeleccion = seleccionados.size > 0;
  const mensaje = haySeleccion ? `¿Limpiar los ${seleccionados.size} seleccionados?` : `¿Limpiar TODA la base (${datosOriginales.length})?`;

  confirmarSeguro(mensaje, (confirmado) => {
    if (!confirmado) return;
    mostrarToast('⏳ Limpiando textos...', 5000);
    setTimeout(() => {
      guardarParaDeshacer('limpiar textos');
      const reemplazos = {
        'Ã¡': 'á', 'Ã©': 'é', 'Ã': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã±': 'ñ', 'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‘': 'Ñ',
        'â€™': "'", 'â€~': "'", 'â€œ': '"', 'â€': '"', 'â€“': '–', 'â€”': '—', 'â€¦': '...', 'Â ': ' ', 'Â': '', 'Âº': 'º', 'Âª': 'ª',
        'Ã¼': 'ü', 'Ãœ': 'Ü', 'Ã§': 'ç', 'Ã‡': 'Ç', 'Ã¢â‚¬â„¢': "'", 'Ã¢â‚¬Å“': '"'
      };
      const regex = new RegExp(Object.keys(reemplazos).join('|'), 'g');
      const limpiarString = (str) => typeof str === 'string' ? str.replace(regex, match => reemplazos[match] || match) : str;
      
      let modificados = 0;
      const indices = haySeleccion ? Array.from(seleccionados).map(i => datosOriginales.indexOf(datosFiltrados[i])) : datosOriginales.keys();
      
      for (const oi of indices) {
        if (oi === -1) continue;
        let filaMod = false;
        for (const col of columnas) {
          if (col === '_hoja_origen') continue;
          const orig = datosOriginales[oi][col];
          const limpio = limpiarString(orig);
          if (limpio !== orig) { datosOriginales[oi][col] = limpio; filaMod = true; }
        }
        if (filaMod) modificados++;
      }
      filtrarDatos(); renderizarTabla(); actualizarEstadisticas(); programarAutoguardado();
      mostrarToast(modificados > 0 ? `✅ ${modificados} limpiados` : `✨ Nada que limpiar`, 3000);
    }, 100);
  });
}

// ===== ELIMINAR =====
function eliminarSeleccionados() {
  if(!seleccionados.size) return;
  if (seleccionados.size > 50) {
    const texto = prompt(`⚠️ Eliminar ${seleccionados.size} registros.\nEscribe "BORRAR" para confirmar:`);
    if (texto !== 'BORRAR') return;
  } else { if(!confirm(`¿Eliminar ${seleccionados.size}?`)) return; }
  
  guardarParaDeshacer('eliminar');
  const idxs = new Set(); seleccionados.forEach(i => { const item=datosFiltrados[i]; const oi=datosOriginales.indexOf(item); if(oi!==-1) idxs.add(oi); });
  const sorted = Array.from(idxs).sort((a,b)=>b-a);
  const mapa = new Map(); let n=0;
  for(let i=0;i<datosOriginales.length;i++) if(!idxs.has(i)) mapa.set(i,n++);
  sorted.forEach(i=>datosOriginales.splice(i,1));
  const nuevas = new Map(); for(const [oi,cid] of asignaciones) if(mapa.has(oi)) nuevas.set(mapa.get(oi),cid);
  asignaciones = nuevas; seleccionados.clear();
  filtrarDatos(); renderizarTabla(); actualizarEstadisticas(); detectarDuplicados(); renderizarCarpetas();
  mostrarToast(`✅ ${sorted.length} eliminados`);
  programarAutoguardado();
}

// ===== EXPORTAR =====
function exportarPorCarpetas() {
  if(!carpetas.size) { alertSeguro('Crea carpetas primero'); return; }
  const wb = XLSX.utils.book_new(); let hojas=0;
  for(const [id,c] of carpetas) {
    const regs = []; datosOriginales.forEach((r,i)=>{ if(asignaciones.get(i)===id) regs.push(r); });
    if(!regs.length) continue;
    const ws = crearHojaExcel(regs);
    let name = c.nombre.replace(/[\\\/\?\*\[\]:]/g,'_').substring(0,31);
    let final = name, sfx=1; while(wb.SheetNames.includes(final)) { const s=`_${sfx}`; final=name.substring(0,31-s.length)+s; sfx++; }
    XLSX.utils.book_append_sheet(wb, ws, final); hojas++;
  }
  const sin = []; datosOriginales.forEach((r,i)=>{ if(!asignaciones.has(i)) sin.push(r); });
  if(sin.length) { XLSX.utils.book_append_sheet(wb, crearHojaExcel(sin), 'Sin Asignar'); hojas++; }
  if(!hojas) { alertSeguro('Sin datos'); return; }
  XLSX.writeFile(wb, `carpetas_${fechaHoy()}.xlsx`);
  setTimeout(() => { document.body.style.pointerEvents = "auto"; }, 500);
}

function exportarFiltrados() {
  if(!datosFiltrados.length) { alertSeguro('Sin datos'); return; }
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, crearHojaExcel(datosFiltrados), 'Filtrados');
  XLSX.writeFile(wb, `filtrados_${fechaHoy()}.xlsx`);
  setTimeout(() => { document.body.style.pointerEvents = "auto"; }, 500);
}

// ===== UTILIDADES UI =====
function actualizarEstadisticas() {
  document.getElementById('totalRegistros').textContent = datosOriginales.length;
  document.getElementById('totalFiltrados').textContent = datosFiltrados.length;
  document.getElementById('totalSeleccionados').textContent = seleccionados.size;
  document.getElementById('totalCarpetas').textContent = carpetas.size;
  actualizarProgresoDepuracion();
}

function habilitarBotones() {
  ['searchInput','btnLimpiar','btnGlobal','btnDifusa','btnDuplicados','btnGuardarVista','btnCargarVista','btnEditarMasiva','btnSelTodos','btnDeselTodos','btnEliminar','btnExportar','btnCadenas','btnExportarCarpetas','btnExportarSesion','btnImportarSesion','btnReiniciar','btnUndo','btnVista','btnEstadisticas','btnLimpiarTexto','btnMapa'].forEach(id => { const el=document.getElementById(id); if(el) el.disabled=false; });
  actualizarBotonUndo();
}

function mostrarAyuda() { document.getElementById('modalAyuda').style.display='block'; }
function cerrarAyuda() { document.getElementById('modalAyuda').style.display='none'; }

try { const s=localStorage.getItem('vistasGuardadas'); if(s) vistasGuardadas=JSON.parse(s); } catch(e){}

// ===== ATAJOS DE TECLADO =====
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if(e.ctrlKey && e.key==='f') { e.preventDefault(); document.getElementById('searchInput').focus(); }
  else if(e.ctrlKey && e.key==='z') { e.preventDefault(); deshacer(); }
  else if(e.key==='Escape') { cerrarPanelFiltro(); cerrarAyuda(); cerrarEstadisticas(); cerrarMapa(); }
  else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); seleccionarTodos(); mostrarToast('☑️ Todos seleccionados', 1500); }
  else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); deseleccionarTodos(); mostrarToast('⬜ Selección vacía', 1500); }
  else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); mostrarDuplicados(); }
  else if (/^[1-9]$/.test(e.key)) {
    const index = parseInt(e.key) - 1;
    const carpetasArray = Array.from(carpetas.keys());
    if (carpetasArray[index]) { e.preventDefault(); asignarSeleccionadosA(carpetasArray[index]); }
  }
});

// ===== INICIALIZACIÓN =====
(async function initApp() {
  await initDB();
  setTimeout(() => { ofrecerReanudarSesion(); }, 500);
})();

// Exponer al window
Object.assign(window, { crearCarpeta, eliminarCarpeta, renombrarCarpeta, filtrarPorCarpeta, asignarSeleccionadosA, moverSeleccionadosA, exportarPorCarpetas, abrirFiltroColumna, cerrarPanelFiltro, filtrarListaValores, marcarTodosValores, aplicarFiltroColumna, limpiarFiltroColumna, limpiarTodo, toggleGlobal, toggleDifusa, mostrarDuplicados, detectarCadenas, guardarVista, cargarVista, editarMasiva, aplicarEdicionMasiva, eliminarSeleccionados, seleccionarTodos, deseleccionarTodos, toggleSeleccion, ordenarPor, exportarFiltrados, mostrarAyuda, cerrarAyuda, filtrarDatos, renderizarTabla, renderizarCarpetas, actualizarEstadisticas, renderizarFiltrosActivos, deshacer, mostrarEstadisticas, cerrarEstadisticas, limpiarTextosRaros });
