import type { CapacitorElectronConfig } from '@capawesome/capacitor-electron/config';

const config: CapacitorElectronConfig = {
  // Definir el tamaño y comportamiento de la ventana aquí
  window: {
    width: 1280,
    height: 800,
    show: true,        // Forzar visibilidad desde el inicio
    focusable: true
  }
};

export default config;
