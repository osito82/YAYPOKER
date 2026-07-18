import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PokerBot } from '../bot.js';

// Mock WebSocket so we don't actually connect during tests
vi.mock('ws', () => {
  return {
    default: class WebSocket {
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
      // Helper to simulate incoming messages
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
    },
  };
});

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
});
