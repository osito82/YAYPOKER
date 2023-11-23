const express = require("express");
const R = require("radash");

const http = require("http");
const WebSocket = require("ws");

const { generateUniqueId, randomName } = require("./utils");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const log = require("./log");
const Match = require("./match");
const Socket = require("./sockets");
const Torneo = require("./torneo");

const gameId = generateUniqueId();

const startTime = new Date();

wss.on("connection", (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1));
  const torneoId = urlParams.get("torneoId") ?? "default_Torneo";
  const playerName = urlParams.get("playerName") ?? randomName();

  const thisSocket = { id: generateUniqueId(), name: playerName, socket: ws };

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

      if (!torneoId || !Torneo.torneoExists(torneoId)) {
        console.log("no torneo Id");
        ws.close();
        return;
      }

      match.signUpPlayer(jsonData, thisSocket.id);
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
      log.add({ step: "Fold" });
      match.fold(thisSocket.id);
    }

    if (jsonData && jsonData.action === "close") {
      log.add({ step: "Close" });
      match.close(thisSocket, torneoId);
    }

    if (jsonData && jsonData.action === "initialBet") {
      log.add({ step: "Initial Bet" });
      const chipsToBet = jsonData.chipsToBet;

      match.initialBet(thisSocket.id, chipsToBet);
    }

    if (jsonData && jsonData.action === "dealtPrivateCards") {
      match.dealtPrivateCards();
      log.add({ step: "3. Dealt Private Cards" });
    }

    if (jsonData && jsonData.action === "stats") {
      match.stats(thisSocket.id);
    }

    if (jsonData && jsonData.action === "startGame") {
      match.startGame();
      log.add({ step: "4. Start the Game" });
      log.add({ players: match.players });
    }

    if (jsonData && jsonData.action === "log") {
      console.log("log");
      log.print();
    }
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
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
  res.redirect("/"); // Redirige a la ruta principal
});
