'use client'

import { Suspense } from 'react';
import { usePaddleCollection } from '@/hooks/usePaddleCollection';
import { PaddleCollectionLoading } from '@/components/paddles/PaddleCollectionLoading';
import { PaddleCollectionHeader } from '@/components/paddles/PaddleCollectionHeader';
import { PaddleCollectionGrid } from '@/components/paddles/PaddleCollectionGrid';

function PaddleListContent() {
  const {
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
  } = usePaddleCollection();

  if (loading) {
    return <PaddleCollectionLoading />;
  }

  if (error) {
    throw new Error(error);
  }

  // Show the list of paddles
  return (
    <div className="container mx-auto px-4 py-8">
      <PaddleCollectionHeader
        totalCount={paddles.length}
        filteredCount={filteredPaddles.length}
        brands={brands}
        brandCounts={brandCounts}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <PaddleCollectionGrid paddles={filteredPaddles} />
    </div>
  );
}

export default function PaddleList() {
  return (
    <Suspense fallback={<PaddleCollectionLoading />}>
      <PaddleListContent />
    </Suspense>
  );
} 
