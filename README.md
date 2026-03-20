# Youth Wheel (Firebase + React Vite)

## What it does
- Users press **SPIN** to get assigned to one tribe/color.
- The first **20** assignments are quota-balanced: **5 per tribe** (4 tribes total).
- After the spin, the user enters **name** + **WhatsApp** (stored in Firestore).
- Admin can log in, view quota/device stats, and export confirmed entries to **Excel** (`.xlsx`).

## Setup
1. Create a Firebase project and enable **Firestore**.
2. In `Firestore`, apply the rules from `firestore.rules`.
3. Register a Firebase Web App, then copy credentials to `.env.local` (see `.env.example`).
4. Admin access requires a Firebase Auth custom claim:
   - `admin=true`

## Environment variables
Create `.env.local` from `.env.example` with:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Run locally
1. Install deps with `bun install`
2. Start: `bun run dev`

## Admin custom claim (quick example)
You can set the claim using a script with `firebase-admin` (or a Cloud Function). Example (conceptual):
```ts
// After you initialize firebase-admin with service account credentials:
await admin.auth().setCustomUserClaims("<ADMIN_UID>", { admin: true });
```

Then sign in with that admin user to `/admin/login`.

# youth-random-Colour-Picker
