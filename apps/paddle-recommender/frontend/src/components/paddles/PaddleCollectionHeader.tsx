'use client';

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaddleCollectionHeaderProps {
  totalCount: number;
  filteredCount: number;
  brands: string[];
  brandCounts: Record<string, number>;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function PaddleCollectionHeader({
  totalCount,
  filteredCount,
  brands,
  brandCounts,
  selectedBrand,
  onBrandChange,
  searchQuery,
  onSearchChange,
}: PaddleCollectionHeaderProps) {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(inputValue);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [inputValue, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-3xl font-bold">Paddle Collection</h1>

      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-[240px]">
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search paddles..."
            aria-label="Search paddles"
            className="bg-muted text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Brand:</span>
          <Select value={selectedBrand} onValueChange={onBrandChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Brands ({totalCount})
              </SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>
                  {brand} ({brandCounts[brand]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline">
          {filteredCount} {filteredCount === 1 ? 'paddle' : 'paddles'}
        </Badge>
      </div>
    </div>
  );
}
