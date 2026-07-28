const express = require("express");
const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Ollama } = require("ollama");
const log = require("./logger");
require("dotenv").config();

const SYSTEM_PROMPT_RULES = `You are an expert, highly professional Texas Hold'em AI player.
Respond strictly in JSON format: {"action":"fold|call|check|raise","amount":number}

Strategy Rules:
1. SHORT STACK (< 10 BB): Never limp or make passive calls pre-flop. If stack < 10 BB, go ALL-IN ("raise" all chips) with playable hands (any Pair, Ace, K-high, suited connectors), or FOLD.
2. BOARD TEXTURE & COUNTERFEITING: Beware of community pairs on the board (e.g. A-A-J-J-7). Everyone has that pair! Do not call large bets on paired boards unless you hold a Full House, Trips, or Top Pair with highest kicker.
3. SPR & AGGRESSION: When you hit Top Pair or better post-flop and SPR <= 1.5, be aggressive. Initiate an ALL-IN or max raise ("raise") to protect against draws.
4. NEVER fold if "check" is an allowed action.
5. If EV > 0 and Pot Odds < Equity, calling is profitable (+EV).
6. If EV < 0 and Call Amount > 0, FOLD unless bluffing.
7. Only "raise" if Equity > 0.6, EV is highly positive, or protecting vulnerable top pair/all-in. Pick amount between 2x-3x raise or pot-sized bet (up to total chips).`;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8886;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const TESTING_URL = process.env.testingURL;

let ollamaClient;
try {
  // Si existe testingURL, la usamos (útil para pruebas externas con amigos)
  // de lo contrario usamos la OLLAMA_URL estándar.
  const host = TESTING_URL || OLLAMA_URL;
  ollamaClient = new Ollama({ host });
  log
    .Template({ name: "brakets", title: "AI:OLLAMA_INIT", date: true })
    .R({ url: host, msg: "Ready" });
} catch (error) {
  log
    .Template({ name: "brakets", title: "ERROR:OLLAMA", date: true })
    .R({ error: error.message });
}

class PokerBot {
  constructor(config) {
    this.gameCode = config.gameCode;
    this.playerName = config.playerName;

    // Lógica de cambio automático de proveedor según entorno
    // Local (dev/test) -> ollama | Prod -> deepseek
    const isProduction = process.env.NODE_ENV === "production";
    const defaultEnvProvider = isProduction ? "deepseek" : "ollama";

    this.provider =
      config.provider || process.env.DEFAULT_AI_PROVIDER || defaultEnvProvider;

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
    this.myChips = 1000;
    this.bigBlind = 20;
    this.lastStepId = null;
    this.myOdds = { win: 0, tie: 0 }; // Estado persistente de probabilidades

    this.initIA();
    this.connect();
  }

