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

const gameId = generateUniqueId();

const startTime = new Date();
const log = new osolog();

wss.on("connection", (ws, req) => {
  
  const urlParams = new URLSearchParams(req.url.substring(1));
  const torneoId = urlParams.get("torneoId") ?? "default_Torneo";
  const playerName = urlParams.get("playerName") ?? randomName();
  const secretCode = urlParams.get("secretCode") ?? generateUniqueId(10);

  const thisSocket = { id: generateUniqueId(), name: playerName, secretCode: secretCode, socket: ws };

  Socket.addSocket(thisSocket, torneoId);

  const thisMatch = new Match(torneoId, gameId);

  setInterval(() => thisMatch.vigilant(), 2500);

  Torneo.addMatch(thisMatch, torneoId);

  let match = Torneo.getMatch(torneoId, gameId);

  ws.on("message", (data) => {
    let jsonData;

    if (data) {
      try {
        jsonData = JSON.parse(data);
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
        console.log("no torneo Id");
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
        targetSocket.socket.send(JSON.stringify({ message: targetMessage }));
      } else {
        console.log(
          `Jugador con ID ${targetPlayerId} no encontrado o sin socket`
        );
      }
    }

    if (jsonData && jsonData.action === "fold") {
      log.R({ step: "Fold" });
      match.fold(thisSocket);
    }

    if (jsonData && jsonData.action === "close") {
      log.R({ step: "Close" });
      match.close(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "setBet") {
      log.R({ step: "Set Bet" });
      const chipsToBet = jsonData.chipsToBet;
      match.setBet(thisSocket, chipsToBet);
    }

    if (jsonData && jsonData.action === "setRise") {
      log.R({ step: "Set Rise" });
      const chipsToRiseBet = jsonData.chipsToRiseBet;
      match.setRise(thisSocket.id, chipsToRiseBet);
    }

    if (jsonData && jsonData.action === "setCall") {
      log.R({ step: "Set Call" });
      match.setCall(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "setCheck") {
      log.R({ step: "Check" });
      match.setCheck(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "dealtPrivateCards") {
      log.R({ step: "Dealt Private Cards" });
      match.dealtPrivateCards(thisSocket);
    }

    if (jsonData && jsonData.action === "stats") {
      match.stats(thisSocket.id);
    }

    if (jsonData && jsonData.action === "startGame") {
      log.R({ step: "Start Game" });
      match.startGame(thisSocket);
    }
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
    match.pause(thisSocket);
  });
});

app.get("/", (req, res) => res.send("Poker!"));
const port = 8888;
server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

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
