const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const osolog = require('osolog')
const path = require('path')
const { PassThrough } = require('stream')

const logDir = path.join(__dirname, '../Logs')

const isTest = process.env.NODE_ENV === 'test'

// Winston para WebSocket
const transportWS = isTest
  ? new winston.transports.Console({ silent: true })
  : new DailyRotateFile({
      filename: path.join(logDir, 'webSocket', 'webSocket-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '14d',
    })

const winstonLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ message }) => message),
  ),
  transports: [transportWS],
})

// Winston para Client (Logs enviados vía WS)
const transportClient = isTest
  ? new winston.transports.Console({ silent: true })
  : new DailyRotateFile({
      filename: path.join(logDir, 'client', 'client-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '14d',
    })

const clientWinstonLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ message }) => message),
  ),
  transports: [transportClient],
})

// Configurar osolog
const log = new osolog()

// Función para guardar logs del cliente (Bracketed)
log.logClient = (message) => {
  clientWinstonLogger.info(message)
}

// Crear un stream personalizado para capturar la salida
const logStream = new PassThrough()

logStream.on('data', (chunk) => {
  const message = chunk.toString().trim()
  if (message) {
    // Limpiar ANSI colors para el archivo de winston
    // eslint-disable-next-line no-control-regex
    const cleanMsg = message.replace(/\x1b\[[0-9;]*m/g, '')
    winstonLogger.info(cleanMsg)
  }
})

// Redirigir la salida de osolog de forma robusta interceptando stdout.write
const originalR = log.R.bind(log)
log.R = function (...args) {
  // Guardar la función original de escritura
  const originalStdoutWrite = process.stdout.write

  // Redirigir stdout temporalmente durante la ejecución de R
  process.stdout.write = (chunk, encoding, callback) => {
    // Enviar al stream para Winston
    logStream.write(chunk)
    // Mantener la salida por consola original
    return originalStdoutWrite.call(process.stdout, chunk, encoding, callback)
  }

  // Ejecutar el método original de osolog
  originalR(...args)

  // Restaurar stdout.write inmediatamente
  process.stdout.write = originalStdoutWrite

  return this
}

module.exports = log
