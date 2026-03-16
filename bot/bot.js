const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Ollama } = require("ollama");
const osolog = require("osolog");
const PokerOddsCalculator = require("../webSocket/pokerOdds");
const { ACTIONS, SERVER_CONFIG } = require("../webSocket/constants");
require("dotenv").config();

const log = new osolog();

// Inicializar Cliente de Ollama
let ollamaClient;
try {
  ollamaClient = new Ollama({
    host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
  });
  log
    .Template({ name: "brakets", title: "IA:OLLAMA_INIT", date: true })
    .R({ msg: "Ollama client initialized" });
} catch (error) {
  log
    .Template({ name: "brakets", title: "ERROR:OLLAMA_INIT", date: true })
    .R({ error: error.message });
}

// Configuración de argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace("--", "").split("=");
  acc[key] = value;
  return acc;
}, {});

let provider = args.provider || "gemini";
if (provider.toLowerCase() === "openllama") provider = "ollama";

const modelName =
  args.model || (provider === "gemini" ? "gemini-1.5-flash" : "llama3.2");
const gameCode = args.gameCode || "LOBBY";
const playerName = args.name || `${provider.toUpperCase()}_Bot`;
const apiKey = args.key || process.env.GEMINI_API_KEY;

// CONFIGURACIÓN DE CONEXIÓN
const wsHost =
  process.env.VITE_WS_URL || process.env.VITE_CLIENT_URL || "73.7.52.167";
const wsPort =
  process.env.VITE_WS_PORT ||
  process.env.VITE_CLIENT_PORT ||
  SERVER_CONFIG.PORT ||
  "8888";
const serverUrl = `ws://${wsHost}:${wsPort}/?gameCode=${gameCode}&playerName=${playerName}`;

log.Template({ name: "brakets", title: "BOT:START", date: true }).R({
  name: playerName,
  url: serverUrl,
  provider,
  model: modelName,
});

if (provider === "gemini" && !apiKey) {
  log
    .Template({ name: "brakets", title: "ERROR:CONFIG", date: true })
    .R({ msg: "No GEMINI_API_KEY found" });
  process.exit(1);
}

let geminiModel = null;
if (provider === "gemini" && apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  geminiModel = genAI.getGenerativeModel({ model: modelName });
}

let myId = null;
let myCards = [];
let communityCards = [];
let myOdds = { win: 0 };
let gameState = { pot: 0, currentHighestBet: 0 };

const socket = new WebSocket(serverUrl);

// Función auxiliar para enviar mensajes con log
function sendAction(data) {
  const payload = JSON.stringify(data);
  log
    .Template({ name: "brakets", title: "BOT:SENDING", date: true })
    .R({ action: data.action, payload: data });
  socket.send(payload);
}

socket.on("open", () => {
  log
    .Template({ name: "brakets", title: "BOT:CONNECTED", date: true })
    .R({ msg: "Connection established" });
  sendAction({ action: ACTIONS.SIGN_UP, totalChips: 1000 });
});

socket.on("message", async (data) => {
  try {
    const rawData = data.toString();
    const payload = JSON.parse(rawData);
    const msg = payload.message;

    if (!msg) return;

    log
      .Template({
        name: "brakets",
        title: `INCOMING:${msg.action?.toUpperCase() || "MSG"}`,
        date: true,
      })
      .R({ type: msg.type, from: playerName, raw: rawData.substring(0, 200) });

    // Actualizar estado global del juego
    if (msg.pot !== undefined) gameState.pot = msg.pot;
    if (msg.currentHighestBet !== undefined)
      gameState.currentHighestBet = msg.currentHighestBet;

    // 1. Registro y obtención de ID
    if (msg.action === "signUp" && msg.type === "private") {
      myId = msg.myPlayerInfo?.playerId || msg.id || msg.playerId;
      if (myId) {
        log
          .Template({ name: "brakets", title: "BOT:REGISTERED", date: true })
          .R({ myId });
        sendAction({ action: ACTIONS.PLAYER_READY });
      }
    }

    // 2. Recibir cartas
    if (msg.action === "dealtPrivateCards") {
      const targetId = msg.playerId || msg.id;
      if (targetId === myId) {
        myCards = msg.cards || [];
        log
          .Template({ name: "brakets", title: "BOT:HAND", date: true })
          .R({ cards: myCards });
      }
    }

    // 3. Cartas comunitarias
    if (msg.action?.startsWith("dealerHand")) {
      communityCards = msg.dealerCards || [];
      log
        .Template({ name: "brakets", title: "BOT:BOARD_UPDATE", date: true })
        .R({ board: communityCards });
    }

    // 4. Probabilidades
    if (msg.action === "oddsUpdate") {
      myOdds = msg.odds || { win: 0 };
      log
        .Template({ name: "brakets", title: "BOT:ODDS", date: true })
        .R({ win: myOdds.win });
    }

    // 5. Manejar CIEGAS (Small/Big Blind)
    if (msg.action === "askForBlindBets") {
      const targetId = msg.playerId || msg.id || msg.messageForId;

      if (msg.type === "private" && targetId === myId) {
        handleBlind(msg);
      } else if (msg.type === "public") {
        if (
          msg.smallBlind?.playerId === myId ||
          msg.bigBlind?.playerId === myId
        ) {
          const amount =
            msg.smallBlind?.playerId === myId
              ? msg.smallBlind.amount
              : msg.bigBlind.amount;
          handleBlind({ blindAmount: amount });
        }
      }
    }

    // 6. Manejar TURNO de apuesta
    if (msg.action?.startsWith("bettingCore")) {
      const targetId = msg.messageForId || msg.playerId || msg.id;
      if (msg.type === "private" && targetId === myId) {
        await handleAIDecision(msg);
      }
    }
  } catch (error) {
    log
      .Template({ name: "brakets", title: "ERROR:MSG_PROCESS", date: true })
      .R({ error: error.message, stack: error.stack });
  }
});

