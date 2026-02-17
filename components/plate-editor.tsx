"use client";

import { cn } from "@udecode/cn";
import { CommentsProvider } from "@udecode/plate-comments";
import { Plate, Value } from "@udecode/plate-common";
import { useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { CommentsPopover } from "@/components/plate-ui/comments-popover";
import { CursorOverlay } from "@/components/plate-ui/cursor-overlay";
import { Editor } from "@/components/plate-ui/editor";
import { FixedToolbar } from "@/components/plate-ui/fixed-toolbar";
import { FixedToolbarButtons } from "@/components/plate-ui/fixed-toolbar-buttons";
import { FloatingToolbar } from "@/components/plate-ui/floating-toolbar";
import { FloatingToolbarButtons } from "@/components/plate-ui/floating-toolbar-buttons";
import { MentionCombobox } from "@/components/plate-ui/mention-combobox";
import { TooltipProvider } from "@/components/plate-ui/tooltip";
import { commentsUsers, myUserId } from "@/lib/plate/comments";
import { MENTIONABLES } from "@/lib/plate/mentionables";
import { plugins } from "@/lib/plate/plate-plugins-minimal";

type PlateEditorProps = {
  onChange?: (
    value: { id: string; type: string; children: { text: string }[] }[] | Value,
  ) => void;
  value?: Value | undefined;
  readOnly?: boolean;
  fixedToolbar?: boolean;
};

export default function PlateEditor({
  onChange,
  value,
  readOnly,
  fixedToolbar = true,
}: PlateEditorProps) {
  const containerRef = useRef(null);
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.__isReactDndBackendSetUp = false;
  }
  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <CommentsProvider users={commentsUsers} myUserId={myUserId}>
          <Plate
            plugins={plugins}
            onChange={(e) => onChange?.(e)}
            value={value}
            readOnly={readOnly}
          >
            <div
              ref={containerRef}
              className={cn(
                "relative",
                "[&_.slate-start-area-left]:w-[64px]! [&_.slate-start-area-right]:w-[64px]! [&_.slate-start-area-top]:h-4!",
              )}
            >
              {fixedToolbar ? (
                <FixedToolbar>
                  <FixedToolbarButtons />
                </FixedToolbar>
              ) : null}
              <Editor
                className="border border-solid border-gray-300 px-[15px] py-[15px] lg:px-[96px] lg:py-16"
                autoFocus
                focusRing={false}
                variant="ghost"
                size="md"
                readOnly={readOnly}
              />
              <FloatingToolbar>
                <FloatingToolbarButtons />
              </FloatingToolbar>
              <MentionCombobox items={MENTIONABLES} />
              <CommentsPopover />
              <CursorOverlay containerRef={containerRef} />
            </div>
          </Plate>
        </CommentsProvider>
      </DndProvider>
    </TooltipProvider>
  );
}
