/**
 * 개발용 1회성 유저 데이터 복제
 * 사용 후 이 파일 삭제할 것
 *
 * GET /api/dev-clone-user?src=SOURCE_UID&dst=TARGET_UID
 */

import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get('src');
  const dst = searchParams.get('dst');

  if (!src || !dst) {
    return Response.json({ error: 'src, dst 파라미터가 필요합니다' }, { status: 400 });
  }

  try {
    const log: string[] = [];

    // 1. profile/taste
    const tasteSnap = await getDoc(doc(db, 'users', src, 'profile', 'taste'));
    if (tasteSnap.exists()) {
      await setDoc(doc(db, 'users', dst, 'profile', 'taste'), tasteSnap.data());
      log.push('✓ profile/taste');
    }

    // 2. favorites
    const favSnap = await getDocs(collection(db, 'users', src, 'favorites'));
    for (const d of favSnap.docs) {
      await setDoc(doc(db, 'users', dst, 'favorites', d.id), d.data());
    }
    log.push(`✓ favorites (${favSnap.size}개)`);

    // 3. chats + 각 chat의 messages
    const chatsSnap = await getDocs(collection(db, 'users', src, 'chats'));
    for (const chatDoc of chatsSnap.docs) {
      await setDoc(doc(db, 'users', dst, 'chats', chatDoc.id), chatDoc.data());

      const msgsSnap = await getDocs(
        collection(db, 'users', src, 'chats', chatDoc.id, 'messages'),
      );
      for (const msgDoc of msgsSnap.docs) {
        await setDoc(
          doc(db, 'users', dst, 'chats', chatDoc.id, 'messages', msgDoc.id),
          msgDoc.data(),
        );
      }
      log.push(`✓ chat ${chatDoc.id} (메시지 ${msgsSnap.size}개)`);
    }

    return Response.json({ ok: true, src, dst, log });
  } catch (err) {
    console.error('[dev-clone-user]', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
