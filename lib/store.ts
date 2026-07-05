import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductItem, ProductComparisonMatrix, ReviewSummary, TasteProfile } from './types';

export interface WorkspaceData {
  title: string;
  products: ProductItem[];
  comparisonMatrix: ProductComparisonMatrix;
  reviewSummary: ReviewSummary;
}

const DEFAULT_TASTE: TasteProfile = {
  tags: [],
  customNote: '',
  platforms: [],
  priceBalance: 50,
};

interface AppStore {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;

  workspace: WorkspaceData | null;
  isAnalyzing: boolean;
  isNewChat: boolean;
  theme: 'light' | 'dark';
  setWorkspace: (data: WorkspaceData | null) => void;
  setAnalyzing: (v: boolean) => void;
  setIsNewChat: (v: boolean) => void;
  toggleTheme: () => void;

  tasteProfile: TasteProfile;
  setTasteProfile: (profile: TasteProfile) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      currentChatId: null,
      setCurrentChatId: (id) => set({ currentChatId: id }),

      workspace: null,
      isAnalyzing: false,
      isNewChat: false,
      theme: 'light',
      setWorkspace: (data) => set({ workspace: data }),
      setAnalyzing: (v) => set({ isAnalyzing: v }),
      setIsNewChat: (v) => set({ isNewChat: v }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      tasteProfile: DEFAULT_TASTE,
      setTasteProfile: (profile) => set({ tasteProfile: profile }),
    }),
    {
      name: 'picks-store',
      partialize: (state) => ({
        currentChatId: state.currentChatId,
        isNewChat: state.isNewChat,
        theme: state.theme,
        tasteProfile: state.tasteProfile,
      }),
    },
  ),
);
