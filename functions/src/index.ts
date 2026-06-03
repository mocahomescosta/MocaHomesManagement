import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// ─── Types ───────────────────────────────────────────────────────────────────

interface LodgifyRoomType {
  id: number;
  room_type_id: number;
  name: string;
  people: number;
  image_url: string;
}

interface LodgifyBooking {
  id: number;
  date_arrival: string;
  date_departure: string;
  date_created: string;
  property_id: number;
  property_name: string;
  property_image_url: string;
  status: string; // 'booked' | 'tentative' | 'declined' | 'canceled' | 'open_bill'
  source: string; // 'airbnb' | 'booking' | 'vrbo' | 'direct' | etc.
  currency_code: string;
  room_types: LodgifyRoomType[];
  add_ons: any[];
  guest_name?: string;
  special_requests?: string;
  people?: number;
}

interface LodgifyWebhookPayload {
  action: string; // 'booking_change'
  booking: LodgifyBooking;
}

// ─── Helper: verify Lodgify HMAC signature ────────────────────────────────────

function verifyLodgifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

// ─── Helper: resolve unitId from Lodgify property_id ─────────────────────────

async function resolveUnitId(
  lodgifyPropertyId: number
): Promise<{ unitId: string; unitName: string } | null> {
  const snap = await db
    .collection('units')
    .where('lodgifyPropertyId', '==', String(lodgifyPropertyId))
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { unitId: doc.id, unitName: doc.data().name ?? '' };
}

// ─── Helper: total guests from room_types ─────────────────────────────────────

function extractGuests(booking: LodgifyBooking): number {
  if (booking.people && booking.people > 0) return booking.people;
  if (booking.room_types && booking.room_types.length > 0) {
    return booking.room_types.reduce((sum, rt) => sum + (rt.people ?? 0), 0);
  }
  return 0;
}

// ─── Main webhook handler ─────────────────────────────────────────────────────

