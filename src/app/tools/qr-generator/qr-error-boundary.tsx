"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class QRErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[QR_ERROR_BOUNDARY_CAUGHT]", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex max-w-sm flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-1 text-sm font-bold">
            {this.props.fallbackTitle || "QR kod yaratishda xatolik"}
          </h3>
          <p className="text-foreground-muted mb-4 text-xs leading-relaxed">
            Kiritilgan matn yoki ma&apos;lumot QR kod sig&apos;imidan oshib ketdi. Iltimos, qisqaroq
            matn yoki havola (URL) kiriting.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="bg-surface-elevated border-border text-foreground hover:bg-border/60 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Qayta urinish</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
