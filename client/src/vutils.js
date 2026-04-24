function generateUniqueId() {
  const randomStr = () =>
    Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${randomStr()}-${randomStr()}`
}

function cleanPlayerName(name) {
  if (!name) return ''
  // Strip _Bot or _ia (case insensitive) and any trailing numbers/underscores if they follow
  return name.replace(/(_Bot|_ia)/gi, '').replace(/_+/g, ' ').trim()
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

function generatePublicId() {
  return `P_${generateUniqueId()}`
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

  let wsHost = import.meta.env.VITE_WS_URL || host
  let clientHost = import.meta.env.VITE_CLIENT_URL || host

  // LIMPIEZA: Quitamos el protocolo si viene
  wsHost = wsHost.replace(/^https?:\/\//, '')
  clientHost = clientHost.replace(/^https?:\/\//, '')

  const wsPort = import.meta.env.VITE_WS_PORT || '8888'
  const clientPort = import.meta.env.VITE_CLIENT_PORT || window.location.port

  const buildUrl = (protocol, host, port) => {
    // 1. Si el host ya contiene un puerto (ej: localhost:8080), lo usamos tal cual
    if (host.includes(':')) return `${protocol}://${host}`

    // 2. Si no hay puerto, o es puerto estándar, devolvemos solo el host
    if (!port || port === '80' || port === '443') return `${protocol}://${host}`

    // 3. De lo contrario, concatenamos host:puerto
    return `${protocol}://${host}:${port}`
  }

  const server = buildUrl(wsProtocol, wsHost, wsPort)
  const serverHttp = buildUrl(pageProtocol.replace(':', ''), wsHost, wsPort)

  // Para el cliente, si estamos en DEV y no hay puerto detectado, usamos 5173
  const finalClientPort =
    !clientPort && import.meta.env.DEV ? '5173' : clientPort
  const url = buildUrl(clientProtocol, clientHost, finalClientPort)

  console.log({ server, serverHttp, url }, '--------URLs Generadas')

  return {
    server,
    serverHttp,
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
  generatePublicId,
  generateSecretCode,
  simbolConverter,
  letterToSymbol,
  letterToNumber,
  whatColor,
  urlsFactory,
  copyToClipboard,
  cleanPlayerName
}