  initIA() {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (this.provider === "gemini" && geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: SYSTEM_PROMPT_RULES,
        generationConfig: { maxOutputTokens: 35, temperature: 0.1 },
      });
      log
        .Template({ name: "brakets", title: "AI:GEMINI_INIT", date: true })
        .R({ bot: this.playerName, model: this.modelName });
    }

    if (this.provider === "deepseek") {
      this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      this.deepseekBaseUrl =
        process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
      log
        .Template({ name: "brakets", title: "AI:DEEPSEEK_INIT", date: true })
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

        if (msg.bigBlind) this.bigBlind = Number(msg.bigBlind);
        if (msg.data?.bigBlind) this.bigBlind = Number(msg.data.bigBlind);
        if (msg.data?.blindType === "BB" && msg.data?.blindAmount) {
          this.bigBlind = Number(msg.data.blindAmount);
        }
        if (msg.data?.playerChips !== undefined) {
          this.myChips = Number(msg.data.playerChips);
        }

        // Actualizar mi apuesta actual y fichas desde la lista de jugadores
        if (msg.players) {
          const me = msg.players.find(
            (p) => (this.myId && p.id === this.myId) || p.name === this.playerName,
          );
          if (me) {
            if (!this.myId && me.id) this.myId = me.id;
            this.myCurrentBet = Number(me.currentBet || 0);
            this.myChips = Number(me.chips || 0);
          }
        }

        // Registro de signup
        if (msg.action === "signUp" && msg.type === "private") {
          this.myId = msg.id || msg.playerId || msg.myPlayerInfo?.playerId;
          if (msg.bigBlind) this.bigBlind = Number(msg.bigBlind);
          if (msg.data?.bigBlind) this.bigBlind = Number(msg.data.bigBlind);
          log
            .Template({ name: "brakets", title: "BOT:REGISTERED", date: true })
            .R({ bot: this.playerName, myId: this.myId, bb: this.bigBlind });
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

        // Recuperación de errores del servidor (ej. Raise rechazado)
        if (msg.action === "actionRejected" && msg.type === "private") {
          log
            .Template({ name: "brakets", title: "BOT:REJECTED", date: true })
            .R({ bot: this.playerName, reason: msg.data?.reason });
            
          const currentHighestBet = Number(msg.currentHighestBet || 0);
          const callAmount = Math.max(0, currentHighestBet - this.myCurrentBet);
          
          // Para destrabar el juego, hacemos la acción más conservadora y válida
          const fallbackAction = callAmount > 0 ? "setCall" : "setCheck";
          this.sendAction({ action: fallbackAction, chipsToCall: callAmount });
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

    const myChips = Number(this.myChips ?? 1000);
    const bigBlind = Number(this.bigBlind ?? 20);
    const stackInBB = Math.round(myChips / (bigBlind > 0 ? bigBlind : 20));

    // Cálculo de Equity matemático basado en el estado guardado
    const winChance = this.myOdds.win;
    const tieChance = this.myOdds.tie;
    const realEquity = (winChance + tieChance / 2) / 100;

    // Cálculo de Pot Odds y Expected Value (EV)
    const currentPot = Number(msg.pot || 0);
    const potOdds = callAmount > 0 ? callAmount / (currentPot + callAmount) : 0;
    const evCall = (realEquity * currentPot) - ((1 - realEquity) * callAmount);
    const spr = currentPot > 0 ? (myChips / currentPot).toFixed(2) : "N/A";

    // Acción base por defecto (segura ante errores de IA o stacks cortos)
    let baseAction = "check";
    if (callAmount === 0) {
      baseAction = allowedActions.includes("check") ? "check" : "call";
    } else {
      if (allowedActions.includes("call")) {
        // Guardarriel de stack corto / apuesta gigante:
        // Si nos piden más de la mitad de nuestro stack y nuestra equity no es fuerte (< 45%), foldear aunque el EV marginal sea positivo
        if (callAmount >= myChips * 0.5 && realEquity < 0.45) {
          baseAction = "fold";
        } else {
          baseAction = evCall > 0 ? "call" : "fold";
        }
      } else {
        baseAction = "fold";
      }
    }

    log
      .Template({ name: "brakets", title: "BOT:DECIDING", date: true })
      .R({
        bot: this.playerName,
        chips: myChips,
        bb: stackInBB,
        spr,
        equity: realEquity,
        potOdds: potOdds.toFixed(2),
        ev: evCall.toFixed(2),
        call: callAmount,
        allowed: allowedActions,
      });

    // 1. Filtrado Algorítmico (Ahorrar 100% de tokens en decisiones triviales u obvias)
    //    Solo se activa si tenemos datos de odds reales (realEquity > 0), para no
    //    tomar decisiones con valores por defecto sin inicializar.
    const hasOddsData = (this.myOdds.win + this.myOdds.tie) > 0;
    let algoDecision = null;

    if (hasOddsData) {
      if (callAmount >= myChips * 0.5 && realEquity < 0.45 && allowedActions.includes("fold")) {
        // Apuesta gigante con equity débil → fold inmediato
        algoDecision = { action: "fold", reason: "high_call_low_equity" };
      } else if (callAmount === 0 && realEquity <= 0.40 && allowedActions.includes("check")) {
        // Check gratis solo con manos mediocres/débiles (≤40%). Con >40% dejamos que
        // la IA decida si apostar/raise para extraer valor.
        algoDecision = { action: "check", reason: "free_check_weak_hand" };
      } else if (board.length === 0 && callAmount > 0 && realEquity < 0.35 && allowedActions.includes("fold")) {
        // Preflop trash enfrentando raise → fold
        algoDecision = { action: "fold", reason: "preflop_trash_facing_raise" };
      } else if (stackInBB < 10 && realEquity >= 0.55 && allowedActions.includes("raise")) {
        // Short stack con mano fuerte → all-in algorítmico sin gastar tokens
        algoDecision = { action: "raise", amount: myChips, reason: "short_stack_allin" };
      }
    }

    if (algoDecision) {
      log
        .Template({ name: "brakets", title: "BOT:ALGO_DECISION", date: true })
        .R({ bot: this.playerName, reason: algoDecision.reason, action: algoDecision.action });
    }

    let decision = algoDecision;
    if (!decision) {
      // 2. Compresión del Prompt (Mini-JSON estructurado y ultra corto)
      const prompt = `State: ${JSON.stringify({
        hand: this.myCards.join(", "),
        board: board.join(", ") || "Pre-flop",
        pot: currentPot,
        call: callAmount,
        chips: myChips,
        bb: stackInBB,
        spr,
        eq: Number(realEquity.toFixed(2)),
        potOdds: Number(potOdds.toFixed(2)),
        ev: Number(evCall.toFixed(2)),
        opts: allowedActions,
      })}`;

      try {
        let aiText = "";
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI Request Timeout")), 25000)
        );

        const aiRequest = async () => {
          if (this.provider === "gemini" && this.geminiModel) {
            const result = await this.geminiModel.generateContent(prompt);
            return (await result.response).text();
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
                    { role: "system", content: SYSTEM_PROMPT_RULES },
                    { role: "user", content: prompt },
                  ],
                  stream: false,
                  max_tokens: 35,
                  temperature: 0.1,
                }),
              },
            );
            const data = await response.json();
            if (data.error) throw new Error(data.error.message || "DeepSeek Error");
            return data.choices[0].message.content;
          } else if (this.provider === "ollama" && ollamaClient) {
            const response = await ollamaClient.generate({
              model: this.modelName,
              system: SYSTEM_PROMPT_RULES,
              prompt,
              stream: false,
              options: {
                num_predict: 35,
                temperature: 0.1,
              },
            });
            return response.response;
          } else {
            throw new Error(`Provider ${this.provider} is not properly configured.`);
          }
        };

        aiText = await Promise.race([aiRequest(), timeoutPromise]);
        decision = this.safeParseJSON(aiText);
      } catch (e) {
        log
          .Template({ name: "brakets", title: "ERROR:AI", date: true })
          .R({ bot: this.playerName, error: e.message });
      }
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
      const minRaise = Number(msg.lastRaiseAmount || 20); // Valor de subida mínima obligatoria
      actionMsg.chipsToRiseBet = Math.max(
        Number(decision.amount || 0),
        currentHighestBet + minRaise,
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
      return JSON.parse(text);
    } catch {
      try {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      } catch {
        return null;
      }
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

if (require.main === module) {
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
}

module.exports = { PokerBot, app };
