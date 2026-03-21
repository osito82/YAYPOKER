const express = require("express");
const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Ollama } = require("ollama");
const log = require("./logger");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = 8886;
const OLLAMA_URL = "http://127.0.0.1:11434";

let ollamaClient;
try {
  ollamaClient = new Ollama({ host: OLLAMA_URL });
  log.Template({ name: "brakets", title: "IA:OLLAMA_INIT", date: true }).R({ url: OLLAMA_URL, msg: "Ready" });
} catch (error) {
  log.Template({ name: "brakets", title: "ERROR:OLLAMA", date: true }).R({ error: error.message });
}

class PokerBot {
  constructor(config) {
    this.gameCode = config.gameCode;
    this.playerName = config.playerName;
    this.provider = config.provider || "ollama";
    this.modelName = config.model || (this.provider === "gemini" ? "gemini-1.5-flash" : "llama3.2");
    this.secretCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.serverUrl = `ws://${config.server || "localhost"}:${config.port || "8888"}/?gameCode=${this.gameCode}&playerName=${this.playerName}&secretCode=${this.secretCode}`;
    
    this.myId = null;
    this.myCards = [];
    this.myCurrentBet = 0;
    this.lastStepId = null; // Guard para evitar duplicados
    
    this.initIA();
    this.connect();
  }

