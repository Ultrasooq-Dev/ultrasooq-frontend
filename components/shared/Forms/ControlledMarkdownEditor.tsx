"use client";
import { useAuth } from "@/context/AuthContext";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { 
  ssr: false 
});

interface ControlledMarkdownEditorProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: any) => void;
  readOnly?: boolean;
  height?: number;
  maxLength?: number;
}

const ControlledMarkdownEditor: React.FC<ControlledMarkdownEditorProps> = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  height = 400,
  maxLength,
}) => {
  const formContext = useFormContext();
  const { langDir } = useAuth();

  return (
    <div className="space-y-2" data-color-mode="light">
      <label
        className="text-color-dark text-sm leading-none font-medium"
        dir={langDir}
      >
        {label}
      </label>
      <Controller
        control={formContext.control}
        name={name}
        defaultValue={name === "descriptionJson" ? "" : ""}
        render={({ field }) => {
          // Convert between string and array formats based on field name
          const isDescriptionJson = name === "descriptionJson";
          
          // Get the current value - convert from array format if needed
          let currentValue = "";
          if (isDescriptionJson) {
            if (Array.isArray(field.value)) {
              // Extract text from descriptionJson array format
              currentValue = field.value[0]?.children?.[0]?.text || "";
            } else if (typeof field.value === "string") {
              currentValue = field.value;
            } else {
              currentValue = "";
            }
          } else {
            currentValue = field.value || "";
          }
          
          // Check character limit
          const currentLength = currentValue.length;
          const isOverLimit = maxLength && currentLength > maxLength;
          
          return (
            <div className="w-full">
              <MDEditor
                value={currentValue}
                onChange={(val) => {
                  let markdownValue = val || "";
                  
                  // Enforce maxLength if provided
                  if (maxLength && markdownValue.length > maxLength) {
                    markdownValue = markdownValue.substring(0, maxLength);
                  }
                  
                  if (onChange) {
                    onChange(markdownValue);
                  } else {
                    // Convert markdown string to array format for descriptionJson
                    if (isDescriptionJson) {
                      const arrayValue = markdownValue ? [{
                        type: "p",
                        children: [{ text: markdownValue }]
                      }] : [];
                      field.onChange(arrayValue);
                    } else {
                      field.onChange(markdownValue);
                    }
                  }
                }}
                preview="edit"
                hideToolbar={readOnly}
                height={height}
                data-color-mode="light"
              />
              {maxLength && (
                <div className={`mt-2 text-xs text-right ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                  {currentLength}/{maxLength} characters
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default ControlledMarkdownEditor;

