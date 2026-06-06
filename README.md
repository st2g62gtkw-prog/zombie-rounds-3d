# Zombie Rounds 3D

Juego web 3D simple hecho con HTML, CSS, JavaScript y Three.js. Esta version esta pensada para funcionar como sitio estatico en GitHub Pages.

## Como jugar

- Click en la pantalla para capturar el mouse.
- WASD para moverte.
- Mueve el mouse para mirar.
- Click para disparar.
- R para reiniciar despues de perder.
- Elimina todos los enemigos para pasar a la siguiente ronda.

El juego guarda el puntaje maximo en `localStorage`, por lo que el record queda en el navegador donde se juega.

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador. Si prefieres servirlo como sitio estatico:

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Publicar en GitHub Pages

1. Sube estos archivos a un repositorio de GitHub.
2. En Settings > Pages, elige la rama y carpeta donde esta `index.html`.
3. Guarda la configuracion y abre la URL publicada por GitHub Pages.

## Archivos

- `index.html`: estructura base del juego y HUD.
- `style.css`: estilos de pantalla completa, HUD y mensajes.
- `main.js`: escena Three.js, movimiento, disparos, enemigos y rondas.
- `README.md`: instrucciones del proyecto.
