const express = require("express");
const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Ollama } = require("ollama");
const log = require("./logger");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8886;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

let ollamaClient;
try {
  ollamaClient = new Ollama({ host: OLLAMA_URL });
  log
    .Template({ name: "brakets", title: "IA:OLLAMA_INIT", date: true })
    .R({ url: OLLAMA_URL, msg: "Ready" });
} catch (error) {
  log
    .Template({ name: "brakets", title: "ERROR:OLLAMA", date: true })
    .R({ error: error.message });
}

class PokerBot {
  constructor(config) {
    this.gameCode = config.gameCode;
    this.playerName = config.playerName;
    this.provider = config.provider || process.env.DEFAULT_AI_PROVIDER || "ollama";
    if (this.provider === "openllama") this.provider = "ollama"; // Normalización
    this.modelName =
      config.model ||
      process.env.DEFAULT_AI_MODEL ||
      (this.provider === "gemini"
        ? "gemini-1.5-flash"
        : this.provider === "deepseek"
          ? "deepseek-chat"
          : "llama3.2");

    this.secretCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.serverUrl = `ws://${config.server || "localhost"}:${config.port || "8888"}/?gameCode=${this.gameCode}&playerName=${this.playerName}&secretCode=${this.secretCode}`;

    this.myId = null;
    this.myCards = [];
    this.myCurrentBet = 0;
    this.lastStepId = null;
    this.myOdds = { win: 0, tie: 0 }; // Estado persistente de probabilidades

    this.initIA();
    this.connect();
  }

  initIA() {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (this.provider === "gemini" && geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = genAI.getGenerativeModel({ model: this.modelName });
      log
        .Template({ name: "brakets", title: "IA:GEMINI_INIT", date: true })
        .R({ bot: this.playerName, model: this.modelName });
    }

    if (this.provider === "deepseek") {
      this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      this.deepseekBaseUrl =
        process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
      log
        .Template({ name: "brakets", title: "IA:DEEPSEEK_INIT", date: true })
        .R({ bot: this.playerName, model: this.modelName });
    }
  }

  connect() {
    log
      .Template({ name: "brakets", title: "BOT:CONNECTING", date: true })
      .R({ name: this.playerName, url: this.serverUrl });

    this.socket = new WebSocket(this.serverUrl);

    this.socket.on("open", () => {
      log
        .Template({ name: "brakets", title: "BOT:CONNECTED", date: true })
        .R({ name: this.playerName });
      this.sendAction({
        action: "signUp",
        totalChips: 1000,
        name: this.playerName,
      });
    });

    this.socket.on("message", async (data) => {
      const rawData = data.toString();
      // Log de entrada solo para depuración pesada si es necesario
      // console.log(`[${this.playerName}] <<< INCOMING:`, rawData);

      try {
        const payload = JSON.parse(rawData);
        const msg = payload.message || payload;

        // Actualizar mi apuesta actual desde la lista de jugadores
        if (this.myId && msg.players) {
          const me = msg.players.find((p) => p.id === this.myId);
          if (me) this.myCurrentBet = Number(me.currentBet || 0);
        }

        // Registro de signup
        if (msg.action === "signUp" && msg.type === "private") {
          this.myId = msg.id || msg.playerId || msg.myPlayerInfo?.playerId;
          log
            .Template({ name: "brakets", title: "BOT:REGISTERED", date: true })
            .R({ bot: this.playerName, myId: this.myId });
          this.sendAction({ action: "playerReady" });
          return;
        }

        // Actualizar probabilidades si vienen en el mensaje
        if (msg.action === "oddsUpdate" || (msg.data && msg.data.odds)) {
          const odds = msg.data?.odds || msg.odds;
          if (odds) {
            this.myOdds = {
              win: Number(odds.win || 0),
              tie: Number(odds.tie || 0),
            };
          }
        }

        const stepId = JSON.stringify({
          action: msg.action,
          pot: msg.pot,
          board: msg.dealerCards,
        });
        if (this.lastStepId === stepId) return;

        // Recibir cartas
        if (msg.action === "dealtPrivateCards" && msg.type === "private") {
          this.myCards = msg.myPlayerInfo?.privateCards || [];
          log
            .Template({ name: "brakets", title: "BOT:HAND", date: true })
            .R({ bot: this.playerName, cards: this.myCards });
          this.lastStepId = stepId;
        }

        // Poner ciegas
        if (msg.action === "askForBlindBets" && msg.type === "private") {
          const targetId = msg.myPlayerInfo?.playerId || msg.data?.id;
          if (targetId === this.myId) {
            const amount = msg.data?.blindAmount || msg.blindAmount || 20;
            log
              .Template({
                name: "brakets",
                title: "BOT:POSTING_BLIND",
                date: true,
              })
              .R({ bot: this.playerName, amount });
            this.sendAction({ action: "setBet", chipsToBet: amount });
            this.lastStepId = stepId;
          }
        }

        // Turno de apuesta
        if (msg.action?.startsWith("bettingCore") && msg.type === "private") {
          const targetId =
            msg.myPlayerInfo?.playerId || msg.data?.id || msg.messageForId;
          if (targetId === this.myId) {
            log
              .Template({ name: "brakets", title: "BOT:MY_TURN", date: true })
              .R({ bot: this.playerName, action: msg.action });
            this.lastStepId = stepId;
            await this.handleDecision(msg);
          }
        }
      } catch (err) {
        log
          .Template({ name: "brakets", title: "ERROR:MSG", date: true })
          .R({ error: err.message });
      }
    });

    this.socket.on("close", () => {
      log
        .Template({ name: "brakets", title: "BOT:DISCONNECTED", date: true })
        .R({ bot: this.playerName, msg: "Connection lost." });
    });

    this.socket.on("error", (err) => {
      log
        .Template({ name: "brakets", title: "ERROR:SOCKET", date: true })
        .R({ bot: this.playerName, error: err.message });
    });
  }

