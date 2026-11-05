// Gestión de sesiones: autoguardado + export/import JSON
let timerAutoguardado = null;
const INTERVALO_AUTOGUARDADO = 5000; // 5 segundos

function programarAutoguardado() {
  clearTimeout(timerAutoguardado);
  timerAutoguardado = setTimeout(ejecutarAutoguardado, INTERVALO_AUTOGUARDADO);
}

async function ejecutarAutoguardado() {
  if (!datosOriginales.length) return;
  
  const estado = {
    datosOriginales,
    carpetas: Array.from(carpetas.entries()),
    asignaciones: Array.from(asignaciones.entries()),
    filtrosColumna: Array.from(filtrosColumna.entries()).map(([k, v]) => [k, Array.from(v)]),
    carpetaActivaFiltro,
    contadorCarpetas,
    columnaNombre,
    timestamp: Date.now()
  };
  
  try {
    await guardarSesionAuto(estado);
    actualizarIndicadorGuardado('✅ Guardado auto: ' + new Date().toLocaleTimeString());
  } catch (e) {
    console.error('Error autoguardado:', e);
  }
}

function actualizarIndicadorGuardado(msg) {
  let ind = document.getElementById('indicadorGuardado');
  if (!ind) {
    ind = document.createElement('div');
    ind.id = 'indicadorGuardado';
    ind.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#28a745;color:#fff;padding:6px 12px;border-radius:6px;font-size:.75em;opacity:.8;z-index:9000;transition:opacity .3s;';
    document.body.appendChild(ind);
  }
  ind.textContent = msg;
  ind.style.opacity = '1';
  clearTimeout(ind._t);
  ind._t = setTimeout(() => { ind.style.opacity = '0'; }, 3000);
}

async function ofrecerReanudarSesion() {
  try {
    const sesion = await cargarSesionAuto();
    if (!sesion || !sesion.estado) return;
    
    const fecha = new Date(sesion.timestamp).toLocaleString();
    const total = sesion.estado.datosOriginales.length;
    const numCarpetas = sesion.estado.carpetas.length;
    
    const confirmar = confirm(
      `📂 Sesión anterior encontrada:\n\n` +
      `📅 Fecha: ${fecha}\n` +
      `📊 Registros: ${total}\n` +
      `📁 Carpetas: ${numCarpetas}\n\n` +
      `¿Deseas reanudar donde lo dejaste?`
    );
    
    if (confirmar) {
      reanudarSesion(sesion.estado);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error al reanudar:', e);
    return false;
  }
}

function reanudarSesion(estado) {
  datosOriginales = estado.datosOriginales || [];
  carpetas = new Map(estado.carpetas || []);
  asignaciones = new Map(estado.asignaciones || []);
  filtrosColumna = new Map((estado.filtrosColumna || []).map(([k, v]) => [k, new Set(v)]));
  carpetaActivaFiltro = estado.carpetaActivaFiltro || null;
  contadorCarpetas = estado.contadorCarpetas || 0;
  columnaNombre = estado.columnaNombre || '';
  
  // Reconstruir columnas
  const setC = new Set();
  datosOriginales.forEach(r => Object.keys(r).forEach(c => setC.add(c)));
  columnas = ['_hoja_origen', ...Array.from(setC).filter(c => c !== '_hoja_origen')];
  
  // Reconstruir selector de columnas
  const sel = document.getElementById('columnaNombre');
  sel.innerHTML = '<option value="">Columna Nombre</option>';
  columnas.forEach(c => {
    if (c === '_hoja_origen') return;
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
  if (columnaNombre) sel.value = columnaNombre;
  
  document.getElementById('carpetasPanel').style.display = 'block';
  habilitarBotones();
  filtrarDatos();
  renderizarTabla();
  renderizarCarpetas();
  renderizarFiltrosActivos();
  actualizarEstadisticas();
  detectarDuplicados();
  
  mostrarToast('✅ Sesión reanudada', 3000);
}

async function reiniciarSesion() {
  if (!confirm('¿Reiniciar sesión? Se borrarán TODOS los datos cargados, carpetas y asignaciones. Esta acción no se puede deshacer.')) return;
  
  await borrarSesionAuto();
  datosOriginales = [];
  datosFiltrados = [];
  columnas = [];
  columnaNombre = '';
  seleccionados.clear();
  filtrosActivos = [];
  filtrosColumna.clear();
  carpetas.clear();
  asignaciones.clear();
  carpetaActivaFiltro = null;
  contadorCarpetas = 0;
  duplicados.clear();
  cadenasDetectadas = {};
  
  document.getElementById('searchInput').value = '';
  document.getElementById('columnaNombre').innerHTML = '<option value="">Columna Nombre</option>';
  document.getElementById('carpetasPanel').style.display = 'none';
  
  renderizarTabla();
  renderizarCarpetas();
  renderizarFiltrosActivos();
  actualizarEstadisticas();
  document.getElementById('totalDuplicados').textContent = '0';
  
  mostrarToast('🔄 Sesión reiniciada', 2500);
}

function exportarSesionJSON() {
  if (!datosOriginales.length) {
    alert('No hay datos cargados para exportar');
    return;
  }
  
  const estado = {
    version: '3.0',
    fecha: new Date().toISOString(),
    datosOriginales,
    carpetas: Array.from(carpetas.entries()),
    asignaciones: Array.from(asignaciones.entries()),
    filtrosColumna: Array.from(filtrosColumna.entries()).map(([k, v]) => [k, Array.from(v)]),
    carpetaActivaFiltro,
    contadorCarpetas,
    columnaNombre
  };
  
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sesion_filtrador_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  mostrarToast('💾 Sesión exportada', 2500);
}

function importarSesionJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const estado = JSON.parse(e.target.result);
      if (!estado.datosOriginales || !estado.version) {
        alert('Archivo de sesión inválido');
        return;
      }
      if (!confirm(`¿Cargar sesión del ${new Date(estado.fecha).toLocaleString()}?\n\nSe perderá el trabajo actual.`)) return;
      
      reanudarSesion(estado);
      ejecutarAutoguardado();
    } catch (err) {
      alert('Error al leer archivo: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Aviso antes de cerrar
window.addEventListener('beforeunload', (e) => {
  if (datosOriginales.length > 0) {
    ejecutarAutoguardado();
    e.preventDefault();
    e.returnValue = '';
  }
});

window.programarAutoguardado = programarAutoguardado;
window.ejecutarAutoguardado = ejecutarAutoguardado;
window.ofrecerReanudarSesion = ofrecerReanudarSesion;
window.reanudarSesion = reanudarSesion;
window.reiniciarSesion = reiniciarSesion;
window.exportarSesionJSON = exportarSesionJSON;
window.importarSesionJSON = importarSesionJSON;
