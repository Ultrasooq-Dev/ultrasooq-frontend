import { useAuth } from "@/context/AuthContext";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";

// Simple rich text editor component
const SimpleRichTextEditor = ({
  value,
  onChange,
  readOnly = false,
  maxLength,
  ...props
}: any) => {
  const currentLength = (value || "").length;
  const isOverLimit = maxLength && currentLength > maxLength;
  
  return (
    <div className="relative">
      <textarea
        value={value || ""}
        onChange={(e) => {
          onChange?.(e.target.value);
        }}
        readOnly={readOnly}
        maxLength={maxLength}
        className={`w-full min-h-[120px] p-3 border rounded-md resize-vertical focus:ring-2 focus:border-transparent ${
          isOverLimit 
            ? 'border-destructive/30 focus:ring-destructive' 
            : 'border-border focus:ring-primary'
        }`}
        placeholder="Enter description..."
        {...props}
      />
      <div className="mt-2 flex justify-between items-center">
        {!readOnly && (
          <div className="text-xs text-muted-foreground">
            You can use basic formatting. For advanced formatting, please use HTML tags.
          </div>
        )}
        {maxLength && (
          <div className={`text-xs ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {currentLength}/{maxLength} characters
          </div>
        )}
      </div>
    </div>
  );
};

interface ControlledRichTextEditorProps {
  label: string;
  name: string;
  value?: any[];
  onChange?: (e: any) => void;
  readOnly?: boolean;
  maxLength?: number;
}

const ControlledRichTextEditor: React.FC<ControlledRichTextEditorProps> = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  maxLength,
}) => {
  const formContext = useFormContext();
  const { langDir } = useAuth();

  return (
    <div className="space-y-2">
      <label
        className="text-color-dark text-sm leading-none font-medium"
        dir={langDir}
      >
        {label}
      </label>
      <Controller
        control={formContext.control}
        name={name}
        defaultValue={name === "descriptionJson" ? [] : ""}
        render={({ field }) => {
          // Convert between string and array formats based on field name
          const isDescriptionJson = name === "descriptionJson";
          
          // Get the current value - convert from array format if needed
          const currentValue = isDescriptionJson 
            ? (Array.isArray(field.value) ? field.value[0]?.children?.[0]?.text || "" : field.value || "")
            : (field.value || "");
          
          return (
            <SimpleRichTextEditor
              onChange={(newValue) => {
                if (onChange) {
                  onChange(newValue);
                } else {
                  // Convert string to array format for descriptionJson
                  if (isDescriptionJson) {
                    const arrayValue = newValue ? [{
                      type: "p",
                      children: [{ text: newValue }]
                    }] : [];
                    field.onChange(arrayValue);
                  } else {
                    field.onChange(newValue);
                  }
                }
              }}
              value={currentValue}
              readOnly={readOnly}
              maxLength={maxLength}
            />
          );
        }}
      />
    </div>
  );
};

export default ControlledRichTextEditor;
