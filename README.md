# MBET v2 — Guía completa para publicar tu app

Bienvenido. Esta guía te lleva de CERO a tener tu app funcionando en tu teléfono en **unos 20-30 minutos**. No necesitas instalar nada, todo se hace desde el navegador de tu celular.

---

## ✨ Qué incluye esta versión

**Panel principal**
- P&L, ROI, Win Rate, bankroll en vivo
- Gráfica de evolución del bankroll en el tiempo
- Racha actual + mejor racha histórica (ganadora y perdedora)
- Resumen de la semana vs semana pasada
- Punto de equilibrio visual
- Botón de "cerrar día" con tracking emocional

**Gestión de apuestas**
- Apuestas simples Y combinadas (parlays con múltiples selecciones)
- Campo de casa de apuestas
- Notas/comentarios por apuesta
- Fecha personalizable (por si registras apuestas viejas)
- Estados: pendiente, ganada, perdida, anulada
- **Recomendación Kelly Criterion**: dile la probabilidad estimada y te sugiere cuánto apostar
- Filtros avanzados: por deporte, estado, casa, rango de fechas

**Control y responsabilidad**
- Límites diarios y semanales de apuesta
- Stop-loss en % del bankroll
- Alertas cuando te acercas a tus límites
- Alerta automática tras 3+ apuestas perdidas seguidas
- Cierre de día con seguimiento emocional (🔥😌😐😤😵) y reflexión escrita

**Análisis profundo**
- Ranking por deporte (mejor y peor destacados)
- Ranking por casa de apuestas (descubre dónde ganas más)
- Desglose mensual (tendencias en el tiempo)
- Diario emocional (revisa cierres de días anteriores)

**Lectura IA de tickets**
- Foto → lectura automática
- Detecta si es simple o combinada
- Extrae evento, deporte, pick, cuota, stake y casa

**IA para probabilidades**
- Análisis entre equipos con probabilidades y cuotas justas
- Factores clave y nivel de confianza
- Contexto personalizable (lesiones, local, forma)

**Datos**
- Exportar a CSV (Excel lo abre directo)
- Importar CSV (por si cambias de teléfono)
- Backup completo en JSON
- Restore de backup

---

## 📋 Lo que vas a hacer (resumen)

1. Crear cuenta en **GitHub** (guarda el código)
2. Subir los archivos de Mbet a GitHub
3. Crear cuenta en **Vercel** (pone la app online)
4. Conectar Vercel con GitHub → tu app queda lista con un link
5. Instalar la app en tu pantalla de inicio
6. (Opcional) Conseguir API key de Anthropic para la IA

---

## PASO 1: Crear cuenta en GitHub

1. Abre en tu navegador: **https://github.com/signup**
2. Usa tu email, crea contraseña y nombre de usuario.
3. Verifica tu email.
4. Listo.

---

## PASO 2: Crear un repositorio

1. Toca el **+** arriba a la derecha → **New repository**.
2. Nombre: `mbet`
3. **Public**
4. Marca **Add a README file**
5. Toca **Create repository**

---

## PASO 3: Subir los archivos

**Recomendación fuerte**: descarga la app **GitHub** (App Store / Play Store), inicia sesión con tu cuenta. Es 10x más fácil subir desde ahí que desde el navegador del celular.

Dentro del repositorio `mbet`:

1. Toca **Add file** → **Upload files**
2. Sube todos los archivos manteniendo la estructura:

```
mbet/
├── package.json
├── vite.config.js
├── index.html
├── .gitignore
├── README.md
├── src/
│   ├── main.jsx
│   ├── Mbet.jsx
│   ├── components.jsx
│   ├── modals.jsx
│   └── utils.js
└── public/
    ├── manifest.json
    └── icon.svg
```

3. Toca **Commit changes**.

> **Truco si usas GitHub.com desde el navegador móvil:** cuando estés subiendo archivos, en el nombre del archivo puedes escribir `src/Mbet.jsx` y GitHub crea la carpeta automáticamente.

---

## PASO 4: Crear Vercel y conectar

1. Ve a: **https://vercel.com/signup**
2. **Continue with GitHub**
3. Autoriza.
4. **Add New...** → **Project**
5. Toca **Import** en tu repo `mbet`
6. NO cambies nada → **Deploy**
7. Espera 1-2 minutos → 🎉

Recibirás un link tipo `https://mbet-tuusuario.vercel.app`

---

## PASO 5: Instalar en pantalla de inicio

### iPhone (Safari):
1. Abre el link en **Safari**
2. Botón **Compartir**
3. **Añadir a pantalla de inicio**

### Android (Chrome):
1. Abre el link en **Chrome**
2. **Tres puntos** → **Instalar app**

---

## PASO 6 (Opcional): IA

Para lectura de tickets y análisis IA necesitas una API key de Anthropic.

1. Ve a **https://console.anthropic.com/signup**
2. Crea cuenta
3. **Settings → API Keys → Create Key**
4. **Settings → Billing** → agrega $5 mínimo
5. Copia tu key
6. En Mbet: ⚙️ Ajustes → pega la key → GUARDAR

Cada lectura de ticket cuesta ~$0.005 (medio centavo). $5 te dan cientos de usos.

---

## 🔄 Actualizar la app en el futuro

1. Ve a tu repo en GitHub
2. Sube o edita el archivo modificado
3. Vercel se actualiza solo en 1-2 minutos
4. **Tus datos NO se borran** con las actualizaciones

---

## 💡 Tips de uso

- **Configura límites primero**: antes de apostar, ve a Ajustes → Límites. Define tu tope diario y semanal. Tu yo futuro lo agradecerá.
- **Usa Kelly con honestidad**: la recomendación Kelly solo sirve si eres honesto con tu estimación de probabilidad. Si dices 80% cuando es 50%, el sistema te hará perder.
- **Cierra cada día**: toma 30 segundos al final del día, marca cómo te sentiste y escribe una línea. Después de un mes verás patrones (ej: pierdes más cuando apuestas "frustrado").
- **Haz backup mensual**: ve a Ajustes → Datos → Descargar backup. Guárdalo en tu Drive/iCloud.
- **Filtra por casa**: si apuestas en varias casas, mira cuál te da mejores resultados. Puede que en una pierdas sistemáticamente.

---

## ❓ Preguntas frecuentes

**¿Mis datos se guardan?** Sí, en el almacenamiento local de tu teléfono. No se van a ningún servidor.

**¿Qué pasa si cambio de teléfono?** Exporta el backup (Ajustes → Datos) antes, luego lo importas en el nuevo.

**¿Cuánto cuesta Vercel?** Gratis para uso personal.

**¿La API de Anthropic?** $5 de crédito = cientos de análisis.

**¿Se puede hacer privado el link?** La URL es difícil de adivinar. Para privacidad con contraseña, Vercel tiene una opción de pago ($20/mes) — para uso personal no es necesario.

---

## 🆘 Si algo falla

- **Deploy falla**: revisa que subiste TODOS los archivos en sus carpetas correctas.
- **IA no funciona**: verifica API key y crédito en Anthropic.
- **Otro error**: dime exactamente qué ves y lo arreglamos.

Buena suerte. Recuerda: la app te muestra la verdad — úsala para tomar mejores decisiones, no para justificar peores.
