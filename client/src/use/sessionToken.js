// Session token issued by the server on signUp (OPS-001), kept per table so a
// reload or a reconnect takes the same seat back. Storage can be unavailable
// (private mode, blocked site data): every access is guarded.
const key = (gameCode) => `yay.session.${gameCode}`

export function getSessionToken(gameCode) {
  if (!gameCode) return null
  try {
    return localStorage.getItem(key(gameCode))
  } catch {
    return null
  }
}

export function saveSessionToken(gameCode, token) {
  if (!gameCode || !token) return
  try {
    localStorage.setItem(key(gameCode), token)
  } catch {
    // Without storage the player can still recover the seat with name + PIN
  }
}
