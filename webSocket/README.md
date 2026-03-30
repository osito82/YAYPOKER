# YAY Poker Server ⚙️

Servidor de Poker de alto rendimiento basado en **Node.js** y **WebSockets**. Actúa como el cerebro del juego, gestionando múltiples partidas, evaluando manos y sincronizando el estado en tiempo real.

## 🚀 Tecnologías Principales

- **Node.js**: Plataforma para ejecutar JavaScript del lado del servidor.
- **WebSocket (ws)**: Protocolo de comunicación bidireccional y persistente.
- **Express**: Framework minimalista para servicios REST y monitoreo.
- **Radash**: Biblioteca de utilidades para un código más funcional y limpio.
- **osolog**: Sistema de logs estructurado y visual.
- **Vitest**: Suite de pruebas ultra rápida.

## ✨ Características del Motor

- **Multi-Partida (Rooms)**: Soporta múltiples torneos simultáneos identificados por códigos únicos.
- **Evaluación de Manos (`pokerCore.js`)**: Algoritmo avanzado que identifica desde "High Card" hasta "Royal Flush" comparando todas las combinaciones posibles de 5 cartas.
- **Gestión de Dealer (`dealer.js`)**: Controla el ciclo de vida de la baraja, el reparto de cartas privadas y la revelación progresiva de la comunidad.
- **Lobby Automático**: Sistema inteligente de espera que inicia la partida automáticamente cuando el host está listo o se cumple el tiempo de espera.
- **Tolerancia a Fallos**: Manejadores globales de errores y un recolector de basura (GC) que limpia partidas inactivas para optimizar memoria.

## 📁 Estructura del Servidor

```text
webSocket/
├── match/          # Acciones, comunicación y lógica de lobby específicas de partida
├── app.js          # Punto de entrada, servidor HTTP y WebSocket
├── pokerCore.js    # El "Cerebro": reglas de Poker y lógica de ganadores
├── dealer.js       # El repartidor: baraja, flop, turn y river
├── sockets.js      # Gestión de conexiones y broadcasts
└── torneo.js       # Registro global de partidas activas
```

## 🛠️ Instalación y Uso

1.  **Instalar dependencias**:

    ```bash
    npm install
    ```

2.  **Iniciar el servidor (con nodemon)**:

    ```bash
    npm start
    ```

3.  **Ejecutar pruebas de lógica**:
    ```bash
    npm test
    ```

## 🔌 API de Comunicación

El servidor escucha acciones JSON como:

- `signUp`: Entrada al lobby.
- `setBet` / `setRise` / `setCall`: Acciones de apuesta.
- `fold`: Retirada de la mano.
- `startGame`: Inicio manual por el host.

---

El motor de Poker detrás de cada mano. ♠️♥️♣️♦️
