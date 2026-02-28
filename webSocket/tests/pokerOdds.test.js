// pokerOddsCalculator.test.js
import { describe, it, expect, afterEach, vi } from 'vitest';
import PokerOddsCalculator from '../pokerOdds'; // Ajusta según tu export real

describe('PokerOddsCalculator', () => {
  const poker = new PokerOddsCalculator();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const handExamples = {
    'High Card': [['2h','5d','9c','Jd','Ks']],
    'Pair': [['2h','2d','5c','9s','Kd']],
    'Two Pair': [['2h','2d','5c','5s','Kd']],
    'Three of a Kind': [['3h','3d','3c','7s','Kd']],
    'Straight': [['2h','3d','4c','5s','6d']],
    'Flush': [['2h','5h','7h','9h','Kh']],
    'Full House': [['2h','2d','2c','3s','3d']],
    'Four of a Kind': [['4h','4d','4c','4s','Kd']],
    'Straight Flush': [['5h','6h','7h','8h','9h']],
    'Royal Flush': [['Th','Jh','Qh','Kh','Ah']],
  };

  const handValues = {
    'High Card': 0,
    'Pair': 1,
    'Two Pair': 2,
    'Three of a Kind': 3,
    'Straight': 4,
    'Flush': 5,
    'Full House': 6,
    'Four of a Kind': 7,
    'Straight Flush': 8,
    'Royal Flush': 9
  };

  Object.entries(handExamples).forEach(([handName, examples]) => {
    it(`should calculate odds correctly for ${handName}`, () => {
      vi.spyOn(poker, 'evaluateHand').mockImplementation(() => handValues[handName]);

      const playerHands = examples;
      const board = [];
      const result = poker.calculateOdds(playerHands, board, 100);

      expect(result.winProbabilities[0]).toBeGreaterThan(0.9);
      expect(result.tieProbability).toBeLessThan(0.1);
    });
  });
});