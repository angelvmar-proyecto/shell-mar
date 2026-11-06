let carpetas = new Map();
let asignaciones = new Map();
let carpetaActivaFiltro = null;
let contadorCarpetas = 0;
const COLORES_CARPETAS = ['#6f42c1','#28a745','#dc3545','#fd7e14','#17a2b8','#e83e8c','#20c997','#6610f2','#ffc107','#007bff'];

function crearCarpeta() {
  const input = document.getElementById('nuevaCarpetaInput');
  const nombre = input.value.trim();
  if(!nombre) { alertSeguro('Escribe un nombre'); return; }
  for(const [,c] of carpetas) if(c.nombre.toLowerCase()===nombre.toLowerCase()) { alertSeguro('Ya existe'); return; }
  guardarParaDeshacer('crear carpeta');
  const id = 'carpeta_'+(++contadorCarpetas);
  carpetas.set(id, { nombre, color: COLORES_CARPETAS[(contadorCarpetas-1)%COLORES_CARPETAS.length] });
  input.value = '';
  renderizarCarpetas(); renderizarTabla(); actualizarEstadisticas();
  programarAutoguardado(); actualizarProgresoDepuracion();
}

function eliminarCarpeta(id) {
  const c = carpetas.get(id); if(!c) return;
  const n = contarRegistrosEnCarpeta(id);
  if(!confirm(`¿Eliminar "${c.nombre}"? ${n} registros volverán a Sin Asignar.`)) return;
  guardarParaDeshacer('eliminar carpeta');
  for(const [idx,cid] of Array.from(asignaciones)) if(cid===id) asignaciones.delete(idx);
  carpetas.delete(id);
  if(carpetaActivaFiltro===id) carpetaActivaFiltro=null;
  filtrarDatos(); renderizarCarpetas(); renderizarTabla(); actualizarEstadisticas();
  programarAutoguardado(); actualizarProgresoDepuracion();
}

function renombrarCarpeta(id) {
  const c = carpetas.get(id); if(!c) return;
  const n = prompt('Nuevo nombre:', c.nombre); if(!n||!n.trim()) return;
  for(const [cid,cc] of carpetas) if(cid!==id && cc.nombre.toLowerCase()===n.toLowerCase().trim()) { alertSeguro('Ya existe'); return; }
  guardarParaDeshacer('renombrar carpeta');
  c.nombre = n.trim(); renderizarCarpetas(); renderizarTabla();
  programarAutoguardado(); actualizarProgresoDepuracion();
}

function contarRegistrosEnCarpeta(id) { let n=0; for(const [,cid] of asignaciones) if(cid===id) n++; return n; }
function contarSinAsignar() { let n=0; datosOriginales.forEach((_,idx)=>{ if(!asignaciones.has(idx)) n++; }); return n; }

function moverSeleccionadosA(idCarpeta) {
  if(!seleccionados.size) { alertSeguro('Selecciona registros primero'); return; }
  guardarParaDeshacer('mover a sin asignar');
  const idxs = [];
  seleccionados.forEach(i => { const item = datosFiltrados[i]; const oi = datosOriginales.indexOf(item); if(oi!==-1) idxs.push(oi); });
  idxs.forEach(i => { if(idCarpeta) asignaciones.set(i, idCarpeta); else asignaciones.delete(i); });
  const nombre = idCarpeta ? carpetas.get(idCarpeta).nombre : 'Sin Asignar';
  seleccionados.clear(); filtrarDatos(); renderizarTabla(); renderizarCarpetas(); actualizarEstadisticas();
  mostrarToast(`✅ ${idxs.length} → "${nombre}"`);
  programarAutoguardado(); actualizarProgresoDepuracion();
}

function asignarSeleccionadosA(idCarpeta) {
  if(!seleccionados.size) { alertSeguro('Selecciona registros primero'); return; }
  guardarParaDeshacer('asignar a carpeta');
  const idxs = [];
  seleccionados.forEach(i => { const item = datosFiltrados[i]; const oi = datosOriginales.indexOf(item); if(oi!==-1) idxs.push(oi); });
  idxs.forEach(i => asignaciones.set(i, idCarpeta));
  const nombre = carpetas.get(idCarpeta).nombre;
  seleccionados.clear(); filtrarDatos(); renderizarTabla(); renderizarCarpetas(); actualizarEstadisticas();
  mostrarToast(`✅ ${idxs.length} → "${nombre}"`);
  programarAutoguardado(); actualizarProgresoDepuracion();
}

function filtrarPorCarpeta(id) {
  carpetaActivaFiltro = (carpetaActivaFiltro===id) ? null : id;
  filtrarDatos(); renderizarTabla(); actualizarEstadisticas(); renderizarCarpetas();
}

function renderizarCarpetas() {
  const lista = document.getElementById('carpetasLista'); if(!lista) return;
  let html = `<div class="carpeta-chip sin-asignar ${carpetaActivaFiltro==='__SIN_ASIGNAR__'?'activa':''}" onclick="filtrarPorCarpeta('__SIN_ASIGNAR__')">📭 Sin Asignar <span class="count">${contarSinAsignar()}</span></div>`;
  for(const [id,c] of carpetas) {
    const n = contarRegistrosEnCarpeta(id);
    html += `<div class="carpeta-chip asignada ${carpetaActivaFiltro===id?'activa':''}" style="background:${c.color}22;color:${c.color};" onclick="filtrarPorCarpeta('${id}')">
      📁 ${escapeHtml(c.nombre)} <span class="count">${n}</span>
      <span class="acciones" onclick="event.stopPropagation()">
        <span onclick="asignarSeleccionadosA('${id}')" title="Mover aquí">📥</span>
        <span onclick="renombrarCarpeta('${id}')">✏️</span>
        <span onclick="eliminarCarpeta('${id}')">🗑️</span>
      </span></div>`;
  }
  lista.innerHTML = html;
  document.getElementById('totalCarpetas').textContent = carpetas.size;
  const btn = document.getElementById('btnMoverSin');
  if(btn) btn.disabled = !(datosOriginales.length && seleccionados.size>0);
}
