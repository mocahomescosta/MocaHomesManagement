# Guía de Despliegue — Moca Homes

## Requisitos previos

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Expo CLI: `npm install -g eas-cli`
- Cuenta Firebase con plan **Blaze** (pago por uso) activado
- Proyecto Firebase creado en [console.firebase.google.com](https://console.firebase.google.com)

---

## Paso 1 — Configurar Firebase

### 1.1 Activar servicios en Firebase Console

En [console.firebase.google.com](https://console.firebase.google.com), dentro de tu proyecto:

1. **Authentication** → Comenzar → activar **Email/contraseña**
2. **Firestore Database** → Crear base de datos → modo producción → región `europe-west1`
3. **Storage** → Comenzar → región `europe-west1`
4. **Functions** → Se activa automáticamente al desplegar (requiere plan Blaze)

### 1.2 Obtener credenciales de Firebase

En Firebase Console → ⚙️ Configuración del proyecto → Tus apps → Agregar app → Web:

Copia los valores y crea el archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_EAS_PROJECT_ID=tu-eas-project-id
TELEGRAM_BOT_TOKEN=tu-telegram-bot-token
TELEGRAM_GROUP_CHAT_ID=-5261542592
```

### 1.3 Actualizar .firebaserc

Edita `.firebaserc` y sustituye `YOUR_FIREBASE_PROJECT_ID` por tu Project ID real:

```json
{
  "projects": {
    "default": "tu-proyecto-id"
  }
}
```

---

## Paso 2 — Desplegar reglas y Cloud Functions

```bash
# Login en Firebase
firebase login

# Desplegar reglas de Firestore y Storage
firebase deploy --only firestore:rules,storage

# Instalar dependencias de Cloud Functions
npm --prefix functions install

# Configurar secretos en Firebase (variables de entorno para Cloud Functions)
firebase functions:secrets:set LODGIFY_WEBHOOK_SECRET
firebase functions:secrets:set LODGIFY_API_KEY
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_GROUP_CHAT_ID

# Desplegar Cloud Functions
firebase deploy --only functions
```

> ⚠️ El despliegue de Functions tarda 3-5 minutos la primera vez.

---

## Paso 3 — Configurar webhook de Telegram

Después de desplegar las functions, registra el webhook del bot de Telegram.
Sustituye `TU_PROJECT_ID` por tu Firebase Project ID:

```bash
curl -X POST "https://api.telegram.org/botTU_TELEGRAM_TOKEN/setWebhook" \
  -d "url=https://us-central1-TU_PROJECT_ID.cloudfunctions.net/telegramWebhook"
```

Verifica que está activo:
```bash
curl "https://api.telegram.org/botTU_TELEGRAM_TOKEN/getWebhookInfo"
```

---

## Paso 4 — Configurar webhook de Lodgify

En Lodgify → Settings → API & Webhooks → Webhooks → Add webhook:

- **URL:** `https://us-central1-TU_PROJECT_ID.cloudfunctions.net/lodgifyWebhook`
- **Events:** Booking change

---

## Paso 5 — Desplegar la app móvil con Expo EAS

### 5.1 Configurar EAS

```bash
# Login en Expo
eas login

# Configurar el proyecto (primera vez)
eas build:configure
```

Esto crea `eas.json`. Copia el **EAS Project ID** que aparece y añádelo al `.env`:
```
EXPO_PUBLIC_EAS_PROJECT_ID=tu-eas-project-id
```

### 5.2 Instalar dependencias

```bash
npm install
```

### 5.3 Build para Android

```bash
# Build APK para pruebas internas
eas build --platform android --profile preview

# Build para Google Play Store
eas build --platform android --profile production
```

### 5.4 Build para iOS

```bash
# Requiere cuenta de Apple Developer ($99/año)
eas build --platform ios --profile production
```

### 5.5 Probar en el dispositivo durante desarrollo

```bash
npx expo start
```

Escanea el QR con la app **Expo Go** en tu móvil.

---

## Paso 6 — Crear el primer usuario Admin

En Firebase Console → Authentication → Agregar usuario:
- Email y contraseña del manager principal

Luego en Firestore → Colección `users` → Nuevo documento con ID = UID del usuario creado:

```json
{
  "uid": "UID_DEL_USUARIO",
  "name": "Tu Nombre",
  "email": "tu@email.com",
  "phone": "+34600000000",
  "role": "Admin",
  "status": "active",
  "profilePictureURL": "",
  "fcmTokens": [],
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "lastLoginAt": null
}
```

---

## Paso 7 — Mapear apartamentos con Lodgify

1. En la app → tab 📅 Reservas → botón ⚙️
2. Introduce el **Lodgify Property ID** de cada apartamento
3. El ID lo encuentras en Lodgify → Properties → URL del apartamento

---

## Resumen de URLs de Cloud Functions desplegadas

| Función | URL |
|---------|-----|
| Webhook Lodgify | `https://us-central1-PROJECT.cloudfunctions.net/lodgifyWebhook` |
| Webhook Telegram | `https://us-central1-PROJECT.cloudfunctions.net/telegramWebhook` |

---

## Solución de problemas

### "Functions require Blaze plan"
Ve a Firebase Console → ⚙️ Uso y facturación → Modificar plan → Blaze

### Las notificaciones push no llegan
- Asegúrate de que `EXPO_PUBLIC_EAS_PROJECT_ID` está configurado
- El usuario debe haber aceptado los permisos de notificaciones
- Solo funciona en builds nativos (no en Expo Go)

### El bot de Telegram no responde
- Verifica que el webhook está activo con `getWebhookInfo`
- Comprueba los logs: `firebase functions:log --only telegramWebhook`

### Lodgify no envía reservas
- Verifica la URL del webhook en Lodgify Settings
- Comprueba los logs: `firebase functions:log --only lodgifyWebhook`
