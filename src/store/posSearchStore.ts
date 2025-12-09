import { create } from 'zustand';
import type { ProductVariant } from '../types';

interface POSSearchState {
  searchQuery: string;
  searchResults: ProductVariant[];
  isSearching: boolean;
  allVariants: ProductVariant[];
  
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ProductVariant[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setAllVariants: (variants: ProductVariant[]) => void;
  clearSearch: () => void;
}

export const usePOSSearchStore = create<POSSearchState>((set) => ({
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  allVariants: [],

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSearchResults: (results: ProductVariant[]) => set({ searchResults: results }),
  setIsSearching: (isSearching: boolean) => set({ isSearching }),
  setAllVariants: (variants: ProductVariant[]) => set({ allVariants: variants }),
  clearSearch: () => set({ searchQuery: '', searchResults: [], isSearching: false }),
}));

// Alias for convenience
export const usePOSVariantsStore = usePOSSearchStore;
