import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function touchDevice(params: {
  deviceId: string;
}) {
  if (!db) throw new Error("Firebase not configured");

  const deviceRef = doc(db, "devices", params.deviceId);
  await setDoc(
    deviceRef,
    {
      deviceId: params.deviceId,
      firstSeenAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  );
}

