const express = require("express");
const R = require("radash");
const osolog = require("osolog");

const http = require("http");
const WebSocket = require("ws");

const { generateUniqueId, randomName } = require("./utils");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const Match = require("./match");
const Socket = require("./sockets");
const Torneo = require("./torneo");

const startTime = new Date();
const log = new osolog();

wss.on("connection", (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1));

  const torneoId = (urlParams.get("gameCode") ?? "default_Torneo").slice(0, 25);
  const playerName = (urlParams.get("playerName") ?? randomName()).slice(0, 25);
  const secretCode = (urlParams.get("secretCode") ?? generateUniqueId(10)).slice(0, 25);

  const thisSocket = {
    id: generateUniqueId(25),
    name: playerName,
    secretCode: secretCode,
    socket: ws
  };

  log.Template({ name: "brakets", title: "SERVER - New Connection", date: true }).R({ playerName, id: thisSocket.id, torneo: torneoId });
  Socket.addSocket(thisSocket, torneoId);

  // Intentar obtener el match existente o crear uno nuevo si no existe
  let match = Torneo.getMatch(torneoId);
  if (!match) {
    const newGameId = generateUniqueId();
    match = new Match(torneoId, newGameId);
    Torneo.addMatch(match, torneoId);
    log.Template({ name: "brakets", title: "SERVER - Match Created", date: true }).R({ newGameId, torneoId });
  }

  ws.on("message", (data) => {
    let jsonData;
    if (data) {
      try {
        jsonData = JSON.parse(data);
        log.Template({ name: "brakets", title: `INCOMING - ${jsonData.action}`, date: true }).R({ from: playerName });
      } catch (error) {
        console.error("Error al analizar el JSON:", error);
        ws.send(JSON.stringify({ error: "Formato JSON no válido" }));
        return;
      }
    }

    if (jsonData && jsonData.action === "signUp") {
      jsonData.name = playerName;
      jsonData.secretCode = secretCode;

      if (!torneoId || !Torneo.torneoExists(torneoId)) {
        log.Template({ name: "brakets", title: "SERVER - Error", date: true }).R({ msg: "Torneo not found during signUp", torneoId });
        ws.close();
        return;
      }

      match.signUp(jsonData, thisSocket);
    }

    if (jsonData && jsonData.action === "sendMessage") {
      const targetPlayerId = jsonData.targetPlayerId;
      const targetMessage = jsonData.targetMessage;

      const targetSocket = Socket.getSocket(torneoId, targetPlayerId);

      if (targetSocket && targetSocket.socket) {
        targetSocket.socket.send(JSON.stringify({ message: {displayMsg: targetMessage} }));
      } else {
        log.Template({ name: "brakets", title: "SERVER - Chat Error", date: true }).R({ msg: "Target not found", targetPlayerId });
      }
    }

    if (jsonData && jsonData.action === "fold") {
      match.fold(thisSocket);
    }

    if (jsonData && jsonData.action === "close") {
      match.close(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "setBet") {
      const chipsToBet = jsonData.chipsToBet;
      match.setBet(thisSocket, chipsToBet);
    }

    if (jsonData && jsonData.action === "setRise") {
      const chipsToRiseBet = jsonData.chipsToRiseBet;
      match.setRise(thisSocket, chipsToRiseBet);
    }

    if (jsonData && jsonData.action === "setCall") {
      match.setCall(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "setCheck") {
      match.setCheck(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "dealtPrivateCards") {
      match.dealtPrivateCards(thisSocket);
    }

    if (jsonData && jsonData.action === "stats") {
      match.stats(thisSocket.id);
    }

    if (jsonData && jsonData.action === "startGame") {
      match.startGame(thisSocket);
    }
  });

  ws.on("close", () => {
    log.Template({ name: "brakets", title: "SERVER - Disconnection", date: true }).R({ playerName });
    match.pause(thisSocket);
  });
});

app.get("/", (req, res) => res.send("Poker!"));
const port = 8888;

if (require.main === module) {
  server.listen(port, () => {
    log.Template({ name: "brakets", title: "SERVER - Listening", date: true }).R({ port, url: `http://localhost:${port}` });
  });
}

app.get("/status", (req, res) => {
  const uptimeInMilliseconds = new Date() - startTime;

  // Convierte el tiempo de ejecución a un formato más legible
  const uptimeInSeconds = Math.floor(uptimeInMilliseconds / 1000);
  const hours = Math.floor(uptimeInSeconds / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = uptimeInSeconds % 60;

  res.json({
    status: "Server is running",
    startTime: startTime.toLocaleString(),
    uptime: {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    },
  });
});

app.get("*", (req, res) => {
  res.redirect("/");
});

module.exports = { app, server, wss };
