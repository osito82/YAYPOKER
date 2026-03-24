/**
 * winnerCertificate.js
 * Algoritmo matemático directo para certificación de ganadores.
 */

const fs = require('fs')
const path = require('path')

const CERT_FILE = path.join(__dirname, '..', 'Logs', 'certificates.json')

class WinnerCertificate {
  /**
   * Genera un código de 4 dígitos basado en pura matemática.
   * Es determinista: mismas entradas siempre dan mismo código.
   */

  static generateMagicCode(torneoId, secretCode) {
    const input = `${torneoId}:${secretCode}`

    let hash = 0
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0
    }

    const finalCode = hash % 10000
    return finalCode.toString().padStart(4, '0')
  }

  static registerWinner(torneoId, winner, totalPlayers) {
    const code = this.generateMagicCode(torneoId, winner.secretCode)

    const certificate = {
      torneoId,
      winnerName: winner.name,
      winnerId: winner.id,
      totalPlayers,
      chipsWon: winner.amount,
      date: new Date().toISOString(),
      verified: true,
      winnerSecret: winner.secretCode, // string, con ceros a la izquierda
      code: code, // también string
    }

    this.saveCertificate(certificate)
    return certificate
  }

  static verifyCertificate(torneoId, providedCode) {
    const certificates = this.loadCertificates()
    // Buscamos el último certificado de este torneo (por si hay varios registrados)
    const cert = certificates.reverse().find((c) => c.torneoId === torneoId)

    if (!cert) {
      return {
        valid: false,
        error: 'Este torneo no tiene un certificado de ganador registrado.',
      }
    }

    // Verificamos usando el algoritmo matemático
    const expectedCode = this.generateMagicCode(torneoId, cert.winnerSecret)
    if (providedCode === expectedCode || providedCode === cert.code) {
      return {
        valid: true,
        certificate: {
          winnerName: cert.winnerName,
          torneoId: cert.torneoId,
          date: cert.date,
          totalPlayers: cert.totalPlayers,
          chipsWon: cert.chipsWon,
        },
      }
    }

    return {
      valid: false,
      error: 'El código ingresado no coincide con el certificado oficial.',
    }
  }

  static saveCertificate(cert) {
    try {
      const certs = this.loadCertificates()
      certs.push(cert)

      const dir = path.dirname(CERT_FILE)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      fs.writeFileSync(CERT_FILE, JSON.stringify(certs, null, 2))
    } catch (e) {
      console.error('Error saving certificate:', e)
    }
  }

  static loadCertificates() {
    try {
      if (fs.existsSync(CERT_FILE)) {
        const data = fs.readFileSync(CERT_FILE, 'utf8')
        return JSON.parse(data)
      }
    } catch (e) {
      console.error('Error loading certificates:', e)
    }
    return []
  }

  static getCertificate(torneoId) {
    return this.loadCertificates().find((c) => c.torneoId === torneoId)
  }
}

module.exports = WinnerCertificate
