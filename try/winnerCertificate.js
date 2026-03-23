/**
 * winnerCertificate.js
 * Sistema de certificados para ganadores de torneos de poker.
 * 
 * Genera un código único de 4 dígitos por torneo que el ganador puede
 * usar para verificar su victoria en la página de certificación.
 * 
 * Integrar en: webSocket/winnerCertificate.js
 */

class WinnerCertificate {
  // Map: torneoId -> { winnerId, winnerName, code, timestamp, totalPlayers }
  static certificates = new Map()

  /**
   * Genera un código de 4 dígitos único para un torneo.
   * El código está derivado del torneoId + timestamp para que sea reproducible
   * pero difícil de adivinar sin conocer el torneoId.
   * 
   * @param {string} torneoId - ID del torneo
   * @returns {string} Código de 4 dígitos (e.g. "7342")
   */
  static generateCode(torneoId) {
    // Usa el torneoId como semilla para generar el código
    // Mezcla caracteres del ID con timestamp para unicidad
    const seed = torneoId + Date.now().toString()
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convierte a 32-bit int
    }
    // Toma los últimos 4 dígitos del hash absoluto
    const code = String(Math.abs(hash) % 10000).padStart(4, '0')
    return code
  }

  /**
   * Registra al ganador de un torneo y genera su certificado.
   * Llamar desde winnerTournament() en actions.js
   * 
   * @param {string} torneoId - ID del torneo
   * @param {object} winner - { playerId, name, amount }
   * @param {number} totalPlayers - Número total de jugadores del torneo
   * @returns {object} Certificado generado
   */
  static registerWinner(torneoId, winner, totalPlayers = 0) {
    // Si ya existe certificado para este torneo, no sobreescribir
    if (this.certificates.has(torneoId)) {
      return this.certificates.get(torneoId)
    }

    const code = this.generateCode(torneoId)
    const certificate = {
      torneoId,
      winnerId: winner.playerId || winner.id,
      winnerName: winner.name,
      chipsWon: winner.amount || 0,
      handName: winner.handName || 'Tournament Champion',
      code,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      totalPlayers,
      verified: true,
    }

    this.certificates.set(torneoId, certificate)
    return certificate
  }

  /**
   * Verifica si un código corresponde al ganador de un torneo.
   * Llamar desde el endpoint de verificación.
   * 
   * @param {string} torneoId - ID del torneo
   * @param {string} code - Código de 4 dígitos a verificar
   * @returns {{ valid: boolean, certificate?: object, error?: string }}
   */
  static verifyCertificate(torneoId, code) {
    const cert = this.certificates.get(torneoId)

    if (!cert) {
      return { valid: false, error: 'Torneo no encontrado o no ha terminado.' }
    }

    if (cert.code !== String(code).padStart(4, '0')) {
      return { valid: false, error: 'Código incorrecto.' }
    }

    return { valid: true, certificate: cert }
  }

  /**
   * Obtiene el certificado de un torneo sin verificar código.
   * Solo para uso interno del servidor.
   */
  static getCertificate(torneoId) {
    return this.certificates.get(torneoId) || null
  }

  /**
   * Lista todos los certificados (para admin/debug).
   */
  static getAllCertificates() {
    return Array.from(this.certificates.values())
  }
}

module.exports = WinnerCertificate


/* ============================================================
 * INSTRUCCIONES DE INTEGRACIÓN
 * ============================================================
 *
 * 1. Copiar este archivo a: webSocket/winnerCertificate.js
 *
 * 2. En webSocket/match/actions.js, importar:
 *    const WinnerCertificate = require('../winnerCertificate')
 *
 * 3. En la función winnerTournament(), agregar después del log:
 *
 *    const totalPlayers = this.match.players.length
 *    const certificate = WinnerCertificate.registerWinner(
 *      this.match.torneoId,
 *      winner,
 *      totalPlayers
 *    )
 *
 *    // Incluir el certificado en el mensaje al ganador
 *    this.communicator.msgBuilder('winnerTournament', 'public', null, {
 *      method: 'winnerTournament',
 *      displayMsg: `🏆 ${winner.name} wins the tournament!`,
 *      winner,
 *      isTournamentWinner: true,
 *      certificate: {          // <-- AGREGAR ESTO
 *        code: certificate.code,
 *        torneoId: certificate.torneoId,
 *        date: certificate.date,
 *      },
 *    })
 *
 * 4. En webSocket/app.js, agregar endpoint de verificación:
 *
 *    app.get('/verify/:torneoId/:code', (req, res) => {
 *      const { torneoId, code } = req.params
 *      const result = WinnerCertificate.verifyCertificate(torneoId, code)
 *      res.json(result)
 *    })
 *
 *    // También un endpoint para que la UI del ganador consulte su cert:
 *    app.get('/certificate/:torneoId', (req, res) => {
 *      const cert = WinnerCertificate.getCertificate(req.params.torneoId)
 *      if (!cert) return res.status(404).json({ error: 'Not found' })
 *      // Solo devolver info pública (sin el código completo)
 *      res.json({
 *        torneoId: cert.torneoId,
 *        winnerName: cert.winnerName,
 *        date: cert.date,
 *        totalPlayers: cert.totalPlayers,
 *        verified: cert.verified,
 *      })
 *    })
 *
 * ============================================================ */
