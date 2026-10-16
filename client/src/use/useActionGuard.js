import { ref } from 'vue'

// Turn actions that must be sent at most once per turn (a double click used
// to send a second bet that the server rejected as "not your turn").
const TURN_ACTIONS = new Set([
  'fold',
  'check',
  'call',
  'allin',
  'bet',
  'raise',
  'blind',
])

/**
 * One turn action at a time. `tryAcquire(action)` returns false while a
 * previous action is still waiting for the server; call `release()` when the
 * server answers (turn changed, new prompt, rejection). A timeout releases
 * the lock anyway so a lost answer never blocks the player.
 */
export function useActionGuard(timeoutMs = 3000) {
  const pending = ref(false)
  let timer = null

  const release = () => {
    pending.value = false
    clearTimeout(timer)
    timer = null
  }

  const tryAcquire = (action) => {
    if (!TURN_ACTIONS.has(action)) return true
    if (pending.value) return false
    pending.value = true
    timer = setTimeout(release, timeoutMs)
    return true
  }

  return { pending, tryAcquire, release }
}
