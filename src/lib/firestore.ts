import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import type { WhereFilterOp, Query, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from './firebase';

// ─── Path Helpers ────────────────────────────────────────────────────────────

export const businessPath = (businessId: string) => `businesses/${businessId}`;

export const collectionPath = (businessId: string, col: string) =>
  `businesses/${businessId}/${col}`;

// ─── Generic CRUD ────────────────────────────────────────────────────────────

export async function addDocument(path: string, data: Record<string, unknown>) {
  const colRef = collection(db, path);
  return addDoc(colRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function setDocument(path: string, id: string, data: Record<string, unknown>) {
  const docRef = doc(db, path, id);
  return setDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

export async function updateDocument(path: string, id: string, data: Record<string, unknown>) {
  const docRef = doc(db, path, id);
  return updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteDocument(path: string, id: string) {
  const docRef = doc(db, path, id);
  return deleteDoc(docRef);
}

export async function getDocument(path: string, id: string) {
  const docRef = doc(db, path, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getDocuments(
  path: string,
  constraints: QueryConstraint[] = []
): Promise<DocumentData[]> {
  const colRef = collection(db, path);
  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Query Builders ──────────────────────────────────────────────────────────

export { where, orderBy, limit, Timestamp, onSnapshot, query, collection, doc };

// ─── Timestamp Utils ─────────────────────────────────────────────────────────

export function toDate(ts: Timestamp | null | undefined): Date | null {
  return ts ? ts.toDate() : null;
}

export function nowTimestamp() {
  return Timestamp.now();
}
