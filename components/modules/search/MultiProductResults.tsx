'use client';

import { Badge } from '@/components/ui/badge';

interface SubQueryResult {
  query: {
    term: string;
    quantity: number | null;
    intent: string;
  };
  results: any[];
  totalCount: number;
}

interface MultiProductResultsProps {
  results: SubQueryResult[];
  locale: string;
}

export function MultiProductResults({
  results,
  locale,
}: MultiProductResultsProps) {
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6">
      {results.map((group, idx) => (
        <div key={idx} className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">{group.query.term}</h3>
            {group.query.quantity && (
              <Badge variant="secondary" className="text-xs">
                {isAr
                  ? `الكمية: ${group.query.quantity}`
                  : `Qty: ${group.query.quantity}`}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {group.query.intent}
            </Badge>
            <span className="text-xs text-muted-foreground ms-auto">
              {group.totalCount} {isAr ? 'نتيجة' : 'results'}
            </span>
          </div>
          {group.results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.results.slice(0, 8).map((product: any) => (
                <div key={product.id} className="rounded border p-2">
                  <p className="text-xs font-medium line-clamp-2">
                    {product.productName}
                  </p>
                  <p className="text-xs text-primary font-semibold mt-1">
                    $
                    {Number(
                      product.offerPrice || product.productPrice || 0,
                    ).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isAr ? 'لا توجد نتائج' : 'No results found'}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
