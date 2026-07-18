# 🃏 YAYPOKER

![Vue.js](https://img.shields.io/badge/vue-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-000000?style=for-the-badge&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

Welcome to the official repository of **YAYPOKER** — a modern, fast, and highly interactive real-time multiplayer Texas Hold'em Poker platform.

🌐 **Play Live:** [yaypoker.com](https://yaypoker.com)

---

## 📖 About The Project

**YAYPOKER** was built to bring a seamless, low-latency, and engaging poker experience to the web without heavy downloads. It utilizes native WebSockets for blazing-fast game state synchronization and features a custom-built poker engine that handles complex scenarios like side-pots, showdowns, and precise hand evaluations.

One of the platform's standout innovations is the integration of **AI-driven Bots**. Powered by Large Language Models (LLMs) like Deepseek, Claude, or local Ollama, these bots simulate human-like behavior, ensuring there's always a challenging game waiting for you, even if human players are unavailable.

---

## 📁 Project Structure

```text
YAYPOKER/
├── client/         # Vue 3 frontend application (Vite, Pinia, Tailwind CSS)
├── webSocket/      # Node.js game server and WebSocket manager
├── bot/            # Autonomous AI Bot microservice
├── Caddyfile       # Reverse Proxy settings for production Caddy
├── docker-compose.yml        # Development container orchestration
└── docker-compose-prod.yml   # Production container orchestration
```

---

## 🚀 Running Locally

The easiest way to get the entire platform running on your local machine is using Docker.

### Option 1: Using Docker (Recommended)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/osito82/YAYPOKER.git
   cd YAYPOKER
   ```
2. **Start all services:**
   ```bash
   docker compose up -d --build
   ```
3. **Play!** Open your browser and navigate to `http://localhost:5174`.

### Option 2: Manual Development Setup
You will need to open three terminals to run each service manually:

1. **Start the Backend Server:**
   ```bash
   cd webSocket
   npm install
   npm start
   ```
2. **Start the AI Bots (Optional):**
   ```bash
   cd bot
   npm install
   # Add your .env file with LLM API keys
   npm start
   ```
3. **Start the Frontend Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 💻 Frontend Client Details (`/client`)

A modern, fast, and responsive poker client built with **Vue 3** and **Vite**.

* **Dynamic HUD:** The action bar (`ActionBar.vue`) adapts to screen layouts (`xsmall`, `small`, `medium`, `large`), optimizing space for mobile screens while displaying comprehensive controls on desktop.
* **Premium Skeuomorphic Chips:** The chips component (`Chip.vue`) uses 3D reliefs, shadows, and casino-like patterns for a tactile betting feel.
* **Audio & Voice integration:** Native Web Audio synthesizer triggers sound effects (folds, calls, wins, turn warnings) dynamically. Integrated WebRTC voice chat allows talking with other players.
* **Odds Calculation HUD:** Live probabilities show your odds of winning/tying based on your pocket cards and community cards (calculated via Monte Carlo simulation on the server against random opponent hands).

### Commands (Client Directory):
* **Dev Server:** `npm run dev`
* **Production Build:** `npm run build`
* **Linter & Code Format:** `npm run lint`
* **Unit Tests:** `npm test`

---

## ⚙️ Backend WebSocket Server (`/webSocket`)

A high-performance poker room manager and engine built on **Node.js** and **WebSockets**.

* **Match Rooms:** Supports multiple active games simultaneously, isolated by 5-character tournament codes.
* **Engine (`pokerCore.js`):** A custom hand evaluator identifying ranking tiers from "High Card" to "Royal Flush" and resolving complex split-pot or side-pot scenarios.
* **Dealer Lifecycle (`dealer.js`):** Manages the card deck, pocket distribution, and progressive community card reveals (Flop, Turn, River).
* **Automatic Lobby:** Matches start automatically when all players are ready or when host triggers the action.
* **Garbage Collector:** Automatically cleans up inactive sockets and abandoned rooms to optimize memory usage.

### WebSocket Communication Events:
* `signUp`: Player requests entry to a tournament room.
* `setBet` / `setRise` / `setCall`: Bet-related actions.
* `fold`: Folds pocket cards.
* `startGame`: Manual game initiation by room host.

### Commands (WebSocket Directory):
* **Dev Server:** `npm start` (Runs with nodemon)
* **Linter:** `npm run lint`
* **Integration & Logic Tests:** `npm test` (Runs with Vitest)

---

## 🤖 Autonomous AI Bot Service (`/bot`)

An independent REST API service that spawns LLM-powered poker players and connects them to active rooms via WebSockets.

* **AI Providers:**
  * **Google Gemini (Cloud):** Set your API key in `/bot/.env` as `GEMINI_API_KEY=your_api_key`.
  * **Ollama (Local):** Run a local model (such as `llama3.2`) using [Ollama](https://ollama.com/).
* **REST API Endpoint (`POST /spawn`):**
  The main game server requests bots by calling this endpoint with:
  ```json
  {
    "gameCode": "ABCDE-12345",
    "playerName": "Claude_Bot",
    "server": "localhost",
    "port": "8888"
  }
  ```
* **Bot Behavior:** Bots parse the real-time game state, evaluate actions (Check, Call, Raise, Fold), generate bluff strategies, and send normal player socket actions.

### Commands (Bot Directory):
* **Start Service:** `npm start` (Runs with node or nodemon depending on env)

---

## 🎨 UI ID Naming Conventions

All UI elements must follow a strict, descriptive ID pattern to support automated end-to-end testing:
`[descriptive-name]-[TemplateSuffix]`

1. **Descriptive Names:** IDs must clearly indicate the element's function (e.g., `player-item-chip-stack-count` instead of `chips`).
2. **Template Suffix:** Match the active device layout or context template:
   - Layout templates: `-TemplateLarge`, `-TemplateMedium`, `-TemplateSmall`, `-TemplateXSmall`.
   - Page contexts: `-Home`, `-About`.
   - Dynamic templates: Bind to `templateSuffix` dynamically.

**Examples:**
* `game-container-TemplateSmall`
* `poker-table-viewport-TemplateLarge`
* `player-item-display-name-{{ player.id }}-{{ templateSuffix }}`

---

## 🌎 Production Deployments

For deployment guides, server specifications, reverse proxy details, and SSH keys, please refer to:
👉 **[DEPLOYMENT.md](file:///home/osito/Development/GIT/YAYPOKER/DEPLOYMENT.md)**

---

> **Enjoy the game, and may the flop be with you! ♠️♥️♣️♦️**
