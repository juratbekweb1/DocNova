"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRecentTool } from "@/hooks/useRecentTool";
import { KeyRound, Copy, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PasswordGeneratorPage() {
  useRecentTool("password-generator", "Password Gen", "Tools Hub", "/tools/password-generator");

  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let charset = "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let newPassword = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      newPassword += charset.charAt(Math.floor(Math.random() * n));
    }
    setPassword(newPassword);
    setCopied(false);
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generatePassword();
  }, [generatePassword]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12">
      <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-center">
        <div className="bg-primary/10 border-primary/20 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border">
          <KeyRound className="text-primary h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-4 text-center text-4xl font-extrabold">
          Password Generator
        </h1>
        <p className="text-foreground-secondary mb-12 max-w-2xl text-center text-lg">
          Create strong, secure, and unique passwords instantly to keep your accounts safe.
        </p>

        <div className="bg-surface border-border w-full rounded-3xl border p-8 shadow-lg">
          <div className="group relative mb-8">
            <div className="bg-surface-elevated border-primary/20 text-foreground w-full rounded-2xl border-2 p-6 pr-24 text-center font-mono text-2xl tracking-wider break-all">
              {password}
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1/2 right-4 -translate-y-1/2 rounded-xl p-3 shadow-md transition-colors"
              title="Copy"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-foreground text-sm font-bold">Password Length</label>
                <span className="text-primary text-sm font-bold">{length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="bg-background accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
            </div>

            <div className="border-border grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
              <label className="bg-background border-border hover:border-primary/50 flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="accent-primary bg-surface-elevated border-border h-5 w-5 rounded"
                />
                <span className="text-foreground text-sm font-medium">Uppercase (A-Z)</span>
              </label>

              <label className="bg-background border-border hover:border-primary/50 flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="accent-primary bg-surface-elevated border-border h-5 w-5 rounded"
                />
                <span className="text-foreground text-sm font-medium">Numbers (0-9)</span>
              </label>

              <label className="bg-background border-border hover:border-primary/50 flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="accent-primary bg-surface-elevated border-border h-5 w-5 rounded"
                />
                <span className="text-foreground text-sm font-medium">Symbols (!-$^+)</span>
              </label>
            </div>

            <Button
              onClick={generatePassword}
              variant="outline"
              className="border-border hover:bg-surface-elevated mt-4 w-full rounded-xl py-6 font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Generate Another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
