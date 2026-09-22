"use client";

import { useState } from "react";
import { Save, Download, Settings, History, Maximize2, Send } from "lucide-react";

export default function DocumentEditorPage({ _params }: { _params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("content"); // content vs templates

  return (
    <div className="flex h-full w-full flex-col bg-slate-950">
      {/* Editor Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/50 px-6">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            defaultValue="Untitled Document" 
            className="bg-transparent text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded px-2 py-1"
          />
          <span className="flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-1 text-xs text-slate-400">
            <Save className="h-3 w-3" /> Saved 2m ago
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            <History className="h-4 w-4" /> History
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white">
            <Settings className="h-4 w-4" /> Settings
          </button>
          
          <button 
            className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            onClick={async () => {
              try {
                const res = await fetch(`/api/documents/${_params.id}/send-telegram`, { method: "POST" });
                if (res.ok) alert("Sent to Telegram!");
                else alert("Failed to send.");
              } catch (_e) {
                alert("Error sending to telegram.");
              }
            }}
          >
            <Send className="h-4 w-4" /> Send to Telegram
          </button>

          <button className="flex h-9 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-500">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </header>

      {/* Split Pane Editor */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane: Builder */}
        <div className="flex w-1/2 flex-col border-r border-white/10 bg-slate-900/30">
          <div className="flex border-b border-white/10 px-2 pt-2">
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'content' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'templates' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'content' ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-white">Personal Information</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Full Name" className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                    <input type="email" placeholder="Email" className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
                
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-white">Experience</h3>
                  <div className="rounded-lg border border-dashed border-white/20 p-4 text-center text-sm text-slate-400">
                    + Add Experience
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Template thumbnails would go here */}
                <div className="aspect-[1/1.4] rounded-lg border-2 border-cyan-500 bg-slate-800"></div>
                <div className="aspect-[1/1.4] rounded-lg border border-white/10 bg-slate-800 opacity-50"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Live Preview */}
        <div className="relative flex w-1/2 items-center justify-center bg-slate-950 p-8">
          <button className="absolute right-6 top-6 rounded-lg bg-slate-900 p-2 text-slate-400 hover:text-white shadow-lg border border-white/10">
            <Maximize2 className="h-4 w-4" />
          </button>
          
          {/* Document Render Surface (A4 aspect ratio) */}
          <div className="aspect-[1/1.414] w-full max-w-2xl rounded shadow-2xl shadow-black/50 bg-white">
            <div className="p-12 text-black">
              <h1 className="text-3xl font-bold">John Doe</h1>
              <p className="text-gray-500 mt-2">Software Engineer • john@example.com</p>
              
              <div className="mt-8">
                <h2 className="text-xl font-bold uppercase tracking-wider text-gray-800 border-b-2 border-gray-200 pb-2 mb-4">Experience</h2>
                {/* Preview content will be rendered here dynamically */}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
