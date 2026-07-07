import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock firebase
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

const mockSubscribeFavorites = jest.fn();
const mockRemoveFavorite = jest.fn(() => Promise.resolve());

jest.mock('@/lib/firestore', () => ({
  // Delegate to the hoisted mocks so tests can override behavior
  subscribeFavorites: (...args: unknown[]) => mockSubscribeFavorites(...args),
  removeFavorite: (...args: unknown[]) => mockRemoveFavorite(...args),
}));

const mockRouterReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockRouterReplace }),
  usePathname: () => '/wishlist',
  useSearchParams: () => ({ get: () => null }),
}));

// Use a stable user object so useEffect([user]) doesn't see a new reference each render
jest.mock('@/lib/auth-context', () => {
  const stableUser = {
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
    photoURL: null,
  };
  return {
    useAuth: () => ({
      user: stableUser,
      loading: false,
      logout: jest.fn(),
    }),
  };
});

jest.mock('@/lib/store', () => ({
  useStore: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
}));

import type { FavoriteItem } from '@/lib/firestore';
import WishlistPage from '@/app/wishlist/page';

function makeFavoriteItem(overrides: Partial<FavoriteItem> = {}): FavoriteItem {
  return {
    docId: 'doc-001',
    product: {
      id: 'prod-001',
      name: '삼성 갤럭시 S24',
      brand: 'Samsung',
      price: 1000000,
      image: '',
      link: 'https://example.com',
      mallName: '삼성스토어',
      rating: 4.5,
      reviewCount: 500,
      shipping: '무료배송',
      tags: ['스마트폰'],
      pros: [],
      cons: [],
      aiScore: 90,
    },
    savedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('WishlistPage', () => {
  beforeEach(() => {
    mockSubscribeFavorites.mockReset();
    mockRemoveFavorite.mockReset();
    mockRemoveFavorite.mockResolvedValue(undefined);
  });

  it('renders title "관심 상품"', async () => {
    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: FavoriteItem[]) => void) => {
      cb([]);
      return jest.fn();
    });
    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '관심 상품' })).toBeInTheDocument();
    });
  });

  it('shows empty state when no favorites', async () => {
    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: FavoriteItem[]) => void) => {
      cb([]);
      return jest.fn();
    });
    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText('저장된 관심상품이 없어요')).toBeInTheDocument();
    });
  });

  it('renders product cards for each favorite', async () => {
    const favorites = [
      makeFavoriteItem({ docId: 'doc-001' }),
      makeFavoriteItem({
        docId: 'doc-002',
        product: {
          id: 'prod-002',
          name: '애플 아이패드',
          brand: 'Apple',
          price: 800000,
          image: '',
          link: 'https://example.com/ipad',
          mallName: '애플스토어',
          rating: 4.8,
          reviewCount: 1000,
          shipping: '무료배송',
          tags: ['태블릿'],
          pros: [],
          cons: [],
          aiScore: 95,
        },
      }),
    ];
    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: FavoriteItem[]) => void) => {
      cb(favorites);
      return jest.fn();
    });
    render(<WishlistPage />);
    await waitFor(() => {
      expect(screen.getByText('삼성 갤럭시 S24')).toBeInTheDocument();
      expect(screen.getByText('애플 아이패드')).toBeInTheDocument();
    });
  });

  it('calls removeFavorite with correct args when heart button clicked', async () => {
    const fav = makeFavoriteItem({ docId: 'doc-to-remove' });
    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: FavoriteItem[]) => void) => {
      cb([fav]);
      return jest.fn();
    });
    render(<WishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('삼성 갤럭시 S24')).toBeInTheDocument();
    });

    const heartButton = screen.getByTitle('관심상품 해제');
    fireEvent.click(heartButton);

    await waitFor(() => {
      expect(mockRemoveFavorite).toHaveBeenCalledWith('test-uid', 'doc-to-remove');
    });
  });

  it('filters products by category tab', async () => {
    const tech = makeFavoriteItem({
      docId: 'doc-tech',
      product: {
        id: 'prod-tech',
        name: '갤럭시 S24',
        brand: 'Samsung',
        price: 1200000,
        image: '',
        link: 'https://example.com',
        mallName: '삼성',
        rating: 4.5,
        reviewCount: 100,
        shipping: '',
        tags: ['스마트폰', '디지털'],
        pros: [],
        cons: [],
        aiScore: 80,
      },
    });
    const fashion = makeFavoriteItem({
      docId: 'doc-fashion',
      product: {
        id: 'prod-fashion',
        name: '리바이스 청바지',
        brand: "Levi's",
        price: 89000,
        image: '',
        link: 'https://example.com',
        mallName: '무신사',
        rating: 4.2,
        reviewCount: 50,
        shipping: '',
        tags: ['패션', '청바지'],
        pros: [],
        cons: [],
        aiScore: 70,
      },
    });

    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: FavoriteItem[]) => void) => {
      cb([tech, fashion]);
      return jest.fn();
    });
    render(<WishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('갤럭시 S24')).toBeInTheDocument();
      expect(screen.getByText('리바이스 청바지')).toBeInTheDocument();
    });

    // Click the 패션·잡화 category
    const fashionTab = screen.getByRole('button', { name: /패션·잡화/ });
    fireEvent.click(fashionTab);

    await waitFor(() => {
      expect(screen.getByText('리바이스 청바지')).toBeInTheDocument();
      expect(screen.queryByText('갤럭시 S24')).not.toBeInTheDocument();
    });
  });

  it('sort dropdown shows sort options when opened', async () => {
    mockSubscribeFavorites.mockImplementation((_uid: string, cb: (items: FavoriteItem[]) => void) => {
      cb([makeFavoriteItem()]);
      return jest.fn();
    });
    render(<WishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('삼성 갤럭시 S24')).toBeInTheDocument();
    });

    // Open sort dropdown — the button contains "최신순" text
    const sortButtons = screen.getAllByText('최신순');
    // Click the dropdown button (not the sort option itself)
    fireEvent.click(sortButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '가격 낮은순' })).toBeInTheDocument();
    });
  });
});
