const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const osolog = require("osolog");
const path = require("path");
const { PassThrough } = require("stream");

const logDir = path.join(__dirname, "../Logs");

// Configurar Winston para el bot
const transport = new DailyRotateFile({
  filename: path.join(logDir, "bot-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const winstonLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => message),
  ),
  transports: [transport],
});

// Configurar osolog
const log = new osolog();

// Crear un stream personalizado para capturar la salida
const logStream = new PassThrough();
logStream.on("data", (chunk) => {
  const message = chunk.toString().trim();
  if (message) {
    // Limpiar ANSI colors para el archivo de winston
    const cleanMsg = message.replace(/\x1b\[[0-9;]*m/g, "");
    winstonLogger.info(cleanMsg);
  }
});

// Redirigir la salida de osolog interceptando stdout.write
const originalR = log.R.bind(log);
log.R = function (...args) {
  // Guardar la función original de escritura
  const originalStdoutWrite = process.stdout.write;

  // Redirigir stdout temporalmente
  process.stdout.write = (chunk, encoding, callback) => {
    // Enviar al stream para Winston
    logStream.write(chunk);
    // Mantener la salida por consola
    return originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
  };

  // Ejecutar osolog
  originalR(...args);

  // Restaurar stdout.write
  process.stdout.write = originalStdoutWrite;

  return this;
};

module.exports = log;
