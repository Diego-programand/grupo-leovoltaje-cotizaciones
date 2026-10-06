# Generador de Cotizaciones — Grupo Leovoltaje

Motor web moderno y ágil desarrollado en **Next.js 15**, **TypeScript** y **Vanilla CSS** para la generación, emisión y descarga de propuestas técnicas y cotizaciones comerciales en formato estricto **A4** para **Grupo Leovoltaje** (Servicios de ingeniería eléctrica y obras técnicas).

---

## 📌 UBICACIÓN DE ASSETS Y PERSONALIZACIÓN DE IMÁGENES

Para colocar la imagen de la firma y el logo oficial de la empresa:

### 1. Logo de la Empresa
* **Ruta de archivo:** `public/logo.png` o `public/favicon.svg`
* **Formatos soportados:** PNG transparente o SVG vectorial.
* **Resolución recomendada:** 512x512 px o vector SVG.
* **Nota técnica:** En `components/QuotationDocument.tsx` el logo se carga desde `data.logoUrl || '/favicon.svg'`. Si colocas tu archivo `logo.png` en `public/logo.png`, puedes actualizar la ruta en `data/defaults.ts` (`OFFICIAL_COMPANY_INFO.logoUrl = '/logo.png'`).

### 2. Firma Digital del Administrador
* **Ruta de archivo:** `public/firma-admin.png` (o `public/firma-admin.svg`)
* **Formatos soportados:** PNG transparente con la firma gráfica digitalizada o SVG.
* **Dimensiones recomendadas:** Ancho 300px a 500px, alto 80px a 140px, fondo estrictamente transparente.
* **Nota técnica:** Actualmente el proyecto incluye un placeholder vectorial en `public/firma-admin.svg`. Al reemplazarlo por tu archivo gráfico oficial `public/firma-admin.png`, actualiza la ruta en `data/defaults.ts` (`OFFICIAL_COMPANY_INFO.signatureUrl = '/firma-admin.png'`).

---

## 🚀 Características Principales

1. **Identidad Visual Corporativa:**
   - Paleta de color oficial: Azul institucional (`#232357`), azul acento de marca (`#23266c`), neutro secundario (`#d5d5eb`) y neutros técnicos (`#FFFFFF`, `#F8F9FA`, `#1A1A1A`, `#333333`).
   - Tipografía oficial: Familia `Bree Serif` para encabezados, títulos y total económico; familia `Inter` para lectura técnica y cuerpo.

2. **Modelo Comercial de Precio Global (Llave en Mano):**
   - Tabla técnica de una sola columna al 100% de ancho (`DESCRIPCIÓN`).
   - Cero columnas intermedias de precio.
   - Franja consolidada de cierre al pie con la etiqueta **TOTAL** y el importe global del proyecto (`$ [VALOR_TOTAL] COP`).

3. **Cero Texto Relleno:**
   - Saludo institucional directo de 2 líneas con referencia al consecutivo y fecha.
   - Mensaje de cierre técnico y canales oficiales.

4. **Presets de Partidas Eléctricas:**
   - Botones rápidos de 1-clic para agregar labores frecuentes:
     - Acometida NTC 2050
     - Tablero de Distribución
     - Tubería EMT y Cajas
     - Circuitos Ramales
     - Puesta a Tierra (SPT)
     - Pruebas RETIE
     - Servicios eléctricos generales
     - Servicios de aire acondicionado
     - Sistemas de seguridad
     - Redes y telecomunicaciones

5. **Exportación y Compartir:**
   - **Descarga PDF en A4:** Compilación directa con `jsPDF` y `html2canvas` a escala 2.3x para máxima fidelidad vectorial.
   - **Compartir por WhatsApp:** Genera texto redactado automáticamente con el resumen del alcance y link/archivo adjunto.
   - **Impresión nativa:** Compatible con `Ctrl+P` y reglas `@media print`.

6. **Seguridad Administrativa:**
   - Protección por PIN (por defecto: `leovoltaje2026`).
   - Rate limiting contra fuerza bruta y sesión firmada mediante cookie HTTP-Only.

---

## 🛠️ Instalación y Ejecución Local

1. Navega a la carpeta del proyecto:
   ```bash
   cd D:\3-Development\OwlyDev\grupo-leovoltaje-cotizaciones
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre en tu navegador:
   `http://localhost:3000`

---

## 🔐 Variables de Entorno (`.env.local`)

```env
ADMIN_PIN=leovoltaje2026
SESSION_SECRET=grupo-leovoltaje-super-secure-token-2026
ADMIN_NAME=Administrador General
ADMIN_EMAIL=contacto@grupoleovoltaje.com
ADMIN_PHONE=+57 300 000 0000
```