export const lodgifyWebhook = functions
  .runWith({ secrets: ['LODGIFY_WEBHOOK_SECRET'] })
  .https.onRequest(async (req, res) => {
    // Only accept POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Verify signature
    const webhookSecret = process.env.LODGIFY_WEBHOOK_SECRET ?? '';
    const signature = req.headers['x-lodgify-signature'] as string ?? '';
    const rawBody = JSON.stringify(req.body);

    if (webhookSecret && signature) {
      if (!verifyLodgifySignature(rawBody, signature, webhookSecret)) {
        functions.logger.warn('Invalid Lodgify webhook signature');
        res.status(401).send('Unauthorized');
        return;
      }
    }

    const payload = req.body as LodgifyWebhookPayload;

    // Only handle booking_change events
    if (payload.action !== 'booking_change') {
      res.status(200).send('OK');
      return;
    }

    const booking = payload.booking;
    if (!booking || !booking.id) {
      res.status(400).send('Invalid payload');
      return;
    }

    functions.logger.info('Lodgify booking event', {
      bookingId: booking.id,
      status: booking.status,
      propertyId: booking.property_id,
    });

    try {
      // Resolve unit
      const unit = await resolveUnitId(booking.property_id);
      const guests = extractGuests(booking);

      const arrivalDate = booking.date_arrival.split('T')[0];   // "2026-06-10"
      const departureDate = booking.date_departure.split('T')[0];

      // Upsert booking in Firestore
      const bookingRef = db.collection('bookings').doc(String(booking.id));
      const bookingData = {
        lodgifyBookingId: String(booking.id),
        lodgifyPropertyId: String(booking.property_id),
        unitId: unit?.unitId ?? '',
        unitName: unit?.unitName ?? booking.property_name,
        arrivalDate,
        departureDate,
        status: booking.status,
        source: booking.source ?? 'direct',
        guests,
        specialRequests: booking.special_requests ?? '',
        guestName: booking.guest_name ?? '',
        currencyCode: booking.currency_code ?? 'EUR',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const bookingSnap = await bookingRef.get();
      if (!bookingSnap.exists) {
        await bookingRef.set({
          ...bookingData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await bookingRef.update(bookingData);
      }

      // Auto-create cleaning on checkout date if booking is confirmed and unit is mapped
      const isConfirmed = ['booked', 'open_bill'].includes(booking.status);
      if (isConfirmed && unit && departureDate) {
        const cleaningId = `cleaning_checkout_${booking.id}`;
        const cleaningRef = db.collection('cleanings').doc(cleaningId);
        const cleaningSnap = await cleaningRef.get();

        if (!cleaningSnap.exists) {
          await cleaningRef.set({
            unitId: unit.unitId,
            unitName: unit.unitName,
            type: 'checkout',
            status: 'pendiente',
            scheduledDate: departureDate,
            scheduledTime: '11:00',
            guestCheckout: '11:00',
            guestCheckin: '15:00',
            assignedToId: '',
            assignedToName: '',
            checklist: DEFAULT_CHECKLIST,
            issues: [],
            notes: `Reserva Lodgify #${booking.id} · ${booking.source ?? 'directo'} · ${guests} huéspedes`,
            lodgifyBookingId: String(booking.id),
            startedAt: null,
            completedAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          functions.logger.info('Cleaning auto-created', { cleaningId, departureDate });
        }
      }

      // If booking is cancelled, mark cleaning as cancelled
      if (['declined', 'canceled'].includes(booking.status)) {
        const cleaningId = `cleaning_checkout_${booking.id}`;
        const cleaningRef = db.collection('cleanings').doc(cleaningId);
        const cleaningSnap = await cleaningRef.get();
        if (cleaningSnap.exists && cleaningSnap.data()?.status === 'pendiente') {
          await cleaningRef.update({
            status: 'cancelada',
            notes: (cleaningSnap.data()?.notes ?? '') + ' [CANCELADA - reserva cancelada]',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.status(200).json({ success: true, bookingId: booking.id });
    } catch (error) {
      functions.logger.error('Error processing Lodgify webhook', error);
      res.status(500).send('Internal Server Error');
    }
  });

// ─── HTTP: sync Lodgify properties → list for mapping ─────────────────────────

export const getLodgifyProperties = functions
  .runWith({ secrets: ['LODGIFY_API_KEY'] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');

    const apiKey = process.env.LODGIFY_API_KEY ?? '';
    const response = await fetch('https://api.lodgify.com/v2/properties', {
      headers: {
        'X-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new functions.https.HttpsError('internal', `Lodgify API error: ${response.status}`);
    }

    const data2 = await response.json() as any;
    return data2;
  });

// ─── Default checklist for auto-created cleanings ─────────────────────────────

// ─── Helper: send FCM notifications to a list of tokens ──────────────────────

async function sendNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!tokens.length) return;

  const validTokens = tokens.filter(t => t.startsWith('ExponentPushToken') || t.startsWith('https://fcm'));

  // Use Expo Push Notifications API for ExponentPushTokens
  const expTokens = validTokens.filter(t => t.startsWith('ExponentPushToken'));
  if (expTokens.length > 0) {
    const messages = expTokens.map(to => ({ to, title, body, data: data ?? {}, sound: 'default' }));
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      });
    } catch (e) {
      functions.logger.warn('Expo push send failed', e);
    }
  }
}

async function getUserTokens(uid: string): Promise<string[]> {
  const snap = await db.collection('users').doc(uid).get();
  return snap.data()?.fcmTokens ?? [];
}

async function getTokensByRole(role: string): Promise<string[]> {
  const snap = await db.collection('users')
    .where('role', 'in', [role, 'Admin', 'Manager'])
    .where('status', '==', 'active')
    .get();
  const tokens: string[] = [];
  snap.docs.forEach(d => {
    const t: string[] = d.data().fcmTokens ?? [];
    tokens.push(...t);
  });
  return [...new Set(tokens)];
}

// ─── Trigger: cleaning assigned → notify the assigned cleaner ─────────────────

export const onCleaningAssigned = functions.firestore
  .document('cleanings/{cleaningId}')
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    // Notify when assignedToId is set or changed
    const assigneeChanged = after.assignedToId && after.assignedToId !== before?.assignedToId;
    if (!assigneeChanged) return;

    const tokens = await getUserTokens(after.assignedToId);
    await sendNotifications(
      tokens,
      '🧹 Nueva limpieza asignada',
      `${after.unitName} · ${after.scheduledDate} a las ${after.scheduledTime}`,
      { type: 'cleaning', cleaningId: context.params.cleaningId }
    );
  });

// ─── Trigger: urgent maintenance created → notify managers ────────────────────

export const onUrgentMaintenance = functions.firestore
  .document('maintenance/{itemId}')
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    // Only fire when priority becomes 'urgente' and status is 'abierta'
    const becameUrgent = after.priority === 'urgente' &&
      (before?.priority !== 'urgente' || !change.before.exists);

    if (!becameUrgent) return;

    const tokens = await getTokensByRole('Manager');
    await sendNotifications(
      tokens,
      '🚨 Mantenimiento urgente',
      `${after.unitName}: ${after.title}`,
      { type: 'maintenance', itemId: context.params.itemId }
    );
  });

// ─── Scheduled: daily briefing at 8:00 AM → notify managers ──────────────────

export const dailyBriefing = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('Europe/Madrid')
  .onRun(async () => {
    const today = new Date().toISOString().split('T')[0];

    // Count today's cleanings
    const cleaningsSnap = await db.collection('cleanings')
      .where('scheduledDate', '==', today)
      .where('status', '!=', 'cancelada')
      .get();

    // Count today's checkouts
    const checkoutsSnap = await db.collection('bookings')
      .where('departureDate', '==', today)
      .where('status', 'in', ['booked', 'open_bill'])
      .get();

    const cleaningCount = cleaningsSnap.size;
    const checkoutCount = checkoutsSnap.size;

    if (cleaningCount === 0 && checkoutCount === 0) return;

    const body = [
      cleaningCount > 0 ? `🧹 ${cleaningCount} limpieza${cleaningCount > 1 ? 's' : ''}` : null,
      checkoutCount > 0 ? `🚪 ${checkoutCount} salida${checkoutCount > 1 ? 's' : ''}` : null,
    ].filter(Boolean).join(' · ');

    const tokens = await getTokensByRole('Manager');
    await sendNotifications(tokens, '📊 Resumen del día', body, { type: 'daily_briefing' });
  });

// ─── Trigger: booking created/confirmed → notify managers ────────────────────

export const onNewBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    if (!['booked', 'open_bill'].includes(booking.status)) return;

    const tokens = await getTokensByRole('Manager');
    await sendNotifications(
      tokens,
      '📅 Nueva reserva',
      `${booking.unitName} · ${booking.arrivalDate} → ${booking.departureDate}`,
      { type: 'booking', bookingId: context.params.bookingId }
    );
  });

