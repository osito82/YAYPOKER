const express = require("express");
const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Ollama } = require("ollama");
const log = require("./logger");
const { ACTIONS, SERVER_CONFIG } = require("../webSocket/constants");
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
        
        if (msg.action !== "oddsUpdate" && msg.action !== "signUp") {
            log.Template({ name: "brakets", title: `BOT:RECV:${msg.action?.toUpperCase()}`, date: true })
               .R({ bot: this.playerName, type: msg.type });
        }

        if (msg.action === "signUp" && msg.type === "private") {
          this.myId = msg.id || msg.playerId || msg.myPlayerInfo?.playerId;
          log.Template({ name: "brakets", title: "BOT:REGISTERED", date: true }).R({ bot: this.playerName, myId: this.myId });
          this.sendAction({ action: "playerReady" });
        }

        if (msg.action === "dealtPrivateCards") {
          this.myCards = msg.myPlayerInfo?.privateCards || msg.cards || [];
          log.Template({ name: "brakets", title: "BOT:HAND", date: true }).R({ bot: this.playerName, cards: this.myCards });
        }

        if (msg.action === "askForBlindBets" && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId || msg.data?.id || msg.messageForId;
          if (targetId === this.myId) {
            const amount = msg.data?.blindAmount || msg.blindAmount || 20;
            this.sendAction({ action: "setBet", chipsToBet: amount });
          }
        }

        if (msg.action?.startsWith("bettingCore") && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId || msg.data?.id || msg.messageForId;
          if (targetId === this.myId) {
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
    const callAmount = Number(msg.data?.chipsToCall || msg.chipsToCall || 0);
    const options = msg.data?.actions || msg.possibleActions || ["fold", "call", "check", "raise"];
    const currentBet = Number(msg.currentHighestBet || 0);
    
    log.Template({ name: "brakets", title: "BOT:THINKING", date: true }).R({ bot: this.playerName, call: callAmount, options });

    const prompt = `Poker AI. Hand: ${this.myCards.join(", ")} | Options: ${options.join(", ")} | Call Amount: ${callAmount}. Respond ONLY JSON: {"action": "choice", "amount": number}. Choice must be one of the options. If you raise, amount must be at least ${currentBet + 40}.`;

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
      
      log.Template({ name: "brakets", title: "BOT:DECISION", date: true }).R({ bot: this.playerName, action: decision.action, amount: decision.amount });

      setTimeout(() => {
        let action = decision.action?.toLowerCase();
        let finalAction = "setCall";
        
        if (action === "fold") finalAction = "fold";
        else if (action === "call") finalAction = "setCall";
        else if (action === "check" || (action === "call" && callAmount === 0)) finalAction = "setCheck";
        else if (action === "raise" || action === "bet") finalAction = "setRise";

        const actionMsg = { action: finalAction };
        if (finalAction === "setRise") {
            // Un raise debe ser al menos el doble de la apuesta actual o un mínimo coherente
            const minRaise = currentBet > 0 ? currentBet * 2 : 40;
            actionMsg.chipsToRiseBet = Math.max(Number(decision.amount || minRaise), minRaise);
        }
        if (finalAction === "setCall") actionMsg.chipsToCall = callAmount;
        
        this.sendAction(actionMsg);
      }, 1000);
    } catch (error) {
      this.sendAction({ action: callAmount === 0 ? "setCheck" : "setCall" });
    }
  }
}

app.get("/", (req, res) => res.json({ status: "active", service: "Poker Bot Service", port: PORT }));
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
