"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, Bot, User, FileText, Loader2, Sparkles } from "lucide-react";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Rezyumemni ATS tizimiga qanday moslayman?",
  "Dasturchi ish suhbatida eng muhim savollar",
  "Rezyumeda yutuqlarni raqamlar bilan yozish sirlari",
  "IELTS Speaking imtihoni uchun eng yaxshi maslahatlar",
];

function generateMsgId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Assalomu alaykum! Men Novaman — sizning DocNova platformasidagi aqlli karyera va o'quv yordamchingiz. Rezyume tuzish, ish suhbati (interview) tayyorgarligi, ATS tahlili yoki kurs ishlari bo'yicha sizga qanday yordam bera olaman?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessageWithText = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { id: generateMsgId(), role: "user", content: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (response.status === 429) {
        setShowUpgradeModal(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: generateMsgId(),
          role: "assistant",
          content: data.reply || "Kechirasiz, javob olib bo'lmadi.",
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Xatolik",
        description: "Server bilan ulanishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessageWithText(input);
  };

  return (
    <div className="bg-background flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="border-border bg-surface flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <Bot className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-foreground text-lg font-bold">Nova Chat</h1>
            <p className="text-foreground-secondary text-xs">
              Sening aqlli karyera va platforma yordamching
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/ats-analyzer"
          className="bg-surface-elevated hover:bg-border/50 border-border text-foreground flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          <FileText className="text-primary h-4 w-4" />
          Rezyumemni tahlil qil
        </Link>
      </div>

      {/* Chat Area */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex max-w-3xl gap-4 ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user" ? "bg-accent/10" : "bg-primary/10"
              }`}
            >
              {msg.role === "user" ? (
                <User className="text-accent h-4 w-4" />
              ) : (
                <Bot className="text-primary h-4 w-4" />
              )}
            </div>
            <div
              className={`rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-surface border-border text-foreground rounded-tl-sm border shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mr-auto flex max-w-3xl gap-4">
            <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Bot className="text-primary h-4 w-4" />
            </div>
            <div className="bg-surface border-border flex items-center gap-2 rounded-2xl rounded-tl-sm border px-5 py-3 shadow-sm">
              <Loader2 className="text-primary h-4 w-4 animate-spin" />
              <span className="text-foreground-secondary text-sm font-medium">
                Nova o&apos;ylamoqda va yozmoqda...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts bar */}
      <div className="bg-surface/50 border-border no-scrollbar flex items-center gap-2 overflow-x-auto border-t px-6 py-2">
        <Sparkles className="text-primary h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground-secondary shrink-0 text-[11px] font-semibold">
          Takliflar:
        </span>
        {QUICK_PROMPTS.map((promptText, i) => (
          <button
            key={i}
            onClick={() => sendMessageWithText(promptText)}
            disabled={isLoading}
            className="bg-background hover:bg-surface-elevated text-foreground border-border shrink-0 rounded-full border px-3 py-1 text-[11px] transition-colors disabled:opacity-50"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-surface border-border border-t p-4">
        <form onSubmit={handleSend} className="relative mx-auto max-w-4xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nova bilan suhbatlashish (masalan: Rezyumemni qanday kuchaytiraman?)..."
            className="bg-background border-border focus:border-primary/50 text-foreground w-full rounded-xl border py-3 pr-12 pl-4 text-sm shadow-sm focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 transition-all disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Chat Limiti Tugadi"
        description="Free ta'rifidagi kunlik chat limitiga yetib keldingiz. Ko'proq imkoniyatlar uchun tarifingizni oshiring."
      />
    </div>
  );
}
