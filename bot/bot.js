const WebSocket = require("ws");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Ollama } = require("ollama"); 
const PokerOddsCalculator = require("../webSocket/pokerOdds");
const { ACTIONS, SERVER_CONFIG } = require("../webSocket/constants");
require("dotenv").config();

// Inicializar Cliente de Ollama
let ollamaClient;
try {
  ollamaClient = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });
  console.log("✅ Ollama client initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Ollama client:", error.message);
  process.exit(1);
}

// Configuración de argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace("--", "").split("=");
  acc[key] = value;
  return acc;
}, {});

// CORRECCIÓN: Normalizar el nombre del proveedor
let provider = args.provider || "gemini";
// Mapear "openllama" a "ollama"
if (provider.toLowerCase() === "openllama") {
  provider = "ollama";
}

const modelName = args.model || (provider === "gemini" ? "gemini-1.5-flash" : "llama3.2:latest");
const gameCode = args.gameCode || "LOBBY";
const playerName = args.name || `${provider.toUpperCase()}_Bot`;
const apiKey = args.key || process.env.GEMINI_API_KEY;

// CONFIGURACIÓN DE CONEXIÓN
const wsHost = process.env.VITE_WS_URL || process.env.VITE_CLIENT_URL || "73.7.52.167";
const wsPort = process.env.VITE_WS_PORT || process.env.VITE_CLIENT_PORT || SERVER_CONFIG.PORT || "8888";
const serverUrl = `ws://${wsHost}:${wsPort}/?gameCode=${gameCode}&playerName=${playerName}`;

console.log("\n" + "=".repeat(40));
console.log(`🤖 BOT: ${playerName}`);
console.log(`🌐 CONNECTING TO: ${serverUrl}`);
console.log(`🧠 PROVIDER: ${provider} (${modelName})`);
console.log("=".repeat(40) + "\n");

if (provider === "gemini" && !apiKey) {
  console.error("❌ ERROR: No GEMINI_API_KEY found in .env or arguments.");
  process.exit(1);
}

// Inicializar Gemini si es necesario
let geminiModel = null;
if (provider === "gemini") {
  const genAI = new GoogleGenerativeAI(apiKey);
  geminiModel = genAI.getGenerativeModel({ model: modelName });
}

let myId, myCards = [], communityCards = [], myOdds = { win: 0 };
let gameState = {
  pot: 0,
  currentHighestBet: 0,
  players: []
};

const socket = new WebSocket(serverUrl);

socket.on("open", () => {
  console.log(`✅ [${playerName}] Connection established with server.`);
  console.log(`📊 [${playerName}] WebSocket readyState: ${socket.readyState}`);
  socket.send(JSON.stringify({ action: ACTIONS.SIGN_UP, totalChips: 1000 }));
});

