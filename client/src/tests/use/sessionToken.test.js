import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { getSessionToken, saveSessionToken } from '../../use/sessionToken'
import { usePokerStore } from '../../store/pokerStore'

// OPS-001 AC-06: the client keeps the server-issued session token per table
describe('session token', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('stores and reads the token per game code', () => {
    saveSessionToken('ABCDE-12345', 'tok-1')
    saveSessionToken('P_OTHER', 'tok-2')
    expect(getSessionToken('ABCDE-12345')).toBe('tok-1')
    expect(getSessionToken('P_OTHER')).toBe('tok-2')
    expect(getSessionToken('NOPE')).toBeNull()
    expect(getSessionToken(null)).toBeNull()
  })

  it('saves the token from our private signUp, keyed by the real table', () => {
    const store = usePokerStore()
    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'signUp',
          type: 'private',
          torneoId: 'P_REAL',
          sessionToken: '11111111-2222-3333-4444-555555555555',
          data: { id: 'sock-1' },
        },
      }),
    )
    expect(getSessionToken('P_REAL')).toBe('11111111-2222-3333-4444-555555555555')
  })

  it('ignores signUp errors (no token)', () => {
    const store = usePokerStore()
    store.setSocketMessage(
      JSON.stringify({
        message: {
          action: 'signUp',
          type: 'private',
          torneoId: 'T1',
          data: { displayMsg: 'taken', errorType: 'NAME_TAKEN' },
        },
      }),
    )
    expect(getSessionToken('T1')).toBeNull()
    expect(store.getLastError.type).toBe('NAME_TAKEN')
  })
})
