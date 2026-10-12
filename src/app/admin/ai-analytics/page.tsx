"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, Zap, CheckCircle2, XCircle, Clock, AlertTriangle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIUsage {
  id: string;
  plan: string;
  feature: string;
  status: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  createdAt: string;
  userId?: string;
}

export default function AIAnalyticsPage() {
  const [usages, setUsages] = useState<AIUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/ai/usage?range=30d")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsages(data.usages);
        } else {
          toast({ title: "Error", description: data.error || "Failed to load AI usage data", variant: "destructive" });
        }
      })
      .catch(err => {
        toast({ title: "Error", description: "Failed to load AI usage data", variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayUsages = usages.filter(u => u.createdAt.startsWith(todayStr));

  const calcStats = (arr: AIUsage[]) => {
    const totalRequests = arr.length;
    const successful = arr.filter(u => u.status === "SUCCESS").length;
    const failed = arr.filter(u => u.status === "FAILED").length;
    const rateLimited = arr.filter(u => u.status === "RATE_LIMITED" || u.status === "QUOTA_EXCEEDED").length;
    
    const inputTokens = arr.reduce((acc, u) => acc + (u.inputTokens || 0), 0);
    const outputTokens = arr.reduce((acc, u) => acc + (u.outputTokens || 0), 0);
    const totalTokens = inputTokens + outputTokens;
    const cost = arr.reduce((acc, u) => acc + (u.estimatedCostUsd || 0), 0);

    return { totalRequests, successful, failed, rateLimited, inputTokens, outputTokens, totalTokens, cost };
  };

  const todayStats = calcStats(todayUsages);
  const monthStats = calcStats(usages);

  const getFeatureCounts = (arr: AIUsage[]) => {
    const counts: Record<string, number> = {};
    arr.forEach(u => counts[u.feature] = (counts[u.feature] || 0) + 1);
    return counts;
  };
  const featureCounts = getFeatureCounts(usages);
  
  const getPlanCounts = (arr: AIUsage[]) => {
    const counts: Record<string, number> = {};
    arr.forEach(u => counts[u.plan] = (counts[u.plan] || 0) + 1);
    return counts;
  };
  const planCounts = getPlanCounts(usages);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-8 space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">AI Analytics</h1>
          <p className="text-zinc-400 mt-1 text-sm">Monitor usage, performance, and costs for DocNova AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Requests" 
          value={todayStats.totalRequests.toLocaleString()} 
          icon={<Zap className="w-4 h-4 text-cyan-400" />} 
          subtext={`${todayStats.successful} successful`}
        />
        <StatCard 
          title="Today's Cost (USD)" 
          value={`$${todayStats.cost.toFixed(2)}`} 
          icon={<Activity className="w-4 h-4 text-emerald-400" />} 
          subtext={`~${Math.round(todayStats.cost * 12800).toLocaleString()} UZS`}
        />
        <StatCard 
          title="Monthly Requests" 
          value={monthStats.totalRequests.toLocaleString()} 
          icon={<Activity className="w-4 h-4 text-blue-400" />} 
          subtext="Last 30 days"
        />
        <StatCard 
          title="Monthly Cost (USD)" 
          value={`$${monthStats.cost.toFixed(2)}`} 
          icon={<Activity className="w-4 h-4 text-emerald-400" />} 
          subtext={`~${Math.round(monthStats.cost * 12800).toLocaleString()} UZS`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-[#121214] border border-white/5 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-400" />
            Performance & Errors (30d)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-zinc-400 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400"/> Success</div>
              <div className="text-2xl font-semibold">{monthStats.successful}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-zinc-400 mb-1 flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400"/> Failed</div>
              <div className="text-2xl font-semibold">{monthStats.failed}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-zinc-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-400"/> Rate Limited</div>
              <div className="text-2xl font-semibold">{monthStats.rateLimited}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-zinc-400 mb-1 flex items-center gap-1"><Users className="w-3 h-3 text-blue-400"/> Active Users</div>
              <div className="text-2xl font-semibold">{new Set(usages.map(u => u.userId).filter(Boolean)).size}</div>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-sm font-medium text-zinc-400 mb-4">Token Usage</h4>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-semibold text-white">{(monthStats.inputTokens / 1_000_000).toFixed(2)}M</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Input Tokens</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-white">{(monthStats.outputTokens / 1_000_000).toFixed(2)}M</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Output Tokens</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">By Feature</h3>
            <div className="space-y-3">
              {Object.entries(featureCounts).sort((a,b) => b[1]-a[1]).map(([feature, count]) => (
                <div key={feature} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-300">{feature.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">By Plan</h3>
            <div className="space-y-3">
              {Object.entries(planCounts).sort((a,b) => b[1]-a[1]).map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-300">{plan}</span>
                  <span className="text-sm font-medium text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtext }: { title: string, value: string | number, icon: React.ReactNode, subtext: string }) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <div className="p-2 bg-white/5 rounded-md text-zinc-300">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold text-white tracking-tight">{value}</div>
      <div className="text-sm text-zinc-500 mt-2">{subtext}</div>
      
      {/* Subtle glass effect flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
}
