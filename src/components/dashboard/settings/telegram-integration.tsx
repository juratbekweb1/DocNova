"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, ExternalLink, Send } from "lucide-react";

export function TelegramIntegration({ isLinked, telegramUsername }: { isLinked: boolean, telegramUsername?: string | null }) {
  const [token, setToken] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/user/telegram-token", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate token");
      const data = await res.json();
      setToken(data.token);
    } catch (_error) {
      toast({ title: "Error", description: "Failed to generate token", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    toast({ title: "Copied!", description: "Token copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
          <Send className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Telegram Bot Integration</h3>
          <p className="text-sm text-muted-foreground">
            {isLinked 
              ? `Linked to @${telegramUsername || "Telegram User"}`
              : "Receive notifications and documents directly in Telegram."}
          </p>
        </div>
      </div>

      {!isLinked && (
        <div className="pt-4 border-t space-y-4">
          <Button onClick={handleGenerate} disabled={isGenerating} variant="outline">
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate Link Token
          </Button>

          {token && (
            <div className="space-y-2 p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Step 1: Copy your token</p>
              <div className="flex gap-2">
                <Input readOnly value={token} className="font-mono text-sm bg-background" />
                <Button size="icon" variant="secondary" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm font-medium pt-2">Step 2: Message our bot</p>
              <Button className="w-full" onClick={() => window.open(`https://t.me/DocNovaBot?start=${token}`, '_blank')}>
                Open Telegram <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {isLinked && (
        <div className="pt-4 border-t">
          <Button variant="destructive" onClick={async () => {
            await fetch("/api/user/telegram-unlink", { method: "POST" });
            window.location.reload();
          }}>
            Unlink Account
          </Button>
        </div>
      )}
    </div>
  );
}
