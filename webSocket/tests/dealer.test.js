import { describe, it, expect, beforeEach, vi } from "vitest";


// 🔹 Mock de osolog
vi.mock("osolog", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      Template: () => ({
        R: () => {},
      }),
    })),
  };
});

const Dealer = require("../dealer");

vi.mock("../sockets", () => ({
  getSocketsByTorneo: vi.fn(),
  getSocket: vi.fn(),
}));


const Socket = require("../sockets");

describe("Dealer Class", () => {
  let dealer;
  let players;
  let deck;

  beforeEach(() => {
       vi.clearAllMocks();
       vi.resetAllMocks();
    deck = ["A♠", "K♠", "Q♠", "J♠", "10♠"];

    players = [
      createMockPlayer("p1", true, false),
      createMockPlayer("p2", true, false),
    ];

    dealer = new Dealer("game1", players, deck, "torneo1", 0, []);
     
  });

  function createMockPlayer(id, connected = true, folded = false) {
    return {
      id,
      name: id,
      gameId: "game1",
      chips: 100,
      connected,
      folded,
      currentBet: 0,
      cards: [],
      getCurrentBet() {
        return this.currentBet;
      },
      getCurrentPrize: vi.fn(() => ({ hand: "pair" })),
      giveChipsToDealer: vi.fn(),
      countCards() {
        return this.cards.length;
      },
      setCard(card) {
        this.cards.push(card);
      },
    };
  }

  // ================================
  // 🟢 BET STATE
  // ================================

  it("should set and get current highest bet", () => {
    dealer.setCurrentHighestBet(200);
    expect(dealer.getCurrentHighestBet()).toBe(200);
  });

  it("should set and get last raiser", () => {
    dealer.setLastRaiser("p1");
    expect(dealer.getLastRaiser()).toBe("p1");
  });

  // ================================
  // 🟢 POT
  // ================================

  it("should add chips to pot", () => {
    dealer.setPot(100);
    dealer.setPot(50);
    expect(dealer.getPot()).toBe(150);
  });

  // ================================
  // 🟢 CHECK LOGIC
  // ================================

  it("should mark player as checked", () => {
    dealer.setChecked("p1");
    expect(dealer.getPlayersChecked()).toContain("p1");
  });

  it("should detect when all players checked with same bet", () => {
    players[0].currentBet = 100;
    players[1].currentBet = 100;

    dealer.setChecked("p1");
    dealer.setChecked("p2");

    expect(dealer.allPlayersCheck()).toBe(true);
  });

  it("should return false if not all players checked", () => {
    players[0].currentBet = 100;
    players[1].currentBet = 100;

    dealer.setChecked("p1");

    expect(dealer.allPlayersCheck()).toBe(false);
  });

  // ================================
  // 🟢 DEAL CARDS
  // ================================

  it("should deal cards to players", () => {
    dealer.dealCardsEachPlayer(1);

    expect(players[0].cards.length).toBe(1);
    expect(players[1].cards.length).toBe(1);
    expect(deck.length).toBe(3);
  });

  it("should deal cards to dealer table", () => {
    dealer.dealCardsDealer(2);

    expect(dealer.getDealerCards().length).toBe(2);
    expect(deck.length).toBe(3);
  });

  // ================================
  // 🟢 FINAL HANDS
  // ================================

  it("should build final hands", () => {
    dealer.setFinalHands();
    const finalHands = dealer.getFinalHands();

    expect(finalHands.length).toBe(2);
    expect(finalHands[0]).toHaveProperty("name", "p1");
    expect(finalHands[0]).toHaveProperty("chips", 100);
  });

  // ================================
  // 🟢 PLAYERS
  // ================================

  it("should return player by number", () => {
    expect(dealer.getPlayerByNumber(1).id).toBe("p1");
  });

  it("should return player by id", () => {
    expect(dealer.getPlayerById("p2").id).toBe("p2");
  });

  it("should detect minimum players", () => {
    expect(dealer.hasMinimumPlayers()).toBe(true);
  });

  it("should detect if all players bet", () => {
    players[0].currentBet = 50;
    players[1].currentBet = 100;

    expect(dealer.hasAllPlayersBet()).toBe(true);
  });

  // ================================
  // 🟢 SOCKET COMMUNICATION
  // ================================
 it("should send message to all sockets", () => {
  const sendMock = vi.fn();

  // Definimos el comportamiento del mock específicamente para este test
  vi.spyOn(Socket, 'getSocketsByTorneo').mockReturnValue([
    { socket: { send: sendMock } },
    { socket: { send: sendMock } },
  ]);

  dealer.talkToAllSockets("hello");

  expect(Socket.getSocketsByTorneo).toHaveBeenCalledWith("torneo1");
  expect(sendMock).toHaveBeenCalledTimes(2);
  expect(sendMock).toHaveBeenCalledWith(JSON.stringify({ message: "hello" }));
});

  // ================================
  // 🟢 jugadores folded / disconnected
  // ================================

  it("should NOT deal cards to folded or disconnected players", () => {
  const deck = ["A♠", "K♠", "Q♠"];

  const players = [
    createMockPlayer("active", true, false),
    createMockPlayer("folded", true, true),
    createMockPlayer("offline", false, false),
  ];

  const dealer = new Dealer("game1", players, deck, "torneo1", 0, []);

  dealer.dealCardsEachPlayer(1);

  expect(players[0].cards.length).toBe(1); // activo recibe carta
  expect(players[1].cards.length).toBe(0); // folded NO recibe
  expect(players[2].cards.length).toBe(0); // disconnected NO recibe
});

it("should ignore folded and disconnected players in allPlayersCheck", () => {
  const players = [
    createMockPlayer("p1", true, false),
    createMockPlayer("p2", true, true),  // folded
    createMockPlayer("p3", false, false) // disconnected
  ];

  players[0].currentBet = 100;

  const dealer = new Dealer("game1", players, [], "torneo1", 0, []);

  dealer.setChecked("p1");

  expect(dealer.allPlayersCheck()).toBe(true);
});

it("should ignore folded and disconnected players in hasAllPlayersBet", () => {
  const players = [
    createMockPlayer("p1", true, false),
    createMockPlayer("p2", true, true),  // folded
    createMockPlayer("p3", false, false) // disconnected
  ];

  players[0].currentBet = 50;

  const dealer = new Dealer("game1", players, [], "torneo1", 0, []);

  expect(dealer.hasAllPlayersBet()).toBe(true);
});

it("should require at least 2 connected players", () => {
  const players = [
    createMockPlayer("p1", true, false),
    createMockPlayer("p2", false, false),
  ];

  const dealer = new Dealer("game1", players, [], "torneo1", 0, []);

  expect(dealer.hasMinimumPlayers()).toBe(false);
});


});