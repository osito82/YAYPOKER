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

**YAYPOKER** was built with a clear vision: to bring a seamless, low-latency, and engaging poker experience to the web without the need for heavy downloads. It utilizes native WebSockets for blazing-fast game state synchronization and features a custom-built poker engine that handles complex scenarios like side-pots, showdowns, and precise hand evaluations.

One of the platform's standout innovations is the integration of **AI-driven Bots**. Powered by Large Language Models (LLMs) like Deepseek and Claude, these bots simulate human-like behavior, ensuring there's always a challenging game waiting for you, even if human players are unavailable.

## ✨ Key Features

- **⚡ Real-Time Multiplayer:** Instantaneous actions (Check, Call, Raise, Fold) powered by a robust Node.js WebSocket backend.
- **🤖 Smart AI Bots:** Autonomous LLM-powered bots that understand game context, bluff, and make strategic decisions.
- **🎨 Modern UI/UX:** A sleek, fully responsive Single Page Application (SPA) built with Vue.js and Tailwind CSS. Playable on desktops, tablets, and mobile devices.
- **🌍 Internationalization (i18n):** Multi-language support to welcome players from around the globe.
- **📦 Fully Dockerized:** Easy deployment and scaling using Docker and `docker-compose`.
- **🧮 Custom Poker Logic:** Precise hand evaluators, intelligent pot splitting, and robust player queueing systems.
- **🔐 Secure & Fast:** Encrypted connections, resilient state management against disconnections, and no sensitive data leaks.

## 🛠️ Technologies Used

### Frontend (`/client`)
* **Framework:** Vue.js
* **State Management:** Pinia
* **Styling:** Tailwind CSS
* **Routing:** Vue Router

### Backend (`/webSocket` & `/bot`)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Real-time Engine:** `ws` (Native WebSockets)
* **AI Integration:** LLM APIs (Deepseek, Claude)
* **Logging:** Winston & Osolog

### Infrastructure
* **Containers:** Docker & Docker Compose
* **Reverse Proxy:** Caddy

---

## 📁 Project Structure

```text
YAYPOKER/
├── client/         # Vue.js frontend application
├── webSocket/      # Node.js game server and socket manager
├── bot/            # Autonomous AI Bot microservice
├── docker-compose.yml        # Development container orchestration
└── docker-compose-prod.yml   # Production container orchestration
```

---

## 🚀 How to Run Locally

The easiest way to get the entire platform running on your local machine is by using Docker.

### Prerequisites
* [Docker](https://www.docker.com/get-started) and Docker Compose installed.
* [Node.js](https://nodejs.org/en/) (if running manually).

### Option 1: Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/osito82/YAYPOKER.git
   cd YAYPOKER
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d --build
   ```

3. **Play!**
   Open your browser and navigate to `http://localhost` (or the port defined in your configuration).

### Option 2: Manual Setup

1. **Start the Backend:**
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

3. **Start the Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make to **YAYPOKER** are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

> **Enjoy the game, and may the flop be with you! ♠️♥️♣️♦️**