socket.on("message", async (data) => {
  try {
    console.log(`📩 [${playerName}] Raw message received:`, data.toString().substring(0, 100) + "...");
    const payload = JSON.parse(data);
    const msg = payload.message;
    if (!msg) return;

    // Actualizar estado del juego
    if (msg.pot !== undefined) gameState.pot = msg.pot;
    if (msg.currentHighestBet !== undefined) gameState.currentHighestBet = msg.currentHighestBet;

    // Manejar diferentes tipos de mensajes
    if (msg.action === "signUp" && msg.type === "private") {
      if (msg.myPlayerInfo && msg.myPlayerInfo.playerId) {
        myId = msg.myPlayerInfo.playerId;
        console.log(`👤 [${playerName}] Registered with ID: ${myId}`);
        socket.send(JSON.stringify({ action: ACTIONS.PLAYER_READY }));
      }
    }

    if (msg.action === "dealtPrivateCards" && msg.playerId === myId) {
      myCards = msg.cards || [];
      console.log(`🃏 [${playerName}] Received Hand: ${myCards.join(', ')}`);
    }

    if (msg.action?.startsWith("dealerHand")) {
      communityCards = msg.dealerCards || [];
      console.log(`🎴 [${playerName}] Board Updated: ${communityCards.join(', ') || 'Empty'}`);
    }

    if (msg.action === "oddsUpdate") {
      myOdds = msg.odds || { win: 0 };
    }

    // CORRECCIÓN: Manejar correctamente askForBlindBets
    if (msg.action === "askForBlindBets") {
      console.log(`💰 [${playerName}] Received blind request`);
      
      // Si es un mensaje privado para este jugador
      if (msg.type === "private" && msg.playerId === myId) {
        handleBlind(msg);
      }
      // Si es un mensaje público, verificar si somos el small blind o big blind
      else if (msg.type === "public") {
        // Buscar si somos el small blind o big blind
        if (msg.smallBlind && msg.smallBlind.playerId === myId) {
          console.log(`💰 [${playerName}] We are small blind`);
          handleBlind({ blindAmount: msg.smallBlind.amount });
        } else if (msg.bigBlind && msg.bigBlind.playerId === myId) {
          console.log(`💰 [${playerName}] We are big blind`);
          handleBlind({ blindAmount: msg.bigBlind.amount });
        }
      }
    }

    // CORRECCIÓN: Manejar bettingCore
    if (msg.action?.startsWith("bettingCore")) {
      console.log(`🎲 [${playerName}] Betting round started`);
      
      // Si es un mensaje privado para este jugador
      if (msg.type === "private" && msg.playerId === myId) {
        await handleAIDecision(msg);
      }
    }

  } catch (error) { 
    console.error(`⚠️ [${playerName}] Msg Error:`, error.message);
  }
});

function handleBlind(msg) {
  const blindAmount = msg.blindAmount || msg.amount || 10;
  console.log(`💰 [${playerName}] Posting blind: ${blindAmount}`);
  socket.send(JSON.stringify({ 
    action: ACTIONS.BLIND, 
    blindAmount: blindAmount 
  }));
}

