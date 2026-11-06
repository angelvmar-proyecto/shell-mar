function escapeHtml(t) { if(t==null) return ''; return String(t).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function escapeAttr(t) { if(t==null) return ''; return String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function fechaHoy() { return new Date().toISOString().slice(0,10); }

function levenshtein(a, b) {
  const m = []; for(let i=0;i<=b.length;i++) m[i]=[i]; for(let j=0;j<=a.length;j++) m[0][j]=j;
  for(let i=1;i<=b.length;i++) for(let j=1;j<=a.length;j++) {
    m[i][j] = b[i-1]===a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  } return m[b.length][a.length];
}

function busquedaDifusaMatch(texto, termino) {
  if(texto.includes(termino)) return true;
  const tol = termino.length > 5 ? 2 : 1;
  for(let i=0;i<=texto.length-termino.length+tol;i++) {
    const sub = texto.substr(i, termino.length+tol);
    if(levenshtein(sub, termino) <= tol) return true;
  } return false;
}

function mostrarToast(msg, ms) {
  let t = document.getElementById('toastMsg');
  if(!t) { t=document.createElement('div'); t.id='toastMsg'; t.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#28a745;color:#fff;padding:10px 20px;border-radius:6px;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999;transition:opacity .3s;font-size:.9em;max-width:90vw;text-align:center;'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity='1';
  clearTimeout(t._timeout); t._timeout = setTimeout(()=>{t.style.opacity='0';}, ms||2000);
}

function actualizarProgresoDepuracion() {
  if (!datosOriginales || datosOriginales.length === 0) {
    document.getElementById('progresoPanel').style.display = 'none';
    return;
  }
  document.getElementById('progresoPanel').style.display = 'block';
  
  const total = datosOriginales.length;
  const asignados = asignaciones.size; // Cuántos ya están en alguna carpeta
  const porcentaje = Math.round((asignados / total) * 100);
  
  document.getElementById('progresoTexto').textContent = `${porcentaje}% (${asignados}/${total})`;
  document.getElementById('progresoFill').style.width = porcentaje + '%';
}

// Reemplazo de alert() para evitar bloqueos en Electron
window.alertSeguro = function(mensaje) {
  mostrarToast(mensaje, 4000);
};

// Reemplazo de confirm() para evitar bloqueos en Electron
window.confirmarSeguro = function(mensaje, callback) {
  // Creamos un modal rápido en HTML
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px; text-align:center;">
      <h3 style="color:#0056b3;">Confirmación</h3>
      <p style="white-space:pre-wrap;">${escapeHtml(mensaje)}</p>
      <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
        <button id="btnConfirmSi" style="background:#28a745; color:white; padding:10px 20px; border:none; border-radius:4px; cursor:pointer;">Sí, continuar</button>
        <button id="btnConfirmNo" style="background:#dc3545; color:white; padding:10px 20px; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.querySelector('#btnConfirmSi').onclick = () => {
    document.body.removeChild(modal);
    callback(true);
  };
  modal.querySelector('#btnConfirmNo').onclick = () => {
    document.body.removeChild(modal);
    callback(false);
  };
};
