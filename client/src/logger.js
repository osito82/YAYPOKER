import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import osolog from 'osolog';

// Nota: En navegador, las rutas relativas para logs suelen ser manejadas por el backend o el bundler
// pero seguimos la instrucción de guardarlos en ../Logs/client-fecha.log
const logDir = '../Logs';

const winstonLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => message)
  ),
  transports: [
    new DailyRotateFile({
      filename: `${logDir}/client-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Configurar osolog original
const log = new osolog();

// Guardamos la referencia original de console.log
const originalConsoleLog = console.log;

// Redirigir la salida de osolog de forma robusta interceptando console.log
const originalR = log.R.bind(log);
log.R = function(...args) {
  let output = '';
  
  // Redirigir console.log temporalmente durante la ejecución de R
  console.log = (...msgArgs) => {
    // Unir los argumentos como osolog lo haría
    const message = msgArgs.join(' ');
    output += message;

    // Limpiar ANSI colors para el archivo de winston
    const cleanMsg = message.replace(/\x1b\[[0-9;]*m/g, '');
    winstonLogger.info(cleanMsg);
    
    // Mantener la salida por consola original (para que el usuario vea el formateo de osolog)
    originalConsoleLog(...msgArgs);
  };
  
  // Ejecutar el método original de osolog (el cual llama internamente a console.log)
  originalR(...args);
  
  // Restaurar console.log inmediatamente
  console.log = originalConsoleLog;
  
  return this;
};

// Implementación de Brackets solicitada para el cliente
// Esto permite que el cliente genere logs visualmente similares a los de bot/websocket
const originalTemplate = log.Template.bind(log);
log.Template = function(options) {
  // Aseguramos que el nombre de la plantilla sea brackets si no se especifica
  if (!options.name) options.name = 'brakets';
  return originalTemplate(options);
};

export default log;
