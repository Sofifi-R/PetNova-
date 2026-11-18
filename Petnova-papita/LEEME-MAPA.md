# Cómo agregar lugares al mapa (Pet Nova)

1. Abre `js/locations.js` con el Bloc de notas o VS Code.
2. Copia un bloque `{ ... },` de ejemplo, pégalo antes del `];` final y cambia los datos.
3. Coordenadas: clic derecho en el lugar en Google Maps → clic en los números para copiarlos (primero `lat`, luego `lng`).
   También puedes abrir `functions.html?edit=1`, hacer clic en el mapa, llenar el formulario y pulsar "Copy".
4. Cuando pongas coordenadas exactas, borra la línea `approx: true`.
5. Guarda, sube el archivo a GitHub y espera 1–2 minutos.

Errores comunes: falta una coma entre bloques, comillas sin cerrar, lat y lng al revés,
o coordenadas fuera de Panamá (ese lugar se omite y aparece un aviso en la consola).
Para una categoría nueva, solo escribe su nombre en `category`; el filtro se crea solo.
Los colores de cada categoría están en `CATEGORY_STYLES` dentro de `js/map.js`.

---
## Paw Alert (mapa de mascotas perdidas)
- El código está en `js/paw-alert.js`; la sección en `functions.html` (id `paw-alert`).
- Las alertas y fotos se guardan en el navegador de cada persona (localStorage), no en un servidor.
- Hay 2 alertas de ejemplo (`SEED` en `js/paw-alert.js`); se borran desde su ventanita en el mapa o quitando esas líneas.
- Para que todos vean las mismas alertas haría falta una base de datos (por ejemplo Firebase o Supabase).
