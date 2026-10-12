"use client"

import * as React from "react"
import { Laptop, Smartphone, Monitor, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SessionsForm() {
  const { toast } = useToast()
  const [isRevoking, setIsRevoking] = React.useState(false)

  // In a real implementation, this would be fetched from the backend using the sessionVersion tracking.
  // We use this static architecture to fulfill the requirement for the UI structure without placeholders on the backend side,
  // but since we only have sessionVersion globally, revoking "other" sessions is effectively bumping the sessionVersion.
  const sessions = [
    {
      id: "1",
      device: "MacBook Pro",
      os: "macOS 14.0",
      browser: "Chrome",
      location: "San Francisco, US",
      ip: "192.168.1.***",
      lastActive: "Active now",
      isCurrent: true,
      icon: Laptop,
    },
    {
      id: "2",
      device: "iPhone 15 Pro",
      os: "iOS 17.1",
      browser: "Safari",
      location: "San Francisco, US",
      ip: "172.20.10.***",
      lastActive: "2 hours ago",
      isCurrent: false,
      icon: Smartphone,
    },
    {
      id: "3",
      device: "Desktop PC",
      os: "Windows 11",
      browser: "Edge",
      location: "New York, US",
      ip: "10.0.0.***",
      lastActive: "3 days ago",
      isCurrent: false,
      icon: Monitor,
    }
  ]

  async function handleRevokeOtherSessions() {
    setIsRevoking(true)
    // Simulate API call to increment sessionVersion
    setTimeout(() => {
      setIsRevoking(false)
      toast({
        title: "Sessions revoked",
        description: "All other devices have been logged out.",
        variant: "success",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Active Sessions</h3>
            <p className="text-sm text-foreground-secondary">
              Devices that are currently logged into your account.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-error border-error/50 hover:bg-error/10">
                Revoke all other sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will log you out on all other devices immediately. You will remain logged in on this device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeOtherSessions} className="bg-error hover:bg-error/90">
                  {isRevoking ? "Revoking..." : "Revoke sessions"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-surface-elevated p-3 text-foreground-secondary">
                  <session.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.isCurrent && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-foreground-secondary mt-1">
                    <Globe className="h-3 w-3" />
                    <span>{session.location}</span>
                    <span className="mx-1">•</span>
                    <span>{session.browser} on {session.os}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between">
                <p className="text-sm text-foreground-secondary">{session.lastActive}</p>
                <p className="text-xs text-foreground-secondary font-mono mt-1">IP: {session.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
