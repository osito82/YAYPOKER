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
      log.Template({ name: "brakets", title: "BOT:CONNECTED", date: true }).R({ name: this.playerName });
      this.sendAction({ action: "signUp", totalChips: 1000, name: this.playerName });
    });

    this.socket.on("message", async (data) => {
      const rawData = data.toString();
      // ✅ LOG EXACTO DE ENTRADA GEMINI DO NOT TOUCH
      console.log(`[${this.playerName}] <<< INCOMING:`, rawData);

      try {
        const payload = JSON.parse(rawData);
        const msg = payload.message || payload;

        if (this.myId && msg.players) {
          const me = msg.players.find(p => p.id === this.myId);
          if (me) this.myCurrentBet = Number(me.currentBet || 0);
        }

        if (msg.action === "signUp" && msg.type === "private") {
          this.myId = msg.id || msg.playerId || msg.myPlayerInfo?.playerId;
          this.sendAction({ action: "playerReady" });
          return;
        }

        const stepId = JSON.stringify({ action: msg.action, pot: msg.pot, board: msg.dealerCards });
        if (this.lastStepId === stepId) return;

        if (msg.action === "dealtPrivateCards" && msg.type === "private") {
          this.myCards = msg.myPlayerInfo?.privateCards || [];
          this.lastStepId = stepId;
        }

        if (msg.action === "askForBlindBets" && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId || msg.data?.id;
          if (targetId === this.myId) {
            const amount = msg.data?.blindAmount || msg.blindAmount || 20;
            this.sendAction({ action: "setBet", chipsToBet: amount });
            this.lastStepId = stepId;
          }
        }

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

    this.socket.on("close", () => log.Template({ name: "brakets", title: "BOT:DISCONNECTED", date: true }).R({ bot: this.playerName }));
    this.socket.on("error", (err) => log.Template({ name: "brakets", title: "ERROR:SOCKET", date: true }).R({ bot: this.playerName, error: err.message }));
  }

  sendAction(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));


  // ✅ LOG EXACTO DE SALIDA GEMINI DO NOT TOUCH
      const payload = JSON.stringify(data);
      console.log(`[${this.playerName}] >>> OUTGOING:`, payload);
      
 






      log.Template({ name: "brakets", title: "BOT:SENDING", date: true }).R({ bot: this.playerName, action: data.action, data });
    }
  }

  async handleDecision(msg) {
    const currentHighestBet = Number(msg.currentHighestBet || 0);
    const callAmount = Math.max(0, currentHighestBet - this.myCurrentBet);
    const allowedActions = msg.data?.action || msg.data?.actions || ["fold", "call"];
    const board = msg.dealerCards || [];
    const handStrength = this.evaluateHandStrength(this.myCards, board);

    // Default safety action
    let baseAction = callAmount === 0 ? (allowedActions.includes("check") ? "check" : "call") : (allowedActions.includes("call") ? "call" : "fold");

    // ENGLISH PROMPT
    const prompt = `
You are a professional Texas Hold'em player.
Hand: ${this.myCards.join(", ")} | Board: ${board.join(", ") || "No cards dealt yet"}
Hand Strength: ${handStrength} (0.0=Weak, 1.0=Strongest)
Current Pot: ${msg.pot} | Amount to Call: ${callAmount}
Allowed Actions: ${allowedActions.join(", ")}

Strategy Rules:
1. NEVER fold if "check" is an allowed action.
2. If Hand Strength is below 0.4 and Call Amount > 20% of the Pot, consider folding.
3. Only "raise" if Hand Strength is > 0.7 or if you want to bluff (10% chance).

Respond strictly in JSON format: {"action":"fold|call|check|raise","amount":number,"reason":"short explanation"}
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
    } catch (e) {
      log.Template({ name: "brakets", title: "ERROR:IA", date: true }).R({ bot: this.playerName, error: e.message });
    }

    // LAYER OF SAFETY (DETERMINISTIC RULES)
    let action = (decision && decision.action) ? decision.action.toLowerCase() : baseAction;
    if (!allowedActions.includes(action)) action = baseAction;

    // RULE: Never fold if checking is free
    if (action === "fold" && allowedActions.includes("check")) {
        action = "check";
    }

    // RULE: Don't call high bets with low strength (The RoyalBot Fix)
    if (handStrength < 0.35 && callAmount > (msg.pot * 0.25) && action === "call") {
        action = "fold";
    }

    const actionMsg = {};
    if (action === "fold") {
        actionMsg.action = "fold";
    } else if (action === "call") {
        actionMsg.action = "setCall";
        actionMsg.chipsToCall = callAmount;
    } else if (action === "raise") {
        actionMsg.action = "setRise";
        actionMsg.chipsToRiseBet = Math.max(Number(decision.amount || 0), currentHighestBet + 20);
    } else {
        actionMsg.action = "setCheck";
    }

    log.Template({ name: "brakets", title: "BOT:DECISION", date: true })
      .R({ bot: this.playerName, action: actionMsg.action, val: actionMsg.chipsToCall || actionMsg.chipsToRiseBet });

    setTimeout(() => this.sendAction(actionMsg), 1000);
  }

  safeParseJSON(text) {
    try {
      const match = text.match(/\{.*\}/s);
      return match ? JSON.parse(match[0]) : null;
    } catch { return null; }
  }

  evaluateHandStrength(cards, board) {
    const all = [...cards, ...board];
    if (all.length < 2) return 0.5;
    const ranks = all.map(c => c[0]);
    const pairs = ranks.filter((r, i) => ranks.indexOf(r) !== i);

    // Pre-flop logic
    if (board.length === 0) {
        if (pairs.length > 0) return 0.8; // Pair in hand
        if (ranks.includes('A') || ranks.includes('K')) return 0.7; // High cards
        return 0.4;
    }

    // Post-flop logic
    if (pairs.length >= 2) return 0.9; // Two pairs or better
    if (pairs.length === 1) return 0.65; // One pair
    if (ranks.includes('A')) return 0.5; // Ace high
    return 0.25; // Nothing
  }
}

app.post("/spawn", (req, res) => {
  const { gameCode, playerName, provider, server, port } = req.body;
  new PokerBot({ gameCode, playerName, provider, server, port });
  res.json({ message: `Spawned ${playerName}` });
});

app.listen(PORT, () => log.Template({ name: "brakets", title: "SERVICE:READY", date: true }).R({ port: PORT }));