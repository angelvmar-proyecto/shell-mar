#!/bin/bash
echo "🔍 Validando sintaxis JavaScript..."
for f in ~/filtrador/www/js/modules/*.js ~/filtrador/www/js/app.js; do
  node --check "$f" || { echo "❌ Error en $f. Abortando deploy."; exit 1; }
done
echo "✅ Sintaxis OK. Sincronizando Capacitor..."
cd ~/filtrador
npx cap sync
echo "📤 Subiendo a GitHub..."
git add .
git commit -m "Deploy automático $(date +'%Y-%m-%d %H:%M')"
git push origin main
echo "🚀 Build lanzado en GitHub Actions"