  initIA() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (this.provider === "gemini" && apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: this.modelName });
    }
  }

  connect() {
    log.Template({ name: "brakets", title: "BOT:CONNECTING", date: true }).R({ name: this.playerName, url: this.serverUrl });
    this.socket = new WebSocket(this.serverUrl);

    this.socket.on("open", () => {
      log.Template({ name: "brakets", title: "BOT:CONNECTED", date: true }).R({ name: this.playerName });
      this.sendAction({ action: "signUp", totalChips: 1000, name: this.playerName });
    });

    this.socket.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const msg = payload.message || payload;
        
        // 0. ACTUALIZAR ESTADO PROPIO (Chips y apuesta actual)
        const me = msg.players?.find(p => p.id === this.myId || p.name === this.playerName);
        if (me) {
            this.myCurrentBet = me.currentBet || 0;
        }

        // 1. REGISTRO (Solo una vez)
        if (msg.action === "signUp" && msg.type === "private") {
          this.myId = msg.id || msg.playerId || msg.myPlayerInfo?.playerId;
          log.Template({ name: "brakets", title: "BOT:REGISTERED", date: true }).R({ bot: this.playerName, myId: this.myId });
          this.sendAction({ action: "playerReady" });
          return;
        }

        // 2. GUARD DE ESTADO: Evitar procesar el mismo paso lógico dos veces
        // Usamos action + pot + dealerCards para identificar el momento exacto del juego
        const stepId = `${msg.action}_${msg.type}_${msg.pot}_${msg.dealerCards?.length}`;
        if (this.lastStepId === stepId) return;

        // 3. CARTAS (Solo de mensajes privados)
        if (msg.action === "dealtPrivateCards" && msg.type === "private") {
          this.myCards = msg.myPlayerInfo?.privateCards || [];
          log.Template({ name: "brakets", title: "BOT:HAND", date: true }).R({ bot: this.playerName, cards: this.myCards });
          this.lastStepId = stepId;
        }

        // 4. CIEGAS (Solo si es mensaje privado para mí)
        if (msg.action === "askForBlindBets" && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId || msg.data?.id || msg.messageForId;
          if (targetId === this.myId) {
            const amount = msg.data?.blindAmount || msg.blindAmount || 20;
            log.Template({ name: "brakets", title: "BOT:POSTING_BLIND", date: true }).R({ bot: this.playerName, amount });
            this.sendAction({ action: "setBet", chipsToBet: amount });
            this.lastStepId = stepId;
          }
        }

        // 5. TURNO DE JUEGO (Solo mensajes privados)
        if (msg.action?.startsWith("bettingCore") && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId || msg.data?.id || msg.messageForId;
          if (targetId === this.myId) {
            this.lastStepId = stepId;
            await this.handleDecision(msg);
          }
        }

      } catch (err) {
        log.Template({ name: "brakets", title: "ERROR:MSG", date: true }).R({ error: err.message });
      }
    });

    this.socket.on("close", () => log.R({ msg: `Bot ${this.playerName} socket closed` }));
    this.socket.on("error", (err) => log.R({ error: `Bot ${this.playerName} socket error`, msg: err.message }));
  }

  sendAction(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  async handleDecision(msg) {
    // CORRECCIÓN 1: Cálculo real de Call Amount
    const currentHighestBet = Number(msg.currentHighestBet || 0);
    const callAmount = Math.max(0, currentHighestBet - this.myCurrentBet);
    
    // CORRECCIÓN 4: Usar acciones permitidas por el servidor
    const allowedActions = msg.data?.actions || ["fold", "call", "check", "raise"];
    
    log.Template({ name: "brakets", title: "BOT:THINKING", date: true })
       .R({ bot: this.playerName, call: callAmount, actions: allowedActions });

    const prompt = `
      You are a Poker Bot. 
      Your Hand: ${this.myCards.join(", ")}
      Board: ${msg.dealerCards?.join(", ") || "Empty"}
      Pot: ${msg.pot}
      Amount to Call: ${callAmount}
      Allowed Actions: ${allowedActions.join(", ")}
      
      Respond ONLY JSON: {"action": "choice", "amount": number}
      "choice" must be from Allowed Actions. 
      If you "raise", "amount" must be total bet (at least ${currentHighestBet + 20}).
    `;

    try {
      let aiText = "";
      if (this.provider === "gemini" && this.geminiModel) {
        const result = await this.geminiModel.generateContent(prompt);
        aiText = (await result.response).text();
      } else if (ollamaClient) {
        const response = await ollamaClient.generate({ model: this.modelName, prompt, stream: false });
        aiText = response.response;
      }

      const match = aiText.match(/\{.*\}/);
      const decision = match ? JSON.parse(match[0]) : { action: callAmount === 0 ? "check" : "call" };
      
      setTimeout(() => {
        let action = decision.action?.toLowerCase();
        let finalAction = "setCheck";
        
        // Mapeo seguro a comandos del servidor
        if (action === "fold") finalAction = "fold";
        else if (action === "call") finalAction = "setCall";
        else if (action === "check" || (action === "call" && callAmount === 0)) finalAction = "setCheck";
        else if (action === "raise" || action === "bet") finalAction = "setRise";

        // Validar que la acción elegida esté permitida
        if (!allowedActions.includes(action) && action !== "raise" && action !== "bet") {
            finalAction = callAmount === 0 ? "setCheck" : "setCall";
        }

        const actionMsg = { action: finalAction };
        if (finalAction === "setRise") actionMsg.chipsToRiseBet = Math.max(Number(decision.amount || 0), currentHighestBet + 20);
        if (finalAction === "setCall") actionMsg.chipsToCall = callAmount;
        
        this.sendAction(actionMsg);
      }, 1000);
    } catch (error) {
      this.sendAction({ action: callAmount === 0 ? "setCheck" : "setCall" });
    }
  }
  
}

app.get("/health", (req, res) => res.json({ status: "healthy", ollama: ollamaClient ? "connected" : "disconnected" }));

app.post("/spawn", (req, res) => {
  const { gameCode, playerName, provider, server, port } = req.body;
  log.Template({ name: "brakets", title: "SERVICE:SPAWN", date: true }).R({ gameCode, bot: playerName });
  new PokerBot({ gameCode, playerName, provider, server, port });
  res.json({ message: `Spawning ${playerName}` });
});

app.listen(PORT, () => {
  log.Template({ name: "brakets", title: "SERVICE:READY", date: true }).R({ port: PORT, ollama: OLLAMA_URL });
});
