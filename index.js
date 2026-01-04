import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason
} from '@whiskeysockets/baileys';

import Pino from 'pino';
import qrcode from 'qrcode-terminal';

async function iniciarBot() {

    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        logger: Pino({ level: 'silent' }),
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // 👉 MOSTRAR QR
        if (qr) {
            console.log('📱 Escanea este QR con WhatsApp');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log('🔄 Reconectando...');
                iniciarBot();
            }
        }

        if (connection === 'open') {
            console.log('✅ Bot WhatsApp conectado correctamente');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            '';

        const body = text.toLowerCase();

        console.log(`📩 ${from}: ${body}`);

        if (body === 'hola') {
            await sock.sendMessage(from, { text: '👋 Hola, bot activo' });
        }

        if (body === 'menu') {
            await sock.sendMessage(from, {
                text:
`📋 MENÚ
1️⃣ Diagnóstico
2️⃣ Electrónica
3️⃣ Software`
            });
        }

        if (body.includes('versa')) {
            await sock.sendMessage(from, {
                text: '🚗 Versa detectado ¿año y código de falla?'
            });
        }
    });
}

iniciarBot();