function handleBlind(msg) {
  const amount = msg.blindAmount || msg.amount || 10;
  log
    .Template({ name: "brakets", title: "BOT:BLIND_ACTION", date: true })
    .R({ amount });
  sendAction({ action: ACTIONS.BLIND, blindAmount: amount });
}

async function handleAIDecision(msg) {
  const options = msg.possibleActions ||
    msg.data?.actions || ["fold", "call", "check", "raise"];

  log.Template({ name: "brakets", title: "BOT:THINKING", date: true }).R({
    provider,
    odds: myOdds.win,
    pot: gameState.pot,
    call: gameState.currentHighestBet,
    options,
  });

  const prompt = `
    You are a professional Poker AI.
    HAND: ${myCards.join(", ")} | BOARD: ${communityCards.join(", ") || "None"}
    WIN ODDS: ${myOdds.win}% | POT: $${gameState.pot} | CALL: $${gameState.currentHighestBet}
    OPTIONS: ${options.join(", ")}
    
    Respond ONLY with JSON: {"action": "choice", "amount": number, "thought": "reason"}
    Choice must be one of: ${options.join(", ")}
  `;

  try {
    let aiText = "";
    if (provider === "gemini") {
      log
        .Template({ name: "brakets", title: "IA:GEMINI_CALL", date: true })
        .R({ msg: "Calling Gemini API" });
      const result = await geminiModel.generateContent(prompt);
      aiText = (await result.response).text().trim();
    } else {
      log
        .Template({ name: "brakets", title: "IA:OLLAMA_CALL", date: true })
        .R({ msg: "Calling Ollama", model: modelName });
      const response = await ollamaClient.generate({
        model: modelName,
        prompt: prompt,
        stream: false,
      });
      aiText = response.response.trim();
    }

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log
        .Template({ name: "brakets", title: "ERROR:IA_RESPONSE", date: true })
        .R({ raw: aiText });
      throw new Error("Invalid AI Response Format");
    }

    const decision = JSON.parse(jsonMatch[0]);
    log.Template({ name: "brakets", title: "IA:DECISION", date: true }).R({
      action: decision.action,
      amount: decision.amount,
      thought: decision.thought,
    });

    let finalAction = mapAction(decision.action);

    setTimeout(() => {
      const actionMsg = { action: finalAction };
      if (finalAction === ACTIONS.RAISE)
        actionMsg.chipsToRiseBet = decision.amount ||
          gameState.currentHighestBet * 2;
      if (finalAction === ACTIONS.CALL)
        actionMsg.chipsToCall = gameState.currentHighestBet;

      sendAction(actionMsg);
    }, 1000);
  } catch (error) {
    log
      .Template({ name: "brakets", title: "ERROR:IA_DECISION", date: true })
      .R({ error: error.message });
    const fallback = options.includes("check") ? ACTIONS.CHECK : ACTIONS.FOLD;
    log
      .Template({ name: "brakets", title: "BOT:FALLBACK", date: true })
      .R({ action: fallback });
    sendAction({ action: fallback });
  }
}

function mapAction(action) {
  switch (action?.toLowerCase()) {
    case "fold":
      return ACTIONS.FOLD;
    case "call":
      return ACTIONS.CALL;
    case "check":
      return ACTIONS.CHECK;
    case "raise":
    case "bet":
      return ACTIONS.RAISE;
    default:
      return ACTIONS.CHECK;
  }
}

socket.on("close", (code, reason) => {
  log
    .Template({ name: "brakets", title: "BOT:DISCONNECTED", date: true })
    .R({ code, reason: reason?.toString() || "No reason" });
  process.exit(0);
});

socket.on("error", (err) => {
  log
    .Template({ name: "brakets", title: "ERROR:SOCKET", date: true })
    .R({ error: err.message });
});
