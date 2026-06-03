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

const DEFAULT_CHECKLIST = [
  { id: '1', name: 'Cambiar ropa de cama', area: 'Dormitorio', order: 1, completed: false, notes: '' },
  { id: '2', name: 'Limpiar y desinfectar baño', area: 'Baño', order: 2, completed: false, notes: '' },
  { id: '3', name: 'Fregar suelos', area: 'General', order: 3, completed: false, notes: '' },
  { id: '4', name: 'Limpiar cocina y electrodomésticos', area: 'Cocina', order: 4, completed: false, notes: '' },
  { id: '5', name: 'Reponer consumibles (gel, champú, papel)', area: 'Baño', order: 5, completed: false, notes: '' },
  { id: '6', name: 'Sacar basura', area: 'General', order: 6, completed: false, notes: '' },
  { id: '7', name: 'Revisar inventario', area: 'General', order: 7, completed: false, notes: '' },
];
