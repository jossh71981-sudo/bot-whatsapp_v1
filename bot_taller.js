import makeWASocket, {
    useMultiFileAuthState
  } from '@whiskeysockets/baileys'
  
  const sesiones = {}
  
  async function startBot() {
  
    const { state, saveCreds } = await useMultiFileAuthState('auth')
  
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true
    })
  
    sock.ev.on('creds.update', saveCreds)
  
    // 📩 MENSAJES
    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0]
      if (!msg?.message || msg.key.fromMe) return
  
      const from = msg.key.remoteJid
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''
  
      const body = text.toLowerCase().trim()
  
      // 🧠 Crear sesión
      if (!sesiones[from]) {
        sesiones[from] = { paso: 'menu' }
  
        await sock.sendMessage(from, {
          text:
  `🏍️ *TALLER DE MOTOS*
  Bienvenido 👋
  
  📋 *SERVICIOS*
  1️⃣ Mantenimiento
  2️⃣ Falla mecánica
  3️⃣ Falla eléctrica
  4️⃣ Cotización
  5️⃣ Estado de reparación
  
  Responde con el número`
        })
        return
      }
  
      // 🔁 FLUJO
      switch (sesiones[from].paso) {
  
        case 'menu':
          if (body === '1') {
            sesiones[from].paso = 'mantenimiento'
            await sock.sendMessage(from, {
              text:
  `🔧 *MANTENIMIENTO*
  Envía:
  • Marca
  • Modelo
  • Año
  • Cilindraje`
            })
          } else if (body === '2') {
            sesiones[from].paso = 'falla_mecanica'
            await sock.sendMessage(from, {
              text: `⚙️ *FALLA MECÁNICA*\nDescribe el problema`
            })
          } else if (body === '3') {
            sesiones[from].paso = 'falla_electrica'
            await sock.sendMessage(from, {
              text: `⚡ *FALLA ELÉCTRICA*\nDescribe el problema`
            })
          } else if (body === '4') {
            sesiones[from].paso = 'cotizacion'
            await sock.sendMessage(from, {
              text: `💰 *COTIZACIÓN*\nMarca, modelo y servicio`
            })
          } else if (body === '5') {
            sesiones[from].paso = 'estado'
            await sock.sendMessage(from, {
              text: `📦 *ESTADO DE REPARACIÓN*\nEnvía folio o placa`
            })
          } else {
            await sock.sendMessage(from, {
              text: '❗ Responde con un número del 1 al 5'
            })
          }
          break
  
        default:
          await sock.sendMessage(from, {
            text:
  `✅ Información recibida.
  Un técnico te responderá en breve 🧑‍🔧`
          })
          delete sesiones[from]
          break
      }
    })
  }
  
  startBot()
  