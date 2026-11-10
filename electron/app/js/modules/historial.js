// Módulo para deshacer acciones
let pilaUndo = [];
const MAX_UNDO = 20;

function capturarEstado() {
  return {
    datosOriginales: JSON.parse(JSON.stringify(datosOriginales)),
    carpetas: Array.from(carpetas.entries()),
    asignaciones: Array.from(asignaciones.entries()),
    filtrosColumna: Array.from(filtrosColumna.entries()).map(([k, v]) => [k, Array.from(v)]),
    contadorCarpetas
  };
}

function restaurarEstado(estado) {
  datosOriginales = estado.datosOriginales;
  carpetas = new Map(estado.carpetas);
  asignaciones = new Map(estado.asignaciones);
  filtrosColumna = new Map(estado.filtrosColumna.map(([k, v]) => [k, new Set(v)]));
  contadorCarpetas = estado.contadorCarpetas;
  
  filtrarDatos();
  renderizarTabla();
  renderizarCarpetas();
  actualizarEstadisticas();
  renderizarFiltrosActivos();
}

function guardarParaDeshacer(accion) {
  pilaUndo.push({
    timestamp: Date.now(),
    accion: accion || 'acción',
    estado: capturarEstado()
  });
  if (pilaUndo.length > MAX_UNDO) pilaUndo.shift();
  actualizarBotonUndo();
}

function deshacer() {
  if (pilaUndo.length === 0) {
    mostrarToast('No hay nada que deshacer', 2000);
    return;
  }
  const ultimo = pilaUndo.pop();
  restaurarEstado(ultimo.estado);
  mostrarToast(`↩️ Deshecho: ${ultimo.accion}`, 2500);
  actualizarBotonUndo();
  programarAutoguardado();
}

function actualizarBotonUndo() {
  const btn = document.getElementById('btnUndo');
  if (btn) {
    btn.disabled = pilaUndo.length === 0;
    btn.textContent = pilaUndo.length > 0 ? `↩️ Deshacer (${pilaUndo.length})` : '↩️ Deshacer';
  }
}

window.guardarParaDeshacer = guardarParaDeshacer;
window.deshacer = deshacer;
window.actualizarBotonUndo = actualizarBotonUndo;
