function generateUniqueId() {
  const randomStr = () =>
    Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${randomStr()}-${randomStr()}`
}

const simbolConverter = (simbol) => {
  const number = {}

  const letter = simbol.charAt(0)
  const symbol = simbol.charAt(simbol.length - 1)

  const letterMod = letterToNumber(letter)
  const symbolMod = letterToSymbol(symbol)

  number.letter = letterMod
  number.symbol = symbolMod

  return number
}

const whatColor = (symbol) => {
  const symbolC = symbol.charAt(symbol.length - 1)
  switch (symbolC) {
    case 's':
    case 'c':
      return 'black'
    case 'h':
    case 'd':
      return 'red'
  }
}

const letterToSymbol = (letter) => {
  switch (letter) {
    case 's':
      return '♠'
    case 'h':
      return '♥'
    case 'c':
      return '♣'
    case 'd':
      return '♦'
  }
}

const letterToNumber = (letter) => {
  switch (letter) {
    case 'T':
      return '10'
    default:
      return letter.toString()
  }
}

function generateSecretCode() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

function urlsFactory() {
  const host = window.location.hostname
  const pageProtocol = window.location.protocol

  // Detect correct websocket protocol
  const wsProtocol =
    import.meta.env.VITE_WS_PROTOCOL ||
    (pageProtocol === 'https:' ? 'wss' : 'ws')

  const clientProtocol =
    import.meta.env.VITE_CLIENT_PROTOCOL || pageProtocol.replace(':', '')

  const wsHost = import.meta.env.VITE_WS_URL || host
  const clientHost = import.meta.env.VITE_CLIENT_URL || host

  const wsPort = import.meta.env.VITE_WS_PORT || '8888'
  const clientPort =
    import.meta.env.VITE_CLIENT_PORT || window.location.port || '5173'

  const server = `${wsProtocol}://${wsHost}:${wsPort}`
  const url = `${clientProtocol}://${clientHost}:${clientPort}`

  return {
    server,
    url,
  }
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      return successful
    }
  } catch (err) {
    console.error('Copy to clipboard failed:', err)
    return false
  }
}

export {
  generateUniqueId,
  generateSecretCode,
  simbolConverter,
  letterToSymbol,
  letterToNumber,
  whatColor,
  urlsFactory,
  copyToClipboard,
}
