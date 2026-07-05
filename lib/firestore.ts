import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ProductItem } from './types';
import type { WorkspaceData } from './store';

// undefined 값 제거 (Firestore는 undefined 불허)
function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface SavedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function createConversation(userId: string, title: string): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'chats'), {
    title: title.slice(0, 50),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addMessage(
  userId: string,
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  await Promise.all([
    addDoc(collection(db, 'users', userId, 'chats', chatId, 'messages'), {
      role,
      content,
      createdAt: serverTimestamp(),
    }),
    updateDoc(doc(db, 'users', userId, 'chats', chatId), {
      updatedAt: serverTimestamp(),
    }),
  ]);
}

export async function getMessages(userId: string, chatId: string): Promise<SavedMessage[]> {
  const q = query(
    collection(db, 'users', userId, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    role: d.data().role as 'user' | 'assistant',
    content: d.data().content as string,
  }));
}

/* ── 관심상품 ── */

export interface FavoriteItem {
  docId: string;
  product: ProductItem;
  savedAt: Date;
}

function makeFavoriteDocId(product: ProductItem): string {
  const raw = product.brand + '::' + product.name;
  let h = 0;
  for (const c of raw) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h).toString(36);
}

export async function addFavorite(userId: string, product: ProductItem): Promise<void> {
  const docId = makeFavoriteDocId(product);
  await addDoc(collection(db, 'users', userId, 'favorites'), {
    docId,
    product: clean(product),
    savedAt: serverTimestamp(),
  });
}

export async function deleteConversation(userId: string, chatId: string): Promise<void> {
  const msgsSnap = await getDocs(collection(db, 'users', userId, 'chats', chatId, 'messages'));
  await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'users', userId, 'chats', chatId));
}

export async function saveAnalysis(userId: string, chatId: string, analysis: WorkspaceData): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'chats', chatId), {
    analysis: clean(analysis),
    updatedAt: serverTimestamp(),
  });
}

export async function getAnalysis(userId: string, chatId: string): Promise<WorkspaceData | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'chats', chatId));
  return (snap.data()?.analysis as WorkspaceData) ?? null;
}

export async function removeFavorite(userId: string, firestoreDocId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'favorites', firestoreDocId));
}

export function subscribeFavorites(
  userId: string,
  callback: (items: FavoriteItem[]) => void,
): () => void {
  const q = query(
    collection(db, 'users', userId, 'favorites'),
    orderBy('savedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        docId: d.id,
        product: d.data().product as ProductItem,
        savedAt: (d.data().savedAt as Timestamp | null)?.toDate() ?? new Date(),
      })),
    );
  });
}

export async function getFavoriteDocIds(userId: string): Promise<Record<string, string>> {
  const q = query(collection(db, 'users', userId, 'favorites'));
  const snap = await getDocs(q);
  const map: Record<string, string> = {};
  snap.docs.forEach((d) => {
    const product = d.data().product as ProductItem;
    map[makeFavoriteDocId(product)] = d.id;
  });
  return map;
}

export { makeFavoriteDocId };

export function subscribeConversations(
  userId: string,
  callback: (convos: ConversationMeta[]) => void,
): () => void {
  const q = query(
    collection(db, 'users', userId, 'chats'),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const convos = snap.docs.map((d) => ({
      id: d.id,
      title: d.data().title as string,
      updatedAt: (d.data().updatedAt as Timestamp | null)?.toDate() ?? new Date(),
    }));
    callback(convos);
  });
}