// ─── Default checklist for auto-created cleanings ─────────────────────────────

// ─── Telegram helpers ─────────────────────────────────────────────────────────

async function sendTelegram(chatId: string | number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? '';
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (e) {
    functions.logger.warn('Telegram send failed', e);
  }
}

async function sendTelegramGroup(text: string): Promise<void> {
  const groupId = process.env.TELEGRAM_GROUP_CHAT_ID ?? '';
  if (!groupId) return;
  await sendTelegram(groupId, text);
}

async function getUserTelegramId(uid: string): Promise<string | null> {
  if (!uid) return null;
  const snap = await db.collection('users').doc(uid).get();
  return snap.data()?.telegramChatId ?? null;
}

// ─── Webhook: receive Telegram bot commands ───────────────────────────────────

export const telegramWebhook = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN'] })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const update = req.body;
    const message = update?.message;

    if (!message || !message.text) { res.status(200).send('OK'); return; }

    const chatId = message.chat.id;
    const text: string = message.text.trim();
    const firstName = message.from?.first_name ?? '';

    // /start command
    if (text === '/start') {
      await sendTelegram(chatId,
        `👋 Hola ${firstName}!\n\nSoy el bot de <b>Moca Homes</b>.\n\nPara vincular tu cuenta escribe:\n<code>/vincular tu@email.com</code>`
      );
      res.status(200).send('OK');
      return;
    }

    // /vincular email command
    if (text.startsWith('/vincular')) {
      const parts = text.split(' ');
      const email = parts[1]?.toLowerCase().trim();

      if (!email || !email.includes('@')) {
        await sendTelegram(chatId, '❌ Formato incorrecto.\n\nUsa: <code>/vincular tu@email.com</code>');
        res.status(200).send('OK');
        return;
      }

      // Find user by email in Firestore
      const snap = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snap.empty) {
        await sendTelegram(chatId, `❌ No se encontró ninguna cuenta con el email <b>${email}</b>.\n\nContacta con tu manager.`);
        res.status(200).send('OK');
        return;
      }

      const userDoc = snap.docs[0];
      await userDoc.ref.update({
        telegramChatId: String(chatId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await sendTelegram(chatId,
        `✅ ¡Cuenta vinculada correctamente!\n\n👤 <b>${userDoc.data().name}</b>\n📧 ${email}\n\nA partir de ahora recibirás notificaciones aquí.`
      );

      res.status(200).send('OK');
      return;
    }

    // Unknown command
    await sendTelegram(chatId, `No entiendo ese comando.\n\nUsa <code>/vincular tu@email.com</code> para vincular tu cuenta.`);
    res.status(200).send('OK');
  });

// ─── Trigger: cleaning assigned → Telegram to cleaner + group ────────────────

export const onCleaningAssignedTelegram = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_CHAT_ID'] })
  .firestore.document('cleanings/{cleaningId}')
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    const assigneeChanged = after.assignedToId && after.assignedToId !== before?.assignedToId;
    if (!assigneeChanged) return;

    // Private message to the assigned cleaner
    const cleanerTelegramId = await getUserTelegramId(after.assignedToId);
    if (cleanerTelegramId) {
      await sendTelegram(cleanerTelegramId,
        `🧹 <b>Nueva limpieza asignada</b>\n\n🏠 ${after.unitName}\n📅 ${after.scheduledDate} a las ${after.scheduledTime}\n🚪 Salida huésped: ${after.guestCheckout || 'N/A'}\n🏠 Entrada huésped: ${after.guestCheckin || 'N/A'}${after.notes ? `\n📝 ${after.notes}` : ''}`
      );
    }

    // Group notification
    await sendTelegramGroup(
      `🧹 Limpieza asignada a <b>${after.assignedToName}</b>\n🏠 ${after.unitName} · ${after.scheduledDate} ${after.scheduledTime}`
    );
  });

