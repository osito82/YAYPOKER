const WebSocket = require("ws");
const readline = require("readline");
const mockTest = require("../mock_sockets");

const socket = new WebSocket("ws://localhost:8888");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

socket.addEventListener("open", (event) => {
  console.log("Conexión establecida con el servidor");

  const sendCommand = (command) => {
    socket.send(JSON.stringify(command));
  };

  const handleCommand = (command) => {
    switch (command) {
      case "signUp":
      case "su":
      case "1":
        sendCommand(mockTest["signUp"]);
        break;
      case "initialBet":
      case "ib":
        //case "3":
        rl.question(" - Money to Bet: ", (chipsToBet) => {
          chipsToBet = Number(chipsToBet);
          mockTest.initialBet.chipsToBet = chipsToBet;
          sendCommand(mockTest["initialBet"]);
          promptCommand();
        });

        break;

      case "dealtPrivateCards":
      case "dp":
      case "3":
        sendCommand(mockTest["dealtPrivateCards"]);
        break;


        case "stats":
          case "ss":
          
            sendCommand(mockTest["stats"]);
            break;


      case "startGame":
      case "sg":
      case "2":
        sendCommand(mockTest["startGame"]);
        break;

      case "ac":
      case "askCard":
        sendCommand(mockTest["askCard"]);
        break;

      case "fold":
      case "fd":
        console.log("Fold");
        sendCommand(mockTest["fold"]);
        // socket.close();  // Cierra la conexión WebSocket
        break;

      case "close":
        console.log("Cerrando conexión.");
        sendCommand(mockTest["close"]);
        // socket.close();  // Cierra la conexión WebSocket
     //   rl.close();
        break;

      //DEVELOPMENT COMMANDS
      case "log":
      case "lg":
      case "LOG":
        sendCommand(mockTest["log"]);
        break;

      case "sm":
      case "sendMessage":
      case "10":
        let playerId;
        let msg;
        rl.question(" - Ingrese el id del Jugador: ", (playerIdAnswer) => {
          playerId = playerIdAnswer;
          rl.question(
            ` - Ingrese el mensaje para ${playerId}: `,
            (msgAnswer) => {
              msg = msgAnswer;

              mockTest.sendMessage.targetPlayerId = playerId;
              mockTest.sendMessage.targetMessage = msg;

              sendCommand(mockTest["sendMessage"]);
              promptCommand();
            }
          );
        });
        break;

      default:
        console.log("Comando no reconocido");
    }
  };

  const promptCommand = () => {
    const askCommand = () => {
      rl.question("Type a command: ", (command) => {
        handleCommand(command);

        askCommand();
      });
    };

    askCommand();
  };

  promptCommand();
});

socket.addEventListener("message", (event) => {
  console.log(`Mensaje del servidor: ${event.data}`);
});

socket.addEventListener("close", () => {
  console.log("Conexión cerrada");
});
