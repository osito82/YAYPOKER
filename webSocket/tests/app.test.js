import { describe, it, expect } from 'vitest'
const { validateAction } = require('../app')

describe('App Validation Logic', () => {
  it('should validate signUp chips', () => {
    const data = { totalChips: '1000' }
    const error = validateAction('signUp', data)
    expect(error).toBeNull()
    expect(data.totalChips).toBe(1000)

    expect(validateAction('signUp', { totalChips: 'invalid' })).toBe(
      'Invalid chips amount',
    )
    expect(validateAction('signUp', { totalChips: -10 })).toBe(
      'Invalid chips amount',
    )
  })

  it('should validate setBet chips', () => {
    const data = { chipsToBet: '500' }
    const error = validateAction('setBet', data)
    expect(error).toBeNull()
    expect(data.chipsToBet).toBe(500)

    expect(validateAction('setBet', { chipsToBet: 'abc' })).toBe(
      'Invalid bet amount',
    )
  })

  it('should validate sendMessage data', () => {
    expect(
      validateAction('sendMessage', {
        targetPlayerId: '1',
        targetMessage: 'hello',
      }),
    ).toBeNull()
    expect(validateAction('sendMessage', { targetPlayerId: '1' })).toBe(
      'Invalid message data',
    )
    expect(validateAction('sendMessage', { targetMessage: 'hello' })).toBe(
      'Invalid message data',
    )
  })

  it('should return error if action is missing', () => {
    expect(validateAction(null, {})).toBe('Action is required')
  })
})
