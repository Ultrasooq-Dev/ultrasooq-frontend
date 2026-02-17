"use client";

/**
 * @component SpecificationTemplateForm
 * @description Renders spec template fields grouped by category/groupName.
 *   Each field renders appropriate input based on dataType.
 *   Supports AI auto-fill of spec values.
 * @props templates - spec templates grouped by category
 * @props values - current spec values (specTemplateId -> value)
 * @props onChange - callback when a spec value changes
 * @props onAIFill - callback to trigger AI auto-fill
 * @uses shadcn/Input, shadcn/Select, shadcn/Switch, shadcn/Button, shadcn/Label
 */
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpecTemplate {
  id: number;
  categoryId: number;
  name: string;
  key: string;
  dataType: "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  unit?: string | null;
  options?: string[] | null;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
  groupName?: string | null;
  category?: { id: number; name: string };
}

export interface SpecValueEntry {
  specTemplateId: number;
  value: string;
  numericValue?: number;
}

interface SpecificationTemplateFormProps {
  templates: SpecTemplate[];
  values: Record<number, SpecValueEntry>;
  onChange: (specTemplateId: number, value: string, numericValue?: number) => void;
  onMultiSelectChange?: (specTemplateId: number, selectedValues: string[]) => void;
  onAIFill?: () => void;
  isAIFilling?: boolean;
  disabled?: boolean;
  showCategoryHeaders?: boolean;
}

export function SpecificationTemplateForm({
  templates,
  values,
  onChange,
  onMultiSelectChange,
  onAIFill,
  isAIFilling = false,
  disabled = false,
  showCategoryHeaders = true,
}: SpecificationTemplateFormProps) {
  // Group templates by groupName (then by category if showCategoryHeaders)
  const grouped = React.useMemo(() => {
    const groups: Record<string, SpecTemplate[]> = {};
    for (const t of templates) {
      const key = showCategoryHeaders && t.category
        ? `${t.category.name} — ${t.groupName || "General"}`
        : t.groupName || "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return groups;
  }, [templates, showCategoryHeaders]);

  const getSpecValue = (templateId: number): string => {
    return values[templateId]?.value || "";
  };

  const getMultiSelectValues = (templateId: number): string[] => {
    const val = values[templateId]?.value;
    if (!val) return [];
    try { return JSON.parse(val); } catch { return val ? [val] : []; }
  };

  const renderField = (template: SpecTemplate) => {
    const currentValue = getSpecValue(template.id);

    switch (template.dataType) {
      case "TEXT":
        return (
          <Input
            value={currentValue}
            onChange={(e) => onChange(template.id, e.target.value)}
            placeholder={`Enter ${template.name.toLowerCase()}...`}
            disabled={disabled}
            className="h-9"
          />
        );

      case "NUMBER":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                onChange(template.id, e.target.value, isNaN(num) ? undefined : num);
              }}
              placeholder={`Enter ${template.name.toLowerCase()}...`}
              disabled={disabled}
              className="h-9"
            />
            {template.unit && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {template.unit}
              </span>
            )}
          </div>
        );

      case "SELECT":
        return (
          <Select
            value={currentValue}
            onValueChange={(val) => onChange(template.id, val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={`Select ${template.name.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {(template.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "MULTI_SELECT": {
        const selected = getMultiSelectValues(template.id);
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selected.map((val) => (
                <Badge key={val} variant="secondary" className="text-xs">
                  {val}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => {
                      const newVals = selected.filter((v) => v !== val);
                      if (onMultiSelectChange) {
                        onMultiSelectChange(template.id, newVals);
                      } else {
                        onChange(template.id, JSON.stringify(newVals));
                      }
                    }}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-[120px] overflow-y-auto">
              {(template.options || []).map((opt) => {
                const isChecked = selected.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded hover:bg-accent"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const newVals = checked
                          ? [...selected, opt]
                          : selected.filter((v) => v !== opt);
                        if (onMultiSelectChange) {
                          onMultiSelectChange(template.id, newVals);
                        } else {
                          onChange(template.id, JSON.stringify(newVals));
                        }
                      }}
                      disabled={disabled}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        );
      }

      case "BOOLEAN":
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={currentValue === "true"}
              onCheckedChange={(checked) => onChange(template.id, checked ? "true" : "false")}
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground">
              {currentValue === "true" ? "Yes" : "No"}
            </span>
          </div>
        );

      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => onChange(template.id, e.target.value)}
            disabled={disabled}
            className="h-9"
          />
        );
    }
  };

  if (templates.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header with AI Fill button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Specification Templates
        </h3>
        {onAIFill && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAIFill}
            disabled={disabled || isAIFilling}
            className="gap-1.5"
          >
            <Sparkles className={cn("h-4 w-4", isAIFilling && "animate-pulse")} />
            {isAIFilling ? "Generating..." : "AI Fill Specs"}
          </Button>
        )}
      </div>

      {/* Grouped spec fields */}
      {Object.entries(grouped).map(([groupName, groupTemplates]) => (
        <div key={groupName} className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider border-b pb-1">
            {groupName}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupTemplates.map((template) => (
              <div key={template.id} className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1">
                  {template.name}
                  {template.isRequired && (
                    <span className="text-destructive">*</span>
                  )}
                  {template.isFilterable && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      filter
                    </Badge>
                  )}
                </Label>
                {renderField(template)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
