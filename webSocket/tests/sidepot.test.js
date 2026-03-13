import { describe, it, expect } from 'vitest'
const Dealer = require('../dealer')
const Player = require('../player')

describe('Dealer Side Pot Calculation', () => {
  it('Basic scenario: One all-in creates main and side pot', () => {
    const players = [
      new Player('g1', 'Alice', '1', 0, [], 'id1', 1),
      new Player('g1', 'Bob', '2', 100, [], 'id2', 2),
      new Player('g1', 'Charlie', '3', 200, [], 'id3', 3),
    ]

    // Simulating contributions
    // Alice is all-in with 100
    players[0].handContribution = 100
    // Bob and Charlie both put 300 total
    players[1].handContribution = 300
    players[2].handContribution = 300

    const dealer = new Dealer('g1', players, [], 't1', 700, [])
    const pots = dealer.calculatePots()

    // Pot 0 (Main): 100 from each = 300. Eligible: Alice, Bob, Charlie
    // Pot 1 (Side): 200 from Bob and 200 from Charlie = 400. Eligible: Bob, Charlie
    expect(pots.length).toBe(2)
    expect(pots[0].amount).toBe(300)
    expect(pots[0].eligiblePlayerIds).toContain('id1')
    expect(pots[0].eligiblePlayerIds).toContain('id2')
    expect(pots[0].eligiblePlayerIds).toContain('id3')

    expect(pots[1].amount).toBe(400)
    expect(pots[1].eligiblePlayerIds).not.toContain('id1')
    expect(pots[1].eligiblePlayerIds).toContain('id2')
    expect(pots[1].eligiblePlayerIds).toContain('id3')
  })

  it('Complex scenario: Multiple all-ins', () => {
    const players = [
      new Player('g1', 'P1', '1', 0, [], 'id1', 1),
      new Player('g1', 'P2', '2', 0, [], 'id2', 2),
      new Player('g1', 'P3', '3', 0, [], 'id3', 3),
      new Player('g1', 'P4', '4', 100, [], 'id4', 4),
    ]

    players[0].handContribution = 50 // All-in short
    players[1].handContribution = 100 // All-in medium
    players[2].handContribution = 200 // Higher bet
    players[3].handContribution = 200 // Calling higher bet

    const dealer = new Dealer('g1', players, [], 't1', 550, [])
    const pots = dealer.calculatePots()

    // Layer 1: up to 50. 4 players * 50 = 200. Eligible: all
    // Layer 2: 50 to 100. 3 players * 50 = 150. Eligible: P2, P3, P4
    // Layer 3: 100 to 200. 2 players * 100 = 200. Eligible: P3, P4

    expect(pots.length).toBe(3)
    expect(pots[0].amount).toBe(200)
    expect(pots[1].amount).toBe(150)
    expect(pots[2].amount).toBe(200)

    expect(pots[0].eligiblePlayerIds).toHaveLength(4)
    expect(pots[1].eligiblePlayerIds).toHaveLength(3)
    expect(pots[1].eligiblePlayerIds).not.toContain('id1')
    expect(pots[2].eligiblePlayerIds).toHaveLength(2)
    expect(pots[2].eligiblePlayerIds).not.toContain('id1')
    expect(pots[2].eligiblePlayerIds).not.toContain('id2')
  })

  it('Scenario with folded players', () => {
    const players = [
      new Player('g1', 'Winner', '1', 0, [], 'id1', 1),
      new Player('g1', 'ShortAllIn', '2', 0, [], 'id2', 2),
      new Player('g1', 'Folder', '3', 0, [], 'id3', 3),
    ]

    players[0].handContribution = 200
    players[1].handContribution = 50
    players[2].handContribution = 200
    players[2].folded = true // Folded but contributed 200

    const dealer = new Dealer('g1', players, [], 't1', 450, [])
    const pots = dealer.calculatePots()

    // Layer 1: up to 50. 3 players contributed. 50 * 3 = 150. Eligible: Winner, ShortAllIn (Folder is NOT eligible)
    // Layer 2: 50 to 200. 2 players contributed. 150 * 2 = 300. Eligible: Winner (Folder is NOT eligible)

    expect(pots.length).toBe(2)
    expect(pots[0].amount).toBe(150)
    expect(pots[0].eligiblePlayerIds).toContain('id1')
    expect(pots[0].eligiblePlayerIds).toContain('id2')
    expect(pots[0].eligiblePlayerIds).not.toContain('id3')

    expect(pots[1].amount).toBe(300)
    expect(pots[1].eligiblePlayerIds).toContain('id1')
    expect(pots[1].eligiblePlayerIds).not.toContain('id2')
    expect(pots[1].eligiblePlayerIds).not.toContain('id3')
  })
})
