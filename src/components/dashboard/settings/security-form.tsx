"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, ShieldCheck, ShieldAlert, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export function SecurityForm() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)
  
  // 2FA State
  const is2FAEnabled = (session?.user as Record<string, unknown>)?.twoFactorEnabled === true
  const [is2FADialogOpen, setIs2FADialogOpen] = React.useState(false)
  const [qrCodeData, setQrCodeData] = React.useState<string | null>(null)
  const [secret, setSecret] = React.useState<string | null>(null)
  const [totpCode, setTotpCode] = React.useState("")
  const [isProcessing2FA, setIsProcessing2FA] = React.useState(false)
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([])

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsUpdatingPassword(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update password")
      }

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
        variant: "success",
      })
      
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function generate2FA() {
    setIsProcessing2FA(true)
    try {
      const response = await fetch("/api/user/2fa/generate", {
        method: "POST",
      })
      const data = await response.json()
      if (response.ok) {
        setQrCodeData(data.qrCode)
        setSecret(data.secret)
        setRecoveryCodes(data.recoveryCodes)
      } else {
        throw new Error(data.error)
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Could not generate 2FA setup. Please try again.",
        variant: "destructive",
      })
      setIs2FADialogOpen(false)
    } finally {
      setIsProcessing2FA(false)
    }
  }

  async function verify2FA() {
    setIsProcessing2FA(true)
    try {
      const response = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: totpCode, secret }),
      })
      
      if (response.ok) {
        await update({ twoFactorEnabled: true })
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication is now active.",
          variant: "success",
        })
        setIs2FADialogOpen(false)
      } else {
        const data = await response.json()
        throw new Error(data.error || "Invalid code")
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing2FA(false)
    }
  }

  async function disable2FA() {
    setIsProcessing2FA(true)
    try {
      const response = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // In a real app, you would prompt for password or TOTP to disable
      })
      
      if (response.ok) {
        await update({ twoFactorEnabled: false })
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been turned off.",
        })
      } else {
        throw new Error("Failed to disable 2FA")
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Could not disable 2FA.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing2FA(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 2FA Section */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-3 ${is2FAEnabled ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
              {is2FAEnabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-foreground-secondary">
                Add an extra layer of security to your account.
              </p>
            </div>
          </div>
          <div>
            {is2FAEnabled ? (
              <Button variant="outline" className="text-error border-error/50 hover:bg-error/10" onClick={disable2FA} disabled={isProcessing2FA}>
                {isProcessing2FA ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Disable 2FA
              </Button>
            ) : (
              <Dialog open={is2FADialogOpen} onOpenChange={(open) => {
                setIs2FADialogOpen(open)
                if (open) generate2FA()
                else { setQrCodeData(null); setSecret(null); setTotpCode(""); }
              }}>
                <DialogTrigger asChild>
                  <Button>Enable 2FA</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    {isProcessing2FA && !qrCodeData ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : qrCodeData ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeData} alt="QR Code" className="w-48 h-48 rounded-lg" />
                        <div className="w-full">
                          <FormLabel>Enter 6-digit code</FormLabel>
                          <div className="flex gap-2 mt-2">
                            <Input 
                              placeholder="123456" 
                              maxLength={6} 
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value)}
                              className="text-center text-lg tracking-widest"
                            />
                            <Button onClick={verify2FA} disabled={totpCode.length < 6 || isProcessing2FA}>
                              Verify
                            </Button>
                          </div>
                        </div>
                        {recoveryCodes.length > 0 && (
                          <div className="w-full mt-4 p-4 bg-muted rounded-md text-xs font-mono">
                            <p className="font-semibold text-foreground mb-2">Save these recovery codes:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {recoveryCodes.map(c => <div key={c}>{c}</div>)}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </Card>

      {/* Change Password Section */}
      <Card className="p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Change Password</h3>
            <p className="text-sm text-foreground-secondary">
              Update your password associated with your account.
            </p>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isUpdatingPassword} className="mt-4">
              {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}
