// Mock firebase before importing from firestore
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _isServerTimestamp: true })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: { now: jest.fn() },
}));

import { makeFavoriteDocId } from '@/lib/firestore';
import type { ProductItem } from '@/lib/types';

function makeProduct(overrides: Partial<ProductItem> = {}): ProductItem {
  return {
    id: 'test-id',
    name: '테스트 상품',
    brand: '테스트 브랜드',
    price: 10000,
    image: '',
    link: '',
    mallName: '테스트몰',
    rating: 4.0,
    reviewCount: 100,
    shipping: '무료배송',
    tags: [],
    pros: [],
    cons: [],
    aiScore: 75,
    ...overrides,
  };
}

describe('makeFavoriteDocId', () => {
  it('returns a string', () => {
    const id = makeFavoriteDocId(makeProduct());
    expect(typeof id).toBe('string');
  });

  it('is deterministic — same product gives same id', () => {
    const product = makeProduct({ brand: 'Apple', name: 'AirPods Pro' });
    expect(makeFavoriteDocId(product)).toBe(makeFavoriteDocId(product));
  });

  it('produces the same hash on repeated calls', () => {
    const p = makeProduct({ brand: 'Samsung', name: '갤럭시 S24' });
    const id1 = makeFavoriteDocId(p);
    const id2 = makeFavoriteDocId(p);
    expect(id1).toBe(id2);
  });

  it('produces different ids for different brands', () => {
    const p1 = makeProduct({ brand: 'Apple', name: 'AirPods Pro' });
    const p2 = makeProduct({ brand: 'Samsung', name: 'AirPods Pro' });
    expect(makeFavoriteDocId(p1)).not.toBe(makeFavoriteDocId(p2));
  });

  it('produces different ids for different names', () => {
    const p1 = makeProduct({ brand: 'Apple', name: 'AirPods Pro' });
    const p2 = makeProduct({ brand: 'Apple', name: 'AirPods Max' });
    expect(makeFavoriteDocId(p1)).not.toBe(makeFavoriteDocId(p2));
  });

  it('returns a non-empty string', () => {
    const id = makeFavoriteDocId(makeProduct({ brand: 'B', name: 'N' }));
    expect(id.length).toBeGreaterThan(0);
  });
});
