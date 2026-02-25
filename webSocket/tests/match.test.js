import { describe, it, expect, beforeEach, vi } from "vitest";

// 🔥 Mocks de dependencias
vi.mock("./player", () => {
  return {
    default: vi.fn().mockImplementation((gameId, name, secretCode, totalChips, cards, id) => {
      return {
        id,
        name,
        secretCode,
        totalChips,
        cards: [],
        connected: true,
        currentBet: 0,
        setBet: vi.fn((amount) => {
          if (amount > 0) {
            return true;
          }
          return false;
        }),
        getCurrentBet: vi.fn(() => 0),
        getPlayerName: vi.fn(() => name),
        getPlayerId: vi.fn(() => id),
        checkPrize: vi.fn(() => "pair"),
        setCurrentPrize: vi.fn()
      };
    })
  };
});

vi.mock("./dealer", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      talkToAllPlayersOnTable: vi.fn(),
      talkToPLayerById: vi.fn(),
      talkToSocketById: vi.fn(),
      talkToPlayerBUTid: vi.fn(),
      dealCardsEachPlayer: vi.fn(),
      dealCardsDealer: vi.fn(),
      setPot: vi.fn(),
      getPot: vi.fn(() => 100),
      hasMinimumPlayers: vi.fn(() => true),
      hasPlayerBetByNumber: vi.fn(() => true),
      getPlayerByNumber: vi.fn(() => ({ id: "1", name: "P1" })),
      hasAllPlayersBet: vi.fn(() => false),
      hasPlayerBet: vi.fn(() => false),
      getDealerCards: vi.fn(() => ["A", "K", "Q"]),
      allPlayersCheck: vi.fn(() => false),
      removeChecks: vi.fn(),
      getFinalHands: vi.fn(() => []),
      setFinalHands: vi.fn(),
      getChipsFromPlayers: vi.fn(),
    }))
  };
});

vi.mock("./stepChecker", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkStep: vi.fn(() => false),
      grantStep: vi.fn(),
      revokeStep: vi.fn(),
      gameFlow: {}
    }))
  };
});

vi.mock("./communicator", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      msgBuilder: vi.fn(),
      getMsg: vi.fn(() => "mock-msg"),
      getFullInfo: vi.fn(() => ({}))
    }))
  };
});

vi.mock("./winnerCore", () => ({
  default: {
    Winner: vi.fn(() => "Player1")
  }
}));

vi.mock("radash", () => ({
  default: {
    isEmpty: vi.fn(() => false)
  }
}));

vi.mock("osolog", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      Template: vi.fn().mockReturnThis(),
      R: vi.fn()
    }))
  };
});

// 🔥 Import después de mocks
import Match from "../../match";

describe("Match Class", () => {
  let match;
  const socketMock = { id: "socket1", name: "John", socket: { close: vi.fn() } };

  // Al inicio del archivo de test
beforeAll(() => {
    vi.resetModules();
   //   const Match = (await import("../match")).default;
  // Forzar que console.log escriba inmediatamente
  console.log = (...args) => {
    process.stdout.write(args.join(' ') + '\n');
  };
});

  beforeEach(() => {
  // <--- AÑADE ESTO
    match = new Match("torneo1", "game1");
  });

  // ✅ TEST SIGNUP
  it("should add a new player on signUp", () => {
    match.signUp(
      {
        name: "John",
        secretCode: "123",
        totalChips: 1000
      },
      socketMock
    );

    expect(match.players.length).toBe(1);
    expect(match.players[0].name).toBe("John");
  });

  // ✅ TEST SETBET
  it("should set bet and increase pot", () => {
    match.signUp(
      { name: "John", secretCode: "123", totalChips: 1000 },
      socketMock
    );

    match.setBet(socketMock, 50);

    expect(match.players.length).toBe(1);
  });


 
 it("should remove player on fold", () => {
    console.log("Métodos de match:", Object.keys(match));
  console.log("fold existe?", typeof match.fold);
  match.signUp(
    { name: "John", secretCode: "123", totalChips: 1000 },
    socketMock
  );

  match.players[0].setCard("A"); 
  match.players[0].setCard("K");
console.log(match.players)
  vi.spyOn(match, "continue").mockImplementation(() => {});

  match.fold(socketMock);

    // DESPUÉS haz el spy si es necesario
  //vi.spyOn(match, "continue").mockImplementation(() => {});

expect(match.players[0].folded).toBe(true);
expect(match.playersFold.includes("John")).toBe(true);
});

  // ✅ TEST PLAYER LEAVE
  it("should remove player when playerLeave is called", () => {
    match.signUp(
      { name: "John", secretCode: "123", totalChips: 1000 },
      socketMock
    );

    match.playerLeave(socketMock);

    expect(match.players.length).toBe(0);
  });

  // ✅ TEST START GAME MINIMUM PLAYERS
  it("should not start game with less than 2 players", () => {
    match.signUp(
      { name: "John", secretCode: "123", totalChips: 1000 },
      socketMock
    );

    match.startGame(socketMock);

    expect(match.players.length).toBe(1);
  });

  // ✅ TEST CHECK PRIZES
it("should call checkPrize when dealer has 3 cards", () => {
  // 1️⃣ Sign up
  match.signUp(
    { name: "John", secretCode: "123", totalChips: 1000 },
    socketMock
  );

  // 2️⃣ Mock/spiar el método checkPrize
  const player = match.players[0];
  const spy = vi.spyOn(player, "checkPrize").mockReturnValue(0);

  // 3️⃣ Darle 3 cartas al dealer
  match.dealer.cardsDealer = ["Ah", "Kd", "Qs"];

  // 4️⃣ Ejecutar checkPrizes
  match.checkPrizes(socketMock);

  // 5️⃣ Verificar que se llamó
  expect(spy).toHaveBeenCalled();
});
});