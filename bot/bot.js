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
  log.Template({ name: "brakets", title: "IA:OLLAMA_INIT", date: true })
    .R({ url: OLLAMA_URL, msg: "Ready" });
} catch (error) {
  log.Template({ name: "brakets", title: "ERROR:OLLAMA", date: true })
    .R({ error: error.message });
}

class PokerBot {
  constructor(config) {
    this.gameCode = config.gameCode;
    this.playerName = config.playerName;
    this.provider = config.provider || "ollama";
    this.modelName =
      config.model || (this.provider === "gemini" ? "gemini-1.5-flash" : "llama3.2");

    this.secretCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    this.serverUrl = `ws://${config.server || "localhost"}:${config.port || "8888"}/?gameCode=${this.gameCode}&playerName=${this.playerName}&secretCode=${this.secretCode}`;

    this.myId = null;
    this.myCards = [];
    this.myCurrentBet = 0;
    this.lastStepId = null;

    this.initIA();
    this.connect();
  }

  initIA() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (this.provider === "gemini" && apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: this.modelName });
      log.Template({ name: "brakets", title: "IA:GEMINI_INIT", date: true })
        .R({ bot: this.playerName, model: this.modelName });
    }
  }

  connect() {
    log.Template({ name: "brakets", title: "BOT:CONNECTING", date: true })
      .R({ name: this.playerName, url: this.serverUrl });

    this.socket = new WebSocket(this.serverUrl);

    this.socket.on("open", () => {
      log.Template({ name: "brakets", title: "BOT:CONNECTED", date: true })
        .R({ name: this.playerName });

      this.sendAction({
        action: "signUp",
        totalChips: 1000,
        name: this.playerName
      });
    });

    this.socket.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const msg = payload.message || payload;

        if (this.myId && msg.players) {
          const me = msg.players.find(p => p.id === this.myId);
          if (me) this.myCurrentBet = me.currentBet || 0;
        }

        // Registro de signup
        if (msg.action === "signUp" && msg.type === "private") {
          this.myId = msg.id || msg.playerId || msg.myPlayerInfo?.playerId;

          log.Template({ name: "brakets", title: "BOT:REGISTERED", date: true })
            .R({ bot: this.playerName, myId: this.myId });

          this.sendAction({ action: "playerReady" });
          return;
        }

        const stepId = JSON.stringify({
          action: msg.action,
          turn: msg.currentPlayerId,
          pot: msg.pot,
          board: msg.dealerCards
        });

        if (this.lastStepId === stepId) return;

        if (msg.action === "dealtPrivateCards" && msg.type === "private") {
          this.myCards = msg.myPlayerInfo?.privateCards || [];
          log.Template({ name: "brakets", title: "BOT:HAND", date: true })
            .R({ bot: this.playerName, cards: this.myCards });
          this.lastStepId = stepId;
        }

        if (msg.action === "askForBlindBets" && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId;
          if (targetId === this.myId) {
            const amount = msg.data?.blindAmount || 20;
            log.Template({ name: "brakets", title: "BOT:POSTING_BLIND", date: true })
              .R({ bot: this.playerName, amount });
            this.sendAction({ action: "setBet", chipsToBet: amount });
            this.lastStepId = stepId;
          }
        }

        if (msg.action?.startsWith("bettingCore") && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId;
          if (targetId === this.myId) {
            log.Template({ name: "brakets", title: "BOT:MY_TURN", date: true })
              .R({ bot: this.playerName, action: msg.action });
            this.lastStepId = stepId;
            await this.handleDecision(msg);
          }
        }

      } catch (err) {
        log.Template({ name: "brakets", title: "ERROR:MSG", date: true })
          .R({ error: err.message });
      }
    });

    this.socket.on("close", () => {
      log.Template({ name: "brakets", title: "BOT:DISCONNECTED", date: true })
        .R({ bot: this.playerName, msg: "Reconnecting..." });
      setTimeout(() => this.connect(), 2000);
    });

    this.socket.on("error", (err) => {
      log.Template({ name: "brakets", title: "ERROR:SOCKET", date: true })
        .R({ bot: this.playerName, error: err.message });
    });
  }

  sendAction(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      log.Template({ name: "brakets", title: "BOT:SENDING", date: true })
        .R({ bot: this.playerName, action: data.action, data });
      this.socket.send(JSON.stringify(data));
    }
  }

  async handleDecision(msg) {
    const currentHighestBet = Number(msg.currentHighestBet || 0);
    const callAmount = Math.max(0, currentHighestBet - this.myCurrentBet);
    const allowedActions = msg.data?.actions || [];

    const board = msg.dealerCards || [];
    const players = msg.players || [];
    const activePlayers = players.filter(p => !p.folded).length;

    const handStrength = this.evaluateHandStrength(this.myCards, board);

    let baseAction;
    if (callAmount === 0) {
      baseAction =
        handStrength > 0.7 && allowedActions.includes("raise")
          ? "raise"
          : "check";
    } else {
      if (handStrength < 0.3 && allowedActions.includes("fold")) {
        baseAction = "fold";
      } else if (handStrength > 0.75 && allowedActions.includes("raise")) {
        baseAction = "raise";
      } else {
        baseAction = allowedActions.includes("call") ? "call" : "check";
      }
    }

    log.Template({ name: "brakets", title: "BOT:DECIDING", date: true })
      .R({ bot: this.playerName, strength: handStrength, call: callAmount, base: baseAction });

    // Prompt IA
    const prompt = `
Hand: ${this.myCards.join(", ")}
Board: ${board.join(", ") || "none"}
Players: ${activePlayers}
Pot: ${msg.pot}
Call: ${callAmount}
Base: ${baseAction}
Allowed: ${allowedActions.join(", ")}
Return JSON:
{"action":"fold|call|check|raise","amount":number}
`;

    let decision = null;
    try {
      let aiText = "";
      if (this.provider === "gemini" && this.geminiModel) {
        const result = await this.geminiModel.generateContent(prompt);
        aiText = (await result.response).text();
      } else if (ollamaClient) {
        const response = await ollamaClient.generate({ model: this.modelName, prompt, stream: false });
        aiText = response.response;
      }
      decision = this.safeParseJSON(aiText);
      log.Template({ name: "brakets", title: "BOT:IA_RESPONSE", date: true })
        .R({ bot: this.playerName, decision });
    } catch (e) {
      log.Template({ name: "brakets", title: "ERROR:IA", date: true })
        .R({ bot: this.playerName, error: e.message });
    }

    if (!decision || !decision.action) decision = { action: baseAction };
    let action = decision.action.toLowerCase();

    if (!allowedActions.includes(action)) {
      log.Template({ name: "brakets", title: "BOT:ACTION_INVALID", date: true })
        .R({ bot: this.playerName, action, base: baseAction });
      action = baseAction;
    }

    const actionMsg = { action: "setCheck" };
    if (action === "fold") actionMsg.action = "fold";
    else if (action === "call") actionMsg.action = "setCall", actionMsg.chipsToCall = callAmount;
    else if (action === "check") actionMsg.action = "setCheck";
    else if (action === "raise") {
      actionMsg.action = "setRise";
      const minRaise = currentHighestBet + 20;
      const potRaise = Math.floor(msg.pot * 0.5);
      actionMsg.chipsToRiseBet = Math.max(Number(decision.amount || 0), minRaise, potRaise);
    }

    const delay = 500 + Math.random() * 1500; // Delay humano
    setTimeout(() => this.sendAction(actionMsg), delay);
  }

  safeParseJSON(text) {
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1));
    } catch {}
    return null;
  }

  evaluateHandStrength(cards, board) {
    const all = [...cards, ...board];
    if (all.length < 2) return 0.5;
    const ranks = all.map(c => c[0]);
    const pairs = ranks.filter((r, i) => ranks.indexOf(r) !== i);
    if (ranks.includes('A')) return 0.7;
    if (pairs.length >= 2) return 0.8;
    if (pairs.length === 1) return 0.6;
    return 0.3;
  }
}

// =========================
// 🚀 API
// =========================
app.get("/health", (req, res) =>
  res.json({ status: "healthy", ollama: ollamaClient ? "connected" : "off" })
);

app.post("/spawn", (req, res) => {
  const { gameCode, playerName, provider, server, port } = req.body;
  log.Template({ name: "brakets", title: "SERVICE:SPAWN", date: true })
    .R({ gameCode, playerName });
  new PokerBot({ gameCode, playerName, provider, server, port });
  res.json({ message: `Spawned ${playerName}` });
});

app.listen(PORT, () => {
  log.Template({ name: "brakets", title: "SERVICE:READY", date: true })
    .R({ port: PORT });
});