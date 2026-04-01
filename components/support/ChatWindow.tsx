"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import MenuGrid from "./MenuGrid";
import MessageBubble, { type ChatMessage } from "./MessageBubble";
import {
  Headset,
  Paperclip,
  Send,
  Minimize2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatWindowProps {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  user: any;
}

// Mock data — will be replaced by real WebSocket + API in Phase 8
const MOCK_GREETING = (name: string, locale: string) => ({
  id: 1,
  senderType: "bot" as const,
  content:
    locale === "ar"
      ? `مرحبا${name ? " " + name : ""}! 👋 كيف يمكنني مساعدتك؟`
      : `Hi${name ? " " + name : ""}! 👋 How can I help you today?`,
  contentType: "text" as const,
  createdAt: new Date().toISOString(),
});

// Mock responses for each menu item
const MOCK_RESPONSES: Record<string, ChatMessage> = {
  product_search: {
    id: 0,
    senderType: "bot",
    content: "What are you looking for?",
    contentType: "text",
    createdAt: new Date().toISOString(),
  },
  order_tracker: {
    id: 0,
    senderType: "bot",
    content: "Here are your recent orders:",
    contentType: "cards",
    metadata: {
      cards: [
        {
          title: "ORD-TEST-1000",
          subtitle: "1x Wireless Headphones",
          price: "39.99 OMR",
          badge: "DELIVERED",
          url: "/orders",
        },
        {
          title: "ORD-TEST-1004",
          subtitle: "2x Wireless Headphones",
          price: "79.98 OMR",
          badge: "SHIPPED",
          url: "/orders",
        },
      ],
    },
    createdAt: new Date().toISOString(),
  },
  rfq_help: {
    id: 0,
    senderType: "bot",
    content: "I can help you create an RFQ. What do you need?",
    contentType: "buttons",
    metadata: {
      buttons: [
        { label: "Create New RFQ", labelAr: "إنشاء طلب جديد", action: "navigate", value: "/rfq-request" },
        { label: "View My RFQs", labelAr: "عرض طلباتي", action: "navigate", value: "/rfq-request" },
      ],
    },
    createdAt: new Date().toISOString(),
  },
  messages: {
    id: 0,
    senderType: "bot",
    content: "You have 2 unread messages",
    contentType: "cards",
    metadata: {
      cards: [
        { title: "Seller Ahmed", subtitle: "Re: Bulk headphones order", url: "/messages" },
        { title: "Seller Sara", subtitle: "RFQ quote ready", url: "/messages" },
      ],
    },
    createdAt: new Date().toISOString(),
  },
  add_product: {
    id: 0,
    senderType: "bot",
    content: "How would you like to add a product?",
    contentType: "buttons",
    metadata: {
      buttons: [
        { label: "Add New Product", action: "navigate", value: "/product?new=true" },
        { label: "Copy Existing", action: "navigate", value: "/manage-products" },
        { label: "Import from URL", action: "send_text", value: "import_url" },
      ],
    },
    createdAt: new Date().toISOString(),
  },
  my_analytics: {
    id: 0,
    senderType: "bot",
    content: "📈 Last 30 days:\nViews: 50 · Orders: 8 · Revenue: 144 OMR\nTop product: Premium Wireless Headphones",
    contentType: "navigate",
    metadata: {
      navigateTo: "/analytics",
      label: "Full Analytics →",
    },
    createdAt: new Date().toISOString(),
  },
  faq: {
    id: 0,
    senderType: "bot",
    content: "What do you need help with?",
    contentType: "buttons",
    metadata: {
      buttons: [
        { label: "Shipping", action: "send_text", value: "shipping info" },
        { label: "Returns", action: "send_text", value: "return policy" },
        { label: "Payments", action: "send_text", value: "payment methods" },
        { label: "Seller Guide", action: "navigate", value: "/help/seller-guide" },
        { label: "Account", action: "send_text", value: "account help" },
      ],
    },
    createdAt: new Date().toISOString(),
  },
  escalate: {
    id: 0,
    senderType: "bot",
    content: "",
    contentType: "status",
    createdAt: new Date().toISOString(),
  },
};

export default function ChatWindow({ onClose, onUnreadChange, user }: ChatWindowProps) {
  const router = useRouter();
  const { langDir } = useAuth();
  const locale = langDir === "rtl" ? "ar" : "en";
  const tradeRole = user?.tradeRole || "BUYER";
  const userName = user?.firstName || "";

  const [messages, setMessages] = useState<ChatMessage[]>([
    MOCK_GREETING(userName, locale),
  ]);
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<string>("bot");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(2);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addMessage = useCallback((msg: Partial<ChatMessage>) => {
    const id = nextId.current++;
    const full: ChatMessage = {
      id,
      senderType: "customer",
      content: "",
      contentType: "text",
      createdAt: new Date().toISOString(),
      ...msg,
    };
    setMessages((prev) => [...prev, full]);
    return id;
  }, []);

  const simulateBotResponse = useCallback(
    (response: ChatMessage, delay = 800) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage({ ...response, id: nextId.current++ });
      }, delay);
    },
    [addMessage]
  );

  // Handle menu item click
  const handleMenuClick = useCallback(
    (menuId: string) => {
      setShowMenu(false);

      // Add customer's selection as a message
      const menuLabels: Record<string, string> = {
        product_search: "🔍 Search Products",
        order_tracker: "📦 Track Orders",
        rfq_help: "📝 Create RFQ",
        messages: "💬 Messages",
        add_product: "➕ Add Product",
        my_analytics: "📊 My Analytics",
        faq: "❓ FAQ & Help",
        escalate: "🛟 Talk to Admin",
      };
      addMessage({
        senderType: "customer",
        content: menuLabels[menuId] || menuId,
        contentType: "text",
      });

      // Handle escalate specially
      if (menuId === "escalate") {
        setConversationStatus("open");
        simulateBotResponse(
          {
            ...MOCK_RESPONSES.escalate,
            content: locale === "ar"
              ? "جاري توصيلك بفريق الدعم... سيتم الرد قريباً."
              : "Connecting you to support... An agent will respond shortly.",
          },
          500
        );
        return;
      }

      // Simulate bot response
      const response = MOCK_RESPONSES[menuId];
      if (response) {
        simulateBotResponse(response);
      }
    },
    [addMessage, simulateBotResponse, locale]
  );

  // Handle send text message
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    addMessage({ senderType: "customer", content: text, contentType: "text" });
    setInput("");
    setShowMenu(false);

    // Mock: echo back with a generic bot response
    simulateBotResponse({
      id: 0,
      senderType: "bot",
      content:
        locale === "ar"
          ? "شكراً على رسالتك. دعني أبحث عن إجابة..."
          : `I understand you're asking about "${text}". Let me look into that...`,
      contentType: "text",
      createdAt: new Date().toISOString(),
    });
  }, [input, addMessage, simulateBotResponse, locale]);

  // Handle button clicks from bot messages
  const handleButtonClick = useCallback(
    (action: string, value: string) => {
      if (action === "navigate") {
        router.push(value);
        onClose();
      } else if (action === "send_text") {
        addMessage({ senderType: "customer", content: value, contentType: "text" });
        simulateBotResponse({
          id: 0,
          senderType: "bot",
          content: `Looking up "${value}" for you...`,
          contentType: "text",
          createdAt: new Date().toISOString(),
        });
      } else if (action === "menu_click") {
        handleMenuClick(value);
      }
    },
    [router, onClose, addMessage, simulateBotResponse, handleMenuClick]
  );

  // Handle navigate from cards
  const handleNavigate = useCallback(
    (url: string) => {
      router.push(url);
      onClose();
    },
    [router, onClose]
  );

  // Handle feedback
  const handleFeedback = useCallback((messageId: number, positive: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedbackScore: positive ? 5 : 1 } : m
      )
    );
    // TODO: call API to save feedback
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      addMessage({
        senderType: "customer",
        content: `Uploaded: ${file.name}`,
        contentType: "file",
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      });
      simulateBotResponse({
        id: 0,
        senderType: "bot",
        content: `File "${file.name}" received. I'll include it in your conversation.`,
        contentType: "text",
        createdAt: new Date().toISOString(),
      });
    };
    input.click();
  }, [addMessage, simulateBotResponse]);

  // Reset conversation
  const handleReset = useCallback(() => {
    setMessages([MOCK_GREETING(userName, locale)]);
    setShowMenu(true);
    setConversationStatus("bot");
    nextId.current = 2;
  }, [userName, locale]);

  // Handle escalate button (always visible)
  const handleEscalate = useCallback(() => {
    if (conversationStatus !== "open") {
      handleMenuClick("escalate");
    }
  }, [conversationStatus, handleMenuClick]);

  return (
    <div className="fixed bottom-24 end-6 z-50 flex flex-col w-[380px] h-[560px] max-h-[80vh] rounded-2xl border bg-background shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <span className="text-sm font-bold">U</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Ultrasooq Support</div>
            <div className="text-[10px] opacity-80">
              {conversationStatus === "bot"
                ? locale === "ar" ? "بوت المساعدة" : "AI Assistant"
                : conversationStatus === "open"
                  ? locale === "ar" ? "بانتظار الدعم..." : "Waiting for agent..."
                  : locale === "ar" ? "متصل بالدعم" : "Connected to support"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            title="New conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            locale={locale}
            onFeedback={handleFeedback}
            onButtonClick={handleButtonClick}
            onNavigate={handleNavigate}
          />
        ))}

        {/* Menu Grid (shown after greeting) */}
        {showMenu && (
          <MenuGrid
            tradeRole={tradeRole}
            locale={locale}
            onMenuClick={handleMenuClick}
          />
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="rounded-2xl bg-muted px-3.5 py-2 rounded-bl-sm">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-3">
        <div className="flex items-end gap-2">
          {/* File attach */}
          <button
            type="button"
            onClick={handleFileUpload}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type your message..."}
            className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-20"
            rows={1}
          />

          {/* Escalate button (always visible) */}
          {conversationStatus === "bot" && (
            <button
              type="button"
              onClick={handleEscalate}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              title={locale === "ar" ? "تحدث مع الدعم" : "Talk to Admin"}
            >
              <Headset className="h-4 w-4" />
            </button>
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
