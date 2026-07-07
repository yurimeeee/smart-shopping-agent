import React from 'react';
import { render, screen } from '@testing-library/react';

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
    setWorkspace: jest.fn(),
    isAnalyzing: false,
    setAnalyzing: jest.fn(),
    currentChatId: null,
    setCurrentChatId: jest.fn(),
    isNewChat: false,
    setIsNewChat: jest.fn(),
    resetUserData: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}));

import { SiteHeader } from '@/components/shopping/site-header';

describe('SiteHeader', () => {
  it('renders the PickS logo text', () => {
    render(<SiteHeader />);
    expect(screen.getByText('PickS')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<SiteHeader />);
    expect(screen.getByText('쇼핑 큐레이터')).toBeInTheDocument();
    expect(screen.getByText('상품 검색')).toBeInTheDocument();
    expect(screen.getByText('관심상품')).toBeInTheDocument();
    expect(screen.getByText('소비 리포트')).toBeInTheDocument();
  });

  it('applies active styling to the active nav item', () => {
    render(<SiteHeader active="search" />);
    const searchLink = screen.getByText('상품 검색').closest('a');
    expect(searchLink?.className).toContain('bg-zinc-100');
  });

  it('does not apply active styling to inactive nav items', () => {
    render(<SiteHeader active="search" />);
    const assistantLink = screen.getByText('쇼핑 큐레이터').closest('a');
    expect(assistantLink?.className).not.toContain('bg-zinc-100');
  });

  it('renders user avatar with first letter when no photoURL', () => {
    render(<SiteHeader />);
    // displayName is "Test User" so first letter is "T"
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
