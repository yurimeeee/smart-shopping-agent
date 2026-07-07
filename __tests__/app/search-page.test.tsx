import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock firestore before imports
jest.mock('@/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: { now: jest.fn() },
}));

const mockSubscribeFavorites = jest.fn(() => jest.fn());
const mockAddFavorite = jest.fn(() => Promise.resolve());
const mockRemoveFavorite = jest.fn(() => Promise.resolve());
const mockMakeFavoriteDocId = jest.fn((p: { brand: string; name: string }) => `${p.brand}::${p.name}`);

jest.mock('@/lib/firestore', () => ({
  subscribeFavorites: (...args: Parameters<typeof mockSubscribeFavorites>) => mockSubscribeFavorites(...args),
  addFavorite: (...args: Parameters<typeof mockAddFavorite>) => mockAddFavorite(...args),
  removeFavorite: (...args: Parameters<typeof mockRemoveFavorite>) => mockRemoveFavorite(...args),
  makeFavoriteDocId: (p: { brand: string; name: string }) => mockMakeFavoriteDocId(p),
}));

const mockRouterReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockRouterReplace }),
  usePathname: () => '/search',
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      email: 'test@test.com',
      displayName: 'Test User',
      photoURL: null,
    },
    loading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('@/lib/store', () => ({
  useStore: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    tasteProfile: {},
    workspace: null,
  }),
}));

const NAVER_ITEM = {
  id: 'prod-001',
  title: 'Samsung 노트북',
  link: 'https://example.com/product',
  image: '/api/image-proxy?url=https%3A%2F%2Fexample.com%2Fimg.jpg',
  lprice: 1000000,
  hprice: 1200000,
  mallName: '쿠팡',
  brand: 'Samsung',
  category1: '디지털/가전',
  category2: '노트북',
};

// Helper: create a plain-object fetch response (jsdom has no Response constructor)
function makeFetchMock(data: object) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

import SearchPage from '@/app/search/page';

describe('SearchPage', () => {
  beforeEach(() => {
    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: unknown[]) => void) => {
      cb([]);
      return jest.fn();
    });
    global.fetch = makeFetchMock({ total: 1, items: [NAVER_ITEM] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (global as { fetch?: unknown }).fetch = undefined;
  });

  it('renders title "상품 검색"', () => {
    render(<SearchPage />);
    // Use role=heading to disambiguate from the nav link that also says "상품 검색"
    expect(screen.getByRole('heading', { name: '상품 검색' })).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<SearchPage />);
    expect(screen.getByPlaceholderText('상품명, 브랜드, 카테고리 검색...')).toBeInTheDocument();
  });

  it('shows product cards after successful search', async () => {
    render(<SearchPage />);
    const input = screen.getByPlaceholderText('상품명, 브랜드, 카테고리 검색...');
    const submitButton = screen.getByRole('button', { name: '검색' });

    fireEvent.change(input, { target: { value: '노트북' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Samsung 노트북')).toBeInTheDocument();
    });
  });

  it('shows skeleton cards while fetching', async () => {
    global.fetch = jest.fn().mockImplementation(
      () => new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ total: 1, items: [NAVER_ITEM] }),
        }), 100),
      ),
    );

    render(<SearchPage />);
    const input = screen.getByPlaceholderText('상품명, 브랜드, 카테고리 검색...');
    fireEvent.change(input, { target: { value: '노트북' } });
    fireEvent.click(screen.getByRole('button', { name: '검색' }));

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
