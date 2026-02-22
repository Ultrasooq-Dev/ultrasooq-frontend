"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Tag, FolderTree, Loader2 } from "lucide-react";

interface AiCategorizationOverlayProps {
  isVisible: boolean;
  status: "analyzing" | "matching" | "done" | "error";
  message?: string;
}

const STATUS_CONFIG = {
  analyzing: {
    icon: Sparkles,
    label: "Analyzing product name...",
    color: "text-warning",
    bgColor: "bg-warning/5",
  },
  matching: {
    icon: Tag,
    label: "Matching tags & categories...",
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  done: {
    icon: FolderTree,
    label: "Categories found!",
    color: "text-success",
    bgColor: "bg-success/5",
  },
  error: {
    icon: Sparkles,
    label: "Could not auto-detect. Please select manually.",
    color: "text-destructive",
    bgColor: "bg-destructive/5",
  },
};

const AiCategorizationOverlay: React.FC<AiCategorizationOverlayProps> = ({
  isVisible,
  status,
  message,
}) => {
  if (!isVisible) return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isLoading = status === "analyzing" || status === "matching";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className={cn(
          "mx-4 flex max-w-md flex-col items-center gap-4 rounded-2xl border bg-white p-8 shadow-2xl transition-all duration-300",
          config.bgColor === "bg-warning/5" && "border-warning/20",
          config.bgColor === "bg-primary/5" && "border-primary/20",
          config.bgColor === "bg-success/5" && "border-success/20",
          config.bgColor === "bg-destructive/5" && "border-destructive/20"
        )}
      >
        {/* Animated icon area */}
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            config.bgColor
          )}
        >
          {isLoading ? (
            <Loader2
              className={cn("h-8 w-8 animate-spin", config.color)}
            />
          ) : (
            <Icon className={cn("h-8 w-8", config.color)} />
          )}
        </div>

        {/* Status text */}
        <div className="text-center">
          <h3
            className={cn(
              "text-lg font-semibold",
              config.color
            )}
          >
            {message || config.label}
          </h3>
          {isLoading && (
            <p className="mt-1 text-sm text-gray-500">
              This may take a few seconds...
            </p>
          )}
        </div>

        {/* Progress dots */}
        {isLoading && (
          <div className="flex gap-1.5">
            <div className="h-2 w-2 animate-bounce rounded-full bg-warning [animation-delay:0ms]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-warning [animation-delay:150ms]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-warning [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AiCategorizationOverlay;
