'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

interface FilterOption {
  id: number;
  name: string;
  count: number;
}

interface SearchFiltersProps {
  brands: FilterOption[];
  categories: FilterOption[];
  priceRange: { min: number; max: number };
  onBrandChange: (ids: number[]) => void;
  onCategoryChange: (ids: number[]) => void;
  onPriceChange: (min: number, max: number) => void;
  locale: string;
}

export function SearchFilters({
  brands,
  categories,
  priceRange,
  onBrandChange,
  onCategoryChange,
  onPriceChange,
  locale,
}: SearchFiltersProps) {
  const isAr = locale === 'ar';
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [price, setPrice] = useState([priceRange.min, priceRange.max]);

  const toggleBrand = (id: number) => {
    const next = selectedBrands.includes(id)
      ? selectedBrands.filter((b) => b !== id)
      : [...selectedBrands, id];
    setSelectedBrands(next);
    onBrandChange(next);
  };

  const toggleCategory = (id: number) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];
    setSelectedCategories(next);
    onCategoryChange(next);
  };

  return (
    <aside className="w-56 shrink-0 space-y-4 border-e pe-4">
      <div>
        <h4 className="text-xs font-semibold mb-2">
          {isAr ? 'الفئات' : 'Categories'}
        </h4>
        {categories.slice(0, 10).map((c) => (
          <label
            key={c.id}
            className="flex items-center gap-2 py-0.5 text-xs cursor-pointer"
          >
            <Checkbox
              checked={selectedCategories.includes(c.id)}
              onCheckedChange={() => toggleCategory(c.id)}
            />
            <span className="flex-1 truncate">{c.name}</span>
            <span className="text-muted-foreground">({c.count})</span>
          </label>
        ))}
      </div>

      <div>
        <h4 className="text-xs font-semibold mb-2">
          {isAr ? 'العلامات' : 'Brands'}
        </h4>
        {brands.slice(0, 10).map((b) => (
          <label
            key={b.id}
            className="flex items-center gap-2 py-0.5 text-xs cursor-pointer"
          >
            <Checkbox
              checked={selectedBrands.includes(b.id)}
              onCheckedChange={() => toggleBrand(b.id)}
            />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="text-muted-foreground">({b.count})</span>
          </label>
        ))}
      </div>

      <div>
        <h4 className="text-xs font-semibold mb-2">
          {isAr ? 'السعر' : 'Price Range'}
        </h4>
        <div className="px-1">
          <Slider
            min={priceRange.min}
            max={priceRange.max}
            step={1}
            value={price}
            onValueChange={(v) => {
              setPrice(v);
              onPriceChange(v[0], v[1]);
            }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>${price[0]}</span>
            <span>${price[1]}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
