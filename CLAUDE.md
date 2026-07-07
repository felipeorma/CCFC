# ColoColo Football Center — Reglas del proyecto

## Procesamiento de datos (Wyscout)
- **Archivo de jugadores (ej. `20206-chile-jugadores.xlsx`)**: el club de cada jugador se toma SIEMPRE de la columna **«Equipo durante el período seleccionado»**, NO de la columna «Equipo». Esto refleja traspasos/cesiones dentro de la temporada y así se construyó `app/cc-data-2026.js`.
- Team Stats: un archivo Excel por equipo (16 clubes); métricas normalizadas por 90 minutos.
- Nunca inventar datos: si un dato no está en los archivos o en los paquetes descargados (Sofascore), se muestra vacío o "sin datos".

## Otras convenciones
- No mencionar las fuentes de datos (Wyscout/Sofascore) en etiquetas visibles de la UI ni en exportaciones.
- El plantel de Gestión persiste toda la temporada (localStorage `cc_plantel_v1`) y se enlaza al archivo de jugadores por nombre exacto o apellido+inicial (desempate por edad).
- Los partidos terminados quedan empaquetados en la plataforma (shotmaps, lineups) y no dependen de conexión.
