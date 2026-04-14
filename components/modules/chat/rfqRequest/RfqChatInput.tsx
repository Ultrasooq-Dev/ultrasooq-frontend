import React from "react";
import Image from "next/image";
import AttachIcon from "@/public/images/attach.svg";
import SmileIcon from "@/public/images/smile.svg";
import SendIcon from "@/public/images/send-button.png";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface RfqChatInputProps {
  message: string;
  setMessage: (val: string) => void;
  showEmoji: boolean;
  setShowEmoji: (val: boolean) => void;
  attachments: any[];
  isAttachmentUploading: boolean;
  onSendMessage: () => void;
  onKeyDown: (e: any) => void;
  onFileChange: (e: any) => void;
  onRemoveFile: (index: number) => void;
  onEmojiClick: (emojiObject: EmojiClickData) => void;
  /** compact = column view sizing, normal = grid view sizing */
  variant?: "compact" | "normal";
}

const RfqChatInput: React.FC<RfqChatInputProps> = ({
  message,
  setMessage,
  showEmoji,
  setShowEmoji,
  attachments,
  isAttachmentUploading,
  onSendMessage,
  onKeyDown,
  onFileChange,
  onRemoveFile,
  onEmojiClick,
  variant = "normal",
}) => {
  const t = useTranslations();
  const isCompact = variant === "compact";

  const btnSize = isCompact ? "h-8 w-8" : "h-10 w-10";
  const iconSize = isCompact ? "h-4 w-4" : "h-5 w-5";
  const textareaClass = isCompact
    ? "w-full resize-none rounded-lg border-0 bg-transparent px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none"
    : "w-full resize-none rounded-lg border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none";
  const maxHeight = isCompact ? 80 : 120;
  const wrapperGap = isCompact ? "gap-2" : "gap-3";
  const attachmentSpan = isCompact
    ? "max-w-[150px] truncate text-xs text-muted-foreground"
    : "max-w-[200px] truncate text-sm text-muted-foreground";
  const attachmentIcon = isCompact ? "h-3 w-3" : "h-4 w-4";
  const attachmentPadding = isCompact
    ? "gap-1.5 rounded-lg border border-border bg-card px-2 py-1 shadow-sm"
    : "gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm";
  const emojiWrapper = isCompact ? "mb-2 p-1" : "mb-3 p-2";

  return (
    <div>
      {/* Attachment Preview */}
      {!isAttachmentUploading && attachments.length > 0 && (
        <div className={`${isCompact ? "mb-2" : "mb-3"} flex flex-wrap ${isCompact ? "gap-1.5" : "gap-2"}`}>
          {attachments.map((file: any, index: number) => (
            <div
              key={index}
              className={`group flex items-center transition-all hover:border-destructive/30 hover:bg-destructive/5 ${attachmentPadding}`}
            >
              <svg
                className={`${attachmentIcon} text-muted-foreground`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className={attachmentSpan}>{file.name}</span>
              <button
                onClick={() => onRemoveFile(index)}
                className={`${isCompact ? "ml-0.5 p-0.5" : "ml-1 p-1"} rounded-full text-destructive transition-colors hover:bg-destructive/10`}
              >
                <svg
                  className={`${attachmentIcon}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div
          className={`${emojiWrapper} rounded-lg border border-border bg-card shadow-lg`}
        >
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* Input Row */}
      <div className={`flex items-end ${wrapperGap}`}>
        {/* File Attachment Button */}
        <label
          className={`hover:border-dark-orange hover:text-dark-orange flex ${btnSize} cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-warning/5`}
        >
          <input type="file" className="hidden" multiple onChange={onFileChange} />
          <Image src={AttachIcon} alt="attach-icon" className={iconSize} />
        </label>

        {/* Text Input */}
        <div
          className={`focus-within:border-dark-orange flex-1 rounded-lg border-2 border-border bg-card transition-all ${isCompact ? "focus-within:ring-1 focus-within:ring-orange-100" : "focus-within:ring-2 focus-within:ring-orange-100"}`}
        >
          <textarea
            placeholder={t("type_your_message") || "Type your message..."}
            className={textareaClass}
            rows={1}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
            }}
            onKeyDown={onKeyDown}
          />
        </div>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className={cn(
            `hover:border-dark-orange hover:text-dark-orange flex ${btnSize} items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:bg-warning/5`,
            showEmoji && "border-dark-orange text-dark-orange bg-warning/5",
          )}
        >
          <Image src={SmileIcon} alt="smile-icon" className={iconSize} />
        </button>

        {/* Send Button */}
        <button
          onClick={onSendMessage}
          type="button"
          disabled={!message.trim() && attachments.length === 0}
          className={cn(
            `bg-dark-orange flex ${btnSize} items-center justify-center rounded-lg text-white shadow-md transition-all disabled:cursor-not-allowed disabled:bg-muted-foreground`,
            !isCompact && "hover:scale-105 hover:shadow-lg disabled:hover:scale-100",
          )}
        >
          <Image src={SendIcon} alt="send-icon" className={iconSize} />
        </button>
      </div>
    </div>
  );
};

export default RfqChatInput;
