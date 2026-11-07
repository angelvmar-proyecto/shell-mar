module.exports = {
  packagerConfig: {
    asar: true, // Esto comprime tu código para que nadie lo pueda editar fácilmente
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'FiltradorMAR',
        setupExe: 'FiltradorMAR-Setup.exe'
      }
    }
  ]
};
