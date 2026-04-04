"use client";

/**
 * @component ProductSpecTable
 * @description Displays product specifications in a grouped table format.
 *   Groups by groupName from SpecTemplate.
 *   Shows both template-based and custom free-text specifications.
 * @props specValues - product spec values with template info
 * @props customSpecs - legacy free-text specs (label/specification pairs)
 * @uses shadcn/Table, shadcn/Badge
 */
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SpecValue {
  id: number;
  value?: string | null;
  numericValue?: number | null;
  specTemplate: {
    id: number;
    name: string;
    key: string;
    dataType: string;
    unit?: string | null;
    groupName?: string | null;
    isFilterable?: boolean;
  };
}

interface CustomSpec {
  id: number;
  label?: string | null;
  specification?: string | null;
}

interface ProductSpecTableProps {
  specValues?: SpecValue[];
  customSpecs?: CustomSpec[];
  showFilterBadge?: boolean;
}

export function ProductSpecTable({
  specValues = [],
  customSpecs = [],
  showFilterBadge = false,
}: ProductSpecTableProps) {
  // Group spec values by groupName
  const grouped = React.useMemo(() => {
    const groups: Record<string, SpecValue[]> = {};
    for (const sv of specValues) {
      if (!sv.value && sv.numericValue === null) continue;
      const group = sv.specTemplate.groupName || "General";
      if (!groups[group]) groups[group] = [];
      groups[group].push(sv);
    }
    return groups;
  }, [specValues]);

  const formatValue = (sv: SpecValue): string => {
    if (sv.specTemplate.dataType === "BOOLEAN") {
      return sv.value === "true" ? "Yes" : "No";
    }
    if (sv.specTemplate.dataType === "MULTI_SELECT" && sv.value) {
      try {
        const arr = JSON.parse(sv.value);
        return Array.isArray(arr) ? arr.join(", ") : sv.value;
      } catch {
        return sv.value || "";
      }
    }
    let display = sv.value || "";
    if (sv.specTemplate.unit) {
      display += ` ${sv.specTemplate.unit}`;
    }
    return display;
  };

  const hasSpecs = Object.keys(grouped).length > 0 || customSpecs.length > 0;

  if (!hasSpecs) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Specifications</h3>

      {/* Template-based specs grouped by groupName */}
      {Object.entries(grouped).map(([groupName, specs]) => (
        <div key={groupName}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            {groupName}
          </h4>
          <Table>
            <TableBody>
              {specs.map((sv) => (
                <TableRow key={sv.id}>
                  <TableCell className="font-medium w-1/3 py-2 text-sm">
                    {sv.specTemplate.name}
                    {showFilterBadge && sv.specTemplate.isFilterable && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] px-1 py-0 h-4"
                      >
                        filterable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {formatValue(sv)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {/* Custom free-text specs (legacy) */}
      {customSpecs.length > 0 && (
        <div>
          {Object.keys(grouped).length > 0 && (
            <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Additional Specifications
            </h4>
          )}
          <Table>
            <TableBody>
              {customSpecs
                .filter((cs) => cs.label && cs.specification)
                .map((cs) => (
                  <TableRow key={cs.id}>
                    <TableCell className="font-medium w-1/3 py-2 text-sm">
                      {cs.label}
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {cs.specification}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
