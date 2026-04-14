"use client";
/**
 * ItemDetailEditorPanel — Rich-text editor + requirement chips + attachments
 * used inside the Specs & Requirements tab of ItemDetailPanel.
 */
import React from "react";
import {
  Paperclip, Image, Plus, X, Zap, FileText,
} from "lucide-react";

interface ItemDetailEditorPanelProps {
  isAr: boolean;
  vendorAttachments: string[];
  setVendorAttachments: React.Dispatch<React.SetStateAction<string[]>>;
  vendorFileRef: React.RefObject<HTMLInputElement | null>;
}

export function ItemDetailEditorPanel({
  isAr,
  vendorAttachments,
  setVendorAttachments,
  vendorFileRef,
}: ItemDetailEditorPanelProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/30 border-b border-border/50 flex-wrap">
        {[
          { icon: "B", title: "Bold", cls: "font-bold" },
          { icon: "I", title: "Italic", cls: "italic" },
          { icon: "U", title: "Underline", cls: "underline" },
        ].map((b) => (
          <button
            key={b.title}
            type="button"
            title={b.title}
            className={`h-6 w-6 flex items-center justify-center rounded text-[11px] ${b.cls} text-muted-foreground hover:bg-muted hover:text-foreground`}
          >
            {b.icon}
          </button>
        ))}
        <div className="h-4 w-px bg-border mx-0.5" />
        <button
          type="button"
          title="Heading"
          className="h-6 px-1.5 flex items-center justify-center rounded text-[9px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          H
        </button>
        <button
          type="button"
          title="Bullet List"
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          title="Numbered List"
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" />
            <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
            <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
            <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
          </svg>
        </button>
        <div className="h-4 w-px bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => vendorFileRef.current?.click()}
          title="Insert Image"
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Image className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => vendorFileRef.current?.click()}
          title="Attach File"
          className="relative h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground px-1"
        >
          <Paperclip className="h-3.5 w-3.5" />
          {vendorAttachments.length > 0 && (
            <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[7px] font-bold px-0.5 ms-0.5">
              {vendorAttachments.length}
            </span>
          )}
        </button>
        <div className="h-4 w-px bg-border mx-0.5" />
        <button
          type="button"
          title="Insert Table"
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
        <div className="flex-1" />
        <button
          type="button"
          className="flex items-center gap-1 text-[9px] text-primary hover:text-primary/80 bg-primary/5 rounded px-2 py-0.5"
        >
          <Zap className="h-3 w-3" /> AI
        </button>
      </div>

      {/* Editor content area */}
      <div
        contentEditable
        suppressContentEditableWarning
        className="min-h-[200px] px-3 py-3 text-xs leading-relaxed outline-none focus:ring-0"
        style={{ maxHeight: "400px", overflowY: "auto" }}
      >
        <p>Need for corporate use. Prefer black or silver.</p>
        <p>Bulk packaging OK. Must include carrying case.</p>
        <br />
        <p className="text-muted-foreground">
          {isAr
            ? "اكتب تفاصيل طلبك هنا..."
            : "Continue writing your request details..."}
        </p>
      </div>

      {/* Quick requirements chips */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-t border-border/50 bg-muted/10">
        {[
          { l: isAr ? "شهادة جودة" : "Quality Cert", c: true },
          { l: isAr ? "كفالة" : "Warranty", c: true },
          { l: isAr ? "عينات" : "Samples", c: false },
          { l: isAr ? "تغليف مخصص" : "Custom Pkg", c: false },
          { l: isAr ? "شعار" : "Branding", c: false },
          { l: isAr ? "شحن سريع" : "Express", c: true },
        ].map((r, i) => (
          <label
            key={i}
            className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 cursor-pointer hover:bg-muted/30 bg-background"
          >
            <input
              type="checkbox"
              defaultChecked={r.c}
              className="rounded border-border text-primary h-2.5 w-2.5"
            />
            <span className="text-[8px]">{r.l}</span>
          </label>
        ))}
      </div>

      {/* Attachments */}
      <div className="px-3 py-2 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold flex items-center gap-1">
            <Paperclip className="h-3 w-3 text-primary" />
            {isAr ? "المرفقات" : "Attachments"}
            {vendorAttachments.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-1">
                {vendorAttachments.length}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => vendorFileRef.current?.click()}
            className="ms-auto flex items-center gap-1 rounded border border-dashed border-border hover:border-primary px-2 py-1 text-[9px] text-muted-foreground hover:text-primary"
          >
            <Plus className="h-3 w-3" /> {isAr ? "إضافة" : "Add Files"}
          </button>
        </div>

        {vendorAttachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vendorAttachments.map((f, i) => {
              const isImg = f.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
              const isPdf = f.match(/\.pdf$/i);
              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1.5"
                >
                  {isImg ? (
                    <Image className="h-3.5 w-3.5 text-blue-500" />
                  ) : isPdf ? (
                    <FileText className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-[10px] max-w-[120px] truncate">{f}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setVendorAttachments((p) => p.filter((_, idx) => idx !== i))
                    }
                    className="text-muted-foreground hover:text-destructive ms-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {vendorAttachments.length === 0 && (
          <p className="text-[9px] text-muted-foreground/50 text-center">
            {isAr
              ? "أضف صور، مستندات PDF، رسومات تصميم"
              : "Add images, PDF documents, design drawings, specs sheets"}
          </p>
        )}
      </div>
    </div>
  );
}