// ─── Trigger: cleaning completed → group notification ────────────────────────

export const onCleaningCompletedTelegram = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_CHAT_ID'] })
  .firestore.document('cleanings/{cleaningId}')
  .onWrite(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    const justCompleted = after.status === 'completada' && before?.status !== 'completada';
    if (!justCompleted) return;

    await sendTelegramGroup(
      `✅ <b>Limpieza completada</b>\n🏠 ${after.unitName}${after.assignedToName ? `\n👤 ${after.assignedToName}` : ''}`
    );
  });

// ─── Trigger: urgent maintenance → group + assigned technician ───────────────

export const onUrgentMaintenanceTelegram = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_CHAT_ID'] })
  .firestore.document('maintenance/{itemId}')
  .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    const becameUrgent = after.priority === 'urgente' && before?.priority !== 'urgente';
    if (!becameUrgent) return;

    // Group alert
    await sendTelegramGroup(
      `🚨 <b>Mantenimiento URGENTE</b>\n🏠 ${after.unitName}\n🔧 ${after.title}${after.description ? `\n📝 ${after.description}` : ''}${after.assignedToName ? `\n👤 Asignado: ${after.assignedToName}` : ''}`
    );

    // Private to assigned technician if exists
    if (after.assignedToId) {
      const techTelegramId = await getUserTelegramId(after.assignedToId);
      if (techTelegramId) {
        await sendTelegram(techTelegramId,
          `🚨 <b>Incidencia urgente asignada</b>\n🏠 ${after.unitName}\n🔧 ${after.title}${after.description ? `\n📝 ${after.description}` : ''}`
        );
      }
    }
  });

// ─── Trigger: new Lodgify booking → group notification ───────────────────────

export const onNewBookingTelegram = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_CHAT_ID'] })
  .firestore.document('bookings/{bookingId}')
  .onCreate(async (snap) => {
    const booking = snap.data();
    if (!['booked', 'open_bill'].includes(booking.status)) return;

    const sourceLabels: Record<string, string> = {
      airbnb: 'Airbnb 🏡', booking: 'Booking.com 🔵', vrbo: 'VRBO 🏠',
      direct: 'Directo 📱',
    };
    const source = sourceLabels[booking.source] ?? booking.source;

    await sendTelegramGroup(
      `📅 <b>Nueva reserva</b>\n🏠 ${booking.unitName}\n${source}\n📆 ${booking.arrivalDate} → ${booking.departureDate}\n👥 ${booking.guests} huéspedes${booking.specialRequests ? `\n⚠️ ${booking.specialRequests}` : ''}`
    );
  });

// ─── Trigger: maintenance assigned → private message to technician ───────────

export const onMaintenanceAssignedTelegram = functions
  .runWith({ secrets: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_CHAT_ID'] })
  .firestore.document('maintenance/{itemId}')
  .onWrite(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    const assigneeChanged = after.assignedToId && after.assignedToId !== before?.assignedToId;
    if (!assigneeChanged) return;

    const techTelegramId = await getUserTelegramId(after.assignedToId);
    if (!techTelegramId) return;

    const priorityLabels: Record<string, string> = {
      urgente: '🔴 Urgente', alta: '🟠 Alta', media: '🟡 Media', baja: '⚪ Baja',
    };

    await sendTelegram(techTelegramId,
      `🔧 <b>Nueva tarea de mantenimiento</b>\n🏠 ${after.unitName}\n📋 ${after.title}\n${priorityLabels[after.priority] ?? after.priority}${after.description ? `\n📝 ${after.description}` : ''}`
    );
  });

const DEFAULT_CHECKLIST = [
  { id: '1', name: 'Cambiar ropa de cama', area: 'Dormitorio', order: 1, completed: false, notes: '' },
  { id: '2', name: 'Limpiar y desinfectar baño', area: 'Baño', order: 2, completed: false, notes: '' },
  { id: '3', name: 'Fregar suelos', area: 'General', order: 3, completed: false, notes: '' },
  { id: '4', name: 'Limpiar cocina y electrodomésticos', area: 'Cocina', order: 4, completed: false, notes: '' },
  { id: '5', name: 'Reponer consumibles (gel, champú, papel)', area: 'Baño', order: 5, completed: false, notes: '' },
  { id: '6', name: 'Sacar basura', area: 'General', order: 6, completed: false, notes: '' },
  { id: '7', name: 'Revisar inventario', area: 'General', order: 7, completed: false, notes: '' },
];
