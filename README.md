# Zombie Rounds 3D

Juego web 3D simple hecho con HTML, CSS, JavaScript y Three.js. Esta version esta pensada para funcionar como sitio estatico en GitHub Pages.

## Como jugar

- Click en la pantalla para capturar el mouse.
- WASD para moverte.
- Mueve el mouse para mirar.
- Click para disparar.
- ESC para pausar o continuar.
- R para recargar durante la partida.
- R para reiniciar despues de perder.
- Elimina todos los enemigos para pasar a la siguiente ronda.

El juego guarda el puntaje maximo en `localStorage`, por lo que el record queda en el navegador donde se juega.
Cada cargador tiene 8 balas y la recarga tarda 1.2 segundos.

## Enemigos

- Zombie normal: velocidad media, 1 disparo, 100 puntos.
- Zombie rapido: mas pequeno y veloz, aparece desde ronda 3, 150 puntos.
- Zombie pesado: mas grande y lento, necesita 3 disparos, aparece desde ronda 5, 250 puntos.

## Power-ups

- Curacion: recupera 25 puntos de vida sin superar el maximo.
- Municion: rellena el cargador actual.
- Dano aumentado: los disparos hacen doble dano durante 8 segundos.

Al terminar una ronda puede aparecer un power-up. Como maximo hay 2 activos y desaparecen si no se recogen a tiempo.

## Presentacion

El mapa usa suelo, muros y pocos obstaculos grandes hechos con geometrias basicas. Al recibir dano aparece un flash breve y al eliminar enemigos se muestra el puntaje ganado.

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
- `main.js`: puente de compatibilidad para cargar los scripts de `src/`.
- `src/config.js`: constantes de juego.
- `src/gameState.js`: estado mutable compartido.
- `src/scene.js`: escena, camara, renderer y luces.
- `src/map.js`: muros y obstaculos del mapa.
- `src/collision.js`: colisiones simples contra mapa.
- `src/player.js`: movimiento del jugador.
- `src/input.js`: teclado, mouse y botones.
- `src/zombies.js`: rondas, enemigos, IA y ataques.
- `src/pathfinding.js`: grilla, conversion X/Z y rutas A*.
- `src/weapons.js`: disparos, municion y recarga.
- `src/powerUps.js`: aparicion y efectos de power-ups.
- `src/ui.js`: HUD, mensajes y feedback visual.
- `src/utils.js`: funciones auxiliares.
- `README.md`: instrucciones del proyecto.
