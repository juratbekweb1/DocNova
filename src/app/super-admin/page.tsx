import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { ShieldAlert, AlertOctagon, Activity, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const recentLogs = await prisma.securityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Super Admin Panel</h1>
        <p className="text-muted-foreground">System metrics, global configuration, and security telemetry.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Security Telemetry
          </h2>
          
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent security events.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-xs">
                        {log.eventType}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {log.ipAddress}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      <span className="font-semibold text-foreground">Path:</span> {log.path}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-6 flex items-center justify-center">
           <div className="text-center space-y-2">
             <AlertOctagon className="w-10 h-10 text-muted-foreground mx-auto" />
             <p className="text-muted-foreground text-sm">More modules coming soon.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
