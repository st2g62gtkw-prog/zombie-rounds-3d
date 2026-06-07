# Zombie Rounds 3D

Juego web 3D simple hecho con HTML, CSS, JavaScript y Three.js. Esta version esta pensada para funcionar como sitio estatico en GitHub Pages.

## Como jugar

- Click en la pantalla para capturar el mouse.
- WASD para moverte.
- Espacio para saltar.
- Mueve el mouse para mirar.
- Click para disparar.
- ESC o P para pausar o continuar.
- R para recargar durante la partida.
- E para interactuar con puertas o compras cercanas.
- 1 y 2 para cambiar de arma.
- R para reiniciar despues de perder.
- Elimina todos los enemigos para pasar a la siguiente ronda.

El juego guarda el puntaje maximo en `localStorage`, por lo que el record queda en el navegador donde se juega.
La municion es finita: cada arma tiene cargador y reserva, y recargar transfiere balas desde la reserva.

## Modo survival y economia

- Las rondas y transiciones viven en `src/gameMode.js`.
- Los puntos viven en `src/economy.js`.
- El jugador gana puntos por impacto y por eliminar zombies.
- Los puntos se pueden gastar en una estacion de municion y una estacion de arma.
- La estacion de municion cuesta 250 puntos y rellena el arma activa.
- La estacion de arma cuesta 750 puntos y compra/equipa el Rifle.
- Las acciones locales pasan por `src/actions.js` y `src/multiplayer/localSession.js`, preparando el juego para multijugador futuro sin conectarse a ningun servidor todavia.

## Armas

- Pistola: arma inicial semiautomatica, 12 balas en cargador y reserva limitada.
- Rifle: arma comprable automatica, cargador de 60 balas, reserva de 240 y cadencia alta controlada.
- Los impactos a la cabeza hacen dano critico y muestran un feedback simple.
- El HUD muestra arma activa, cargador, reserva y slots 1/2. Los slots no muestran municion.

## Enemigos

- Zombie normal: velocidad media, 1 disparo, 100 puntos.
- Zombie rapido: mas pequeno, mas veloz y con menos vida, aparece desde ronda 3, 150 puntos.
- Zombie pesado: mas grande y lento, golpea mas fuerte, aparece desde ronda 5, 250 puntos.

## Power-ups

- Curacion: recupera 25 puntos de vida sin superar el maximo.
- Municion: rellena la reserva y el cargador del arma activa.
- Dano aumentado: los disparos hacen doble dano durante 8 segundos.

Al eliminar un zombie existe una probabilidad baja de que deje un power-up. Como maximo hay 2 activos y desaparecen si no se recogen a tiempo.

## Presentacion

El mapa usa suelo, muros, pocos obstaculos grandes y una plataforma elevada de prueba con dos rampas. La plataforma tiene superficies caminables con altura y laterales solidos simples. Al recibir dano aparece un flash breve y al eliminar enemigos se muestra el puntaje ganado.

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
- `src/gameMode.js`: estados de partida, rondas y transiciones.
- `src/economy.js`: puntos, gastos y validacion de compras.
- `src/actions.js`: acciones centrales de disparo, interaccion, compras y eliminaciones.
- `src/scene.js`: escena, camara, renderer y luces.
- `src/map.js`: muros y obstaculos del mapa.
- `src/collision.js`: colisiones simples contra mapa.
- `src/player.js`: movimiento del jugador.
- `src/input.js`: teclado, mouse y botones.
- `src/zombies.js`: rondas, enemigos, IA y ataques.
- `src/pathfinding.js`: grilla, conversion X/Z y rutas A*.
- `src/weapons.js`: disparos, municion y recarga.
- `src/powerUps.js`: aparicion y efectos de power-ups.
- `src/interactables.js`: estaciones de municion y arma.
- `src/multiplayer/`: base local sin red para eventos y sesion futura.
- `src/ui.js`: HUD, mensajes y feedback visual.
- `src/utils.js`: funciones auxiliares.
- `README.md`: instrucciones del proyecto.