async function handleAIDecision(msg) {
  // Determinar las opciones disponibles
  let options = [];
  if (msg.possibleActions) {
    options = msg.possibleActions;
  } else if (msg.data && msg.data.actions) {
    options = msg.data.actions;
  } else {
    // Opciones por defecto basadas en el estado del juego
    options = ["fold", "call", "raise"];
    if (gameState.currentHighestBet === 0) {
      options.push("check");
    }
  }

  console.log(`\n🤔 [${playerName}] Thinking via ${provider}...`);
  console.log(`📊 Game State - Pot: $${gameState.pot}, Current Bet: $${gameState.currentHighestBet}`);
  console.log(`🎴 My Hand: ${myCards.join(', ')}`);
  console.log(`📋 Options: ${options.join(', ')}`);

  const prompt = `
    You are a professional Poker AI. Decide your move in this Texas Hold'em game.
    
    SITUATION:
    - MY HAND: ${myCards.join(', ')}
    - BOARD: ${communityCards.join(', ') || 'None'}
    - WIN ODDS: ${myOdds.win || 0}%
    - POT SIZE: $${gameState.pot || 0}
    - CURRENT BET TO CALL: $${gameState.currentHighestBet || 0}
    - OPTIONS: ${options.join(', ')}
    
    IMPORTANT RULES:
    1. Respond ONLY with a valid JSON. No other text.
    2. JSON Format: {"action": "choice", "amount": number, "thought": "brief strategy"}
    3. "choice" MUST be exactly one of: ${options.join(', ')}
    4. If you "raise" or "bet", "amount" must be at least $${gameState.currentHighestBet * 2 || 20}
    5. If you "call", "check", or "fold", "amount" must be 0.
    
    STRATEGY GUIDELINES:
    - With high win odds (>70%), consider raising aggressively
    - With medium win odds (40-70%), consider calling/checking
    - With low win odds (<40%), consider folding unless pot odds justify a call
    - Consider your position and the number of players
  `;

  try {
    let aiText = "";
    
    if (provider === "gemini") {
      console.log(`📡 [${playerName}] Calling Gemini API...`);
      const result = await geminiModel.generateContent(prompt);
      aiText = (await result.response).text().trim();
    } else {
      console.log(`📡 [${playerName}] Calling Ollama with model: ${modelName}...`);
      
      const response = await ollamaClient.generate({ 
        model: modelName, 
        prompt: prompt, 
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      });
      aiText = response.response.trim();
    }

    console.log(`📝 [${playerName}] AI raw response:`, aiText);

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ [${playerName}] No valid JSON in response`);
      throw new Error("Invalid AI JSON");
    }
    
    const decision = JSON.parse(jsonMatch[0]);
    
    // Validar la decisión
    if (!options.includes(decision.action.toLowerCase())) {
      console.warn(`⚠️ [${playerName}] AI suggested invalid action: ${decision.action}`);
      decision.action = options.includes("check") ? "check" : "fold";
      decision.amount = 0;
    }

    console.log(`🎯 [${playerName}] Decision: ${decision.action.toUpperCase()} ${decision.amount > 0 ? '$' + decision.amount : ''}`);
    console.log(`💭 [${playerName}] Thought: ${decision.thought}`);

    let finalAction = mapAction(decision.action);

    // Pequeño delay para simular pensamiento humano
    setTimeout(() => {
      const actionMessage = {
        action: finalAction,
      };
      
      // Añadir el monto según la acción
      if (finalAction === ACTIONS.RAISE) {
        actionMessage.chipsToRiseBet = decision.amount || gameState.currentHighestBet * 2;
      } else if (finalAction === ACTIONS.CALL) {
        actionMessage.chipsToCall = gameState.currentHighestBet;
      }
      
      socket.send(JSON.stringify(actionMessage));
      console.log(`📤 [${playerName}] Action sent: ${finalAction}`);
    }, 1200);

  } catch (error) {
    console.error(`❌ [${playerName}] AI ERROR:`, error.message);
    
    // Estrategia de fallback mejorada
    let fallbackAction = ACTIONS.FOLD;
    
    if (myOdds.win > 50) {
      fallbackAction = options.includes("raise") ? ACTIONS.RAISE : 
                      (options.includes("call") ? ACTIONS.CALL : ACTIONS.CHECK);
    } else if (myOdds.win > 30 && gameState.currentHighestBet < gameState.pot * 0.3) {
      fallbackAction = options.includes("call") ? ACTIONS.CALL : 
                      (options.includes("check") ? ACTIONS.CHECK : ACTIONS.FOLD);
    }
    
    console.log(`🔄 [${playerName}] Using fallback action: ${fallbackAction}`);
    
    const fallbackMessage = {
      action: fallbackAction,
    };
    
    if (fallbackAction === ACTIONS.CALL) {
      fallbackMessage.chipsToCall = gameState.currentHighestBet;
    } else if (fallbackAction === ACTIONS.RAISE) {
      fallbackMessage.chipsToRiseBet = gameState.currentHighestBet * 2;
    }
    
    socket.send(JSON.stringify(fallbackMessage));
  }
}

function mapAction(action) {
  if (!action) return ACTIONS.CHECK;
  switch (action.toLowerCase()) {
    case "fold": return ACTIONS.FOLD;
    case "call": return ACTIONS.CALL;
    case "check": return ACTIONS.CHECK;
    case "raise":
    case "bet": return ACTIONS.RAISE;
    default: return ACTIONS.CHECK;
  }
}

socket.on("close", (code, reason) => {
  console.log(`🔌 [${playerName}] Disconnected. Code: ${code}, Reason: ${reason || 'None'}`);
  process.exit(0);
});

socket.on("error", (err) => {
  console.error(`🚨 [${playerName}] Connection Error:`, err.message);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log(`\n👋 [${playerName}] Shutting down...`);
  socket.close();
  process.exit(0);
});