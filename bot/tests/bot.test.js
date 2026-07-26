import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PokerBot } from '../bot.js';

// Mock WebSocket so we don't actually connect during tests
const MockWebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.events = {};
  }
  on(event, cb) {
    this.events[event] = cb;
  }
  send(data) {
    // Mock send
  }
  simulateMessage(data) {
    if (this.events['message']) {
      this.events['message'](data);
    }
  }
  simulateOpen() {
    if (this.events['open']) {
      this.events['open']();
    }
  }
};
MockWebSocket.default = MockWebSocket;
MockWebSocket.WebSocket = MockWebSocket;

vi.mock('ws', () => MockWebSocket);

describe('PokerBot', () => {
  let bot;

  beforeEach(() => {
    // Reset env vars
    process.env.NODE_ENV = 'test';
    process.env.DEFAULT_AI_PROVIDER = 'ollama';
  });

  it('initializes correctly with given config', () => {
    bot = new PokerBot({
      gameCode: 'TEST_GAME',
      playerName: 'TestBot',
      provider: 'ollama',
      server: 'localhost',
      port: '8888',
    });

    expect(bot.gameCode).toBe('TEST_GAME');
    expect(bot.playerName).toBe('TestBot');
    expect(bot.provider).toBe('ollama');
    expect(bot.myOdds).toEqual({ win: 0, tie: 0 });
    expect(bot.serverUrl).toContain('gameCode=TEST_GAME');
    expect(bot.serverUrl).toContain('playerName=TestBot');
  });

  it('normalizes openllama provider to ollama', () => {
    bot = new PokerBot({
      gameCode: 'TEST',
      playerName: 'Bot',
      provider: 'openllama',
    });
    expect(bot.provider).toBe('ollama');
  });

  it('safeParseJSON works correctly', () => {
    bot = new PokerBot({ gameCode: 'T', playerName: 'B' });

    // Valid JSON
    expect(bot.safeParseJSON('{"action": "raise", "amount": 100}')).toEqual({ action: 'raise', amount: 100 });

    // JSON inside text (markdown backticks or plain text)
    expect(bot.safeParseJSON('Here is my action:\n```json\n{"action": "fold"}\n```')).toEqual({ action: 'fold' });
    expect(bot.safeParseJSON('I will bet: {"action": "call"}')).toEqual({ action: 'call' });

    // Invalid JSON
    expect(bot.safeParseJSON('I am raising 100!')).toBe(null);
  });

  it('updates chip stack and blinds from messages correctly', () => {
    bot = new PokerBot({ gameCode: 'T', playerName: 'TestBot' });
    
    const simMsg = (data) => {
      if (bot.socket.simulateMessage) bot.socket.simulateMessage(data);
      else if (bot.socket.emit) bot.socket.emit('message', data);
    };

    // Simulate player info message
    simMsg(JSON.stringify({
      players: [
        { id: '123', name: 'TestBot', chips: 750, currentBet: 50 },
        { id: '456', name: 'OtherPlayer', chips: 1500, currentBet: 50 }
      ]
    }));

    expect(bot.myChips).toBe(750);
    expect(bot.myCurrentBet).toBe(50);

    // Simulate askForBlindBets with BB
    simMsg(JSON.stringify({
      action: 'askForBlindBets',
      type: 'private',
      data: { id: '123', blindType: 'BB', blindAmount: 50 }
    }));
    expect(bot.bigBlind).toBe(50);
  });

  it('handleDecision fallback folds on massive bets when equity is low and stack is short', async () => {
    vi.useFakeTimers();
    bot = new PokerBot({ gameCode: 'T', playerName: 'TestBot' });
    bot.myChips = 200;
    bot.myOdds = { win: 30, tie: 0 }; // 30% equity
    
    // Mock sendAction to observe result
    const sendSpy = vi.spyOn(bot, 'sendAction');
    
    // Mock provider to force timeout or fail so fallback is triggered
    bot.provider = 'invalid_provider_to_force_fallback';

    await bot.handleDecision({
      currentHighestBet: 150,
      pot: 300,
      data: { action: ['fold', 'call'] }
    });

    vi.advanceTimersByTime(1000);

    // Since callAmount (150) >= myChips * 0.5 (100) and equity (0.30) < 0.45, fallback must be fold
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'fold' }));
    vi.useRealTimers();
  });

  it('handleDecision executes algorithmic check when callAmount is 0 and equity is not huge', async () => {
    vi.useFakeTimers();
    bot = new PokerBot({ gameCode: 'T', playerName: 'TestBot' });
    bot.myOdds = { win: 40, tie: 0 }; // 40% equity
    const sendSpy = vi.spyOn(bot, 'sendAction');
    bot.provider = 'invalid_provider';

    await bot.handleDecision({
      currentHighestBet: 0,
      pot: 100,
      data: { action: ['check', 'bet'] }
    });
    vi.advanceTimersByTime(1000);

    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'setCheck' }));
    vi.useRealTimers();
  });

  it('handleDecision executes algorithmic fold on preflop trash hand facing raise', async () => {
    vi.useFakeTimers();
    bot = new PokerBot({ gameCode: 'T', playerName: 'TestBot' });
    bot.myOdds = { win: 25, tie: 0 }; // 25% equity (trash)
    const sendSpy = vi.spyOn(bot, 'sendAction');
    bot.provider = 'invalid_provider';

    await bot.handleDecision({
      currentHighestBet: 50,
      pot: 100,
      dealerCards: [], // Preflop
      data: { action: ['fold', 'call'] }
    });
    vi.advanceTimersByTime(1000);

    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'fold' }));
    vi.useRealTimers();
  });
});


