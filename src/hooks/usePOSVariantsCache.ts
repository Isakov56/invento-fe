import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { usePOSVariantsStore } from '../store/posSearchStore';

/**
 * Hook to load and cache all variants for POS search
 * This enables fast client-side fuzzy search without backend load
 */
export function usePOSVariantsCache() {
  const { setAllVariants, allVariants } = usePOSVariantsStore();

  // Fetch all products (which include their variants)
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-pos-cache'],
    queryFn: async () => {
      try {
        // Fetch all products - adjust this based on your API
        // This should ideally have pagination and filters
        const response = await productsService.getAll();
        return response;
      } catch (error) {
        console.error('Error fetching products for POS cache:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

  // Extract and cache all variants when products load
  useEffect(() => {
    if (products && products.length > 0) {
      const allVariants = products.flatMap((product: any) => 
        product.variants || []
      );
      setAllVariants(allVariants);
    }
  }, [products, setAllVariants]);

  return { allVariants, isLoading: !allVariants || allVariants.length === 0 };
}
