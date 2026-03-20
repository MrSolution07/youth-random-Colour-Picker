import { TRIBES, type TribeId, QUOTA_PER_TRIBE } from "./tribes";
import { db, serverTimestamp } from "./firebase";
import {
  collection,
  doc,
  updateDoc,
  runTransaction,
  serverTimestamp as fsServerTimestamp,
} from "firebase/firestore";

type AllocationResult = {
  responseId: string;
  tribeId: TribeId;
  roundId: string;
  roundIndex: number;
};

type CurrentRoundMeta = {
  roundId: string | null;
};

type RoundDoc = {
  index: number;
  status: "active" | "closed";
  counts: Record<TribeId, number>;
  createdAt: unknown;
  updatedAt: unknown;
};

function randomInt(maxExclusive: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % maxExclusive;
}

export async function spinAndReserve(params: {
  deviceId: string;
}): Promise<AllocationResult> {
  const firestore = db;
  if (!firestore) throw new Error("Firebase not configured");

  const allocation = await runTransaction(firestore, async (tx) => {
    const metaDocRef = doc(firestore, "meta", "currentRound");
    const metaSnap = await tx.get(metaDocRef);
    const meta = (metaSnap.data() ?? { roundId: null }) as CurrentRoundMeta;

    let roundId: string | null = meta.roundId;
    let round:
      | { rRef: ReturnType<typeof doc>; rData: RoundDoc }
      | undefined;

    if (roundId) {
      const rRef = doc(firestore, "rounds", roundId);
      const rSnap = await tx.get(rRef);
      if (rSnap.exists()) {
        round = { rRef, rData: rSnap.data() as RoundDoc };
      }
    }

    if (!round) {
      // First run: create round #1.
      const firstRef = doc(collection(firestore, "rounds"));
      const emptyCounts = TRIBES.reduce((acc, t) => {
        acc[t.id] = 0;
        return acc;
      }, {} as Record<TribeId, number>);
      tx.set(firstRef, {
        index: 1,
        status: "active",
        counts: emptyCounts,
        createdAt: fsServerTimestamp(),
        updatedAt: fsServerTimestamp(),
      });
      tx.set(metaDocRef, { roundId: firstRef.id });
      roundId = firstRef.id;
      const emptyRoundData: RoundDoc = {
        index: 1,
        status: "active",
        counts: emptyCounts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      round = { rRef: firstRef, rData: emptyRoundData };
    }

    // If the round is full, close and start a new one.
    const counts = { ...round.rData.counts } as Record<TribeId, number>;
    const assignedTotal = TRIBES.reduce(
      (sum, t) => sum + (counts[t.id] ?? 0),
      0,
    );

    if (round.rData.status !== "active" || assignedTotal >= TRIBES.length * QUOTA_PER_TRIBE) {
      // Close current, create next.
      const nextIndex = round.rData.index + 1;
      const newRoundRef = doc(collection(firestore, "rounds"));
      const emptyCounts = TRIBES.reduce((acc, t) => {
        acc[t.id] = 0;
        return acc;
      }, {} as Record<TribeId, number>);
      tx.update(round.rRef, { status: "closed", updatedAt: fsServerTimestamp() });
      tx.set(newRoundRef, {
        index: nextIndex,
        status: "active",
        counts: emptyCounts,
        createdAt: fsServerTimestamp(),
        updatedAt: fsServerTimestamp(),
      });
      tx.set(metaDocRef, { roundId: newRoundRef.id });
      roundId = newRoundRef.id;
      const nextRoundData: RoundDoc = {
        index: nextIndex,
        status: "active",
        counts: emptyCounts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      round = { rRef: newRoundRef, rData: nextRoundData };
    }

    if (!roundId) throw new Error("Round id was not created.");

    const currentCounts = round.rData.counts;
    const remainingTribes = TRIBES.filter((t) => {
      const current = currentCounts[t.id] ?? 0;
      return current < QUOTA_PER_TRIBE;
    });

    if (remainingTribes.length === 0) {
      throw new Error("No remaining quota in active round");
    }

    const chosen = remainingTribes[randomInt(remainingTribes.length)]!;
    const nextCounts: Record<TribeId, number> = { ...currentCounts };
    nextCounts[chosen.id] = (nextCounts[chosen.id] ?? 0) + 1;

    tx.update(round.rRef, {
      counts: nextCounts,
      updatedAt: fsServerTimestamp(),
    });

    const responseRef = doc(collection(firestore, "responses"));
    tx.set(responseRef, {
      deviceId: params.deviceId,
      roundId,
      roundIndex: round.rData.index,
      tribeId: chosen.id,
      colorId: chosen.colorId,
      status: "pending",
      createdAt: fsServerTimestamp(),
    });

    return {
      responseId: responseRef.id,
      tribeId: chosen.id,
      roundId,
      roundIndex: round.rData.index,
    };
  });

  return allocation;
}

export async function confirmResponse(params: {
  responseId: string;
  deviceId: string;
  name: string;
  whatsapp: string;
}) {
  if (!db) throw new Error("Firebase not configured");

  const responseRef = doc(db, "responses", params.responseId);
  await updateDoc(responseRef, {
    deviceId: params.deviceId,
    status: "confirmed",
    name: params.name,
    whatsapp: params.whatsapp,
    confirmedAt: fsServerTimestamp(),
  });
}

