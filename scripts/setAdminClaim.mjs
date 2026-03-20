import admin from "firebase-admin";
import fs from "node:fs";

const uid = process.env.ADMIN_UID || "m5oXnTeC0Gcx5QuoUKyMDRTaTet2";

function loadServiceAccountFromEnv() {
  // Option 1: JSON passed directly as env var.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  // Option 2: Path provided via env var.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8");
    return JSON.parse(raw);
  }

  return null;
}

async function main() {
  const serviceAccount = loadServiceAccountFromEnv();

  admin.initializeApp(
    serviceAccount
      ? { credential: admin.credential.cert(serviceAccount) }
      : { credential: admin.credential.applicationDefault() },
  );

  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`Set custom claim admin=true for uid: ${uid}`);
}

main().catch((err) => {
  console.error("Failed to set admin claim:", err);
  process.exit(1);
});

