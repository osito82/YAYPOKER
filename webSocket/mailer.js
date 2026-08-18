const nodemailer = require('nodemailer')
const log = require('./logger')

function createTransporter() {
  const host = process.env.MAIL_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.MAIL_PORT || '587', 10)
  const secure = process.env.MAIL_SECURE === 'true'
  const user = process.env.MAIL_USER
  const pass = process.env.MAIL_PASS

  if (!user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

async function sendContactEmail({ nickname, subject, message }) {
  const transporter = createTransporter()
  const mailFrom = process.env.MAIL_FROM || process.env.MAIL_USER || 'info@latinstartup.com'
  const mailTo = 'info@latinstartup.com'

  if (!transporter) {
    log
      .Template({ name: 'brakets', title: 'MAIL:SKIP', date: true })
      .R({ reason: 'SMTP credentials missing in environment' })
    return { success: false, error: 'SMTP credentials missing' }
  }

  const mailOptions = {
    from: `"YayPoker Contact" <${mailFrom}>`,
    to: mailTo,
    replyTo: mailFrom,
    subject: `[YayPoker Contact] ${subject || 'Sin Asunto'} - ${nickname || 'Anónimo'}`,
    text: `Nuevo mensaje de contacto desde YayPoker:\n\nDe: ${nickname || 'Anónimo'}\nAsunto: ${subject || 'N/A'}\n\nMensaje:\n${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #eab308;">Nuevo Mensaje de Contacto - YayPoker</h2>
        <p><strong>De:</strong> ${nickname || 'Anónimo'}</p>
        <p><strong>Asunto:</strong> ${subject || 'N/A'}</p>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    log
      .Template({ name: 'brakets', title: 'MAIL:SENT', date: true })
      .R({ messageId: info.messageId, to: mailTo })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    log
      .Template({ name: 'brakets', title: 'ERROR:MAIL', date: true })
      .R({ error: error.message })
    return { success: false, error: error.message }
  }
}

module.exports = {
  sendContactEmail,
}
