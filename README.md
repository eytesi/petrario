# 🪨 Petrario — Guía de deploy en Vercel

## Estructura del proyecto
```
petrario-vercel/
├── api/
│   └── identify.js       ← función serverless (llama a Gemini, guarda la key)
├── src/
│   ├── main.jsx
│   └── App.jsx           ← toda la app React
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## Pasos para deployar

### 1. Conseguí tu Gemini API Key
- Andá a https://aistudio.google.com/apikey
- Creá una nueva key (el tier gratuito alcanza: 1500 requests/día)
- Copiala, **no la compartas ni la pegues en ningún archivo**

### 2. Subí el proyecto a GitHub
```bash
cd petrario-vercel
git init
git add .
git commit -m "Petrario inicial"
# Creá un repo en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/petrario.git
git push -u origin main
```

### 3. Conectá con Vercel
- Entrá a https://vercel.com y logueate con GitHub
- "Add New Project" → importá el repo de Petrario
- En "Build Settings" Vercel detecta Vite automáticamente
- Antes de deployar, en "Environment Variables" agregá:
  - Name: `GEMINI_API_KEY`
  - Value: (tu key de Google AI Studio)
- Click en Deploy

### 4. Listo
La URL que te da Vercel es tu app funcionando con IA real.

## Desarrollo local
```bash
npm install
# Creá un archivo .env.local (NO lo subas a git):
echo "GEMINI_API_KEY=tu_key_aqui" > .env.local
npm run dev
```

## Notas
- El archivo `.env.local` ya está en .gitignore por defecto en Vite
- La función `/api/identify.js` es la única que toca la key
- El frontend solo llama a `/api/identify`, nunca a Google directamente
- jsPDF y Leaflet se cargan desde CDN, no necesitan instalación
