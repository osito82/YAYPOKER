const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// CAMBIA ESTA LÍNEA:
const { Ollama } = require("ollama"); 

const PokerOddsCalculator = require("../webSocket/pokerOdds");
const { ACTIONS, SERVER_CONFIG } = require("../webSocket/constants");

require("dotenv").config();

// ESTA LÍNEA AHORA FUNCIONARÁ:
const ollamaClient = new Ollama({ host: 'http://127.0.0.1:11434' });

/*
ARGS
--provider=gemini | openllama
--model=...
--key=...
--gameCode=...
--name=...
*/

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace("--", "").split("=");
  acc[key] = value;
  return acc;
}, {});

const provider = args.provider || "gemini";
const modelName =
  args.model || (provider === "gemini" ? "gemini-1.5-flash" : "llama3");

const gameCode = args.gameCode || "LOBBY";
const playerName = args.name || `${provider.toUpperCase()}_Bot`;

const apiKey = args.key || process.env.GEMINI_API_KEY;

const server = process.env.VITE_CLIENT_URL || "localhost";
const port = process.env.VITE_CLIENT_PORT || SERVER_CONFIG.PORT;

const THINK_DELAY = 1200;

const serverUrl = `ws://${server}:${port}/?gameCode=${gameCode}&playerName=${playerName}`;

console.log("\n-----------------------------------");
console.log(`[BOT] ${playerName}`);
console.log(`[BOT] Provider: ${provider}`);
console.log(`[BOT] Model: ${modelName}`);
console.log(`[BOT] Server: ${serverUrl}`);
console.log("-----------------------------------\n");

if (provider === "gemini" && !apiKey) {
  console.error("[ERROR] GEMINI_API_KEY missing");
  process.exit(1);
}

/* -----------------------------
   IA CLIENTS
------------------------------*/

let geminiModel = null;

if (provider === "gemini") {
  const genAI = new GoogleGenerativeAI(apiKey);
  geminiModel = genAI.getGenerativeModel({ model: modelName });
}

/* -----------------------------
   GAME STATE
------------------------------*/

let myId = null;
let myCards = [];
let communityCards = [];
let myOdds = { win: 0 };

const oddsCalculator = new PokerOddsCalculator();

/* -----------------------------
   SOCKET
------------------------------*/

const socket = new WebSocket(serverUrl);

socket.on("open", () => {
  console.log(`[${playerName}] Connected`);

  socket.send(
    JSON.stringify({
      action: ACTIONS.SIGN_UP,
      totalChips: 1000,
    })
  );
});

socket.on("message", async (data) => {
  try {
    const payload = JSON.parse(data);
    const msg = payload.message;

    if (!msg) return;

    /* PLAYER REGISTERED */

    if (msg.method === "signUp" && msg.name === playerName) {
      myId = msg.id;

      console.log(`[${playerName}] Registered ID: ${myId}`);

      socket.send(JSON.stringify({ action: ACTIONS.PLAYER_READY }));
    }

    /* CARDS */

    if (msg.method === "dealtPrivateCards" && msg.id === myId) {
      myCards = msg.cards || [];
      console.log(`[${playerName}] My Cards:`, myCards);
    }

    if (msg.method?.startsWith("dealerHand")) {
      communityCards = msg.dealerCards || [];
      console.log(`[${playerName}] Board:`, communityCards);
    }

    if (msg.method === "oddsUpdate") {
      myOdds = msg.odds;
    }

    /* BLINDS */

    if (msg.method === "askForBlindBets" && msg.id === myId) {
      handleBlind(msg);
    }

    /* AI DECISION */

    if (msg.method?.startsWith("bettingCore") && msg.messageForId === myId) {
      await handleAIDecision(msg);
    }
  } catch (err) {
    console.error(`[${playerName}] Message error`, err.message);
  }
});

/* -----------------------------
   BLIND HANDLER
------------------------------*/

function handleBlind(msg) {
  console.log(`[${playerName}] Paying blind ${msg.blindAmount}`);

  socket.send(
    JSON.stringify({
      action: ACTIONS.BLIND,
      blindAmount: msg.blindAmount,
    })
  );
}

/* -----------------------------
   AI DECISION
------------------------------*/

async function handleAIDecision(msg) {
  const options = msg.action || [];

  console.log(`\n[${playerName}] Thinking...`);

  const prompt = `
You are a professional Texas Hold'em poker AI.

GAME STATE

My Cards: ${myCards.join(", ")}
Board: ${communityCards.join(", ") || "None"}
Win Odds: ${myOdds.win}%

Allowed Actions:
${options.join(", ")}

Min Bet: ${msg.minBet || 20}
Max Bet: ${msg.maxBet || 1000}

Rules:
Return ONLY JSON.

{
"action":"fold|call|check|raise|bet",
"amount":number,
"thought":"short reasoning"
}
`;

  try {
    const aiText = await queryAI(prompt);

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("AI returned invalid JSON");

    const decision = JSON.parse(jsonMatch[0]);

    console.log(`[${playerName}] Decision:`, decision);

    const finalAction = mapAction(decision.action);

    setTimeout(() => {
      socket.send(
        JSON.stringify({
          action: finalAction,
          chipsToRiseBet: decision.amount || 0,
          chipsToBet: decision.amount || 0,
        })
      );
    }, THINK_DELAY);
  } catch (err) {
    console.error(`[${playerName}] AI failed`, err.message);

    socket.send(
      JSON.stringify({
        action: ACTIONS.FOLD,
      })
    );
  }
}

/* -----------------------------
   AI QUERY
------------------------------*/
async function queryAI(prompt) {
  if (provider === "gemini") {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  if (provider === "openllama") {
    console.log('es opellama 0021')
    // Usamos el cliente que instanciamos arriba
    const response = await ollamaClient.generate({
      model: modelName,
      prompt: prompt,
      stream: false,
    });

    console.log(response, 'respons e0021')
    return response.response?.trim() || "";
  }

  throw new Error("Unknown provider");
}
/* -----------------------------
   ACTION MAPPER
------------------------------*/

function mapAction(action) {
  switch (action) {
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

/* -----------------------------
   SOCKET EVENTS
------------------------------*/

socket.on("close", () => {
  console.log(`[${playerName}] Disconnected`);
  process.exit(0);
});

socket.on("error", (err) => {
  console.error(`[${playerName}] Socket error`, err.message);
});

//http://73.7.52.167:8080/join/DHPOZ-GK1RC
//http://73.7.52.167:8080/join/98LFD-WTUUG