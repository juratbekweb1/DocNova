"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, AlertTriangle, Mail } from "lucide-react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
import { Card } from "@/components/ui/card"

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

type EmailFormValues = z.infer<typeof emailFormSchema>

export function AccountForm() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: session?.user?.email || "",
    },
  })

  async function onEmailSubmit(data: EmailFormValues) {
    if (data.email === session?.user?.email) {
      toast({
        title: "No changes",
        description: "This is already your current email address.",
      })
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update email")
      }

      toast({
        title: "Verification Email Sent",
        description: "Please check your new email address for a verification link.",
        variant: "success",
      })
    } catch (_error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      toast({
        title: "Account marked for deletion",
        description: "Your account has been deactivated.",
      })
      
      signOut({ callbackUrl: "/login" })
    } catch (_error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium">Email Address</h3>
          <p className="text-sm text-foreground-secondary">
            Update the email address associated with your account.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-foreground-secondary" />
                      <Input placeholder="your@email.com" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    We will send a verification link to your new email before applying the change.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update email
            </Button>
          </form>
        </Form>
      </Card>

      <Card className="border-error/20 bg-error/5 p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-error/10 p-3 text-error">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-error">Danger Zone</h3>
            <p className="text-sm text-foreground-secondary">
              Permanently delete your account and all associated data.
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-error hover:bg-error/90"
              >
                {isDeleting ? "Deleting..." : "Yes, delete my account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  )
}
