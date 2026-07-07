import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSignInWithEmail = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    logout: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockRouterReplace }),
  usePathname: () => '/login',
  useSearchParams: () => ({ get: () => null }),
}));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    mockSignInWithEmail.mockReset();
    mockSignInWithGoogle.mockReset();
    mockRouterReplace.mockReset();
    // Clear cookies in test environment
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('renders email input', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('renders Google login button', () => {
    render(<LoginPage />);
    expect(screen.getByText('Google로 계속하기')).toBeInTheDocument();
  });

  it('renders 이메일 저장 checkbox label', () => {
    render(<LoginPage />);
    expect(screen.getByText('이메일 저장')).toBeInTheDocument();
  });

  it('calls signInWithEmail with correct arguments on form submit', async () => {
    const user = userEvent.setup();
    mockSignInWithEmail.mockResolvedValue(undefined);
    render(<LoginPage />);

    await user.type(screen.getByLabelText('이메일'), 'test@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error message for invalid credentials', async () => {
    const user = userEvent.setup();
    mockSignInWithEmail.mockRejectedValue({ code: 'auth/invalid-credential' });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('이메일'), 'test@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    });
  });

  it('shows error message for too many requests', async () => {
    const user = userEvent.setup();
    mockSignInWithEmail.mockRejectedValue({ code: 'auth/too-many-requests' });
    render(<LoginPage />);

    await user.type(screen.getByLabelText('이메일'), 'test@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
    });
  });

  it('submit button is disabled when email or password is empty', () => {
    render(<LoginPage />);
    const submitButton = screen.getByRole('button', { name: '로그인' });
    expect(submitButton).toBeDisabled();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockResolvedValue(undefined);
    render(<LoginPage />);

    await user.click(screen.getByText('Google로 계속하기'));
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });
});
