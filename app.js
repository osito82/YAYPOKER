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

wss.on("connection", (ws, req) => {
  const urlParams = new URLSearchParams(req.url.substring(1));
  const torneoId = urlParams.get("torneoId") ?? "default_Torneo";
  const myName = randomName();

  const thisSocket = { id: generateUniqueId(), name: myName, socket: ws };

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
      //log.add({ step: "Sign Up" });

      jsonData.name = myName;

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
      match.close(thisSocket.id, torneoId);
      // const targetSocket = Socket.getSocket(torneoId, thisSocket.id);

      // if (targetSocket && targetSocket.socket) {
      //   targetSocket.socket.terminate();
      // }
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
      match.stats();
      //  log.add({ step: "3. Dealt Private Cards" });
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
});

app.get("/", (req, res) => res.send("hola mundo"));
server.listen(8888, () => {
  console.log("Servidor escuchando en http://localhost:8888");
});
