import { describe, it, expect, beforeEach, vi } from 'vitest'
const Torneo = require('../torneo')

describe('Torneo Class', () => {
  beforeEach(() => {
    Torneo.torneos.clear()
  })

  it('should add and get matches', () => {
    const match = { gameId: 'G1' }
    Torneo.addMatch(match, 'T1')
    expect(Torneo.getMatch('T1')).toBe(match)
  })

  it('should remove inactive matches', () => {
    const now = Date.now()
    const activeMatch = {
      gameId: 'G1',
      lastActivity: now,
      players: [{ name: 'P1' }],
    }
    const inactiveMatch = {
      gameId: 'G2',
      lastActivity: now - 4000000,
      players: [{ name: 'P2' }],
    } // > 1 hour
    const abandonedMatch = {
      gameId: 'G3',
      lastActivity: now - 700000,
      players: [],
    } // > 10 min and no players

    Torneo.addMatch(activeMatch, 'T1')
    Torneo.addMatch(inactiveMatch, 'T1')
    Torneo.addMatch(abandonedMatch, 'T2')

    expect(Torneo.torneos.size).toBe(2)

    const removed = Torneo.removeInactiveMatches(3600000)

    expect(removed).toBe(2)
    expect(Torneo.torneos.size).toBe(1)
    expect(Torneo.getMatch('T1')).toBe(activeMatch)
    expect(Torneo.torneoExists('T2')).toBe(false)
  })
})