  sendAction(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(data);
      console.log(`[${this.playerName}] >>> OUTGOING:`, payload);

      log
        .Template({ name: "brakets", title: "BOT:SENDING", date: true })
        .R({ bot: this.playerName, action: data.action });

      this.socket.send(payload);
    }
  }

  async handleDecision(msg) {
    const currentHighestBet = Number(msg.currentHighestBet || 0);
    const callAmount = Math.max(0, currentHighestBet - this.myCurrentBet);
    const allowedActions = msg.data?.action ||
      msg.data?.actions || ["fold", "call"];
    const board = msg.dealerCards || [];

    // Cálculo de Equity matemático basado en el estado guardado
    const winChance = this.myOdds.win;
    const tieChance = this.myOdds.tie;
    const realEquity = (winChance + tieChance / 2) / 100;

    // Acción base por defecto
    let baseAction =
      callAmount === 0
        ? allowedActions.includes("check")
          ? "check"
          : "call"
        : allowedActions.includes("call")
          ? "call"
          : "fold";

    log
      .Template({ name: "brakets", title: "BOT:DECIDING", date: true })
      .R({
        bot: this.playerName,
        equity: realEquity,
        call: callAmount,
        allowed: allowedActions,
      });

    const prompt = `
You are a professional Texas Hold'em player.
Hand: ${this.myCards.join(", ")} | Board: ${board.join(", ") || "No cards dealt yet"}
Current Pot: ${msg.pot} | Amount to Call: ${callAmount}
Your mathematical Equity is: ${realEquity.toFixed(2)} (0.0 to 1.0)
Allowed Actions: ${allowedActions.join(", ")}

Strategy Rules:
1. NEVER fold if "check" is an allowed action.
2. If Equity < 0.2 and Call Amount > 15% of the Pot, consider folding.
3. Only "raise" if Equity > 0.6 or if you want to bluff.

Respond strictly in JSON format: {"action":"fold|call|check|raise","amount":number}
`;

    let decision = null;
    try {
      let aiText = "";
      if (this.provider === "gemini" && this.geminiModel) {
        const result = await this.geminiModel.generateContent(prompt);
        aiText = (await result.response).text();
      } else if (this.provider === "deepseek" && this.deepseekApiKey) {
        const response = await fetch(
          `${this.deepseekBaseUrl}/chat/completions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.deepseekApiKey}`,
            },
            body: JSON.stringify({
              model: this.modelName,
              messages: [
                { role: "system", content: "You are a professional poker bot." },
                { role: "user", content: prompt },
              ],
              stream: false,
            }),
          },
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || "DeepSeek Error");
        aiText = data.choices[0].message.content;
      } else if (this.provider === "ollama" && ollamaClient) {
        const response = await ollamaClient.generate({
          model: this.modelName,
          prompt,
          stream: false,
        });
        aiText = response.response;
      } else {
        // Fallback genérico si el proveedor elegido no está disponible
        throw new Error(`Provider ${this.provider} is not properly configured.`);
      }
      decision = this.safeParseJSON(aiText);
    } catch (e) {
      log
        .Template({ name: "brakets", title: "ERROR:IA", date: true })
        .R({ bot: this.playerName, error: e.message });
    }

    if (!decision || !decision.action) decision = { action: baseAction };

    let action = decision.action.toLowerCase();

    // Forzar reglas de seguridad deterministas
    if (!allowedActions.includes(action)) action = baseAction;
    if (action === "fold" && allowedActions.includes("check")) action = "check";

    const actionMsg = {};
    if (action === "fold") {
      actionMsg.action = "fold";
    } else if (action === "call") {
      actionMsg.action = "setCall";
      actionMsg.chipsToCall = callAmount;
    } else if (action === "raise") {
      actionMsg.action = "setRise";
      actionMsg.chipsToRiseBet = Math.max(
        Number(decision.amount || 0),
        currentHighestBet + 20,
      );
    } else {
      actionMsg.action = "setCheck";
    }

    log
      .Template({ name: "brakets", title: "BOT:DECISION", date: true })
      .R({
        bot: this.playerName,
        action: actionMsg.action,
        val: actionMsg.chipsToCall || actionMsg.chipsToRiseBet,
      });

    setTimeout(() => this.sendAction(actionMsg), 1000);
  }

  safeParseJSON(text) {
    try {
      const match = text.match(/\{.*\}/s);
      return match ? JSON.parse(match[0]) : null;
    } catch {
      return null;
    }
  }
}

app.get("/health", (req, res) =>
  res.json({ status: "healthy", ollama: ollamaClient ? "connected" : "off" }),
);

app.post("/spawn", (req, res) => {
  const { gameCode, playerName, provider, server, port } = req.body;
  log
    .Template({ name: "brakets", title: "SERVICE:SPAWN", date: true })
    .R({ gameCode, bot: playerName });
  new PokerBot({ gameCode, playerName, provider, server, port });
  res.json({ message: `Spawned ${playerName}` });
});

app.listen(PORT, () => {
  log
    .Template({ name: "brakets", title: "SERVICE:READY", date: true })
    .R({ port: PORT });

  // Soporte para CLI: Permitir spawnear un bot directamente si se pasan argumentos
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.replace("--", "").split("=");
    acc[key] = value;
    return acc;
  }, {});

  if (args.gameCode && args.playerName) {
    log
      .Template({ name: "brakets", title: "SERVICE:CLI_SPAWN", date: true })
      .R({ gameCode: args.gameCode, bot: args.playerName });
    new PokerBot(args);
  }
});
