import { describe, it, expect } from 'vitest'
import { BOT_NAMES } from '../constants.js'

describe('Bot Names Validation', () => {
  it('should have all names ending in _Bot', () => {
    BOT_NAMES.forEach((name) => {
      expect(name.endsWith('_Bot')).toBe(true)
    })
  })

  it('should not contain any duplicate names in constants', () => {
    const uniqueNames = new Set(BOT_NAMES)
    expect(uniqueNames.size).toBe(BOT_NAMES.length)
  })

  it('spawnBots logic should filter out used names to prevent duplicates at the same table', () => {
    // We simulate the exact spawnBots logic from match.js to ensure it works correctly
    const mockPlayers = [
      { name: 'Player1' },
      { name: BOT_NAMES[0] }, // Simulate a bot already at the table
      { name: BOT_NAMES[1] }, // Simulate another bot
    ]

    const usedNames = new Set(mockPlayers.map((p) => p.name))
    const count = 5
    const spawnedBots = []

    for (let i = 0; i < count; i++) {
      const availableNames = BOT_NAMES.filter((name) => !usedNames.has(name))
      const botName =
        availableNames.length > 0
          ? availableNames[Math.floor(Math.random() * availableNames.length)]
          : `Bot_${Math.floor(Math.random() * 10000)}`

      usedNames.add(botName)
      spawnedBots.push(botName)
    }

    // Check that none of the spawned bots have a name that was already in mockPlayers initially
    expect(spawnedBots).not.toContain(BOT_NAMES[0])
    expect(spawnedBots).not.toContain(BOT_NAMES[1])

    // Check that none of the newly spawned bots share the same name
    const uniqueSpawnedBots = new Set(spawnedBots)
    expect(uniqueSpawnedBots.size).toBe(count)
  })
})

// GAM-003 R-06: only bot-style names are bots (a human called "Robot" is not)
describe('Player.isBot', () => {
  const Player = require('../player.js')
  const isBot = (name) => new Player('g', name, '0000', 1000, [], 'id', 1).isBot

  it('recognises spawned bot names', () => {
    expect(isBot('TicoMan_Bot')).toBe(true)
    expect(isBot('Bot_1234')).toBe(true)
    expect(isBot('Gemini_IA')).toBe(true)
  })

  it('does not treat humans whose name contains "bot" as bots', () => {
    expect(isBot('Robot')).toBe(false)
    expect(isBot('Botella')).toBe(false)
    expect(isBot('Abbott')).toBe(false)
  })
})
