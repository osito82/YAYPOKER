const WebSocket = require('ws');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ollama } = require("ollama");
const PokerOddsCalculator = require("../webSocket/pokerOdds");
const { ACTIONS, SERVER_CONFIG } = require("../webSocket/constants");
require("dotenv").config();

// Argumentos: --provider=gemini|openllama --model=... --key=... --gameCode=... --name=...
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

const provider = args.provider || 'gemini'; // 'gemini' o 'openllama'
const modelName = args.model || (provider === 'gemini' ? 'gemini-1.5-flash' : 'openllama');
const gameCode = args.gameCode || 'LOBBY';
const playerName = args.name || `${provider.toUpperCase()}_Bot`;
const apiKey = args.key || process.env.GEMINI_API_KEY;
const server = process.env.VITE_CLIENT_URL || 'localhost'
const port = process.env.VITE_CLIENT_PORT || SERVER_CONFIG.PORT

//VITE_CLIENT_PROTOCOL=http
//http://73.7.52.167:8080/join/CS6SD-84ZR4
const serverUrl = `ws://${server}:${port}/?gameCode=${gameCode}&playerName=${playerName}`;
//const serverUrl = `ws://${server}:${port}/play/${gameCode}/0000?playerName=${playerName}`;
console.log(serverUrl)

if (provider === 'gemini' && !apiKey) {
  console.error("\n[ERROR] No GEMINI_API_KEY found for Gemini provider.");
  process.exit(1);
}

// Inicializar Clientes de IA
let geminiModel = null;
if (provider === 'gemini') {
  const genAI = new GoogleGenerativeAI(apiKey);
  geminiModel = genAI.getGenerativeModel({ model: modelName });
}

console.log(`\n[${playerName}] Provider: ${provider} | Model: ${modelName}`);
console.log(`[${playerName}] Connecting to: ${serverUrl}`);

const socket = new WebSocket(serverUrl);
let myId, myCards = [], communityCards = [], myOdds = { win: 0 };

socket.on('open', () => {
  socket.send(JSON.stringify({ action: ACTIONS.SIGN_UP, totalChips: 1000 }));
});

socket.on('message', async (data) => {
  try {
    const payload = JSON.parse(data);
    const msg = payload.message;
    if (!msg) return;

    if (msg.method === 'signUp' && msg.name === playerName) {
      myId = msg.id;
      socket.send(JSON.stringify({ action: ACTIONS.PLAYER_READY }));
    }

    if (msg.method === 'dealtPrivateCards' && msg.id === myId) myCards = msg.cards || [];
    if (msg.method?.startsWith('dealerHand')) communityCards = msg.dealerCards || [];
    if (msg.method === 'oddsUpdate') myOdds = msg.odds;
    if (msg.method === 'askForBlindBets' && msg.id === myId) handleBlind(msg);
    if (msg.method?.startsWith('bettingCore') && msg.messageForId === myId) await handleAIDecision(msg);

  } catch (err) { console.error(`[${playerName}] Error:`, err.message); }
});

function handleBlind(msg) {
  socket.send(JSON.stringify({ action: ACTIONS.BLIND, blindAmount: msg.blindAmount }));
}

async function handleAIDecision(msg) {
  const options = msg.action || [];
  console.log(`\n[${playerName}] Thinking via ${provider}...`);

  const prompt = `
    You are a professional Poker AI. Decide your move in this Texas Hold'em game.
    SITUATION:
    - MY HAND: ${myCards.join(', ')}
    - BOARD: ${communityCards.join(', ') || 'None'}
    - WIN ODDS: ${myOdds.win}%
    - OPTIONS: ${options.join(', ')}
    - MIN BET TO CALL/RAISE: ${msg.minBet || 20}
    - MAX BET: ${msg.maxBet || 1000}
    
    Rules:
    - Respond ONLY with a valid JSON: {"action": "choice", "amount": number, "thought": "brief strategy"}
    - "choice" MUST be one of: ${options.join(', ')}
    - If "raise", "amount" between ${msg.minBet} and ${msg.maxBet}. Otherwise 0.
  `;

  try {
    let text = "";
    if (provider === 'gemini') {
      const result = await geminiModel.generateContent(prompt);
      text = (await result.response).text().trim();
    } else {
      // Local LLM via Ollama
      const response = await ollama.generate({ model: modelName, prompt: prompt, stream: false });
      text = response.response.trim();
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const decision = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    console.log(`[${playerName}] Decision: ${decision.action.toUpperCase()} ${decision.amount > 0 ? '$'+decision.amount : ''}`);
    console.log(`[${playerName}] Strategy: ${decision.thought}`);

    let finalAction = ACTIONS.CHECK;
    if (decision.action === 'fold') finalAction = ACTIONS.FOLD;
    if (decision.action === 'call') finalAction = ACTIONS.CALL;
    if (decision.action === 'check') finalAction = ACTIONS.CHECK;
    if (decision.action === 'raise' || decision.action === 'bet') finalAction = ACTIONS.RAISE;

    setTimeout(() => {
      socket.send(JSON.stringify({
        action: finalAction,
        chipsToRiseBet: decision.amount || 0,
        chipsToBet: decision.amount || 0
      }));
    }, 1500);

  } catch (error) {
    console.error(`[${playerName}] AI Error, falling back to fold:`, error.message);
    socket.send(JSON.stringify({ action: ACTIONS.FOLD }));
  }
}

socket.on('close', () => process.exit(0));
socket.on('error', (err) => console.error(`[${playerName}] Socket Error:`, err.message));
