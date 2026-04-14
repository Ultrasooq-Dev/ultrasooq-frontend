import React from "react";
import Image from "next/image";
import AttachIcon from "@/public/images/attach.svg";
import SmileIcon from "@/public/images/smile.svg";
import SendIcon from "@/public/images/send-button.png";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useTranslations } from "next-intl";

interface SellerChatMessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  showEmoji: boolean;
  setShowEmoji: (value: boolean) => void;
  attachments: any[];
  isAttachmentUploading: boolean;
  onSendMessage: () => void;
  onKeyDown: (e: any) => void;
  onEmojiClick: (emojiObject: EmojiClickData) => void;
  onFileChange: (e: any) => void;
  onRemoveFile: (index: number) => void;
}

/**
 * The message text input bar, emoji picker, attachment button, send button,
 * and attachment preview chips.
 */
const SellerChatMessageInput: React.FC<SellerChatMessageInputProps> = ({
  message,
  setMessage,
  showEmoji,
  setShowEmoji,
  attachments,
  isAttachmentUploading,
  onSendMessage,
  onKeyDown,
  onEmojiClick,
  onFileChange,
  onRemoveFile,
}) => {
  const t = useTranslations();

  return (
    <div className="flex-shrink-0 rounded-lg border border-border bg-muted p-2">
      <div className="flex w-full items-end gap-2">
        {/* Attachment Button */}
        <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted">
          <input
            type="file"
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            multiple
            onChange={onFileChange}
          />
          <Image src={AttachIcon} alt="attach-icon" className="h-4 w-4" />
        </div>

        {/* Message Input */}
        <div className="flex flex-1 items-end gap-1.5 rounded-lg border border-border bg-card px-3 py-2">
          <textarea
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            placeholder={t("type_your_message") || "Type your message...."}
            className="max-h-24 min-h-[32px] w-full resize-none border-0 text-xs focus:outline-none"
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted"
            type="button"
          >
            <Image src={SmileIcon} alt="smile-icon" className="h-4 w-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={onSendMessage}
          type="button"
          className="bg-dark-orange flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-warning"
        >
          <Image src={SendIcon} alt="send-icon" className="h-4 w-4" />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="mt-2 rounded-lg border border-border bg-card p-2">
          <EmojiPicker lazyLoadEmojis={true} onEmojiClick={onEmojiClick} className="mt-1" />
        </div>
      )}

      {/* Attachments Preview */}
      {!isAttachmentUploading && attachments.length > 0 && (
        <div className="mt-2 flex w-full flex-wrap gap-1.5">
          {attachments.map((file: any, index: any) => (
            <div
              key={index}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5"
            >
              <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="max-w-[200px] truncate text-xs text-muted-foreground">{file.name}</span>
              <button
                onClick={() => onRemoveFile(index)}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                type="button"
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerChatMessageInput;
