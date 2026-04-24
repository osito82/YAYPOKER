# 🤖 Poker AI Bot Service (REST API Edition)

Este es un servicio REST independiente que gestiona bots de IA para el servidor de Poker. Los bots pueden utilizar tanto **Google Gemini** como modelos locales mediante **Ollama** (como OpenLLama).

## 🚀 Instalación

1. Asegúrate de tener Node.js instalado.
2. Ve a la carpeta del bot:
   ```bash
   cd bot
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

## 🛠️ Iniciar el Servicio

Para que el servidor de Poker pueda solicitar bots, este servicio debe estar corriendo:

```bash
node bot.js
```

_Por defecto, el servicio escucha en el puerto **3000**._

## 🧠 Proveedores de IA

El bot soporta dos proveedores principales:

### 1. Google Gemini (Nube)

Configura tu API Key en el archivo `.env` de la carpeta `bot`:
`GEMINI_API_KEY=tu_api_key`

### 2. OpenLLama / Ollama (Local)

Requiere tener instalado [Ollama](https://ollama.com/).

1. Descarga el modelo: `ollama pull llama3.2` (o el que prefieras).
2. Asegúrate de que Ollama esté corriendo.

## 📡 Integración REST API

El servidor de Poker se comunica con este servicio mediante el siguiente endpoint:

### `POST /spawn`

Crea una nueva instancia de un bot y la conecta a una partida vía WebSocket.

**Cuerpo de la petición (JSON):**

```json
{
  "gameCode": "ABCDE-12345",
  "playerName": "Osito_Bot",
  "server": "localhost",
  "port": "8888"
}
```

## 🎮 Uso desde el Cliente

Cuando el servicio está activo, puedes simplemente seleccionar el número de bots (1 o 2) desde el **Lobby** de YayPoker y hacer clic en **"Deal First Hand"**. El servidor de Poker hará la petición automáticamente a este servicio.

---

&copy; 2026 YayPoker Engineering
