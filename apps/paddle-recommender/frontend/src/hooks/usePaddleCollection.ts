import { useMemo, useState } from 'react';
import { CombinedPaddle } from '@/services/fetch';
import { useLoadCombinedPaddles } from '@/hooks/useLoadCombinedPaddles';
import { normalizeCompanyName } from '@/lib/normalizeCompanyName';

interface UsePaddleCollectionResult {
  paddles: CombinedPaddle[];
  loading: boolean;
  error: string | null;
  brands: string[];
  brandCounts: Record<string, number>;
  filteredPaddles: CombinedPaddle[];
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function usePaddleCollection(): UsePaddleCollectionResult {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { paddles, loading, error } = useLoadCombinedPaddles();

  const indexedPaddles = useMemo(() => {
    return paddles.map(paddle => {
      const company = paddle.company || '';
      const name = paddle.paddleName || '';
      return {
        paddle,
        normalizedCompany: normalizeCompanyName(company),
        searchText: `${company} ${name}`.toLowerCase(),
      };
    });
  }, [paddles]);

  const brands = useMemo(() => {
    const brandMap = new Map<string, string[]>();
    indexedPaddles.forEach(({ paddle, normalizedCompany }) => {
      if (!paddle.company) {
        return;
      }
      if (!brandMap.has(normalizedCompany)) {
        brandMap.set(normalizedCompany, []);
      }
      brandMap.get(normalizedCompany)!.push(paddle.company);
    });

    const displayBrands = Array.from(brandMap.values()).map(names => {
      const uniqueNames = Array.from(new Set(names));
      return uniqueNames.sort((a, b) => {
        const aHasAmpersand = a.includes('&') ? 1 : 0;
        const bHasAmpersand = b.includes('&') ? 1 : 0;
        if (aHasAmpersand !== bHasAmpersand) return bHasAmpersand - aHasAmpersand;

        const aHasSpace = a.includes(' ') ? 1 : 0;
        const bHasSpace = b.includes(' ') ? 1 : 0;
        if (aHasSpace !== bHasSpace) return bHasSpace - aHasSpace;

        return b.length - a.length;
      })[0];
    });

    return displayBrands.sort();
  }, [indexedPaddles]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    indexedPaddles.forEach(({ paddle, normalizedCompany }) => {
      if (!paddle.company) {
        return;
      }
      const displayName = brands.find(b => normalizeCompanyName(b) === normalizedCompany) || paddle.company;
      counts[displayName] = (counts[displayName] || 0) + 1;
    });
    return counts;
  }, [indexedPaddles, brands]);

  const filteredPaddles = useMemo(() => {
    const normalizedSelected = normalizeCompanyName(selectedBrand);
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return indexedPaddles
      .filter(({ normalizedCompany, searchText }) => {
        const matchesBrand =
          selectedBrand === 'all' || normalizedCompany === normalizedSelected;

        if (!matchesBrand) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return searchText.includes(normalizedQuery);
      })
      .map(({ paddle }) => paddle);
  }, [indexedPaddles, selectedBrand, searchQuery]);

  return {
    paddles,
    loading,
    error,
    brands,
    brandCounts,
    filteredPaddles,
    selectedBrand,
    setSelectedBrand,
    searchQuery,
    setSearchQuery,
  };
}
