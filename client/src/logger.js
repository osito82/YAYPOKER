/**
 * Frontend Logger Utility
 * Sends client-side logs to the WebSocket server for persistent storage.
 */

let socketInstance = null;

export const initFrontendLogger = (sendMessage) => {
  socketInstance = sendMessage;

  // Interceptar logs originales para enviarlos también al servidor
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    sendToSocket('info', args);
    originalLog.apply(console, args);
  };

  console.warn = (...args) => {
    sendToSocket('warn', args);
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    sendToSocket('error', args);
    originalError.apply(console, args);
  };

  // Capturar errores no manejados
  window.addEventListener('error', (event) => {
    sendToSocket('critical', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      col: event.colno,
      stack: event.error?.stack
    });
  });
};

const sendToSocket = (level, data) => {
  if (socketInstance) {
    try {
      socketInstance({
        action: 'feLog',
        logData: {
          level,
          message: data,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      });
    } catch (e) {
      // Evitar bucle infinito si falla el envío
    }
  }
};
